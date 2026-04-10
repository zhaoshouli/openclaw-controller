import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Gauge, Play, RefreshCw, RotateCcw, Square } from "lucide-react";
import type { OverviewData, ServiceStatusData } from "@openclaw/shared";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { StatusBadge } from "../components/StatusBadge";
import { api } from "../lib/api";
import { useToast } from "../hooks/use-toast";

export function OverviewPage() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  const overviewQuery = useQuery({
    queryKey: ["overview"],
    queryFn: () => api.get<OverviewData>("/api/openclaw/overview"),
    refetchInterval: 15000
  });

  const serviceStatusQuery = useQuery({
    queryKey: ["service-status"],
    queryFn: () => api.get<ServiceStatusData>("/api/openclaw/service/status"),
    refetchInterval: (query) => (query.state.data?.status === "starting" ? 5000 : 15000)
  });

  const startMutation = useActionMutation("/api/openclaw/service/start", "启动指令已发送");
  const stopMutation = useActionMutation("/api/openclaw/service/stop", "服务已停止", {
    timeout_seconds: 10
  });
  const restartMutation = useActionMutation("/api/openclaw/service/restart", "重启指令已发送", {
    timeout_seconds: 10,
    reason: "manual_restart"
  });

  function useActionMutation<TBody extends object>(path: string, message: string, body?: TBody) {
    return useMutation({
      mutationFn: () => api.post(path, body),
      onSuccess: async () => {
        push(message);
        await queryClient.invalidateQueries({ queryKey: ["overview"] });
        await queryClient.invalidateQueries({ queryKey: ["service-status"] });
      },
      onError: (error) => push(error instanceof Error ? error.message : "请求失败", "error")
    });
  }

  const overview = overviewQuery.data;
  const service = serviceStatusQuery.data;

  return (
    <div className="space-y-8">
      <PageHeader title="概览" description="监控 OpenClaw 自身运行状态与基础能力可用性。" />

      <SectionCard className="overflow-hidden">
        <div className="border-b border-line px-8 py-6">
          <div className="text-3xl font-semibold text-ink">状态与控制</div>
        </div>
        <div className="flex flex-col gap-8 px-8 py-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={
                service?.status === "running"
                  ? "h-4 w-4 rounded-full bg-emerald-500"
                  : service?.status === "starting"
                    ? "h-4 w-4 rounded-full bg-brand-500"
                    : "h-4 w-4 rounded-full bg-slate-300"
              }
            />
            <div>
              <div className="text-[38px] font-semibold tracking-tight">
                {overview?.status_text ?? "加载中"}
              </div>
              <div className="mt-2 text-sm text-slate-500">
                {service?.message ?? "正在获取服务状态"}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
              状态 <span className="ml-2">{overview?.status_text ?? "-"}</span>
            </div>
            <button
              onClick={() => startMutation.mutate()}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-8 py-4 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-600"
            >
              <Play size={16} />
              启动
            </button>
            <button
              onClick={() => stopMutation.mutate()}
              className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-5 py-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
            >
              <Square size={15} />
              停止
            </button>
            <button
              onClick={() => restartMutation.mutate()}
              className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-5 py-4 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
            >
              <RotateCcw size={15} />
              重启
            </button>
            <button
              onClick={() => {
                void overviewQuery.refetch();
                void serviceStatusQuery.refetch();
              }}
              className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-white text-slate-500 transition hover:border-brand-500 hover:text-brand-600"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-3">
        <MetricCard
          icon={<Activity size={20} />}
          title="Gateway"
          value={service?.rpc_ok ? "可达" : "不可达"}
          subline={`检测时间 ${formatTime(overview?.checked_at)}`}
          status={<StatusBadge status={overview?.status ?? "unknown"} label={overview?.status_text} />}
        />
        <MetricCard
          icon={<Gauge size={20} />}
          title="健康检查"
          value={overview?.health.ok ? `${overview.health.latency_ms} ms` : "未通过"}
          subline={overview?.health.ok ? "响应延迟" : "等待服务启动"}
          status={<StatusBadge status={overview?.health.ok ? "running" : "stopped"} label={overview?.health.ok ? "正常" : "离线"} />}
        />
        <MetricCard
          icon={<RefreshCw size={20} />}
          title="消息渠道"
          value={`${overview?.channels.healthy ?? 0}/${overview?.channels.total ?? 0}`}
          subline={`失败 ${overview?.channels.failed ?? 0} 个`}
          status={<StatusBadge status={overview?.channels.failed ? "degraded" : "running"} label={overview?.channels.failed ? "部分异常" : "健康"} />}
        />
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  title,
  value,
  subline,
  status
}: {
  icon: ReactNode;
  title: string;
  value: string;
  subline: string;
  status: ReactNode;
}) {
  return (
    <SectionCard className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          {icon}
        </div>
        {status}
      </div>
      <div className="mt-8 text-lg font-semibold text-slate-500">{title}</div>
      <div className="mt-3 text-3xl font-semibold text-ink">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{subline}</div>
    </SectionCard>
  );
}

function formatTime(value?: string) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleTimeString("zh-CN", { hour12: false });
}
