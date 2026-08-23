import { IBuilder } from '../types';
import { IApiResponseError, ApiResponseError } from './api-response-error';

export interface IApiResponseErrorBuilder extends IBuilder<IApiResponseError> {
    setMessage(message: string): IApiResponseErrorBuilder;
    setCode(code: string): IApiResponseErrorBuilder;
    setStatus(status: number): IApiResponseErrorBuilder;
    setCause(cause: string): IApiResponseErrorBuilder;
    setId(id: string): IApiResponseErrorBuilder;
    setError(error: string): IApiResponseErrorBuilder;
    setPath(path: string): IApiResponseErrorBuilder;
    setResource(resource: string): IApiResponseErrorBuilder;
    setTimestamp(timestamp: string): IApiResponseErrorBuilder;
}

export class ApiResponseErrorBuilder implements IApiResponseErrorBuilder {
    private id: string;
    private path: string;
    private code: string;
    private cause: string;
    private error: string;
    private status: number;
    private message: string;
    private resource: string;
    private timestamp: string;

    public setMessage(message: string): IApiResponseErrorBuilder {
        this.message = message;
        return this;
    }

    public setCode(code: string): IApiResponseErrorBuilder {
        this.code = code;
        return this;
    }

    public setStatus(status: number): IApiResponseErrorBuilder {
        this.status = status;
        return this;
    }

    public setCause(cause: string): IApiResponseErrorBuilder {
        this.cause = cause;
        return this;
    }

    public setId(id: string): IApiResponseErrorBuilder {
        this.id = id;
        return this;
    }

    public setError(error: string): IApiResponseErrorBuilder {
        this.error = error;
        return this;
    }

    public setPath(path: string): IApiResponseErrorBuilder {
        this.path = path;
        return this;
    }

    public setResource(resource: string): IApiResponseErrorBuilder {
        this.resource = resource;
        return this;
    }

    public setTimestamp(timestamp: string): IApiResponseErrorBuilder {
        this.timestamp = timestamp;
        return this;
    }

    public build(): IApiResponseError {
        return new ApiResponseError(
            this.id,
            this.message,
            this.code,
            this.status,
            this.cause,
            this.error,
            this.path,
            this.resource,
            this.timestamp,
        );
    }
}
