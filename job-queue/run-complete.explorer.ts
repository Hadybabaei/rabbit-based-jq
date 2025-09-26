import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { ModulesContainer, Reflector } from "@nestjs/core";
import { ON_RUN_COMPLETE } from "./on-run-complete.decorator";
import { RunCompletedEvent } from "./run-completed.event";

@Injectable()
export class RunCompleteExplorer implements OnModuleInit {
  private readonly logger = new Logger(RunCompleteExplorer.name);
  private handlers: Array<{
    filter: (runId: string) => boolean;
    handler: (event: RunCompletedEvent) => Promise<void> | void;
  }> = [];

  constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly reflector: Reflector
  ) {}

  onModuleInit() {
    this.modulesContainer.forEach((moduleRef) => {
      const providers = [...moduleRef.providers.values()];
      for (const wrapper of providers) {
        const instance =
          wrapper && (wrapper as any).instance
            ? (wrapper as any).instance
            : null;
        if (!instance) continue;
        const proto = Object.getPrototypeOf(instance);
        Object.getOwnPropertyNames(proto).forEach((methodName) => {
          if (methodName === "constructor") return;
          const method = instance[methodName];
          const filter = this.reflector.get<(runId: string) => boolean>(
            ON_RUN_COMPLETE,
            method
          );
          if (filter) {
            this.logger.log(
              `Register @OnRunComplete -> ${instance.constructor.name}.${methodName}`
            );
            this.handlers.push({ filter, handler: method.bind(instance) });
          }
        });
      }
    });
  }

  async dispatch(event: RunCompletedEvent) {
    for (const { filter, handler } of this.handlers) {
      try {
        if (filter(event.runId)) {
          await handler(event);
        }
      } catch (err) {
        this.logger.error("Error in onRunComplete handler", err);
      }
    }
  }
}
