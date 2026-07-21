import { IBuilder } from '../types';
import {
    IApiResponseMetadataPagination,
    ResponseMetadataPagination,
} from './api-response-metadata-pagination';

export interface IApiResponseMetadataPaginationBuilder extends IBuilder<IApiResponseMetadataPagination> {
    setPage(page: number): IApiResponseMetadataPaginationBuilder;
    setLimit(limit: number): IApiResponseMetadataPaginationBuilder;
    setTotalItems(totalItems: number): IApiResponseMetadataPaginationBuilder;
}

export class ResponseMetadataPaginationBuilder implements IApiResponseMetadataPaginationBuilder {
    private page: number;
    private limit: number;
    private totalPages: number;
    private totalItems: number;
    private hasNextPage: boolean;
    private hasPreviousPage: boolean;

    public setPage(page: number): IApiResponseMetadataPaginationBuilder {
        this.page = page;
        return this;
    }

    public setLimit(limit: number): IApiResponseMetadataPaginationBuilder {
        this.limit = limit;
        return this;
    }

    public setTotalItems(
        totalItems: number,
    ): IApiResponseMetadataPaginationBuilder {
        this.totalItems = totalItems;
        return this;
    }

    public setHasNextPage(
        hasNextPage: boolean,
    ): IApiResponseMetadataPaginationBuilder {
        this.hasNextPage = hasNextPage;
        return this;
    }

    public build(): IApiResponseMetadataPagination {
        this.totalPages = Math.ceil(this.totalItems / this.limit);
        this.hasNextPage = this.page < this.totalPages;
        this.hasPreviousPage = this.page > 1;
        return new ResponseMetadataPagination(
            this.page,
            this.limit,
            this.totalPages,
            this.totalItems,
            this.hasPreviousPage,
            this.hasNextPage,
        );
    }
}
