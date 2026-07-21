import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
    ApiProperty,
    ApiOkResponse,
    ApiExtraModels,
    getSchemaPath,
} from '@nestjs/swagger';
import { Controller, Get, HttpStatus } from '@nestjs/common';
import {
    Response,
    IApiResponse,
} from '../src/shared/core/response/api-response';
import { ResponseMetadata } from '../src/shared/core/response/api-response-metadata';
import { ResponseMetadataPagination } from '../src/shared/core/response/api-response-metadata-pagination';
import { ApiResponseError } from '../src/shared/core/response/api-response-error';

describe('Swagger Response Format', () => {
    class BookDto {
        @ApiProperty({ example: '267c00a9-865e-4b6b-af47-c81a021cc038' })
        public readonly id!: string;

        @ApiProperty({ example: 'The Hobbit' })
        public readonly title!: string;

        @ApiProperty({ example: 'J.R.R. Tolkien' })
        public readonly author!: string;

        @ApiProperty({ example: 1937 })
        public readonly year!: number;
    }

    class BookListResponse implements IApiResponse<BookDto[]> {
        @ApiProperty({ type: [BookDto], description: 'List of books' })
        public readonly data!: BookDto[];

        @ApiProperty({
            type: () => ResponseMetadata,
            description: 'Response metadata',
        })
        public readonly metadata!: ResponseMetadata;

        constructor(data: BookDto[], metadata: ResponseMetadata) {
            this.data = data;
            this.metadata = metadata;
        }
    }

    class BookPaginatedResponse extends Response<BookDto[]> {
        @ApiProperty({
            type: [BookDto],
            description: 'Paginated list of books',
        })
        declare public readonly data: BookDto[];

        constructor(data: BookDto[], metadata: ResponseMetadata) {
            super(data, metadata);
        }
    }

    const emptyPagination = new ResponseMetadataPagination(
        0,
        0,
        0,
        0,
        false,
        false,
    );

    @Controller('/books')
    @ApiExtraModels(BookListResponse, BookPaginatedResponse, ApiResponseError)
    class BookController {
        @Get()
        @ApiOkResponse({
            description: 'List of books',
            schema: { $ref: getSchemaPath(BookListResponse) },
        })
        public list(): BookListResponse {
            return {
                data: [],
                metadata: new ResponseMetadata(
                    HttpStatus.OK,
                    'OK',
                    emptyPagination,
                ),
            };
        }

        @Get('paginated')
        @ApiOkResponse({
            description: 'Paginated list of books',
            schema: {
                allOf: [{ $ref: getSchemaPath(BookPaginatedResponse) }],
            },
        })
        public listPaginated(): BookPaginatedResponse {
            const pagination = new ResponseMetadataPagination(
                1,
                10,
                1,
                0,
                false,
                false,
            );
            const metadata = new ResponseMetadata(
                HttpStatus.OK,
                'OK',
                pagination,
            );
            return new BookPaginatedResponse([], metadata);
        }
    }

    let document: ReturnType<typeof SwaggerModule.createDocument>;

    beforeAll(async () => {
        const modRef = await Test.createTestingModule({
            controllers: [BookController],
        }).compile();

        const app = modRef.createNestApplication();
        const config = new DocumentBuilder()
            .setTitle('Test API')
            .setVersion('1.0')
            .build();

        document = SwaggerModule.createDocument(app, config);
    });

    it('should generate BookListResponse schema with data and metadata', () => {
        const schema = document.components?.schemas?.BookListResponse as
            Record<string, unknown> | undefined;
        expect(schema).toBeDefined();
        const props = schema!;
        expect(
            (props.properties as Record<string, unknown>).data,
        ).toBeDefined();
        expect(
            (props.properties as Record<string, unknown>).metadata,
        ).toBeDefined();
    });

    it('should have correct BookDto item schema inside data array', () => {
        const bookDtoSchema = document.components?.schemas?.BookDto as
            Record<string, unknown> | undefined;
        expect(bookDtoSchema).toBeDefined();
        const props = bookDtoSchema!.properties as Record<string, unknown>;
        expect(props.id).toBeDefined();
        expect(props.title).toBeDefined();
        expect(props.author).toBeDefined();
        expect(props.year).toBeDefined();
    });

    it('should have ResponseMetadata schema with statusCode, message, pagination', () => {
        const metadataSchema = document.components?.schemas
            ?.ResponseMetadata as Record<string, unknown> | undefined;
        expect(metadataSchema).toBeDefined();
        const props = metadataSchema!.properties as Record<string, unknown>;
        expect(props.statusCode).toBeDefined();
        expect(props.message).toBeDefined();
        expect(props.pagination).toBeDefined();
    });

    it('should have pagination fields in ResponseMetadataPagination schema', () => {
        const pagSchema = document.components?.schemas
            ?.ResponseMetadataPagination as Record<string, unknown> | undefined;
        expect(pagSchema).toBeDefined();
        const props = pagSchema!.properties as Record<string, unknown>;
        expect(props.page).toBeDefined();
        expect(props.limit).toBeDefined();
        expect(props.totalPages).toBeDefined();
        expect(props.totalItems).toBeDefined();
        expect(props.hasNextPage).toBeDefined();
        expect(props.hasPreviousPage).toBeDefined();
    });

    it('should have ApiResponseError schema with all error fields', () => {
        const errorSchema = document.components?.schemas?.ApiResponseError as
            Record<string, unknown> | undefined;
        expect(errorSchema).toBeDefined();
        const props = errorSchema!.properties as Record<string, unknown>;
        expect(props.id).toBeDefined();
        expect(props.message).toBeDefined();
        expect(props.code).toBeDefined();
        expect(props.status).toBeDefined();
        expect(props.cause).toBeDefined();
        expect(props.error).toBeDefined();
        expect(props.path).toBeDefined();
        expect(props.resource).toBeDefined();
        expect(props.timestamp).toBeDefined();
    });

    it('should have /books GET endpoint with correct response ref', () => {
        const paths = document.paths as Record<string, unknown>;
        expect(paths['/books']).toBeDefined();
        const getMethod = (paths['/books'] as Record<string, unknown>)
            .get as Record<string, unknown>;
        expect(getMethod).toBeDefined();
        expect(
            (getMethod.responses as Record<string, unknown>)['200'],
        ).toBeDefined();
        const okResponse = (getMethod.responses as Record<string, unknown>)[
            '200'
        ] as Record<string, unknown>;
        expect(
            (okResponse.content as Record<string, unknown>)['application/json'],
        ).toBeDefined();
    });

    it('should generate BookPaginatedResponse schema for paginated endpoints', () => {
        const paginatedSchema = document.components?.schemas
            ?.BookPaginatedResponse as Record<string, unknown> | undefined;
        expect(paginatedSchema).toBeDefined();
        const props = paginatedSchema!.properties as Record<string, unknown>;
        expect(props.data).toBeDefined();
        expect(props.metadata).toBeDefined();
    });
});
