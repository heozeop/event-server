import { ApiProperty, OmitType, PartialType } from "@nestjs/swagger";
import { IsBoolean, IsMongoId, IsObject } from "class-validator";
import { BooleanTransformer } from "../../common/boolean.transformer";

export class CreateEventRewardDto {
  @ApiProperty({ type: String })
  @IsMongoId()
  eventId!: string;

  @ApiProperty({ type: String })
  @IsMongoId()
  rewardId!: string;

  @ApiProperty({ type: Object })
  @IsObject()
  condition!: Record<string, any>;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  @BooleanTransformer()
  autoResolve!: boolean;
}

export class UpdateEventRewardDto extends PartialType(
  OmitType(CreateEventRewardDto, ["eventId", "rewardId"]),
) { 
  @ApiProperty({ type: String })
  @IsMongoId()
  eventId!: string;

  @ApiProperty({ type: String })
  @IsMongoId()
  rewardId!: string;
}
