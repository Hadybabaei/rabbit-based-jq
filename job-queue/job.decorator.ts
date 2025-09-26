import { RabbitSubscribe } from "@golevelup/nestjs-rabbitmq";

export function JobHandler(routingKey: string, opts?: any) {
  return RabbitSubscribe({
    exchange: "JOBS",
    routingKey,
    queue: `jobs.${routingKey}`,
    queueOptions: { durable: true },
    ...opts,
  });
}
