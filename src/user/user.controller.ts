import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConflictResponse,
} from '@nestjs/swagger';

import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUserDto } from './dto/get-user.dto';
import { User, UserRole } from './entities/user.entity';
import { GetAll } from '../common/interfaces/get-all.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { RegisterDto } from '../auth/dto/register.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new standard user account (normal user)' })
  @ApiCreatedResponse({ description: 'User successfully registered', type: User })
  @ApiConflictResponse({ description: 'Email or username already in use' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    return this.userService.register(registerDto);
  }

  @Post()
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({ description: 'Created successfully', type: User })
  @ApiBadRequestResponse({ description: 'Validation error' })
  async create(
    @Body() createDto: CreateUserDto,
    @GetUser() currentUser: AuthenticatedUser,
  ): Promise<User> {
    // Admin cannot create superadmin
    if (
      currentUser.role === UserRole.ADMIN &&
      createDto.role === UserRole.SUPERADMIN
    ) {
      throw new ForbiddenException('Admins cannot assign the superadmin role');
    }
    return this.userService.create(createDto);
  }

  @Get()
  @Roles('superadmin', 'admin')
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  @ApiOkResponse({ description: 'List retrieved successfully', type: [User] })
  async getAll(@Query() getQuery: GetUserDto): Promise<GetAll<User>> {
    return this.userService.getAll(getQuery);
  }

  @Get(':id')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Get user by UUID' })
  @ApiParam({ name: 'id', description: 'UUID of the user', type: String })
  @ApiOkResponse({ description: 'Found successfully', type: User })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() getQuery: GetUserDto,
    @GetUser() currentUser: AuthenticatedUser,
  ): Promise<User> {
    if (currentUser.role === UserRole.USER && currentUser.id !== id) {
      throw new ForbiddenException('Cannot access other user accounts');
    }
    return this.userService.getById(id, getQuery);
  }

  @Patch(':id')
  @Roles('superadmin', 'admin', 'user')
  @ApiOperation({ summary: 'Update user by UUID' })
  @ApiParam({ name: 'id', description: 'UUID of the user', type: String })
  @ApiOkResponse({ description: 'Updated successfully', type: User })
  @ApiNotFoundResponse({ description: 'User not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateUserDto,
    @GetUser() currentUser: AuthenticatedUser,
  ): Promise<User> {
    // Standard user can only update their own record and cannot change role/status
    if (currentUser.role === UserRole.USER) {
      if (currentUser.id !== id) {
        throw new ForbiddenException('Cannot update other user profiles');
      }
      if (updateDto.role || updateDto.status) {
        throw new ForbiddenException(
          'Users are not permitted to change role or account status',
        );
      }
    }

    // Admin cannot modify superadmins or promote to superadmin
    if (currentUser.role === UserRole.ADMIN) {
      const targetUser = await this.userService.getById(id);
      if (targetUser.role === UserRole.SUPERADMIN) {
        throw new ForbiddenException(
          'Admins cannot modify superadmin accounts',
        );
      }
      if (updateDto.role === UserRole.SUPERADMIN) {
        throw new ForbiddenException(
          'Admins cannot promote users to superadmin',
        );
      }
    }

    return this.userService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('superadmin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete user by UUID' })
  @ApiParam({ name: 'id', description: 'UUID of the user', type: String })
  @ApiNoContentResponse({ description: 'Deleted successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.userService.delete(id);
  }
}
