import { EventRewardEntity } from "@libs/types";
import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsBoolean, IsObject } from "class-validator";
import { BooleanTransformer } from "../../common/boolean.transformer";
import { EventResponseDto } from "./event-response.dto";
import { RewardResponseDto } from "./reward-response.dto";

export class  EventRewardResponseDto {
  @ApiProperty({ type: RewardResponseDto })
  @Expose()
  @Type(() => RewardResponseDto)
  reward!: RewardResponseDto;

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
    dto.reward = RewardResponseDto.fromEntity(eventReward.reward);
    dto.condition = eventReward.condition;
    dto.autoResolve = eventReward.autoResolve;

    return dto;
  }
}

export class RewardEventResponseDto {
  @ApiProperty({ type: EventResponseDto })
  @Expose()
  @Type(() => EventResponseDto)
  event!: EventResponseDto;

  @ApiProperty({ type: Object })
  @Expose()
  @IsObject()
  condition!: Record<string, any>;

  @ApiProperty({ type: Boolean })
  @Expose()
  @IsBoolean()
  @BooleanTransformer()
  autoResolve!: boolean;

  static fromEntity(eventReward: EventRewardEntity): RewardEventResponseDto {
    const dto = new RewardEventResponseDto();

    dto.event = EventResponseDto.fromEntity(eventReward.event);
    dto.condition = eventReward.condition;
    dto.autoResolve = eventReward.autoResolve;

    return dto;
  }
}
