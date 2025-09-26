import { SetMetadata } from "@nestjs/common";

export const ON_RUN_COMPLETE = "ON_RUN_COMPLETE";

export type RunFilterFn = (runId: string) => boolean;

export const OnRunComplete = (filter?: RunFilterFn) =>
  SetMetadata(ON_RUN_COMPLETE, filter ?? (() => true));
