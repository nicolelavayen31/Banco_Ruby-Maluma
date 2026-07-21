import { Response } from '../response/api-response';
import { ResponseMetadata } from '../response/api-response-metadata';

describe('Response', () => {
    it('should create a response with data and metadata', () => {
        const data = { id: '1', name: 'test' };
        const metadata = new ResponseMetadata(200, 'OK', null);
        const response = new Response(data, metadata);

        expect(response.data).toEqual(data);
        expect(response.metadata).toBe(metadata);
    });

    it('should create a response with array data', () => {
        const data = [1, 2, 3];
        const metadata = new ResponseMetadata(200, 'OK', null);
        const response = new Response(data, metadata);

        expect(response.data).toHaveLength(3);
        expect(response.metadata.statusCode).toBe(200);
    });

    it('should create a response with null data', () => {
        const metadata = new ResponseMetadata(204, 'No Content', null);
        const response = new Response(null, metadata);

        expect(response.data).toBeNull();
    });
});
