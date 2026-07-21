import { Command } from '@nestjs/cqrs';
import type { ResolveDiscrepancyResponse } from './response.dto';

export class ResolveDiscrepancyCommand extends Command<ResolveDiscrepancyResponse> {
    public constructor(
        public readonly matchId: string,
        public readonly notes?: string,
    ) {
        super();
    }
}
