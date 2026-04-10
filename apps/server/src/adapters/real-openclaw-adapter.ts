import type {
  ApplyConfigInput,
  ChannelProbeInput,
  LogLine,
  ModelValidationInput,
  PatchConfigInput,
  UpdateChannelInput,
  UpdateDefaultModelInput,
  UpsertProviderInput
} from "@openclaw/shared";
import type { OpenClawAdapter } from "./openclaw-adapter";

const notImplemented = () => {
  throw new Error("RealOpenClawAdapter is reserved for future Gateway / CLI integration.");
};

export class RealOpenClawAdapter implements OpenClawAdapter {
  getOverview = notImplemented;
  getServiceStatus = notImplemented;
  startService = notImplemented;
  stopService = (_timeoutSeconds?: number) => notImplemented();
  restartService = (_timeoutSeconds?: number, _reason?: string) => notImplemented();
  getModels = notImplemented;
  setDefaultModel = (_input: UpdateDefaultModelInput) => notImplemented();
  upsertProvider = (_providerId: string, _input: UpsertProviderInput) => notImplemented();
  deleteProvider = (_providerId: string) => notImplemented();
  validateModel = (_input: ModelValidationInput) => notImplemented();
  getChannels = notImplemented;
  getChannelStatuses = notImplemented;
  updateChannel = (_channelId: string, _input: UpdateChannelInput) => notImplemented();
  probeChannels = (_input: ChannelProbeInput) => notImplemented();
  getCurrentConfig = notImplemented;
  patchConfig = (_input: PatchConfigInput) => notImplemented();
  applyConfig = (_input: ApplyConfigInput) => notImplemented();
  tailLogs = (_args: { tail?: number; level?: string; subsystem?: string; cursor?: string }) => notImplemented();
  subscribeLogs(_listener: (line: LogLine) => void): () => void {
    notImplemented();
    return () => undefined;
  }
  dispose() {}
}
