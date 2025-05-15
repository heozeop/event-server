import { Role } from '@libs/enums';
import { IsArray, IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateRolesDto {
  @IsArray()
  @IsEnum(Role, { each: true })
  @IsNotEmpty()
  readonly roles!: Role[];
}
