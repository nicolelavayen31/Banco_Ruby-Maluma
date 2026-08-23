import {
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { OutboxWorker } from './outbox.worker';

@ApiTags('Outbox')
@ApiBearerAuth()
@ApiSecurity('api-key')
@Controller('outbox')
export class OutboxController {
    constructor(private readonly worker: OutboxWorker) {}

    @Post('process')
    @Version('1')
    @HttpCode(HttpStatus.OK)
    public async process(): Promise<{ processed: number }> {
        await this.worker.tick();
        return { processed: 1 };
    }
}
