import { EventStatus } from "@libs/enums";
import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";
import { BooleanTransformer, PagingDto } from "../../common";

export class QueryEventDto extends PagingDto {
  @ApiProperty({
    enum: EventStatus,
    description: "Filter events by status",
    required: false,
    example: EventStatus.ACTIVE,
  })
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @ApiProperty({
    description: "Filter events by name",
    required: false,
    example: "Summer Promotion",
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: "Filter events by active status",
    required: false,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @BooleanTransformer()
  inPeriod?: boolean;
}
