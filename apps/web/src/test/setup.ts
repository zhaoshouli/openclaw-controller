import "@testing-library/jest-dom";
import { vi } from "vitest";

class MockEventSource {
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  close() {}
}

vi.stubGlobal(
  "fetch",
  vi.fn(async () => ({
    async json() {
      return {
        success: true,
        request_id: "req_test",
        data: {}
      };
    }
  }))
);

vi.stubGlobal("EventSource", MockEventSource);
