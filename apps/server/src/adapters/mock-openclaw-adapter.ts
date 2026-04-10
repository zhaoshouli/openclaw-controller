import {
  CHANNEL_DEFINITIONS,
  ERROR_CODES,
  type ApplyConfigInput,
  type ChannelProbeInput,
  type ChannelProbeResult,
  type ChannelSummary,
  type ConfigMutationResult,
  type ConfigSnapshot,
  type LogLevel,
  type LogLine,
  type MockState,
  type ModelValidationInput,
  type ModelValidationResult,
  type ModelsData,
  type OverviewData,
  type PatchConfigInput,
  type ServiceStatus,
  type ServiceStatusData,
  type UpdateChannelInput,
  type UpdateDefaultModelInput,
  type UpsertProviderInput
} from "@openclaw/shared";
import type { OpenClawAdapter } from "./openclaw-adapter";
import { MockStateStore } from "../services/mock-state-store";
import { LogBroker } from "../services/log-broker";
import { deepMerge } from "../utils/object";

const LOG_SUBSYSTEMS = [
  "System",
  "Database",
  "Network",
  "Security",
  "Channel"
] as const;

const LOG_MESSAGES = {
  System: [
    "OpenClaw 服务启动中...",
    "加载配置文件：/app/data/config.json",
    "OpenClaw 已就绪，等待请求..."
  ],
  Database: [
    "连接到 Redis 缓存服务...",
    "草稿缓存已刷新",
    "配置快照已写入内存"
  ],
  Network: [
    "API 服务已在端口 8080 启动",
    "健康检查完成，响应时间 128ms",
    "收到新的模型探测请求"
  ],
  Security: [
    "未检测到 SSL 证书，将以 HTTP 模式运行",
    "Provider API Key 已脱敏存储",
    "渠道密钥已通过格式校验"
  ],
  Channel: [
    "飞书渠道探测完成",
    "企业微信渠道等待安装",
    "QQ Bot 正在重试连接"
  ]
} satisfies Record<(typeof LOG_SUBSYSTEMS)[number], string[]>;

export class MockOpenClawAdapter implements OpenClawAdapter {
  private state!: MockState;
  private readonly ready: Promise<void>;
  private transitionTimer?: NodeJS.Timeout;
  private logTimer?: NodeJS.Timeout;

  constructor(
    private readonly store = MockStateStore.fromEnv(createDefaultState),
    private readonly logBroker = new LogBroker()
  ) {
    this.ready = this.initialize();
  }

  private async initialize() {
    this.state = await this.store.load();
    if (this.state.service.status === "starting") {
      this.state.service.status = "running";
      this.state.service.statusText = "运行中";
      this.state.service.healthOk = true;
      this.state.service.rpcOk = true;
      this.state.service.checkedAt = new Date().toISOString();
      await this.persist();
    }
    this.startLogLoop();
  }

  private async ensureReady() {
    await this.ready;
  }

  private async persist() {
    await this.store.save(this.state);
  }

  private nextConfigHash() {
    return `cfg_${Date.now().toString(36)}`;
  }

  private toStatusText(status: ServiceStatus) {
    switch (status) {
      case "running":
        return "运行中";
      case "degraded":
        return "部分异常";
      case "starting":
        return "启动中";
      case "stopped":
        return "未启动";
      case "error":
        return "异常";
      default:
        return "未知";
    }
  }

  private async appendLog(level: LogLevel, subsystem: string, message: string) {
    const line: LogLine = {
      id: crypto.randomUUID(),
      time: new Date().toISOString(),
      level,
      subsystem,
      message
    };

    this.state.logs.lines.push(line);
    this.state.logs.lines = this.state.logs.lines.slice(-800);
    await this.persist();
    this.logBroker.publish(line);
  }

  private startLogLoop() {
    if (this.logTimer) {
      return;
    }

    this.logTimer = setInterval(() => {
      void this.emitRandomLog();
    }, 4000);
  }

  private async emitRandomLog() {
    const subsystem = LOG_SUBSYSTEMS[Math.floor(Math.random() * LOG_SUBSYSTEMS.length)];
    const messages = LOG_MESSAGES[subsystem];
    const message = messages[Math.floor(Math.random() * messages.length)];
    const level: LogLevel = subsystem === "Security" ? "warn" : "info";
    await this.appendLog(level, subsystem, message);
  }

  private scheduleRunningTransition(kind: "start" | "restart") {
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }

