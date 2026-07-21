import { ApiProperty } from '@nestjs/swagger';

export interface IApiResponseMetadataPagination {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export class ResponseMetadataPagination implements IApiResponseMetadataPagination {
    @ApiProperty({ example: 1, description: 'Current page number' })
    public readonly page: number;

    @ApiProperty({ example: 10, description: 'Number of items per page' })
    public readonly limit: number;

    @ApiProperty({ example: 5, description: 'Total number of pages' })
    public readonly totalPages: number;

    @ApiProperty({ example: 50, description: 'Total number of items' })
    public readonly totalItems: number;

    @ApiProperty({
        example: true,
        description: 'Indicates if there is a next page',
    })
    public readonly hasNextPage: boolean;

    @ApiProperty({
        example: false,
        description: 'Indicates if there is a previous page',
    })
    public readonly hasPreviousPage: boolean;

    constructor(
        page: number,
        limit: number,
        totalPages: number,
        totalItems: number,
        hasPreviousPage: boolean,
        hasNextPage: boolean,
    ) {
        this.page = page;
        this.limit = limit;
        this.totalPages = totalPages;
        this.totalItems = totalItems;
        this.hasNextPage = hasNextPage;
        this.hasPreviousPage = hasPreviousPage;
    }
}
