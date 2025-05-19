import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

/**
 * Base request DTO for standard offset-based pagination
 */
export class PaginationRequestDto {
  @ApiProperty({
    description: 'Page number (starts from 0)',
    default: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => Number(value) || 0)
  page?: number = 0;

  @ApiProperty({
    description: 'Number of items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Transform(({ value }) => Number(value) || 10)
  limit?: number = 10;

  /**
   * Get the offset for database queries
   */
  getOffset(): number {
    return (this.page || 0) * (this.limit || 10);
  }
}

/**
 * Base response DTO for standard pagination
 */
export class PaginationResponseDto<T> {
  @ApiProperty({ description: 'The items for the current page' })
  items: T[] = [];

  @ApiProperty({ description: 'Total number of available items' })
  totalItems: number = 0;

  @ApiProperty({ description: 'Current page (0-indexed)' })
  page: number = 0;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number = 10;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number = 0;

  @ApiProperty({ description: 'Indicates if there is a next page' })
  hasNextPage: boolean = false;

  @ApiProperty({ description: 'Indicates if there is a previous page' })
  hasPreviousPage: boolean = false;

  /**
   * Create a paginated response
   * @param items The list of items
   * @param totalItems Total number of items
   * @param page Current page (0-indexed)
   * @param limit Items per page
   * @returns A paginated response
   */
  static create<T>(
    items: T[],
    totalItems: number,
    page: number,
    limit: number,
  ): PaginationResponseDto<T> {
    const totalPages = Math.ceil(totalItems / limit);
    
    return {
      items,
      totalItems,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages - 1,
      hasPreviousPage: page > 0,
    };
  }

  /**
   * Create a response type for Swagger documentation
   * @param itemType The type of the paginated items
   * @returns A class representing the paginated response
   */
  static createResponseType<T>(itemType: Type<T>): Type<PaginationResponseDto<T>> {
    class PaginatedResponseType implements PaginationResponseDto<T> {
      @ApiProperty({ type: [itemType] })
      items: T[] = [];

      @ApiProperty({ type: Number })
      totalItems: number = 0;

      @ApiProperty({ type: Number })
      page: number = 0;

      @ApiProperty({ type: Number })
      limit: number = 10;

      @ApiProperty({ type: Number })
      totalPages: number = 0;

      @ApiProperty({ type: Boolean })
      hasNextPage: boolean = false;

      @ApiProperty({ type: Boolean })
      hasPreviousPage: boolean = false;
    }

    // Set the class name dynamically based on the item type
    Object.defineProperty(PaginatedResponseType, 'name', {
      value: `Paginated${itemType.name}Response`,
    });

    return PaginatedResponseType;
  }
} 