    this.transitionTimer = setTimeout(() => {
      void (async () => {
        this.state.service.status = "running";
        this.state.service.statusText = this.toStatusText("running");
        this.state.service.rpcOk = true;
        this.state.service.healthOk = true;
        this.state.service.latencyMs = 120 + Math.floor(Math.random() * 40);
        this.state.service.checkedAt = new Date().toISOString();
        await this.persist();
        await this.appendLog("info", "System", `OpenClaw ${kind === "start" ? "启动" : "重启"}完成`);
      })();
    }, 2500 + Math.floor(Math.random() * 1500));
  }

  async getOverview(): Promise<OverviewData> {
    await this.ensureReady();

    const healthyChannels = this.state.channels.items.filter((item) => item.probe_status === "passed").length;
    const failedChannels = this.state.channels.items.length - healthyChannels;

    return {
      service_name: "OpenClaw",
      status: this.state.service.status,
      status_text: this.state.service.statusText,
      gateway: {
        running: this.state.service.status !== "stopped",
        rpc_ok: this.state.service.rpcOk
      },
      health: {
        ok: this.state.service.healthOk,
        latency_ms: this.state.service.latencyMs
      },
      channels: {
        total: this.state.channels.items.length,
        healthy: healthyChannels,
        failed: failedChannels
      },
      checked_at: this.state.service.checkedAt
    };
  }

  async getServiceStatus(): Promise<ServiceStatusData> {
    await this.ensureReady();

    return {
      status: this.state.service.status,
      gateway_status: this.state.service.status,
      rpc_ok: this.state.service.rpcOk,
      health_ok: this.state.service.healthOk,
      channel_probe_summary: {
        healthy: this.state.channels.items.filter((item) => item.probe_status === "passed").length,
        failed: this.state.channels.items.filter((item) => item.probe_status === "failed").length
      },
      message:
        this.state.service.status === "running"
          ? "gateway and health probe passed"
          : this.state.service.status === "starting"
            ? "service is starting"
            : "service is not running",
      checked_at: this.state.service.checkedAt
    };
  }

  async startService() {
    await this.ensureReady();

    this.state.service.status = "starting";
    this.state.service.statusText = this.toStatusText("starting");
    this.state.service.rpcOk = false;
    this.state.service.healthOk = false;
    this.state.service.checkedAt = new Date().toISOString();
    await this.persist();
    await this.appendLog("info", "System", "收到启动指令，正在拉起 OpenClaw");
    this.scheduleRunningTransition("start");

    return {
      status: "starting",
      message: "service start triggered"
    };
  }

  async stopService(_timeoutSeconds = 10) {
    await this.ensureReady();

    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }

    this.state.service.status = "stopped";
    this.state.service.statusText = this.toStatusText("stopped");
    this.state.service.rpcOk = false;
    this.state.service.healthOk = false;
    this.state.service.checkedAt = new Date().toISOString();
    await this.persist();
    await this.appendLog("warn", "System", "OpenClaw 已停止");

    return {
      status: "stopped",
      message: "service stopped"
    };
  }

  async restartService(_timeoutSeconds = 10, _reason = "manual_restart") {
    await this.ensureReady();

    this.state.service.status = "starting";
    this.state.service.statusText = this.toStatusText("starting");
    this.state.service.rpcOk = false;
    this.state.service.healthOk = false;
    this.state.service.checkedAt = new Date().toISOString();
    await this.persist();
    await this.appendLog("info", "System", "收到重启指令，正在重启 OpenClaw");
    this.scheduleRunningTransition("restart");

    return {
      status: "starting",
      message: "service restart triggered"
    };
  }

  async getModels(): Promise<ModelsData> {
    await this.ensureReady();

    return {
      default_model: this.state.models.defaultModel,
      fallback_models: this.state.models.fallbackModels,
      catalog: this.state.models.catalog,
      providers: this.state.models.providers
    };
  }

  async setDefaultModel(input: UpdateDefaultModelInput) {
    await this.ensureReady();

    this.state.models.defaultModel = input.primary;
    this.state.models.fallbackModels = input.fallbacks;
    this.state.config.configHash = this.nextConfigHash();
    this.state.config.current = deepMerge(this.state.config.current, {
      agents: {
        defaults: {
          model: {
            primary: input.primary,
            fallbacks: input.fallbacks
          }
        }
      }
    });

    await this.persist();
    await this.appendLog("info", "System", `默认模型已更新为 ${input.primary}`);

    return {
      restart_required: false,
      config_hash: this.state.config.configHash
    };
  }

  async upsertProvider(providerId: string, input: UpsertProviderInput) {
    await this.ensureReady();

    const existing = this.state.models.providers.find((provider) => provider.provider_id === providerId);

    const nextProvider = {
      provider_id: providerId,
      api: input.api,
      base_url: input.base_url,
      masked_api_key: input.api_key ? maskApiKey(input.api_key) : existing?.masked_api_key,
      models: input.models,
      official: false
    };

    if (existing) {
      Object.assign(existing, nextProvider);
    } else {
      this.state.models.providers.push(nextProvider);
    }

    for (const model of input.models) {
      const modelRef = `${providerId}/${model.id}`;
      if (!this.state.models.catalog.some((item) => item.model_ref === modelRef)) {
        this.state.models.catalog.push({
          model_ref: modelRef,
          alias: model.alias
        });
      }
    }

    this.state.config.configHash = this.nextConfigHash();
    this.state.config.current = deepMerge(this.state.config.current, {
      models: {
        providers: {
          [providerId]: {
            api: input.api,
            auth: input.auth,
            apiKey: input.api_key ?? null,
            baseUrl: input.base_url,
            headers: input.headers ?? {},
            models: input.models
          }
        }
      }
    });

    await this.persist();
    await this.appendLog("info", "Network", `模型服务 ${providerId} 已保存`);

    return {
      provider_id: providerId,
      restart_required: false,
      config_hash: this.state.config.configHash
    };
  }

  async deleteProvider(providerId: string) {
    await this.ensureReady();

    const refsInUse = [this.state.models.defaultModel, ...this.state.models.fallbackModels].filter((modelRef) =>
      modelRef.startsWith(`${providerId}/`)
    );

    if (refsInUse.length > 0) {
      throw new Error(ERROR_CODES.MODEL_PROVIDER_IN_USE);
    }

    this.state.models.providers = this.state.models.providers.filter((provider) => provider.provider_id !== providerId);
    this.state.models.catalog = this.state.models.catalog.filter((item) => !item.model_ref.startsWith(`${providerId}/`));
    this.state.config.configHash = this.nextConfigHash();

    await this.persist();
    await this.appendLog("warn", "System", `模型服务 ${providerId} 已删除`);

    return {
      provider_id: providerId,
      config_hash: this.state.config.configHash
    };
  }

  async validateModel(input: ModelValidationInput): Promise<ModelValidationResult> {
    await this.ensureReady();

    const provider = this.state.models.providers.find((item) => item.provider_id === input.provider_id);
    if (!provider) {
      return {
        status: "invalid",
        code: ERROR_CODES.MODEL_PROBE_FAILED,
        message: "provider not found"
      };
    }

    const hasUrl = provider.base_url.startsWith("http");
    const hasKey = Boolean(provider.masked_api_key);

    if (!hasUrl || !hasKey) {
      return {
        status: "invalid",
        code: ERROR_CODES.MODEL_AUTH_FAILED,
        message: "provider configuration incomplete"
      };
    }

    const passed = input.probe ? Math.random() > 0.25 : true;
    const latency = 320 + Math.floor(Math.random() * 400);

    if (!passed) {
      await this.appendLog("error", "Network", `模型服务 ${input.provider_id} 在线探测失败`);
      return {
        status: "probe_failed",
        code: ERROR_CODES.MODEL_AUTH_FAILED,
        message: "provider authentication failed",
        latency_ms: latency
      };
    }

    await this.appendLog("info", "Network", `模型服务 ${input.provider_id} 在线探测通过`);
    return {
      status: "passed",
      message: "provider probe passed",
      latency_ms: latency
    };
  }

  async getChannels() {
    await this.ensureReady();
    return { items: this.state.channels.items };
  }

  async getChannelStatuses() {
    await this.ensureReady();
    return {
      items: this.state.channels.items,
      checked_at: new Date().toISOString()
    };
  }

  async updateChannel(channelId: string, input: UpdateChannelInput) {
    await this.ensureReady();

    const channel = this.state.channels.items.find((item) => item.channel_id === channelId);
    if (!channel) {
      throw new Error(ERROR_CODES.CHANNEL_NOT_FOUND);
    }

    channel.enabled = input.enabled;
    channel.configured = Object.values(input.config).every(Boolean);
    channel.status = channel.configured ? "connected" : "not_configured";
    channel.probe_status = channel.configured ? "passed" : "failed";
    channel.summary = channel.configured ? "transport ok" : "配置不完整";
    this.state.config.configHash = this.nextConfigHash();
    this.state.config.current = deepMerge(this.state.config.current, {
      channels: {
        [channelId]: {
          enabled: input.enabled,
          ...input.config
        }
      }
    });

    await this.persist();
    await this.appendLog("info", "Channel", `${channelId} 渠道配置已保存`);

    return {
      channel_id: channelId,
      restart_required: false,
      config_hash: this.state.config.configHash
    };
  }

  async probeChannels(input: ChannelProbeInput): Promise<ChannelProbeResult> {
    await this.ensureReady();

    const items = input.channel_ids.map((channelId) => {
      const channel = this.state.channels.items.find((item) => item.channel_id === channelId);
      if (!channel || !channel.configured) {
        return {
          channel_id: channelId,
          probe_status: "failed" as const,
          message: "auth expired"
        };
      }

      return {
        channel_id: channelId,
        probe_status: "passed" as const
      };
    });

    for (const item of items) {
      const channel = this.state.channels.items.find((candidate) => candidate.channel_id === item.channel_id);
      if (!channel) {
        continue;
      }

      channel.probe_status = item.probe_status;
      channel.status = item.probe_status === "passed" ? "connected" : "error";
      channel.summary = item.probe_status === "passed" ? "transport ok" : item.message ?? "probe failed";
    }

    await this.persist();
    await this.appendLog("info", "Channel", `渠道探测完成：${input.channel_ids.join(", ")}`);

    return { items };
  }

  async getCurrentConfig(): Promise<ConfigSnapshot> {
    await this.ensureReady();
    return {
      config_hash: this.state.config.configHash,
      config: this.state.config.current
    };
  }

  async patchConfig(_input: PatchConfigInput): Promise<ConfigMutationResult> {
    await this.ensureReady();
    this.state.config.current = deepMerge(this.state.config.current, _input.patch);
    this.state.config.configHash = this.nextConfigHash();
    await this.persist();
    await this.appendLog("info", "System", "配置已通过 patch 更新");
    return {
      apply_mode: "patch",
      restart_required: false,
      config_hash: this.state.config.configHash
    };
  }

  async applyConfig(input: ApplyConfigInput): Promise<ConfigMutationResult> {
    await this.ensureReady();
    this.state.config.current = structuredClone(input.config);
    this.state.config.configHash = this.nextConfigHash();
    await this.persist();
    await this.appendLog("warn", "System", "整份配置已覆盖");
    return {
      apply_mode: "full_replace",
      restart_required: true,
      config_hash: this.state.config.configHash
    };
  }

  async tailLogs(args: { tail?: number; level?: string; subsystem?: string; cursor?: string }) {
    await this.ensureReady();

    let lines = [...this.state.logs.lines];

    if (args.level) {
      lines = lines.filter((line) => line.level === args.level);
    }

    if (args.subsystem) {
      const keyword = args.subsystem.toLowerCase();
      lines = lines.filter((line) => line.subsystem.toLowerCase().includes(keyword));
    }

    const tail = Math.min(args.tail ?? 500, 2000);
    return {
      lines: lines.slice(-tail),
      next_cursor: null
    };
  }

  subscribeLogs(listener: (line: LogLine) => void) {
    return this.logBroker.subscribe(listener);
  }

  dispose() {
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
    }

    if (this.logTimer) {
      clearInterval(this.logTimer);
    }
  }
}

