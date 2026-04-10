import type { FastifyInstance, FastifyReply } from "fastify";
import type {
  ApplyConfigInput,
  ChannelProbeInput,
  ModelValidationInput,
  PatchConfigInput,
  UpdateChannelInput,
  UpdateDefaultModelInput,
  UpsertProviderInput
} from "@openclaw/shared";
import { ERROR_CODES } from "@openclaw/shared";
import type { OpenClawAdapter } from "../adapters/openclaw-adapter";
import { createRequestId, failure, success } from "../utils/api";

export async function registerOpenClawRoutes(app: FastifyInstance, adapter: OpenClawAdapter) {
  app.get("/api/openclaw/overview", async () => {
    const requestId = createRequestId();
    return success(requestId, await adapter.getOverview());
  });

  app.get("/api/openclaw/service/status", async () => {
    const requestId = createRequestId();
    return success(requestId, await adapter.getServiceStatus());
  });

  app.post("/api/openclaw/service/start", async () => {
    const requestId = createRequestId();
    return success(requestId, await adapter.startService());
  });

  app.post<{ Body: { timeout_seconds?: number } }>("/api/openclaw/service/stop", async (request) => {
    const requestId = createRequestId();
    return success(requestId, await adapter.stopService(request.body?.timeout_seconds));
  });

  app.post<{ Body: { timeout_seconds?: number; reason?: string } }>(
    "/api/openclaw/service/restart",
    async (request) => {
      const requestId = createRequestId();
      return success(
        requestId,
        await adapter.restartService(request.body?.timeout_seconds, request.body?.reason)
      );
    }
  );

  app.get("/api/openclaw/models", async () => {
    const requestId = createRequestId();
    return success(requestId, await adapter.getModels());
  });

  app.post<{ Body: UpdateDefaultModelInput }>("/api/openclaw/models/default", async (request) => {
    const requestId = createRequestId();
    return success(requestId, await adapter.setDefaultModel(request.body));
  });

  app.put<{ Params: { providerId: string }; Body: UpsertProviderInput }>(
    "/api/openclaw/models/providers/:providerId",
    async (request) => {
      const requestId = createRequestId();
      return success(
        requestId,
        await adapter.upsertProvider(request.params.providerId, request.body)
      );
    }
  );

  app.delete<{ Params: { providerId: string } }>(
    "/api/openclaw/models/providers/:providerId",
    async (request, reply) => {
      const requestId = createRequestId();
      try {
        return success(requestId, await adapter.deleteProvider(request.params.providerId));
      } catch (error) {
        if (error instanceof Error && error.message === ERROR_CODES.MODEL_PROVIDER_IN_USE) {
          reply.code(409);
          return failure(requestId, ERROR_CODES.MODEL_PROVIDER_IN_USE, "provider is still in use");
        }
        throw error;
      }
    }
  );

  app.post<{ Body: ModelValidationInput }>("/api/openclaw/models/validate", async (request) => {
    const requestId = createRequestId();
    return success(requestId, await adapter.validateModel(request.body));
  });

  app.get("/api/openclaw/channels", async () => {
    const requestId = createRequestId();
    return success(requestId, await adapter.getChannels());
  });

  app.get("/api/openclaw/channels/status", async () => {
    const requestId = createRequestId();
    return success(requestId, await adapter.getChannelStatuses());
  });

  app.put<{ Params: { channelId: string }; Body: UpdateChannelInput }>(
    "/api/openclaw/channels/:channelId",
    async (request, reply) => {
      const requestId = createRequestId();
      try {
        return success(
          requestId,
          await adapter.updateChannel(request.params.channelId, request.body)
        );
      } catch (error) {
        if (error instanceof Error && error.message === ERROR_CODES.CHANNEL_NOT_FOUND) {
          reply.code(404);
          return failure(requestId, ERROR_CODES.CHANNEL_NOT_FOUND, "channel not found");
        }
        throw error;
      }
    }
  );

  app.post<{ Body: ChannelProbeInput }>("/api/openclaw/channels/probe", async (request) => {
    const requestId = createRequestId();
    return success(requestId, await adapter.probeChannels(request.body));
  });

  app.get("/api/openclaw/config/current", async () => {
    const requestId = createRequestId();
    return success(requestId, await adapter.getCurrentConfig());
  });

  app.post<{ Body: PatchConfigInput }>("/api/openclaw/config/patch", async (request) => {
    const requestId = createRequestId();
    return success(requestId, await adapter.patchConfig(request.body));
  });

  app.post<{ Body: ApplyConfigInput }>("/api/openclaw/config/apply", async (request) => {
    const requestId = createRequestId();
    return success(requestId, await adapter.applyConfig(request.body));
  });

  app.get<{
    Querystring: {
      tail?: string;
      level?: string;
      subsystem?: string;
      cursor?: string;
    };
  }>("/api/openclaw/logs", async (request) => {
    const requestId = createRequestId();
    return success(
      requestId,
      await adapter.tailLogs({
        tail: request.query.tail ? Number(request.query.tail) : undefined,
        level: request.query.level,
        subsystem: request.query.subsystem,
        cursor: request.query.cursor
      })
    );
  });

  app.get("/api/openclaw/logs/stream", async (_request, reply) => {
    const requestId = createRequestId();
    setupSse(reply);

    reply.raw.write(`event: ready\n`);
    reply.raw.write(`data: ${JSON.stringify({ request_id: requestId })}\n\n`);

    const unsubscribe = adapter.subscribeLogs((line) => {
      reply.raw.write(`data: ${JSON.stringify(line)}\n\n`);
    });

    const heartbeat = setInterval(() => {
      reply.raw.write(`event: heartbeat\ndata: ${Date.now()}\n\n`);
    }, 15000);

    reply.raw.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
      reply.raw.end();
    });

    return reply;
  });
}

function setupSse(reply: FastifyReply) {
  reply.raw.setHeader("Content-Type", "text/event-stream");
  reply.raw.setHeader("Cache-Control", "no-cache, no-transform");
  reply.raw.setHeader("Connection", "keep-alive");
  reply.raw.flushHeaders?.();
}
