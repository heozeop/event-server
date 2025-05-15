import { IsBoolean, IsOptional, IsString } from "class-validator";

import { EventStatus } from "@libs/enums";
import { IsEnum } from "class-validator";
import { PagingDto } from "../../common";

export class QueryEventDto extends PagingDto {
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
