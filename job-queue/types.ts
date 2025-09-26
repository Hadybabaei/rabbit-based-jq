// shared types
export interface JobMessage<T = any> {
  jobId: string;
  runId?: string;
  type?: string;
  payload: T;
  retries?: number;
}

export interface RunSummary {
  runId: string;
  total: number;
  succeeded: number;
  failed: number;
}
