import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvestmentsService } from './investments.service';
import { InvestDto, GetInvestmentsDto } from './dto/invest.dto';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags('Investments')
@Controller('investments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get available investment plans' })
  @ApiResponse({
    status: 200,
    description: 'Investment plans retrieved successfully',
  })
  async getInvestmentPlans() {
    const plans = await this.investmentsService.getAvailableInvestmentPlans();

    return {
      success: true,
      data: plans,
    };
  }

  @Post('invest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invest in a plan' })
  @ApiResponse({ status: 200, description: 'Investment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Investment plan not found' })
  async invest(
    @Request() req: AuthenticatedRequest,
    @Body() investDto: InvestDto,
  ) {
    const result = await this.investmentsService.invest(
      req.user.userId,
      investDto,
    );

    return {
      success: true,
      message: 'Investment created successfully',
      data: {
        userInvestment: result.userInvestment,
        transaction: result.transaction,
        tradeWallet: {
          balance: result.tradeWallet.balance,
          currency: result.tradeWallet.currency,
        },
      },
    };
  }

  @Get('my-investments')
  @ApiOperation({ summary: 'Get user investments' })
  @ApiResponse({
    status: 200,
    description: 'User investments retrieved successfully',
  })
  async getMyInvestments(
    @Request() req: AuthenticatedRequest,
    @Query() queryDto: GetInvestmentsDto,
  ) {
    const investments = await this.investmentsService.getUserInvestments(
      req.user.userId,
      queryDto,
    );

    return {
      success: true,
      data: investments,
    };
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active investments' })
  @ApiResponse({
    status: 200,
    description: 'Active investments retrieved successfully',
  })
  async getActiveInvestments(@Request() req: AuthenticatedRequest) {
    const investments = await this.investmentsService.getActiveInvestments(
      req.user.userId,
    );

    return {
      success: true,
      data: investments,
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get investment history' })
  @ApiResponse({
    status: 200,
    description: 'Investment history retrieved successfully',
  })
  async getInvestmentHistory(@Request() req: AuthenticatedRequest) {
    const investments = await this.investmentsService.getCompletedInvestments(
      req.user.userId,
    );

    return {
      success: true,
      data: investments,
    };
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get investment summary' })
  @ApiResponse({
    status: 200,
    description: 'Investment summary retrieved successfully',
  })
  async getInvestmentSummary(@Request() req: AuthenticatedRequest) {
    const summary = await this.investmentsService.getInvestmentSummary(
      req.user.userId,
    );

    return {
      success: true,
      data: summary,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get investment by ID' })
  @ApiResponse({
    status: 200,
    description: 'Investment retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Investment not found' })
  async getInvestmentById(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const investment = await this.investmentsService.getInvestmentById(
      req.user.userId,
      id,
    );

    return {
      success: true,
      data: investment,
    };
  }
}
