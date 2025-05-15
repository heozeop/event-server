import {
  CreateRewardRequestDto,
  RewardRequestResponseDto,
  UpdateRewardRequestStatusDto,
} from '@libs/dtos';
import { RewardRequestStatus } from '@libs/enums';
import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { RewardRequestService } from '../services/reward-request.service';

@Controller('events')
export class RewardRequestController {
  constructor(private readonly rewardRequestService: RewardRequestService) {}

  @Post(':eventId/request')
  async createRewardRequest(
    @Req() request: Request,
    @Param('eventId') eventId: string,
  ): Promise<RewardRequestResponseDto> {
    // In a real application, the userId would come from the authenticated user
    // For demo purposes, we'll extract it from the request header
    const userId = request.headers['user-id'] as string;
    if (!userId) {
      throw new Error('User ID is required');
    }

    const dto: CreateRewardRequestDto = { eventId };
    const rewardRequest = await this.rewardRequestService.createRewardRequest(
      userId,
      dto,
    );

    return RewardRequestResponseDto.fromEntity(rewardRequest);
  }

  @Get('requests')
  async getRewardRequests(
    @Query('userId') userId?: string,
    @Query('eventId') eventId?: string,
    @Query('status') status?: RewardRequestStatus,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ): Promise<{ requests: RewardRequestResponseDto[]; total: number }> {
    const { requests, total } =
      await this.rewardRequestService.getRewardRequests({
        userId,
        eventId,
        status,
        limit,
        offset,
      });

    return {
      requests: requests.map((request) =>
        RewardRequestResponseDto.fromEntity(request),
      ),
      total,
    };
  }

  @Get('requests/:id')
  async getRewardRequest(
    @Param('id') id: string,
  ): Promise<RewardRequestResponseDto> {
    const rewardRequest =
      await this.rewardRequestService.getRewardRequestById(id);

    return RewardRequestResponseDto.fromEntity(rewardRequest);
  }

  @Put('requests/:id/status')
  async updateRewardRequestStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateRewardRequestStatusDto,
  ): Promise<RewardRequestResponseDto> {
    const rewardRequest =
      await this.rewardRequestService.updateRewardRequestStatus(
        id,
        updateStatusDto,
      );

    return RewardRequestResponseDto.fromEntity(rewardRequest);
  }
}
