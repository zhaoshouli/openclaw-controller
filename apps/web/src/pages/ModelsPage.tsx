import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, Bot, MoreHorizontal, PenLine, Plus, Sparkles, Trash2 } from "lucide-react";
import type {
  ModelValidationResult,
  ModelsData,
  ProviderSummary,
  UpsertProviderInput
} from "@openclaw/shared";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";
import { ProviderDialog } from "../features/ProviderDialog";
import { api } from "../lib/api";
import { useToast } from "../hooks/use-toast";

export function ModelsPage() {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProviderSummary | null>(null);
  const [validationResult, setValidationResult] = useState<ModelValidationResult | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const modelsQuery = useQuery({
    queryKey: ["models"],
    queryFn: () => api.get<ModelsData>("/api/openclaw/models")
  });

  const upsertProviderMutation = useMutation({
    mutationFn: ({ providerId, input }: { providerId: string; input: UpsertProviderInput }) =>
      api.put(`/api/openclaw/models/providers/${providerId}`, input),
    onSuccess: async () => {
      push("模型服务已保存");
      setDialogOpen(false);
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["models"] });
    },
    onError: (error) => push(error instanceof Error ? error.message : "保存失败", "error")
  });

  const validateMutation = useMutation({
    mutationFn: (providerId: string) =>
      api.post<ModelValidationResult, { provider_id: string; probe: boolean }>("/api/openclaw/models/validate", {
        provider_id: providerId,
        probe: true
      }),
    onSuccess: (data) => setValidationResult(data),
    onError: (error) => push(error instanceof Error ? error.message : "校验失败", "error")
  });

  const deleteMutation = useMutation({
    mutationFn: (providerId: string) => api.delete(`/api/openclaw/models/providers/${providerId}`),
    onSuccess: async () => {
      push("模型服务已删除");
      setOpenMenu(null);
      await queryClient.invalidateQueries({ queryKey: ["models"] });
    },
    onError: (error) => push(error instanceof Error ? error.message : "删除失败", "error")
  });

  const data = modelsQuery.data;
  const officialProvider = data?.providers.find((item) => item.official);
  const customProviders = data?.providers.filter((item) => !item.official) ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="模型配置"
        description="配置 AI 模型提供商，支持 OpenAI、Gemini、阿里等兼容服务。"
        action={
          <button
            onClick={() => {
              setValidationResult(null);
              setEditing(null);
              setDialogOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-600"
          >
            <Plus size={16} />
            添加模型服务
          </button>
        }
      />

      {officialProvider ? (
        <SectionCard className="overflow-hidden bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 text-white">
          <div className="flex items-center justify-between gap-5 px-8 py-7">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/15 ring-1 ring-white/20">
                <Sparkles size={28} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-semibold">官方模型服务</h2>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">官方支持</span>
                </div>
                <div className="mt-2 text-sm text-white/85">
                  使用内置服务模板，快速接入 OpenClaw，支持多模型共存。
                </div>
              </div>
            </div>
            <button className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-slate-100">
              立即体验
            </button>
          </div>
        </SectionCard>
      ) : null}

      {customProviders.length === 0 ? (
        <EmptyState
          icon={<Brain size={34} />}
          title="还没有配置 AI 模型"
          description="添加模型服务即可在代理中使用，支持 OpenAI、Claude、Gemini 以及国产主流大模型。"
          action={
            <button
              onClick={() => setDialogOpen(true)}
              className="rounded-full bg-brand-500 px-7 py-3 text-sm font-semibold text-white shadow-soft"
            >
              添加模型
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="text-xl font-semibold text-ink">已配置服务</div>
          {customProviders.map((provider) => (
            <SectionCard key={provider.provider_id} className="p-0">
              <div className="flex items-center justify-between gap-6 px-6 py-5">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 ring-1 ring-brand-100">
                    <Bot size={20} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-ink">{formatProviderName(provider.provider_id)}</h3>
                      <StatusBadge status="connected" label="已连接" />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {provider.models.slice(0, 2).map((model) => (
                        <span
                          key={model.id}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500"
                        >
                          {model.id}
                        </span>
                      ))}
                      {provider.models.length > 2 ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                          +{provider.models.length - 2}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="relative flex min-w-0 items-center gap-4">
                  <div className="hidden text-right md:block">
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">连接地址</div>
                    <div className="mt-2 max-w-[280px] truncate text-xs text-slate-400">{provider.base_url}</div>
                  </div>

                  <button
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-line text-slate-400 transition hover:border-brand-200 hover:text-brand-600"
                    onClick={() =>
                      setOpenMenu((current) =>
                        current === provider.provider_id ? null : provider.provider_id
                      )
                    }
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {openMenu === provider.provider_id ? (
                    <div className="absolute right-0 top-12 z-20 w-36 rounded-2xl border border-line bg-white p-2 shadow-panel">
                      <button
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-brand-600"
                        onClick={() => {
                          setOpenMenu(null);
                          setEditing(provider);
                          setValidationResult(null);
                          setDialogOpen(true);
                        }}
                      >
                        <PenLine size={14} />
                        编辑服务
                      </button>
                      <button
                        className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50"
                        onClick={() => deleteMutation.mutate(provider.provider_id)}
                      >
                        <Trash2 size={14} />
                        删除服务
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <ProviderDialog
        open={dialogOpen}
        provider={editing}
        validationResult={validationResult}
        loading={upsertProviderMutation.isPending || validateMutation.isPending}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
          setValidationResult(null);
        }}
        onSubmit={async (providerId, input) => {
          await upsertProviderMutation.mutateAsync({ providerId, input });
        }}
        onValidate={async (providerId) => {
          await validateMutation.mutateAsync(providerId);
        }}
      />
    </div>
  );
}

function formatProviderName(providerId: string) {
  const normalized = providerId.replace(/[_-]/g, " ");
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}
