import { IsMongoId, IsNotEmpty } from 'class-validator';

export class QueryByIdDto {
  @IsMongoId()
  @IsNotEmpty()
  id!: string;
}
