export type ServiceStatus =
  | "running"
  | "degraded"
  | "starting"
  | "stopped"
  | "error"
  | "unknown";

export type ChannelConnectionStatus =
  | "connected"
  | "disconnected"
  | "not_configured"
  | "error";

export type ProbeStatus = "passed" | "failed" | "skipped";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type ProviderApi = "openai-responses" | "gemini" | "aliyun-qwen" | "custom";

export interface ApiSuccess<T> {
  success: true;
  request_id: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  request_id: string;
  error: {
    code: string;
    message: string;
    details: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface OverviewData {
  service_name: string;
  status: ServiceStatus;
  status_text: string;
  gateway: {
    running: boolean;
    rpc_ok: boolean;
  };
  health: {
    ok: boolean;
    latency_ms: number;
  };
  channels: {
    total: number;
    healthy: number;
    failed: number;
  };
  checked_at: string;
}

export interface ServiceStatusData {
  status: ServiceStatus;
  gateway_status: ServiceStatus;
  rpc_ok: boolean;
  health_ok: boolean;
  channel_probe_summary: {
    healthy: number;
    failed: number;
  };
  message: string;
  checked_at: string;
}

export interface ProviderModel {
  id: string;
  alias: string;
}

export interface ProviderSummary {
  provider_id: string;
  api: ProviderApi;
  base_url: string;
  masked_api_key?: string;
  models: ProviderModel[];
  official?: boolean;
}

export interface ModelsData {
  default_model: string;
  fallback_models: string[];
  catalog: Array<{
    model_ref: string;
    alias: string;
  }>;
  providers: ProviderSummary[];
}

export interface UpdateDefaultModelInput {
  primary: string;
  fallbacks: string[];
}

export interface UpsertProviderInput {
  api: ProviderApi;
  auth: "api-key";
  api_key?: string;
  base_url: string;
  headers?: Record<string, string>;
  models: ProviderModel[];
}

export interface ProviderMutationResult {
  provider_id: string;
  restart_required: boolean;
  config_hash: string;
}

export interface ModelValidationInput {
  provider_id: string;
  probe: boolean;
}

export interface ModelValidationResult {
  status: "passed" | "probe_failed" | "invalid";
  code?: string;
  message: string;
  latency_ms?: number;
}

export interface ChannelSummary {
  channel_id: string;
  enabled: boolean;
  configured: boolean;
  status: ChannelConnectionStatus;
  probe_status: ProbeStatus;
  summary: string;
  version?: string;
}

export interface ChannelsData {
  items: ChannelSummary[];
}

export interface UpdateChannelInput {
  enabled: boolean;
  config: Record<string, string>;
}

export interface ChannelMutationResult {
  channel_id: string;
  restart_required: boolean;
  config_hash: string;
}

export interface ChannelProbeInput {
  channel_ids: string[];
}

export interface ChannelProbeResult {
  items: Array<{
    channel_id: string;
    probe_status: ProbeStatus;
    message?: string;
  }>;
}

export interface ConfigSnapshot {
  config_hash: string;
  config: Record<string, unknown>;
}

export interface PatchConfigInput {
  patch: Record<string, unknown>;
}

export interface ApplyConfigInput {
  config: Record<string, unknown>;
}

export interface ConfigMutationResult {
  apply_mode: "patch" | "full_replace";
  restart_required: boolean;
  config_hash: string;
}

export interface LogLine {
  id: string;
  time: string;
  level: LogLevel;
  subsystem: string;
  message: string;
}

export interface LogsData {
  lines: LogLine[];
  next_cursor: string | null;
}

export interface MockState {
  service: {
    status: ServiceStatus;
    statusText: string;
    rpcOk: boolean;
    healthOk: boolean;
    latencyMs: number;
    checkedAt: string;
  };
  models: {
    defaultModel: string;
    fallbackModels: string[];
    catalog: Array<{
      model_ref: string;
      alias: string;
    }>;
    providers: ProviderSummary[];
  };
  channels: {
    items: ChannelSummary[];
  };
  config: {
    configHash: string;
    current: Record<string, unknown>;
  };
  logs: {
    lines: LogLine[];
  };
}

export const CHANNEL_DEFINITIONS = [
  { channel_id: "feishu", label: "飞书" },
  { channel_id: "wechat-work", label: "企业微信" },
  { channel_id: "dingtalk", label: "钉钉" },
  { channel_id: "wechat", label: "微信" },
  { channel_id: "qq-bot", label: "QQ Bot" }
] as const;

export const ERROR_CODES = {
  SERVICE_NOT_RUNNING: "SERVICE_NOT_RUNNING",
  SERVICE_START_FAILED: "SERVICE_START_FAILED",
  SERVICE_STOP_FAILED: "SERVICE_STOP_FAILED",
  SERVICE_RESTART_FAILED: "SERVICE_RESTART_FAILED",
  MODEL_PROVIDER_IN_USE: "MODEL_PROVIDER_IN_USE",
  MODEL_AUTH_FAILED: "MODEL_AUTH_FAILED",
  MODEL_PROBE_FAILED: "MODEL_PROBE_FAILED",
  CHANNEL_NOT_FOUND: "CHANNEL_NOT_FOUND",
  CHANNEL_CONFIG_INVALID: "CHANNEL_CONFIG_INVALID",
  CHANNEL_PROBE_FAILED: "CHANNEL_PROBE_FAILED",
  CONFIG_PATCH_FAILED: "CONFIG_PATCH_FAILED",
  CONFIG_APPLY_FAILED: "CONFIG_APPLY_FAILED",
  LOG_TAIL_FAILED: "LOG_TAIL_FAILED",
  LOG_STREAM_FAILED: "LOG_STREAM_FAILED"
} as const;
