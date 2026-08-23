import { Result } from '../result';

describe('Result', () => {
    describe('success', () => {
        it('should create a successful result with a value', () => {
            const result = Result.success<number, Error>(42);
            expect(result.isSuccess()).toBe(true);
            expect(result.isFailed()).toBe(false);
            expect(result.getValue()).toBe(42);
        });

        it('should work with string values', () => {
            const result = Result.success<string, Error>('ok');
            expect(result.isSuccess()).toBe(true);
            expect(result.getValue()).toBe('ok');
        });

        it('should work with object values', () => {
            const obj = { id: '1', name: 'test' };
            const result = Result.success<typeof obj, Error>(obj);
            expect(result.getValue()).toEqual(obj);
        });

        it('should work with undefined success value', () => {
            const result = Result.success<void, Error>(undefined);
            expect(result.isSuccess()).toBe(true);
            expect(result.getValue()).toBeUndefined();
        });
    });

    describe('failure', () => {
        it('should create a failed result with an error', () => {
            const error = new Error('something went wrong');
            const result = Result.failure<number, Error>(error);
            expect(result.isSuccess()).toBe(false);
            expect(result.isFailed()).toBe(true);
            expect(result.getError()).toBe(error);
        });

        it('should work with string errors', () => {
            const result = Result.failure<number, string>('error message');
            expect(result.isFailed()).toBe(true);
            expect(result.getError()).toBe('error message');
        });

        it('should preserve the exact error reference', () => {
            class DomainError extends Error {
                constructor(
                    public readonly code: string,
                    message: string,
                ) {
                    super(message);
                }
            }
            const error = new DomainError('NOT_FOUND', 'Resource not found');
            const result = Result.failure<unknown, DomainError>(error);
            expect(result.getError()).toBe(error);
            expect(result.getError().code).toBe('NOT_FOUND');
        });
    });

    describe('getValue', () => {
        it('should throw when getting value from a failed result', () => {
            const result = Result.failure<number, string>('fail');
            expect(() => result.getValue()).toThrow(
                'Cannot get the value of a failed result.',
            );
        });
    });

    describe('getError', () => {
        it('should throw when getting error from a successful result', () => {
            const result = Result.success<number, string>(42);
            expect(() => result.getError()).toThrow(
                'Cannot get the error of a successful result.',
            );
        });
    });

    describe('type safety', () => {
        it('should maintain correct types through success and failure', () => {
            const success = Result.success<string, Error>('data');
            const failure = Result.failure<string, Error>(new Error('err'));

            if (success.isSuccess()) {
                const value: string = success.getValue();
                expect(typeof value).toBe('string');
            }
            if (failure.isFailed()) {
                const error: Error = failure.getError();
                expect(error).toBeInstanceOf(Error);
            }
        });
    });
});
