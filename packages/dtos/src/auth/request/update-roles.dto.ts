import { Role } from "@libs/enums";
import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEnum, IsNotEmpty } from "class-validator";

export class UpdateRolesDto {
  @ApiProperty({
    description: "The roles to update for the user",
    example: [Role.USER, Role.ADMIN],
    enum: Role,
    isArray: true,
  })
  @IsArray()
  @IsEnum(Role, { each: true })
  @IsNotEmpty()
  readonly roles!: Role[];
}
