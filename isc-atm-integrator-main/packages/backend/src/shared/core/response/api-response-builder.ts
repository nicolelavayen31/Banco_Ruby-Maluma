import { IBuilder } from '../types';
import { IApiResponse } from './api-response';
import { Response } from './api-response';
import { IApiResponseMetadata } from './api-response-metadata';

export interface IResponseBuilder<T> extends IBuilder<IApiResponse<T>> {
    setData(data: T): IResponseBuilder<T>;
    setMetadata(metadata: IApiResponseMetadata): IResponseBuilder<T>;
}

export class ResponseBuilder<T> implements IResponseBuilder<T> {
    private data: T;
    private metadata: IApiResponseMetadata;

    public setData(data: T): IResponseBuilder<T> {
        this.data = data;
        return this;
    }

    public setMetadata(metadata: IApiResponseMetadata): IResponseBuilder<T> {
        this.metadata = metadata;
        return this;
    }

    public build(): IApiResponse<T> {
        return new Response<T>(this.data, this.metadata);
    }
}
