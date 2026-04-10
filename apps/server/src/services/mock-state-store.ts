import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { MockState } from "@openclaw/shared";

export class MockStateStore {
  constructor(
    private readonly filePath: string,
    private readonly createDefaultState: () => MockState
  ) {}

  static fromEnv(createDefaultState: () => MockState) {
    const filePath =
      process.env.MOCK_STATE_PATH ??
      path.resolve(process.cwd(), ".openclaw-console/mock-state.json");

    return new MockStateStore(filePath, createDefaultState);
  }

  async load(): Promise<MockState> {
    await mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      const content = await readFile(this.filePath, "utf-8");
      return JSON.parse(content) as MockState;
    } catch {
      const state = this.createDefaultState();
      await this.save(state);
      return state;
    }
  }

  async save(state: MockState) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(state, null, 2), "utf-8");
  }
}

