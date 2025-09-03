import assert from 'assert';
import { RestApi } from "../../src/util/RestApi.js"

// Mock fetch for testing
global.fetch = async (url, options) => {
    const urlStr = url.url;
    
    // Mock different responses based on URL
    if (urlStr.includes('error')) {
        return new Response(null, { status: 500, statusText: 'Internal Server Error' });
    }
    
    return new Response(JSON.stringify({ success: true, url: urlStr, options }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
    });
};

describe( "Testing util.RestApi", () =>
{
    describe('Constructor and Basic Structure', () => {
        it( 'Test class and its structure', () =>
        {
            assert.equal( "function" === typeof RestApi, true );
            assert.throws( () => { new RestApi() }, Error );
        });

        it('Should create instance with valid URL', () => {
            const api = new RestApi('https://api.example.com');
            assert.ok(api instanceof RestApi);
            assert.equal(api.url, 'https://api.example.com');
        });

        it('Should set default timeout and retry options', () => {
            const api = new RestApi('https://api.example.com');
            assert.equal(api.timeout, 30000);
            assert.equal(api.retryAttempts, 0);
            assert.equal(api.retryDelay, 1000);
        });

        it('Should accept custom timeout and retry options', () => {
            const api = new RestApi('https://api.example.com', {}, {
                timeout: 5000,
                retryAttempts: 3,
                retryDelay: 500
            });
            assert.equal(api.timeout, 5000);
            assert.equal(api.retryAttempts, 3);
            assert.equal(api.retryDelay, 500);
        });
    });

    describe('Header Management', () => {
        let api;
        
        beforeEach(() => {
            api = new RestApi('https://api.example.com');
        });

        it('Should add headers', () => {
            api.addHeader('Authorization', 'Bearer token123');
            api.addHeader('Content-Type', 'application/json');
            
            const headers = api.getHeaders();
            assert.equal(headers.get('Authorization'), 'Bearer token123');
            assert.equal(headers.get('Content-Type'), 'application/json');
        });

        it('Should remove headers', () => {
            api.addHeader('Test-Header', 'test-value');
            api.removeHeader('Test-Header');
            
            const headers = api.getHeaders();
            assert.equal(headers.get('Test-Header'), null);
        });

        it('Should set multiple headers at once', () => {
            api.setHeaders({
                'Authorization': 'Bearer new-token',
                'X-API-Version': '2.0'
            });
            
            const headers = api.getHeaders();
            assert.equal(headers.get('Authorization'), 'Bearer new-token');
            assert.equal(headers.get('X-API-Version'), '2.0');
        });
    });

    describe('Query Parameters', () => {
        let api;
        
        beforeEach(() => {
            api = new RestApi('https://api.example.com');
        });

        it('Should build query string from object', () => {
            const params = { page: 1, limit: 10, search: 'test' };
            const queryString = api._buildQueryString(params);
            assert.equal(queryString, 'page=1&limit=10&search=test');
        });

        it('Should handle array parameters', () => {
            const params = { tags: ['fiction', 'drama'], author: 'Shakespeare' };
            const queryString = api._buildQueryString(params);
            assert.equal(queryString, 'tags=fiction&tags=drama&author=Shakespeare');
        });

        it('Should skip null and undefined values', () => {
            const params = { page: 1, filter: null, search: undefined, limit: 10 };
            const queryString = api._buildQueryString(params);
            assert.equal(queryString, 'page=1&limit=10');
        });

        it('Should build complete URL with query parameters', () => {
            const url = api._buildUrl('/books', { page: 1, limit: 10 });
            assert.equal(url, 'https://api.example.com/books?page=1&limit=10');
        });
    });

    describe('HTTP Methods', () => {
        let api;
        
        beforeEach(() => {
            api = new RestApi('https://api.example.com');
        });

        it('Should make GET request and return request ID', async () => {
            const { requestId, result } = await api.get('/books');
            
            assert.ok(typeof requestId === 'string');
            assert.ok(requestId.startsWith('req_'));
            assert.ok(result.status === 200);
            assert.ok(result.data.success === true);
        });

        it('Should make POST request with query parameters', async () => {
            const postData = { title: 'New Book' };
            const { requestId, result } = await api.post('/books', postData, null, {
                queryParams: { notify: 'true' }
            });
            
            assert.ok(typeof requestId === 'string');
            assert.ok(result.data.url.includes('notify=true'));
        });
    });

    describe('Error Handling and Status Codes', () => {
        let api;
        
        beforeEach(() => {
            api = new RestApi('https://api.example.com');
        });

        it('Should throw error for HTTP error status', async () => {
            try {
                await api.get('/error');
                assert.fail('Should have thrown error');
            } catch (error) {
                assert.ok(error.message.includes('HTTP 500'));
            }
        });

        it('Should handle different content types', async () => {
            // This would require more sophisticated mocking for different content types
            const { result } = await api.get('/books');
            assert.ok(result.data !== null);
        });
    });

    describe('Backward Compatibility', () => {
        let api;
        
        beforeEach(() => {
            api = new RestApi('https://api.example.com');
        });

        it('Should work with callback pattern', (done) => {
            api.get('/books', (err, result) => {
                try {
                    assert.equal(err, null);
                    assert.ok(result.status === 200);
                    done();
                } catch (error) {
                    done(error);
                }
            });
        });

        it('Should work without options parameter', async () => {
            const { requestId, result } = await api.get('/books');
            assert.ok(typeof requestId === 'string');
            assert.ok(result.status === 200);
        });
    });
});