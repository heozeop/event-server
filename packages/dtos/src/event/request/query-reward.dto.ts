import { RewardType } from "@libs/enums";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { PagingDto } from "../../common";

export class QueryRewardDto extends PagingDto {
  @IsEnum(RewardType)
  @IsOptional()
  type?: RewardType;

  @IsString()
  @IsOptional()
  name?: string;
} 
