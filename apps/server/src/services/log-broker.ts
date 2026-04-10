import { EventEmitter } from "node:events";
import type { LogLine } from "@openclaw/shared";

export class LogBroker {
  private readonly emitter = new EventEmitter();

  subscribe(listener: (line: LogLine) => void): () => void {
    this.emitter.on("line", listener);
    return () => {
      this.emitter.off("line", listener);
    };
  }

  publish(line: LogLine) {
    this.emitter.emit("line", line);
  }
}

