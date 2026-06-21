import { Controller, Post, Body, Query, UseGuards, Param } from '@nestjs/common';
import { BedrockService } from './bedrock.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from '../user-role/entities/user.role.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('generate-questions')
@UseGuards(JwtAuthGuard)
export class BedrockController {
    constructor(
        private readonly bedrockService: BedrockService,
        @InjectRepository(UserRole)
        private readonly userRoleRepo: Repository<UserRole>
    ) { }

    @Post()
    async generate(
        @Query('roleId') roleId: string,
        @Body('numQuestions') numQuestions = 50,
        @CurrentUser() adminUser: { userId: string, organizationId: string }
    ) {
        const role = await this.userRoleRepo.findOne({ where: { id: roleId } });

        if (!role) {
            return { success: false, message: 'Role not found' };
        }

        return this.bedrockService.generateQuestions(role, numQuestions, adminUser.userId, adminUser.organizationId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('generate-more-questions/:roleId')
    async generateMoreQuestions(
        @Param('roleId') roleId: string,
        @Body('numQuestions') numQuestions: number = 50,
        @CurrentUser() adminUser: { userId: string, organizationId: string }
    ) {
        return this.bedrockService.generateMoreQuestionsForRole(roleId, numQuestions, adminUser.userId, adminUser.organizationId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('regenerate-questions/:roleId')
    async regenerateQuestions(
        @Param('roleId') roleId: string,
        @Body('numQuestions') numQuestions: number = 50,
        @CurrentUser() adminUser: { userId: string, organizationId: string }
    ) {
        return this.bedrockService.regenerateQuestionsForRole(roleId, numQuestions, adminUser.userId, adminUser.organizationId);
    }

}
