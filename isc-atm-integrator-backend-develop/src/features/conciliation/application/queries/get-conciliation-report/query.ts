import { Query } from '@nestjs/cqrs';
import type { GetConciliationReportResponse } from './response.dto';

export class GetConciliationReportQuery extends Query<GetConciliationReportResponse> {
    public constructor(public readonly conciliationId: string) {
        super();
    }
}
