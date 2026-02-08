import {
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/roles.enum';
import { AdminUserManagementService } from './admin-user-management.service';
import { UserQueryDto } from './dto/user-query.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { ResetCredentialsDto } from './dto/reset-credentials.dto';

@ApiTags('Admin User (Investor) Management')
@Controller('admin/user-management')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminUserManagementController {
  constructor(
    private readonly adminUserManagementService: AdminUserManagementService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'View all users with search and filter' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers(@Query() query: UserQueryDto) {
    const result = await this.adminUserManagementService.getAllUsers(query);
    return { success: true, message: 'Users retrieved successfully', ...result };
  }

  @Get(':userId')
  @ApiOperation({ summary: 'View user profile' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  async getUserProfile(@Param('userId') userId: string) {
    const user = await this.adminUserManagementService.getUserProfile(userId);
    return { success: true, data: user };
  }

  @Patch(':userId/suspend')
  @ApiOperation({ summary: 'Suspend or deactivate account' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User suspension updated' })
  async suspendOrReactivate(
    @Param('userId') userId: string,
    @Body() dto: SuspendUserDto,
  ) {
    return this.adminUserManagementService.suspendOrReactivate(userId, dto);
  }

  @Post(':userId/reset-credentials')
  @ApiOperation({ summary: 'Reset user credentials' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Credentials reset' })
  async resetCredentials(
    @Param('userId') userId: string,
    @Body() dto: ResetCredentialsDto,
  ) {
    return this.adminUserManagementService.resetCredentials(userId, dto);
  }
}
