import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Plus, RefreshCw } from "lucide-react";
import type { ChannelSummary, ChannelsData, UpdateChannelInput } from "@openclaw/shared";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";
import { ChannelDialog } from "../features/ChannelDialog";
import { api } from "../lib/api";
import { useToast } from "../hooks/use-toast";

const channelLabelMap: Record<string, string> = {
  feishu: "飞书",
  "wechat-work": "企业微信",
  dingtalk: "钉钉",
  wechat: "微信",
  "qq-bot": "QQ Bot"
};

export function ChannelsPage() {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelSummary | null>(null);

  const channelsQuery = useQuery({
    queryKey: ["channels"],
    queryFn: () => api.get<ChannelsData>("/api/openclaw/channels")
  });

  const updateMutation = useMutation({
    mutationFn: ({ channelId, input }: { channelId: string; input: UpdateChannelInput }) =>
      api.put(`/api/openclaw/channels/${channelId}`, input),
    onSuccess: async () => {
      push("渠道配置已保存");
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
    onError: (error) => push(error instanceof Error ? error.message : "保存失败", "error")
  });

  const probeMutation = useMutation({
    mutationFn: (channelId: string) =>
      api.post("/api/openclaw/channels/probe", {
        channel_ids: [channelId]
      }),
    onSuccess: async () => {
      push("渠道探测已完成");
      await queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
    onError: (error) => push(error instanceof Error ? error.message : "探测失败", "error")
  });

  const channels = channelsQuery.data?.items ?? [];
  const configuredChannels = channels.filter((item) => item.configured);

  return (
    <div className="space-y-8">
      <PageHeader
        title="消息渠道"
        description="管理消息接入插件与渠道凭证，统一接入飞书、企业微信、钉钉、微信与 QQ Bot。"
        action={
          <button
            onClick={() => {
              setSelectedChannel(null);
              setDialogOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-600"
          >
            <Plus size={16} />
            添加渠道
          </button>
        }
      />

      <div>
        <div className="mb-4 text-xl font-semibold text-ink">插件状态</div>
        <div className="grid gap-5 xl:grid-cols-3">
          {channels.map((channel) => (
            <SectionCard key={channel.channel_id} className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line text-slate-400">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold text-ink">{channelLabelMap[channel.channel_id]}</div>
                      <StatusBadge
                        status={channel.configured ? "connected" : "not_configured"}
                        label={channel.configured ? "已就绪" : "未安装"}
                      />
                    </div>
                    <div className="mt-1 text-sm text-slate-500">版本 {channel.version ?? "-"}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-600"
                    onClick={() => {
                      setSelectedChannel(channel);
                      setDialogOpen(true);
                    }}
                  >
                    {channel.configured ? "配置" : "安装"}
                  </button>
                  <button
                    className="rounded-full border border-line p-2 text-slate-500 transition hover:border-brand-500 hover:text-brand-600"
                    onClick={() => probeMutation.mutate(channel.channel_id)}
                  >
                    <RefreshCw size={15} />
                  </button>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      </div>

      <div className="pt-3">
        <div className="mb-4 text-xl font-semibold text-ink">渠道管理</div>
        {configuredChannels.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={34} />}
            title="还没有添加消息渠道"
            description="添加渠道后即可将代理能力分发到不同消息平台，支持飞书、企业微信、QQ Bot 等。"
            action={
              <button
                onClick={() => setDialogOpen(true)}
                className="rounded-full bg-brand-500 px-7 py-3 text-sm font-semibold text-white shadow-soft"
              >
                添加渠道
              </button>
            }
          />
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {configuredChannels.map((channel) => (
              <SectionCard key={channel.channel_id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{channelLabelMap[channel.channel_id]}</h3>
                      <StatusBadge status={channel.status === "connected" ? "connected" : "error"} label={channel.summary} />
                    </div>
                    <div className="mt-2 text-sm text-slate-500">{channel.summary}</div>
                  </div>
                  <button
                    className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand-500 hover:text-brand-600"
                    onClick={() => {
                      setSelectedChannel(channel);
                      setDialogOpen(true);
                    }}
                  >
                    编辑
                  </button>
                </div>
              </SectionCard>
            ))}
          </div>
        )}
      </div>

      <ChannelDialog
        open={dialogOpen}
        channel={selectedChannel}
        loading={updateMutation.isPending}
        onClose={() => {
          setDialogOpen(false);
          setSelectedChannel(null);
        }}
        onSubmit={async (channelId, input) => {
          await updateMutation.mutateAsync({ channelId, input });
        }}
      />
    </div>
  );
}

