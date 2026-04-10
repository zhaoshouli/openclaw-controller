import type {
  ApplyConfigInput,
  ChannelMutationResult,
  ChannelProbeInput,
  ChannelProbeResult,
  ChannelsData,
  ConfigMutationResult,
  ConfigSnapshot,
  LogsData,
  LogLine,
  ModelValidationInput,
  ModelValidationResult,
  ModelsData,
  OverviewData,
  PatchConfigInput,
  ProviderMutationResult,
  ServiceStatusData,
  UpdateChannelInput,
  UpdateDefaultModelInput,
  UpsertProviderInput
} from "@openclaw/shared";

export interface OpenClawAdapter {
  getOverview(): Promise<OverviewData>;
  getServiceStatus(): Promise<ServiceStatusData>;
  startService(): Promise<{ status: string; message: string }>;
  stopService(timeoutSeconds?: number): Promise<{ status: string; message: string }>;
  restartService(timeoutSeconds?: number, reason?: string): Promise<{ status: string; message: string }>;
  getModels(): Promise<ModelsData>;
  setDefaultModel(input: UpdateDefaultModelInput): Promise<{ restart_required: boolean; config_hash: string }>;
  upsertProvider(providerId: string, input: UpsertProviderInput): Promise<ProviderMutationResult>;
  deleteProvider(providerId: string): Promise<{ provider_id: string; config_hash: string }>;
  validateModel(input: ModelValidationInput): Promise<ModelValidationResult>;
  getChannels(): Promise<ChannelsData>;
  getChannelStatuses(): Promise<{ items: ChannelsData["items"]; checked_at: string }>;
  updateChannel(channelId: string, input: UpdateChannelInput): Promise<ChannelMutationResult>;
  probeChannels(input: ChannelProbeInput): Promise<ChannelProbeResult>;
  getCurrentConfig(): Promise<ConfigSnapshot>;
  patchConfig(input: PatchConfigInput): Promise<ConfigMutationResult>;
  applyConfig(input: ApplyConfigInput): Promise<ConfigMutationResult>;
  tailLogs(args: { tail?: number; level?: string; subsystem?: string; cursor?: string }): Promise<LogsData>;
  subscribeLogs(listener: (line: LogLine) => void): () => void;
  dispose?(): void;
}
