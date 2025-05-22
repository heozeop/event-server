import { EventRewardEntity } from "@libs/types";
import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsBoolean, IsMongoId, IsObject, IsOptional } from "class-validator";
import { BooleanTransformer } from "../../common/boolean.transformer";
import { EventResponseDto } from "./event-response.dto";
import { RewardResponseDto } from "./reward-response.dto";

export class  EventRewardResponseDto {
  @ApiProperty()
  @Expose()
  @IsMongoId()
  id!: string;

  @ApiProperty({ type: RewardResponseDto })
  @Expose()
  @Type(() => RewardResponseDto)
  @IsOptional()
  reward?: RewardResponseDto;

  @ApiProperty({ type: EventResponseDto })
  @Expose()
  @Type(() => EventResponseDto)
  @IsOptional()
  event?: EventResponseDto;

  @ApiProperty({ type: Object })
  @Expose()
  @IsObject()
  condition!: Record<string, any>;

  @ApiProperty({ type: Boolean })
  @Expose()
  @IsBoolean()
  @BooleanTransformer()
  autoResolve!: boolean;

  static fromEntity(eventReward: EventRewardEntity): EventRewardResponseDto {
    const dto = new EventRewardResponseDto();
    dto.id = eventReward._id.toString();
    dto.reward = eventReward.reward && RewardResponseDto.fromEntity(eventReward.reward);
    dto.event = eventReward.event && EventResponseDto.fromEntity(eventReward.event);
    dto.condition = eventReward.condition;
    dto.autoResolve = eventReward.autoResolve;

    return dto;
  }
}
