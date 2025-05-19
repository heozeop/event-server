import { Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Base request DTO for cursor-based pagination
 */
export class CursorPaginationRequestDto {
  @ApiProperty({
    description: 'Cursor for pagination (optional, leave empty for first page)',
    required: false,
    example: 'eyJpZCI6IjYxZTU4ZjIyZDQ5YWIyMWUyYzM0YjU3In0=',
  })
  @IsString()
  @IsOptional()
  cursor?: string;

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
}

/**
 * Base response DTO for cursor-based pagination
 */
export class CursorPaginationResponseDto<T> {
  @ApiProperty({ description: 'The items for the current page' })
  items: T[] = [];

  @ApiProperty({
    description: 'Cursor to get the next page',
    required: false,
    example: 'eyJpZCI6IjYxZTU4ZjIyZDQ5YWIyMWUyYzM0YjU3In0=',
  })
  nextCursor: string | null = null;

  @ApiProperty({ description: 'Indicates if there are more items available' })
  hasMore: boolean = false;

  /**
   * Generic factory method to create paginated responses
   * @param items The list of items
   * @param limit The requested limit
   * @param getIdFn Function to extract the cursor value from an item
   * @returns A paginated response
   */
  static create<T>(
    items: T[],
    limit: number,
    getIdFn: (item: T) => string,
  ): CursorPaginationResponseDto<T> {
    const hasMore = items.length > limit;
    const result = hasMore ? items.slice(0, limit) : items;
    
    let nextCursor = null;
    if (hasMore && result.length > 0) {
      const lastItem = result[result.length - 1];
      const cursorValue = getIdFn(lastItem);
      nextCursor = Buffer.from(JSON.stringify({ id: cursorValue })).toString('base64');
    }

    return {
      items: result,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Create a response type for Swagger documentation
   * @param itemType The type of the paginated items
   * @returns A class representing the paginated response
   */
  static createResponseType<T>(itemType: Type<T>): Type<CursorPaginationResponseDto<T>> {
    class PaginatedResponseType implements CursorPaginationResponseDto<T> {
      @ApiProperty({ type: [itemType] })
      items: T[] = [];

      @ApiProperty({ type: String, nullable: true })
      nextCursor: string | null = null;

      @ApiProperty({ type: Boolean })
      hasMore: boolean = false;
    }

    // Set the class name dynamically based on the item type
    Object.defineProperty(PaginatedResponseType, 'name', {
      value: `Paginated${itemType.name}Response`,
    });

    return PaginatedResponseType;
  }

  /**
   * Decode a cursor to extract the ID
   * @param cursor The encoded cursor
   * @returns The ID from the cursor or null if invalid
   */
  static decodeCursor(cursor: string): string | null {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      return parsed.id || null;
    } catch (error) {
      return null;
    }
  }
} 
