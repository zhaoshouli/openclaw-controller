import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "../components/Modal";
import type { ChannelSummary, UpdateChannelInput } from "@openclaw/shared";
import { RoundedSelect } from "../components/RoundedSelect";

const fieldMap = {
  feishu: [
    { key: "appId", label: "飞书 App ID" },
    { key: "appSecret", label: "飞书 App Secret" }
  ],
  "wechat-work": [
    { key: "corpId", label: "企业 ID" },
    { key: "corpSecret", label: "应用 Secret" }
  ],
  dingtalk: [
    { key: "clientId", label: "Client ID" },
    { key: "clientSecret", label: "Client Secret" }
  ],
  wechat: [
    { key: "botKey", label: "机器人 Key" },
    { key: "token", label: "Token" }
  ],
  "qq-bot": [
    { key: "appId", label: "QQ Bot App ID" },
    { key: "token", label: "Bot Token" }
  ]
} as const;

const schema = z.object({
  channel_id: z.enum(["feishu", "wechat-work", "dingtalk", "wechat", "qq-bot"]),
  valueA: z.string().min(1, "请填写凭证"),
  valueB: z.string().min(1, "请填写凭证"),
  enabled: z.boolean()
});

type ChannelDialogValues = z.infer<typeof schema>;

const channelOptions = [
  { value: "feishu", label: "飞书" },
  { value: "wechat-work", label: "企业微信" },
  { value: "dingtalk", label: "钉钉" },
  { value: "wechat", label: "微信" },
  { value: "qq-bot", label: "QQ Bot" }
] as const;

export function ChannelDialog({
  open,
  channel,
  loading,
  onClose,
  onSubmit
}: {
  open: boolean;
  channel?: ChannelSummary | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (channelId: string, input: UpdateChannelInput) => Promise<void>;
}) {
  const form = useForm<ChannelDialogValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      channel_id: (channel?.channel_id as ChannelDialogValues["channel_id"]) ?? "feishu",
      valueA: "",
      valueB: "",
      enabled: channel?.enabled ?? true
    }
  });

  const channelId = form.watch("channel_id");
  const fields = fieldMap[channelId];

  useEffect(() => {
    form.reset({
      channel_id: (channel?.channel_id as ChannelDialogValues["channel_id"]) ?? "feishu",
      valueA: "",
      valueB: "",
      enabled: channel?.enabled ?? true
    });
  }, [channel, form, open]);

  async function handleSubmit(values: ChannelDialogValues) {
    await onSubmit(values.channel_id, {
      enabled: values.enabled,
      config: {
        [fields[0].key]: values.valueA,
        [fields[1].key]: values.valueB
      }
    });
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
      title="添加消息渠道"
      description="选择接入类型并填写凭证信息，保存后即可用于消息分发。"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
          >
            取消
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void form.handleSubmit(handleSubmit)()}
            className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-600 disabled:opacity-60"
          >
            保存
          </button>
        </div>
      }
    >
      <form className="space-y-6">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700">渠道类型</span>
          <Controller
            control={form.control}
            name="channel_id"
            render={({ field }) => (
              <RoundedSelect
                value={field.value}
                onChange={field.onChange}
                options={[...channelOptions]}
              />
            )}
          />
        </label>

        <div className="rounded-[24px] border border-line bg-slate-50/70 p-5">
          <div className="mb-4 text-sm font-semibold text-slate-700">凭证配置</div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-slate-500">{fields[0].label}</span>
              <input className="input" {...form.register("valueA")} placeholder={fields[0].label} />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-500">{fields[1].label}</span>
              <input className="input" {...form.register("valueB")} placeholder={fields[1].label} />
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
}
