import Fastify from "fastify";
import cors from "@fastify/cors";
import type { OpenClawAdapter } from "./adapters/openclaw-adapter";
import { MockOpenClawAdapter } from "./adapters/mock-openclaw-adapter";
import { registerOpenClawRoutes } from "./routes/openclaw";

export async function buildApp(adapter: OpenClawAdapter = new MockOpenClawAdapter()) {
  const app = Fastify({
    logger: false
  });

  await app.register(cors, {
    origin: true
  });

  app.get("/health", async () => ({
    ok: true
  }));

  app.addHook("onClose", async () => {
    adapter.dispose?.();
  });

  await registerOpenClawRoutes(app, adapter);

  return app;
}
