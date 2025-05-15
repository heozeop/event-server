import { RewardRequestStatus } from "@libs/enums";
import { IsEnum, IsMongoId, IsOptional, IsString } from "class-validator";
import { PagingDto } from "../../common";

export class QueryRewardRequestDto extends PagingDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsMongoId()
  @IsOptional()
  eventId?: string;

  @IsEnum(RewardRequestStatus)
  @IsOptional()
  status?: RewardRequestStatus;
}
