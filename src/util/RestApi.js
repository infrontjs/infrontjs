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
 * @example <caption>Headers management</caption>
 * myRestApi.addHeader('Authorization', 'Bearer token123');
 * myRestApi.addHeader('Content-Type', 'application/json');
 * myRestApi.removeHeader('Content-Type');
 * const headers = myRestApi.getHeaders(); // Get copy of current headers
 *
 * @example <caption>Query parameters</caption>
 * // Simple query parameters
 * const books = await myRestApi.get('/books', null, {
 *     queryParams: { page: 1, limit: 10, search: 'javascript' }
 * });
 * // Results in: GET /books?page=1&limit=10&search=javascript
 *
 * // Array parameters
 * const filtered = await myRestApi.get('/books', null, {
 *     queryParams: { tags: ['fiction', 'drama'], author: 'Shakespeare' }
 * });
 * // Results in: GET /books?tags=fiction&tags=drama&author=Shakespeare
 *
 * @example <caption>Request cancellation</caption>
 * // Make a request and get the request ID
 * const { requestId, result } = await myRestApi.get('/large-data');
 * 
 * // Make a request with callback and get request ID immediately
 * const { requestId } = await myRestApi.get('/books', (err, result) => {
 *     if (err) console.error('Request failed:', err);
 *     else console.log('Books:', result);
 * });
 *
 * // Cancel the specific request
 * const cancelled = myRestApi.cancelRequest(requestId);
 * console.log('Request cancelled:', cancelled);
 *
 * // Check if request is still pending
 * if (myRestApi.isRequestPending(requestId)) {
 *     console.log('Request is still running');
 * }
 *
 * // Get all pending requests
 * const pending = myRestApi.getPendingRequests();
 * console.log('Pending requests:', pending);
 *
 * // Cancel all requests
 * myRestApi.abortAll();
 *
 * @example <caption>Progress tracking</caption>
 * // Upload progress tracking
 * const formData = new FormData();
 * formData.append('file', fileInput.files[0]);
 * 
 * const { requestId } = await myRestApi.post('/upload', formData, null, {
 *     onUploadProgress: (progress) => {
 *         console.log(`Upload: ${progress.percent}% (${progress.loaded}/${progress.total} bytes)`);
 *         // Update progress bar: progressBar.value = progress.percent;
 *     }
 * });
 *
 * // Download progress tracking
 * const { requestId, result } = await myRestApi.get('/large-file', null, {
 *     onDownloadProgress: (progress) => {
 *         console.log(`Download: ${progress.percent}% (${progress.loaded}/${progress.total} bytes)`);
 *         // Update progress bar: downloadBar.value = progress.percent;
 *     }
 * });
 *
 * // Both upload and download progress
 * const { requestId } = await myRestApi.put('/documents/123', documentData, null, {
 *     onUploadProgress: (progress) => {
 *         console.log('Uploading:', progress.percent + '%');
 *     },
 *     onDownloadProgress: (progress) => {
 *         console.log('Downloading response:', progress.percent + '%');
 *     }
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
        this._requestMap = new Map(); // Map request IDs to controllers
        this._requestIdCounter = 0;
        
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
     * @param {object=} options.queryParams - Query parameters object
     * @param {function=} options.onDownloadProgress - Download progress callback
     * @returns {Promise<{requestId: string, result: (any|undefined)}>} Promise with request ID and result (if no callback)
     */
    async get( endpoint, cb = null, options = {} )
    {
        const { queryParams, ...fetchOptions } = options;
        const url = this._buildUrl(endpoint, queryParams);
        const fetchOpts = this._createFetchOptions( "GET" );
        const req = new Request( url, fetchOpts );
        const requestId = fetchOpts.signal.requestId;

        if (cb) {
            await this._fetch( req, cb, fetchOptions );
            return { requestId };
        } else {
            const result = await this._fetch( req, cb, fetchOptions );
            return { requestId, result };
        }
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
     * @param {object=} options.queryParams - Query parameters object
     * @param {function=} options.onUploadProgress - Upload progress callback
     * @param {function=} options.onDownloadProgress - Download progress callback
     * @returns {Promise<{requestId: string, result: (any|undefined)}>} Promise with request ID and result (if no callback)
     */
    async post( endpoint, data = {}, cb = null, options = {} )
    {
        const { queryParams, ...fetchOptions } = options;
        const url = this._buildUrl(endpoint, queryParams);
        const fetchOpts = this._createFetchOptions( "POST", data );
        const req = new Request( url, fetchOpts );
        const requestId = fetchOpts.signal.requestId;

        if (cb) {
            await this._fetch( req, cb, fetchOptions );
            return { requestId };
        } else {
            const result = await this._fetch( req, cb, fetchOptions );
            return { requestId, result };
        }
    }

    /**
     * DELETE call
     * @param {string} endpoint - API endpoint
     * @param {function=} [cb=null] - Callback function
     * @param {object=} [options={}] - Request options
     * @param {number=} options.timeout - Request timeout in milliseconds
     * @param {number=} options.retryAttempts - Number of retry attempts
     * @param {number=} options.retryDelay - Delay between retries in milliseconds
     * @param {object=} options.queryParams - Query parameters object
     * @param {function=} options.onDownloadProgress - Download progress callback
     * @returns {Promise<{requestId: string, result: (any|undefined)}>} Promise with request ID and result (if no callback)
     */
    async delete( endpoint, cb = null, options = {} )
    {
        const { queryParams, ...fetchOptions } = options;
        const url = this._buildUrl(endpoint, queryParams);
        const fetchOpts = this._createFetchOptions( "DELETE" );
        const req = new Request( url, fetchOpts );
        const requestId = fetchOpts.signal.requestId;

        if (cb) {
            await this._fetch( req, cb, fetchOptions );
            return { requestId };
        } else {
            const result = await this._fetch( req, cb, fetchOptions );
            return { requestId, result };
        }
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
     * @param {object=} options.queryParams - Query parameters object
     * @param {function=} options.onUploadProgress - Upload progress callback
     * @param {function=} options.onDownloadProgress - Download progress callback
     * @returns {Promise<{requestId: string, result: (any|undefined)}>} Promise with request ID and result (if no callback)
     */
    async put( endpoint, data = {}, cb = null, options = {} )
    {
        const { queryParams, ...fetchOptions } = options;
        const url = this._buildUrl(endpoint, queryParams);
        const fetchOpts = this._createFetchOptions( "PUT", data );
        const req = new Request( url, fetchOpts );
        const requestId = fetchOpts.signal.requestId;

        if (cb) {
            await this._fetch( req, cb, fetchOptions );
            return { requestId };
        } else {
            const result = await this._fetch( req, cb, fetchOptions );
            return { requestId, result };
        }
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
     * @param {object=} options.queryParams - Query parameters object
     * @param {function=} options.onUploadProgress - Upload progress callback
     * @param {function=} options.onDownloadProgress - Download progress callback
     * @returns {Promise<{requestId: string, result: (any|undefined)}>} Promise with request ID and result (if no callback)
     */
    async patch( endpoint, data = {}, cb = null, options = {} )
    {
        const { queryParams, ...fetchOptions } = options;
        const url = this._buildUrl(endpoint, queryParams);
        const fetchOpts = this._createFetchOptions( "PATCH", data );
        const req = new Request( url, fetchOpts );
        const requestId = fetchOpts.signal.requestId;

        if (cb) {
            await this._fetch( req, cb, fetchOptions );
            return { requestId };
        } else {
            const result = await this._fetch( req, cb, fetchOptions );
            return { requestId, result };
        }
    }

    /**
     * Cancel a specific request by ID
     * @param {string} requestId - The request ID to cancel
     * @returns {boolean} True if request was found and cancelled, false otherwise
     */
    cancelRequest(requestId)
    {
        const controller = this._requestMap.get(requestId);
        if (controller) {
            try {
                controller.abort();
                this._requestMap.delete(requestId);
                this._controllers.delete(controller);
                return true;
            } catch (e) {
                // Fail silently and catch the AbortErrors.
            }
        }
        return false;
    }

    /**
     * Get all pending request IDs
     * @returns {Array<string>} Array of pending request IDs
     */
    getPendingRequests()
    {
        return Array.from(this._requestMap.keys());
    }

    /**
     * Check if a request is still pending
     * @param {string} requestId - The request ID to check
     * @returns {boolean} True if request is still pending
     */
    isRequestPending(requestId)
    {
        return this._requestMap.has(requestId);
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
        this._requestMap.clear();
    }

    /**
     * Add or update a base header
     * @param {string} name - Header name
     * @param {string} value - Header value
     */
    addHeader(name, value)
    {
        this.headers.set(name, value);
    }

    /**
     * Remove a base header
     * @param {string} name - Header name to remove
     */
    removeHeader(name)
    {
        this.headers.delete(name);
    }

    /**
     * Get all current base headers
     * @returns {Headers} Current headers object
     */
    getHeaders()
    {
        return new Headers(this.headers);
    }

    /**
     * Set multiple headers at once
     * @param {object|Headers} headers - Headers to set
     */
    setHeaders(headers)
    {
        if (headers instanceof Headers) {
            this.headers = new Headers(headers);
        } else if (typeof headers === 'object' && headers !== null) {
            this.headers = new Headers(headers);
        }
    }

    /**
     * Build query string from parameters object
     * @param {object} params - Query parameters object
     * @returns {string} Query string (without leading ?)
     */
    _buildQueryString(params)
    {
        if (!params || typeof params !== 'object') {
            return '';
        }
        
        const searchParams = new URLSearchParams();
        
        for (const [key, value] of Object.entries(params)) {
            if (value !== null && value !== undefined) {
                if (Array.isArray(value)) {
                    // Handle array values (e.g., tags: ['red', 'blue'] -> tags=red&tags=blue)
                    value.forEach(item => {
                        if (item !== null && item !== undefined) {
                            searchParams.append(key, String(item));
                        }
                    });
                } else {
                    searchParams.append(key, String(value));
                }
            }
        }
        
        return searchParams.toString();
    }

    /**
     * Build complete URL with query parameters
     * @param {string} endpoint - API endpoint
     * @param {object=} queryParams - Query parameters object
     * @returns {string} Complete URL
     */
    _buildUrl(endpoint, queryParams = null)
    {
        const trimmedEndpoint = Helper.trim(endpoint, "/");
        let url = this.url + '/' + trimmedEndpoint;
        
        if (queryParams) {
            const queryString = this._buildQueryString(queryParams);
            if (queryString) {
                url += (url.includes('?') ? '&' : '?') + queryString;
            }
        }
        
        return url;
    }

    /**
     * Create a progress tracking wrapper for upload progress
     * @param {any} body - Request body
     * @param {function=} onProgress - Progress callback
     * @returns {any} Wrapped body or original body
     * @private
     */
    _wrapBodyForProgress(body, onProgress) {
        if (!onProgress || !body) {
            return body;
        }

        // For FormData, File, or Blob, we can track upload progress via XMLHttpRequest
        if (body instanceof FormData || body instanceof File || body instanceof Blob) {
            // Return original body, we'll use XMLHttpRequest for upload progress
            return body;
        }

        // For string/JSON data, we can estimate progress
        if (typeof body === 'string') {
            const totalBytes = new Blob([body]).size;
            setTimeout(() => onProgress({ loaded: totalBytes, total: totalBytes, percent: 100 }), 0);
            return body;
        }

        return body;
    }

    /**
     * Fetch with upload progress support using XMLHttpRequest
     * @param {Request} req - Request object
     * @param {function=} onUploadProgress - Upload progress callback
     * @returns {Promise<Response>} Promise resolving to Response
     * @private
     */
    _fetchWithUploadProgress(req, onUploadProgress) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            // Configure upload progress
            if (onUploadProgress && xhr.upload) {
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        onUploadProgress({
                            loaded: event.loaded,
                            total: event.total,
                            percent: Math.round((event.loaded / event.total) * 100)
                        });
                    }
                });
            }

            // Configure response handling
            xhr.addEventListener('load', () => {
                const response = new Response(xhr.response, {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    headers: xhr.getAllResponseHeaders().split('\r\n').reduce((headers, line) => {
                        const [key, value] = line.split(': ');
                        if (key && value) {
                            headers[key] = value;
                        }
                        return headers;
                    }, {})
                });
                resolve(response);
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Network error'));
            });

            xhr.addEventListener('abort', () => {
                reject(new DOMException('Request aborted', 'AbortError'));
            });

            // Configure abort signal
            if (req.signal) {
                req.signal.addEventListener('abort', () => {
                    xhr.abort();
                });
            }

            // Configure request
            xhr.open(req.method, req.url);
            
            // Set headers
            for (const [key, value] of req.headers.entries()) {
                xhr.setRequestHeader(key, value);
            }

            // Send request
            req.arrayBuffer().then(body => {
                xhr.send(body);
            }).catch(reject);
        });
    }

    /**
     * Create a response with download progress tracking
     * @param {Response} response - Original response
     * @param {function=} onProgress - Progress callback
     * @returns {Response} Response with progress tracking
     * @private
     */
    _wrapResponseForProgress(response, onProgress) {
        if (!onProgress || !response.body) {
            return response;
        }

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : null;
        let loaded = 0;

        const reader = response.body.getReader();
        const stream = new ReadableStream({
            start(controller) {
                function pump() {
                    return reader.read().then(({ done, value }) => {
                        if (done) {
                            controller.close();
                            return;
                        }

                        loaded += value.byteLength;
                        
                        // Call progress callback
                        onProgress({
                            loaded,
                            total: total || loaded,
                            percent: total ? Math.round((loaded / total) * 100) : 0
                        });

                        controller.enqueue(value);
                        return pump();
                    });
                }
                return pump();
            }
        });

        return new Response(stream, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
        });
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
        const { 
            retryAttempts = this.retryAttempts, 
            retryDelay = this.retryDelay,
            onUploadProgress,
            onDownloadProgress
        } = options;
        let lastError;

        for (let attempt = 0; attempt <= retryAttempts; attempt++) {
            try {
                let response;
                
                // Use XMLHttpRequest for upload progress or regular fetch
                if (onUploadProgress && req.body) {
                    response = await this._fetchWithUploadProgress(req, onUploadProgress);
                } else {
                    response = await fetch(req);
                }
                
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
                
                // Wrap response for download progress if needed
                if (onDownloadProgress) {
                    response = this._wrapResponseForProgress(response, onDownloadProgress);
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
        const requestId = req.signal.requestId;
        const { timeout = this.timeout } = options;
        
        // Set up timeout
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, timeout);
        
        const cleanup = () => {
            if (controller) {
                this._controllers.delete(controller);
                this._requestMap.delete(requestId);
            }
        };
        
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
                .finally(cleanup);
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
                cleanup();
            }
        }
    }

    _createFetchOptions( method, data = null )
    {
        const controller = new AbortController();
        // Handle counter overflow by resetting when reaching max safe integer
        this._requestIdCounter = (this._requestIdCounter % Number.MAX_SAFE_INTEGER) + 1;
        const requestId = `req_${this._requestIdCounter}_${Date.now()}`;

        this._controllers.add(controller);
        this._requestMap.set(requestId, controller);

        const opts = {
            method: method.toUpperCase(),
            headers: this.headers,
            signal: controller.signal
        };

        // Attach controller and request ID to signal for cleanup access
        opts.signal.controller = controller;
        opts.signal.requestId = requestId;

        if ( Helper.isPlainObject(data) )
        {
            opts.body = JSON.stringify(data);
        }

        return opts;
    }
}

export { RestApi };
