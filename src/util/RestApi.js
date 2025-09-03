import { Helper } from "../util/Helper.js";

/**
 * RestApi
 * Utility class for REST Api development wraps native fetch internally.
 *
 * @example <caption>Using callbacks</caption>
 * const myRestApi = new RestApi( 'https://api.example.com' );
 * myRestApi.get( '/books', function( err, result ) { } );
 *
 * @example <caption>Using await</caption>
 * const myRestApi = new RestApi( 'https://api.example.com' );
 * try
 * {
 *     const result = await myRestApi.get( '/books' );
 * }
 * catch( e )
 * {
 *     // Handle error
 * }
 *
 * @example <caption>With timeout and retry configuration</caption>
 * const myRestApi = new RestApi( 'https://api.example.com', {}, {
 *     timeout: 10000,      // 10 second timeout
 *     retryAttempts: 3,    // Retry up to 3 times
 *     retryDelay: 1000     // Wait 1 second between retries
 * });
 *
 * @example <caption>Per-request timeout and retry override</caption>
 * const result = await myRestApi.get('/books', null, {
 *     timeout: 5000,       // Override to 5 second timeout
 *     retryAttempts: 1     // Override to 1 retry attempt
 * });
 *
 */
class RestApi
{
    /**
     * Constructor
     * @param {string} url - Base url
     * @param {Headers=} headers - Header data.
     * @param {object=} options - Configuration options
     * @param {number=} options.timeout - Request timeout in milliseconds (default: 30000)
     * @param {number=} options.retryAttempts - Number of retry attempts (default: 0)
     * @param {number=} options.retryDelay - Delay between retries in milliseconds (default: 1000)
     */
    constructor( url = '', headers = {}, options = {} )
    {
        this.url = Helper.trim( url, '/' );
        if ( this.url.length <= 1 )
        {
            throw new Error( 'No endpoint set.' );
        }

        this.headers = new Headers( headers );
        this._controllers = new Set();
        
        // Default configuration
        this.timeout = options.timeout || 30000;
        this.retryAttempts = options.retryAttempts || 0;
        this.retryDelay = options.retryDelay || 1000;
    }

    /**
     * GET call
     * @param {string} endpoint - API endpoint
     * @param {function=} [cb=null] - Callback function
     * @param {object=} [options={}] - Request options
     * @param {number=} options.timeout - Request timeout in milliseconds
     * @param {number=} options.retryAttempts - Number of retry attempts
     * @param {number=} options.retryDelay - Delay between retries in milliseconds
     * @returns {Promise<any|undefined>}
     */
    async get( endpoint, cb = null, options = {} )
    {
        let r = Helper.trim( endpoint, "/" ),
            req = new Request( this.url + '/' + r, this._createFetchOptions( "GET" ) );

        return await this._fetch( req, cb, options );
    }

    /**
     * POST call
     * @param {string} endpoint - API endpoint
     * @param {object=} [data={}] - Post data
     * @param {function=} [cb=null] - Callback function
     * @param {object=} [options={}] - Request options
     * @param {number=} options.timeout - Request timeout in milliseconds
     * @param {number=} options.retryAttempts - Number of retry attempts
     * @param {number=} options.retryDelay - Delay between retries in milliseconds
     * @returns {Promise<any|undefined>}
     */
    async post( endpoint, data = {}, cb = null, options = {} )
    {
        let r = Helper.trim( endpoint, "/" ),
            req = new Request( this.url + '/' + r, this._createFetchOptions( "POST", data ) );
        return await this._fetch( req, cb, options );
    }

    /**
     * DELETE call
     * @param {string} endpoint - API endpoint
     * @param {function=} [cb=null] - Callback function
     * @param {object=} [options={}] - Request options
     * @param {number=} options.timeout - Request timeout in milliseconds
     * @param {number=} options.retryAttempts - Number of retry attempts
     * @param {number=} options.retryDelay - Delay between retries in milliseconds
     * @returns {Promise<any|undefined>}
     */
    async delete( endpoint, cb = null, options = {} )
    {
        let r = Helper.trim( endpoint, "/" ),
            req = new Request( this.url + '/' + r,  this._createFetchOptions( "DELETE" ) );
        return await this._fetch( req, cb, options );
    }

    /**
     * PUT call
     * @param {string} endpoint - API endpoint
     * @param {object=} [data={}] - PUT data
     * @param {function=} [cb=null] - Callback function
     * @param {object=} [options={}] - Request options
     * @param {number=} options.timeout - Request timeout in milliseconds
     * @param {number=} options.retryAttempts - Number of retry attempts
     * @param {number=} options.retryDelay - Delay between retries in milliseconds
     * @returns {Promise<any|undefined>}
     */
    async put( endpoint, data = {}, cb = null, options = {} )
    {
        let r = Helper.trim( endpoint, "/" ),
            req = new Request( this.url + '/' + r, this._createFetchOptions( "PUT", data )  );
        return await this._fetch( req, cb, options );
    }

