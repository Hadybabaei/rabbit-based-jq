import { RunSummary } from "./types";

export class RunCompletedEvent {
  constructor(public readonly summary: RunSummary) {}
  get runId() {
    return this.summary.runId;
  }
}