function maskApiKey(value: string) {
  if (value.length <= 6) {
    return "******";
  }

  return `${value.slice(0, 3)}******${value.slice(-4)}`;
}

function createDefaultState(): MockState {
  const now = new Date().toISOString();
  const channels = CHANNEL_DEFINITIONS.map<ChannelSummary>((item, index) => ({
    channel_id: item.channel_id,
    enabled: item.channel_id === "feishu",
    configured: item.channel_id === "feishu",
    status: item.channel_id === "feishu" ? "connected" : "not_configured",
    probe_status: item.channel_id === "feishu" ? "passed" : "failed",
    summary: item.channel_id === "feishu" ? "transport ok" : "等待安装",
    version: item.channel_id === "feishu" ? "2026.3.13" : index % 2 === 0 ? "-" : undefined
  }));

  return {
    service: {
      status: "stopped",
      statusText: "未启动",
      rpcOk: false,
      healthOk: false,
      latencyMs: 0,
      checkedAt: now
    },
    models: {
      defaultModel: "openai/gpt-5.4",
      fallbackModels: [
        "openai/gpt-5.4-mini"
      ],
      catalog: [
        {
          model_ref: "openai/gpt-5.4",
          alias: "GPT-5.4"
        },
        {
          model_ref: "openai/gpt-5.4-mini",
          alias: "GPT-5.4 Mini"
        }
      ],
      providers: [
        {
          provider_id: "openai",
          api: "openai-responses",
          base_url: "https://api.openai.com/v1",
          masked_api_key: "sk-******demo",
          models: [
            { id: "gpt-5.4", alias: "GPT-5.4" },
            { id: "gpt-5.4-mini", alias: "GPT-5.4 Mini" }
          ],
          official: true
        }
      ]
    },
    channels: {
      items: channels
    },
    config: {
      configHash: "cfg_initial",
      current: {
        agents: {
          defaults: {
            model: {
              primary: "openai/gpt-5.4",
              fallbacks: [
                "openai/gpt-5.4-mini"
              ]
            }
          }
        },
        models: {
          providers: {
            openai: {
              api: "openai-responses",
              baseUrl: "https://api.openai.com/v1"
            }
          }
        },
        channels: {
          feishu: {
            enabled: true
          }
        }
      }
    },
    logs: {
      lines: [
        {
          id: crypto.randomUUID(),
          time: now,
          level: "info",
          subsystem: "System",
          message: "控制台 Mock 适配器已初始化"
        }
      ]
    }
  };
}
