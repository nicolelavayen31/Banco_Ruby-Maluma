import { ResponseMetadataPagination } from '../response/api-response-metadata-pagination';
import { ResponseMetadataPaginationBuilder } from '../response/api-response-metadata-pagination-builder';

describe('ResponseMetadataPagination', () => {
    describe('constructor', () => {
        it('should create pagination with all fields', () => {
            const pagination = new ResponseMetadataPagination(
                1,
                10,
                5,
                50,
                false,
                true,
            );

            expect(pagination.page).toBe(1);
            expect(pagination.limit).toBe(10);
            expect(pagination.totalPages).toBe(5);
            expect(pagination.totalItems).toBe(50);
            expect(pagination.hasPreviousPage).toBe(false);
            expect(pagination.hasNextPage).toBe(true);
        });

        it('should indicate first page has no previous', () => {
            const p = new ResponseMetadataPagination(1, 10, 5, 50, false, true);
            expect(p.hasPreviousPage).toBe(false);
        });

        it('should indicate last page has no next', () => {
            const p = new ResponseMetadataPagination(5, 10, 5, 50, true, false);
            expect(p.hasNextPage).toBe(false);
        });
    });

    describe('Builder', () => {
        it('should build pagination and compute totalPages', () => {
            const pagination = new ResponseMetadataPaginationBuilder()
                .setPage(2)
                .setLimit(10)
                .setTotalItems(25)
                .build();

            expect(pagination.page).toBe(2);
            expect(pagination.limit).toBe(10);
            expect(pagination.totalPages).toBe(3);
            expect(pagination.totalItems).toBe(25);
        });

        it('should compute hasNextPage correctly', () => {
            const p1 = new ResponseMetadataPaginationBuilder()
                .setPage(1)
                .setLimit(10)
                .setTotalItems(25)
                .build();
            expect(p1.hasNextPage).toBe(true);
            expect(p1.hasPreviousPage).toBe(false);

            const p2 = new ResponseMetadataPaginationBuilder()
                .setPage(3)
                .setLimit(10)
                .setTotalItems(25)
                .build();
            expect(p2.hasNextPage).toBe(false);
            expect(p2.hasPreviousPage).toBe(true);
        });

        it('should handle empty results', () => {
            const p = new ResponseMetadataPaginationBuilder()
                .setPage(1)
                .setLimit(10)
                .setTotalItems(0)
                .build();

            expect(p.totalPages).toBe(0);
            expect(p.totalItems).toBe(0);
            expect(p.hasNextPage).toBe(false);
            expect(p.hasPreviousPage).toBe(false);
        });

        it('should handle single page results', () => {
            const p = new ResponseMetadataPaginationBuilder()
                .setPage(1)
                .setLimit(10)
                .setTotalItems(3)
                .build();

            expect(p.totalPages).toBe(1);
            expect(p.hasNextPage).toBe(false);
            expect(p.hasPreviousPage).toBe(false);
        });

        it('should support method chaining', () => {
            const builder = new ResponseMetadataPaginationBuilder()
                .setPage(1)
                .setLimit(10)
                .setTotalItems(100);
            expect(builder.setPage).toBeDefined();
            expect(builder.setLimit).toBeDefined();
            expect(builder.setTotalItems).toBeDefined();
        });
    });
});
