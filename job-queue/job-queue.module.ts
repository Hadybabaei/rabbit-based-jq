import { DynamicModule, Module } from "@nestjs/common";
import { JobQueueService } from "./job-queue.service";
import { RedisRunManager } from "./redis-run-manager";
import { RunCompleteExplorer } from "./run-complete.explorer";
import { Reflector } from "@nestjs/core";

@Module({
  providers: [JobQueueService, RedisRunManager, RunCompleteExplorer, Reflector],
  exports: [JobQueueService, RedisRunManager, RunCompleteExplorer],
})
export class JobQueueModule {
  static forRoot(): DynamicModule {
    return {
      module: JobQueueModule,
      providers: [
        JobQueueService,
        RedisRunManager,
        RunCompleteExplorer,
        Reflector,
      ],
      exports: [JobQueueService, RedisRunManager, RunCompleteExplorer],
    };
  }
}
