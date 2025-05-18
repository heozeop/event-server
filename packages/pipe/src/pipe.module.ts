import { LoggerModule } from "@libs/logger";
import { Module } from "@nestjs/common";
import { ValidationPipe } from "./validation.pipe";

@Module({
  imports: [LoggerModule],
  providers: [ValidationPipe],
  exports: [ValidationPipe],
})
export class PipeModule {}
