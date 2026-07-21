import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Req,
    Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CsrfService } from '../application/csrf.service';

@ApiTags('CSRF')
@Controller('csrf-token')
export class CsrfTokenController {
    constructor(private readonly csrfService: CsrfService) {}

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Get CSRF token for state-changing requests' })
    @ApiResponse({
        status: 200,
        description: 'CSRF token generated',
        schema: {
            type: 'object',
            properties: {
                token: { type: 'string', example: 'xxx.yyy' },
            },
        },
    })
    public getToken(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ): { token: string } {
        return this.csrfService.getToken(req, res);
    }
}
