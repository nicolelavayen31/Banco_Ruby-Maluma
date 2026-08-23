import { ResponseMetadata } from '../response/api-response-metadata';
import { ResponseMetadataPagination } from '../response/api-response-metadata-pagination';

describe('ResponseMetadata', () => {
    it('should create metadata without pagination', () => {
        const metadata = new ResponseMetadata(200, 'OK', null);

        expect(metadata.statusCode).toBe(200);
        expect(metadata.message).toBe('OK');
        expect(metadata.pagination).toBeNull();
    });

    it('should create metadata with pagination', () => {
        const pagination = new ResponseMetadataPagination(
            1,
            10,
            5,
            50,
            false,
            true,
        );
        const metadata = new ResponseMetadata(200, 'OK', pagination);

        expect(metadata.statusCode).toBe(200);
        expect(metadata.pagination).toBe(pagination);
        expect(metadata.pagination?.totalItems).toBe(50);
    });
});
