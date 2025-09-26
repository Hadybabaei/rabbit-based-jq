import { Injectable, Logger } from "@nestjs/common";
import { AmqpConnection } from "@golevelup/nestjs-rabbitmq";
import { v4 as uuid4 } from "uuid";
import { RedisRunManager } from "./redis-run-manager";
import { RunCompleteExplorer } from "./run-complete.explorer";
import { RunCompletedEvent } from "./run-completed.event";
import { JobMessage, RunSummary } from "./types";

@Injectable()
export class JobQueueService {
  private readonly logger = new Logger(JobQueueService.name);

  constructor(
    private readonly amqp: AmqpConnection,
    private readonly runManager: RedisRunManager,
    private readonly runExplorer: RunCompleteExplorer
  ) {}

  // create deterministic run id or accept caller-provided runId
  makeRunId(sagaName: string, correlationId: string, resourceId: string) {
    return `${sagaName}:${correlationId}:${resourceId}`;
  }

  // start run in redis (total = number of jobs)
  async startRun(runId: string, total: number) {
    await this.runManager.start(runId, total);
  }

  // publish a job (each job gets jobId)
  async addJob<T = any>(
    runId: string | undefined,
    type: string,
    payload: T
  ): Promise<string> {
    const jobId = uuid4();
    const msg: JobMessage<T> = {
      jobId,
      runId,
      type,
      payload,
      retries: 0,
    };
    // publish to exchange 'JOBS' with routingKey = type
    await this.amqp.publish("JOBS", type, msg, { persistent: true });
    this.logger.debug(`Published job ${type} ${jobId} run=${runId}`);
    return jobId;
  }

  // ack job — called by event handler when domain event persisted (eg CardCreated)
  async ackJob(runId: string, jobId: string) {
    const summary = await this.runManager.success(runId);
    if (summary) {
      // run complete -> dispatch to registered onRunComplete handlers (global)
      await this.runExplorer.dispatch(new RunCompletedEvent(summary));
      // optional: cleanup
      await this.runManager.remove(runId);
    }
  }

  // nack job — called when CreateCardFailed or other failure
  async nackJob(runId: string, jobId: string) {
    const summary = await this.runManager.fail(runId);
    if (summary) {
      await this.runExplorer.dispatch(new RunCompletedEvent(summary));
      await this.runManager.remove(runId);
    }
  }

  // utility to get snapshot of run status
  async getRun(runId: string): Promise<RunSummary | null> {
    return this.runManager.get(runId);
  }
}
