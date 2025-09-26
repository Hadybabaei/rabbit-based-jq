import { Injectable, Logger, Inject } from "@nestjs/common";
import { Redis } from "ioredis";
import { RunSummary } from "./types";

@Injectable()
export class RedisRunManager {
  private readonly logger = new Logger(RedisRunManager.name);

  constructor(@Inject("REDIS_CLIENT") private readonly redis: Redis) {}

  private key(runId: string) {
    return `run:${runId}`;
  }

  async start(runId: string, total: number) {
    await this.redis.hmset(this.key(runId), {
      runId,
      total: String(total),
      succeeded: "0",
      failed: "0",
    });
  }

  async success(runId: string): Promise<RunSummary | null> {
    await this.redis.hincrby(this.key(runId), "succeeded", 1);
    return this.checkComplete(runId);
  }

  async fail(runId: string): Promise<RunSummary | null> {
    await this.redis.hincrby(this.key(runId), "failed", 1);
    return this.checkComplete(runId);
  }

  async get(runId: string): Promise<RunSummary | null> {
    const data = await this.redis.hgetall(this.key(runId));
    if (!data || !data.total) return null;
    return {
      runId: data.runId,
      total: Number(data.total),
      succeeded: Number(data.succeeded || 0),
      failed: Number(data.failed || 0),
    };
  }

  private async checkComplete(runId: string): Promise<RunSummary | null> {
    const s = await this.get(runId);
    if (!s) return null;
    if (s.succeeded + s.failed === s.total) {
      this.logger.log(`Run complete: ${runId}`);
      return s;
    }
    return null;
  }

  async remove(runId: string) {
    await this.redis.del(this.key(runId));
  }
}
