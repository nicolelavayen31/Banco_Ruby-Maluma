export class Result<Type, Error> {
    private readonly _isSuccess: boolean;
    private readonly _value?: Type;
    private readonly _error?: Error;

    private constructor(isSuccess: boolean, value?: Type, error?: Error) {
        this._isSuccess = isSuccess;
        this._value = value;
        this._error = error;
    }

    public static success<Type, Error>(value: Type): Result<Type, Error> {
        return new Result<Type, Error>(true, value);
    }

    public static failure<Type, Error>(error: Error): Result<Type, Error> {
        return new Result<Type, Error>(false, undefined, error);
    }

    public getValue(): Type {
        if (!this._isSuccess) {
            throw new Error('Cannot get the value of a failed result.');
        }
        return this._value as Type;
    }

    public getError(): Error {
        if (this._isSuccess) {
            throw new Error('Cannot get the error of a successful result.');
        }
        return this._error as Error;
    }

    public isSuccess(): boolean {
        return this._isSuccess;
    }

    public isFailed(): boolean {
        return !this._isSuccess;
    }
}