    /**
     * PATCH call
     * @param {string} endpoint - API endpoint
     * @param {object=} [data={}] - Patch data
     * @param {function=} [cb=null] - Callback function
     * @param {object=} [options={}] - Request options
     * @param {number=} options.timeout - Request timeout in milliseconds
     * @param {number=} options.retryAttempts - Number of retry attempts
     * @param {number=} options.retryDelay - Delay between retries in milliseconds
     * @returns {Promise<any|undefined>}
     */
    async patch( endpoint, data = {}, cb = null, options = {} )
    {
        let r = Helper.trim( endpoint, "/" ),
            req = new Request( this.url + '/' + r, this._createFetchOptions( "PATCH", data ) );
        return await this._fetch( req, cb, options );
    }

    /**
     * Aborts all pending requests
     */
    abortAll()
    {
        for (const controller of this._controllers)
        {
            try
            {
                controller.abort();
            }
            catch( e )
            {
                // Fail silently and catch the AbortErrors.
            }
        }
        this._controllers.clear();
    }

    /**
     * Sleep utility for retry delays
     * @private
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check if error is retryable
     * @private
     */
    _isRetryableError(error) {
        // Retry on network errors, timeouts, and specific HTTP status codes
        return error.name === 'AbortError' || 
               error.message.includes('timeout') ||
               error.message.includes('NetworkError') ||
               error.message.includes('HTTP 5') || // 5xx server errors
               error.message.includes('HTTP 408') || // Request timeout
               error.message.includes('HTTP 429');  // Too many requests
    }

    /**
     * Fetch with retry mechanism and timeout handling
     * @private
     */
    async _fetchWithRetry(req, options = {}) {
        const { retryAttempts = this.retryAttempts, retryDelay = this.retryDelay } = options;
        let lastError;

        for (let attempt = 0; attempt <= retryAttempts; attempt++) {
            try {
                const response = await fetch(req);
                
                if (!response.ok) {
                    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                    error.status = response.status;
                    
                    // Don't retry client errors (4xx) except specific ones
                    if (response.status >= 400 && response.status < 500 && 
                        response.status !== 408 && response.status !== 429) {
                        throw error;
                    }
                    
                    if (attempt < retryAttempts && this._isRetryableError(error)) {
                        lastError = error;
                        await this._sleep(retryDelay * Math.pow(2, attempt)); // Exponential backoff
                        continue;
                    }
                    
                    throw error;
                }
                
                let result = null;
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                    try {
                        result = await response.json();
                    } catch (jsonErr) {
                        result = null;
                    }
                } else {
                    result = await response.text();
                }
                
                return {
                    status: response.status,
                    data: result,
                    headers: response.headers
                };
                
            } catch (error) {
                lastError = error;
                
                // Don't retry if it's the last attempt or not a retryable error
                if (attempt >= retryAttempts || !this._isRetryableError(error)) {
                    throw error;
                }
                
                // Wait before retry with exponential backoff
                await this._sleep(retryDelay * Math.pow(2, attempt));
            }
        }
        
        throw lastError;
    }

    async _fetch(req, cb = null, options = {})
    {
        const controller = req.signal.controller;
        const { timeout = this.timeout } = options;
        
        // Set up timeout
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, timeout);
        
        if (cb)
        {
            this._fetchWithRetry(req, options)
                .then(result => {
                    clearTimeout(timeoutId);
                    cb(null, result);
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    cb(error, null);
                })
                .finally(() => {
                    if (controller) this._controllers.delete(controller);
                });
        }
        else
        {
            try
            {
                const result = await this._fetchWithRetry(req, options);
                clearTimeout(timeoutId);
                return result;
            }
            catch (err)
            {
                clearTimeout(timeoutId);
                throw err;
            }
            finally
            {
                if (controller) this._controllers.delete(controller);
            }
        }
    }

    _createFetchOptions( method, data = null )
    {
        const controller = new AbortController();
        this._controllers.add(controller);

        const opts = {
            method: method.toUpperCase(),
            headers: this.headers,
            signal: controller.signal
        };

        // Attach controller to signal for cleanup access
        opts.signal.controller = controller;

        if ( Helper.isPlainObject(data) )
        {
            opts.body = JSON.stringify(data);
        }

        return opts;
    }
}

export { RestApi };
