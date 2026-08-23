import { Command } from '@nestjs/cqrs';
import type { ConciliationResponse } from '../../queries/get-conciliations/response.dto';

export class RunConciliationCommand extends Command<ConciliationResponse> {}
