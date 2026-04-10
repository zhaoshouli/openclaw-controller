import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "./app";

describe("openclaw routes", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns overview payload", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/openclaw/overview"
    });

    expect(response.statusCode).toBe(200);
    const json = response.json();
    expect(json.success).toBe(true);
    expect(json.data.service_name).toBe("OpenClaw");
  });

  it("starts the service", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/openclaw/service/start"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.status).toBe("starting");
  });

  it("blocks deletion for provider in use", async () => {
    const response = await app.inject({
      method: "DELETE",
      url: "/api/openclaw/models/providers/openai"
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe("MODEL_PROVIDER_IN_USE");
  });
});
