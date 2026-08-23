import { ApiProperty } from '@nestjs/swagger';

export class GetUnreadCountResponse {
    @ApiProperty({ example: 5 })
    public readonly count: number;

    constructor(count: number) {
        this.count = count;
    }
}
