import { startTransition, useDeferredValue, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, RefreshCw, Search, Trash2 } from "lucide-react";
import type { LogLevel, LogsData, LogLine } from "@openclaw/shared";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { api } from "../lib/api";
import { useToast } from "../hooks/use-toast";

const levels: Array<"all" | Exclude<LogLevel, "debug">> = ["all", "info", "warn", "error"];

export function LogsPage() {
  const { push } = useToast();
  const [search, setSearch] = useState("");
  const [activeLevel, setActiveLevel] = useState<typeof levels[number]>("all");
  const [streaming, setStreaming] = useState(true);
  const [liveLines, setLiveLines] = useState<LogLine[]>([]);
  const deferredSearch = useDeferredValue(search);

  const logsQuery = useQuery({
    queryKey: ["logs"],
    queryFn: () => api.get<LogsData>("/api/openclaw/logs?tail=120")
  });

  useEffect(() => {
    const eventSource = new EventSource(`${api.baseUrl}/api/openclaw/logs/stream`);

    eventSource.onopen = () => setStreaming(true);
    eventSource.onerror = () => setStreaming(false);
    eventSource.onmessage = (event) => {
      startTransition(() => {
        const line = JSON.parse(event.data) as LogLine;
        setLiveLines((current) => [...current.slice(-300), line]);
      });
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const lines = [...(logsQuery.data?.lines ?? []), ...liveLines].filter((line) => {
    const matchesLevel = activeLevel === "all" ? true : line.level === activeLevel;
    const keyword = deferredSearch.trim().toLowerCase();
    const matchesSearch = keyword
      ? `${line.subsystem} ${line.message}`.toLowerCase().includes(keyword)
      : true;
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <PageHeader title="运行日志" description="查看 OpenClaw 实时运行日志与错误堆栈。" />

      <SectionCard className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-line px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative w-full max-w-[320px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="搜索日志..."
                className="h-11 w-full rounded-full border border-line bg-white pl-11 pr-4 text-sm outline-none ring-0 transition focus:border-brand-500"
              />
            </div>

            <div className="flex items-center gap-2">
              {levels.map((level) => (
                <button
                  key={level}
                  onClick={() => setActiveLevel(level)}
                  className={
                    activeLevel === level
                      ? "rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand-600"
                      : "rounded-full border border-line px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
                  }
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <IconButton onClick={() => void logsQuery.refetch()} icon={<RefreshCw size={15} />} />
            <IconButton
              onClick={() => {
                const blob = new Blob(
                  [lines.map((line) => `[${line.time}] ${line.level.toUpperCase()} ${line.subsystem} ${line.message}`).join("\n")],
                  { type: "text/plain;charset=utf-8" }
                );
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = "openclaw-logs.txt";
                anchor.click();
                URL.revokeObjectURL(url);
              }}
              icon={<Download size={15} />}
            />
            <IconButton
              onClick={() => {
                setLiveLines([]);
                push("已清空当前视图缓存");
              }}
              icon={<Trash2 size={15} />}
              danger
            />
          </div>
        </div>

        <div className="bg-[#101214] px-4 py-5 font-mono text-sm leading-7 text-slate-200">
          <div className="min-h-[440px] overflow-auto rounded-[20px] bg-[#0d0f11] p-4">
            {lines.map((line) => (
              <div key={line.id} className="grid grid-cols-[90px_70px_120px_1fr] gap-4 whitespace-pre-wrap">
                <span className="text-[#6b86d6]">{new Date(line.time).toLocaleTimeString("zh-CN", { hour12: false })}</span>
                <span className={levelColor(line.level)}>{line.level.toUpperCase()}</span>
                <span className="text-slate-400">[{line.subsystem}]</span>
                <span>{line.message}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 bg-white px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400 md:flex-row md:items-center md:justify-between">
          <div>
            Total: {lines.length} lines &nbsp;&nbsp; Storage: {(JSON.stringify(lines).length / 1024).toFixed(1)} KB
          </div>
          <div className={streaming ? "text-emerald-500" : "text-amber-500"}>
            {streaming ? "Real-time streaming active" : "Stream reconnecting"}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function IconButton({
  onClick,
  icon,
  danger
}: {
  onClick: () => void;
  icon: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={
        danger
          ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-100 text-red-500 transition hover:bg-red-50"
          : "inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-slate-500 transition hover:border-brand-500 hover:text-brand-600"
      }
    >
      {icon}
    </button>
  );
}

function levelColor(level: LogLevel) {
  switch (level) {
    case "warn":
      return "text-amber-400";
    case "error":
      return "text-red-400";
    case "debug":
      return "text-purple-300";
    default:
      return "text-sky-400";
  }
}
