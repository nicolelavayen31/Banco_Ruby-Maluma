import { HttpStatus } from '@nestjs/common';
import { IBuilder } from '../types';
import {
    IApiResponseMetadata,
    ResponseMetadata,
} from './api-response-metadata';
import { IApiResponseMetadataPagination } from './api-response-metadata-pagination';

export interface IResponseMetadataBuilder extends IBuilder<IApiResponseMetadata> {
    setStatusCode(statusCode: HttpStatus): IResponseMetadataBuilder;
    setMessage(message: string): IResponseMetadataBuilder;
    setPagination(
        pagination: IApiResponseMetadataPagination,
    ): IResponseMetadataBuilder;
}

export class ResponseMetadataBuilder implements IResponseMetadataBuilder {
    private statusCode: number;
    private message: string;
    private pagination: IApiResponseMetadataPagination | null;

    public setStatusCode(statusCode: HttpStatus): IResponseMetadataBuilder {
        this.statusCode = statusCode;
        return this;
    }

    public setMessage(message: string): IResponseMetadataBuilder {
        this.message = message;
        return this;
    }

    public setPagination(
        pagination: IApiResponseMetadataPagination,
    ): IResponseMetadataBuilder {
        this.pagination = pagination;
        return this;
    }

    public build(): IApiResponseMetadata {
        return new ResponseMetadata(
            this.statusCode,
            this.message,
            this.pagination,
        );
    }
}
