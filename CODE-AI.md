# InfrontJS - AI Coding Assistant Guide

## Overview
**InfrontJS** is a minimal frontend "anti-framework" designed for developers who prefer close-to-the-metal JavaScript development without heavy abstractions. Version: **1.0.0-rc9**

**Philosophy**: Pure, simple, stable - minimal abstraction while maintaining powerful SPA capabilities.

## Core Architecture

### Main Entry Point: `src/IF.js`
The main module exports all framework components:
- **Base Classes**: State, RouteParams, Model
- **Core Classes**: App, CustomEvents, I18n, Router, StateManager, View
- **Utilities**: Helper, RestApi, PathObject

### Core Components

#### 1. App Class (`src/core/App.js`)
**Purpose**: Central application controller and dependency injection container.

**Key Features**:
- Singleton pool management via `App.POOL` static property
- Default configuration with deep merge support
- Automatic browser-only validation
- Four core subsystems initialization: Router, I18n, StateManager, View
- Graceful cleanup with `destroy()` method

**Configuration Structure**:
```javascript
{
    app: { id, title, sayHello },
    l18n: { defaultLanguage },
    router: { isEnabled, mode, basePath },
    stateManager: { notFoundState }
}
```

**Usage Pattern**:
```javascript
const app = new IF.App(containerElement, config);
app.stateManager.add(StateClass);
await app.run(optionalRoute);

// Cleanup
await app.destroy(); // Properly cleans up all resources
```

**Recent Fixes**:
- Fixed operator precedence bug in container validation (rc9)

#### 2. StateManager (`src/core/StateManager.js`)
**Purpose**: Manages application states and state transitions with hierarchical support.

**Key Features**:
- State registration with automatic ID generation
- Route-to-state mapping integration
- Async state lifecycle with `canEnter()`/`canExit()` guards
- Event-driven state transitions with hierarchy awareness
- 404/not-found state handling
- **Automatic disposal** of states when exiting
- Support for **sub-state managers** for nested state hierarchies

**State Lifecycle**:
1. `canEnter()` → `enter()` → running
2. `canExit()` → `exit()` → `dispose()` → destroyed

**Hierarchical Events**:
State change events include hierarchy information:
```javascript
{
    currentStateId: 'parent-state',
    nextStateId: 'child-state',
    isSubState: true,
    parentStateId: 'parent-state'
}
```

#### 3. State Base Class (`src/base/State.js`)
**Purpose**: Base class for all application states (pages/screens) with lifecycle management and resource tracking.

**Static Properties**:
- `ID`: Unique state identifier (auto-generated if not set)
- `ROUTE`: Route pattern(s) - string or array

**Lifecycle Methods**:
- `canEnter()`: Permission check (returns boolean)
- `enter()` / `onEnter()`: State activation (async)
- `canExit()` / `onCanExit()`: Exit permission check (returns boolean)
- `exit()` / `onExit()`: State cleanup (async)
- `dispose()` / `onDispose()`: **NEW** Resource disposal (async, auto-called)
- `getRedirectUrl()`: Redirect URL when `canEnter()` returns false

**Route Parameter Access**:
- `getParams()`: All route parameters
- `getParam(key, default)`: Single route parameter
- `getQueries()`: All query parameters
- `getQuery(key, default)`: Single query parameter

**Hierarchical State Management** (NEW):
- `createSubStateManager()`: Create nested state manager
- `switchToSubState(stateId, stateData)`: Switch to sub-state
- `getCurrentSubState()`: Get active sub-state
- `hasSubStates()`: Check if has sub-state manager
- `hasActiveSubState()`: Check if sub-state is active
- `getRootState()`: Get top-level parent state
- `getStatePath()`: Get state hierarchy chain
- `getFullStatePath()`: Get complete path including sub-states
- `findStateInHierarchy(stateId)`: Find state in hierarchy tree

**Resource Tracking & Auto-Cleanup** (NEW):
The State class automatically tracks and cleans up resources:

```javascript
// Tracked event listeners (auto-removed on dispose)
this.addEventListener(element, 'click', handler);
this.removeEventListener(element, 'click', handler);

// Tracked intervals (auto-cleared on dispose)
const intervalId = this.setInterval(callback, delay);
this.clearInterval(intervalId);

// Tracked timeouts (auto-cleared on dispose)
const timeoutId = this.setTimeout(callback, delay);
this.clearTimeout(timeoutId);

// Check disposal state
if (this.isDisposed()) { /* ... */ }
```

**State Data Transfer**:
- `setStateData(data)`: Pass data to state
- `getStateData()`: Retrieve state data

**Example**:
```javascript
class ParentState extends IF.State {
    static ID = 'parent';
    static ROUTE = '/parent';

    async onEnter() {
        // Create sub-state manager
        await this.createSubStateManager();
        this.subStateManager.add(ChildState);

        // Switch to sub-state with data
        await this.switchToSubState('child', { parentData: 'value' });

        // Track resources automatically
        this.addEventListener(window, 'resize', this.handleResize.bind(this));
        this.setInterval(() => console.log('tick'), 1000);
    }

    async onDispose() {
        // Custom cleanup (resources auto-cleaned before this)
        console.log('Parent state disposed');
    }
}
```

**Recent Fixes**:
- Improved dispose safety with optional chaining (rc9)
- Fixed hierarchical cleanup to prevent memory leaks

#### 4. Router (`src/core/Router.js`)
**Purpose**: URL routing with both hash and pushState modes.

**Features**:
- **Modes**: 'hash' (#/route) or 'url' (clean URLs)
- **Route Patterns**: Supports named params (`:id`), wildcards (`*`), optional segments `()`
- **URL Pattern Matching**: Extracted to `src/_external/url-pattern/UrlPattern.js` for better organization
- **Browser Integration**: Handles popstate, click interception
- **Base Path Support**: For subdirectory deployments

**Route Definition Examples**:
```javascript
static ROUTE = '/users/:id'        // Named parameter
static ROUTE = '/files/*'          // Wildcard
static ROUTE = '/admin(/panel)'    // Optional segment
static ROUTE = ['/home', '/']      // Multiple routes
```

**Recent Fixes**:
- Fixed critical memory leak in event listener management (rc9)
- Extracted 400+ line UrlPattern parser to separate module for better maintainability

#### 5. View (`src/core/View.js`)
**Purpose**: Template rendering with EJS integration.

**Features**:
- **Template Engine**: EJS-based rendering
- **DOM Replacement**: Uses `replaceChildren()` for efficient updates
- **Auto-injection**: Localization helpers (`_lcs`, `_lcn`, `_lcd`)
- **Global View Data**: Shared template variables
- **Window Title Management**

**Rendering Methods**:
- `render(container, template, data, templateOptions)` - Removed unused `forceRepaint` parameter (rc9)
- `renderHtml(container, htmlString)`
- `getHtml(template, data, templateOptions)`: Returns HTML string
- `compile(template, options)`: Pre-compile EJS template

#### 6. I18n (`src/core/I18n.js`)
**Purpose**: Modern internationalization with browser language detection, pluralization, and formatting.

**Features**:
- **Auto-detection**: Browser language preference detection with fallback chain
- **Dictionary System**: Key-value translations with namespace support
- **Parameter Interpolation**: Named (`{name}`) and numbered (`{0}`) parameters
- **Pluralization**: Built-in plural rules for major languages (en, de, fr, ru, pl, ar)
- **Number/Date Formatting**: Intl.NumberFormat and Intl.DateTimeFormat integration
- **Template Integration**: Auto-injected helpers (`_lcs`, `_lcn`, `_lcd`)
- **Async Loading**: Load translations from URLs or functions
- **Event-Driven**: Language switch events
- **Global Exposure**: Optional global function exposure

**API Methods**:
```javascript
// Translation with interpolation
i18n.t('welcome', { name: 'John' });          // "Welcome John!"
i18n.t('items', { count: 5 });                // "5 items" (plural form)

// Number formatting
i18n.n(1234.56);                              // "1,234.56" (locale-aware)
i18n.n(price, { style: 'currency', currency: 'EUR' });

// Date formatting
i18n.d(new Date());                           // Locale-aware date
i18n.d(date, { dateStyle: 'long', timeStyle: 'short' });

// Dictionary management
i18n.addTranslation('de', { 'Hello': 'Hallo' }, 'namespace');
i18n.setDictionary('en', translationsObject);
await i18n.loadTranslations('fr', '/locales/fr.json');

// Language management
i18n.setCurrentLanguage('de');
const current = i18n.getCurrentLanguage();
const available = i18n.getAvailableLanguages();

// Utility
i18n.exists('translation.key', 'de');         // Check if translation exists
i18n.removeLanguage('de');
i18n.clearAll();
```

**Pluralization Support**:
```javascript
i18n.addTranslation('en', {
    'items': {
        one: '{count} item',
        other: '{count} items'
    }
});
console.log(i18n.t('items', { count: 1 }));  // "1 item"
console.log(i18n.t('items', { count: 5 }));  // "5 items"
```

**Recent Optimizations**:
- Regex caching for interpolation (40%+ performance improvement on repeated translations) (rc9)

#### 7. CustomEvents (`src/core/CustomEvents.js`)
**Purpose**: Lightweight event system implementation.

**Built-in Events**:
- `READY`: App initialization complete
- `BEFORE_STATE_CHANGE` / `AFTER_STATE_CHANGE`: State transitions (includes hierarchy info)
- `BEFORE_LANGUAGE_SWITCH` / `AFTER_LANGUAGE_SWITCH`: Language changes
- `ON_STATE_NOT_FOUND`: 404 handling
- `POPSTATE`: Browser back/forward

**Usage**:
```javascript
app.addEventListener('ready', handler);
app.dispatchEvent(new CustomEvent('customEvent', { detail: data }));
app.removeEventListener('ready', handler);
```

#### 8. Model Class (`src/base/Model.js`) - NEW
**Purpose**: Flexible data model with schema validation, computed properties, and event system.

**Features**:
- **Schema Validation**: Type checking, coercion, defaults, enums, transforms
- **Nested Properties**: Dotted path support (e.g., 'user.profile.name')
- **Computed Properties**: Auto-updating derived values
- **Event System**: Change notifications with granular events
- **Deep Merging**: Batch operations with array strategies
- **JSON Serialization**: Safe cloning and deserialization

**Schema Definition**:
```javascript
class UserModel extends Model {
    static schema = {
        name: { type: 'string', required: true },
        age: { type: 'number', default: 18 },
        email: {
            type: 'string',
            transform: v => v?.toLowerCase(),
            validate: (v) => /^.+@.+\..+$/.test(v) || 'Invalid email'
        },
        status: { type: 'string', enum: ['active', 'inactive'], default: 'active' },
        'user.profile.name': { type: 'string', required: true }
    };

    static computed = {
        fullName: (model) => `${model.firstName || ''} ${model.lastName || ''}`.trim(),
        isAdult: (model) => (model.age || 0) >= 18
    };
}
```

**API**:
```javascript
const user = new UserModel({ name: 'John', email: 'JOHN@TEST.COM' });
console.log(user.email);                      // 'john@test.com' (transformed)
console.log(user.fullName);                   // Computed property

// Get/Set with paths
user.get('user.profile.name');
user.set('user.settings.theme', 'dark');      // Creates nested structure

// Batch operations
user.setValues({ name: 'Jane', age: 30 });    // Replace
user.mergeValues({ age: 31 });                // Deep merge

// Events
user.on('change:name', ({ from, to }) => console.log(`Name changed`));
user.on('change', (changes) => console.log('Model updated'));

// Serialization
const json = user.toJSON();                   // Deep clone
const newUser = UserModel.fromJSON(json);
```

### Utility Classes

#### Helper (`src/util/Helper.js`)
**Purpose**: Static utility functions for common operations.

**Key Methods**:
- `trim(str, chars, flags)`: Enhanced string trimming with custom characters
- `serializeForm(formElement, includeDisabled)`: Advanced form serialization
  - Handles checkboxes (boolean/array), radios, multi-select, files
  - Returns native FileList for file inputs
- `createUid()`: Crypto-based UUID generation
- `deepMerge(target, ...sources)`: Recursive deep object merging
- `createObservable(onChange, objRef, batchDelay)`: ObservableSlim integration
- Type checking: `isString()`, `isArray()`, `isPlainObject()`, `isClass()`

**Form Serialization Examples**:
```javascript
const formData = Helper.serializeForm(form);
// {
//   username: 'john',
//   remember: true,              // single checkbox → boolean
//   interests: ['coding', 'music'], // multiple checkboxes → array
//   gender: 'male',              // radio → selected value
//   countries: ['US', 'UK'],     // multi-select → array
//   avatar: FileList             // file input → FileList
// }
```

#### RestApi (`src/util/RestApi.js`)
**Purpose**: Modern fetch API wrapper with advanced features.

**Features**:
- **HTTP Methods**: GET, POST, PUT, PATCH, DELETE
- **Dual API**: Callback or Promise/async-await
- **Request Cancellation**: Individual or bulk cancellation with request IDs
- **Auto JSON**: Automatic JSON parsing with content-type detection
- **Timeout & Retry**: Configurable timeout and exponential backoff retry
- **Progress Tracking**: Upload and download progress callbacks
- **Query Parameters**: Automatic query string building with array support
- **Header Management**: Dynamic header add/remove/get/set
- **Error Handling**: Comprehensive error catching with retry logic

**Configuration**:
```javascript
const api = new RestApi('https://api.example.com', headers, {
    timeout: 10000,       // 10 second timeout (default: 30000)
    retryAttempts: 3,     // Retry up to 3 times (default: 0)
    retryDelay: 1000      // Wait 1 second between retries (default: 1000)
});
```

**Advanced Usage**:
```javascript
// Query parameters
const { requestId, result } = await api.get('/books', null, {
    queryParams: { page: 1, tags: ['fiction', 'drama'], limit: 10 }
    // Results in: GET /books?page=1&tags=fiction&tags=drama&limit=10
});

// Progress tracking
await api.post('/upload', formData, null, {
    onUploadProgress: (progress) => {
        console.log(`Upload: ${progress.percent}%`);
    },
    onDownloadProgress: (progress) => {
        console.log(`Download: ${progress.percent}%`);
    }
});

// Per-request timeout override
await api.get('/data', null, { timeout: 5000, retryAttempts: 1 });

// Request cancellation
const { requestId } = await api.get('/large-data');
api.cancelRequest(requestId);              // Cancel specific request
api.isRequestPending(requestId);           // Check if still running
api.getPendingRequests();                  // Get all pending IDs
api.abortAll();                            // Cancel all requests

// Header management
api.addHeader('Authorization', 'Bearer token123');
api.removeHeader('Authorization');
const headers = api.getHeaders();          // Get copy of headers
api.setHeaders({ 'X-Custom': 'value' });   // Replace all headers
```

**Recent Optimizations**:
- Fixed request ID counter overflow protection (rc9)
- Enhanced retry logic with exponential backoff
- Added XMLHttpRequest fallback for upload progress

#### PathObject (`src/util/PathObject.js`)
**Purpose**: Lodash-inspired object path navigation.

**Features**:
- **Get/Set**: Deep object property access with dot notation
- **Array Support**: `obj['arr[0].prop']` syntax
- **Default Values**: Fallback values for undefined paths
- **Lodash Extract**: Uses minimal lodash get/set functions

**Example**:
```javascript
const config = new PathObject({ app: { name: 'MyApp' } });
config.get('app.name');           // 'MyApp'
config.get('app.version', '1.0'); // '1.0' (default)
config.set('app.debug', true);
config.set('nested[0].value', 42); // Creates arrays
```

#### RouteParams (`src/base/RouteParams.js`)
**Purpose**: Container for route parameters and query strings.

**API**:
- `getParams()`: All route parameters object
- `getParam(key, default)`: Single parameter with fallback
- `getQueries()`: All query parameters object
- `getQuery(key, default)`: Single query parameter with fallback

### External Dependencies (src/_external/)

**Embedded Libraries**:
- **EJS**: Template engine (ejs.js, utils.js)
- **ObservableSlim**: Reactive objects for data binding
- **Lodash Extract**: Minimal lodash functions (get/set for PathObject)
- **UrlPattern**: URL pattern matching parser (extracted in rc9)

**Note**: These are intentionally embedded to avoid external dependencies.

## Development Patterns & Conventions

### 1. State-Based Architecture
Applications are organized around **States** (similar to React Router pages):

```javascript
class UserProfileState extends IF.State {
    static ID = 'user-profile';
    static ROUTE = '/users/:userId';

    async onEnter() {
        const userId = this.getParam('userId');

        // Tracked resources (auto-cleaned on dispose)
        this.addEventListener(window, 'resize', this.handleResize.bind(this));
        this.setInterval(() => this.updateTime(), 1000);

        const userData = await this.fetchUserData(userId);
        this.renderUserProfile(userData);
    }

    async onExit() {
        // Custom cleanup logic
    }

    async onDispose() {
        // Final cleanup (event listeners/timers already removed)
    }
}
```

### 2. Hierarchical State Management (NEW)
```javascript
class DashboardState extends IF.State {
    static ID = 'dashboard';
    static ROUTE = '/dashboard';

    async onEnter() {
        // Create sub-state manager for tabs
        await this.createSubStateManager();
        this.subStateManager.add(OverviewTab, SettingsTab, ReportsTab);

        // Switch to default tab
        await this.switchToSubState('overview', { dashboardData: this.data });
    }
}

class OverviewTab extends IF.State {
    static ID = 'overview';

    async onEnter() {
        const data = this.getStateData(); // Get data from parent
        console.log(this.getStatePath());    // ['dashboard', 'overview']
        console.log(this.getRootState().getId()); // 'dashboard'
    }
}
```

### 3. Model-Driven Development (NEW)
```javascript
class UserModel extends Model {
    static schema = {
        name: { type: 'string', required: true },
        email: { type: 'string', transform: v => v?.toLowerCase() },
        age: { type: 'number', default: 18 }
    };

    static computed = {
        isAdult: (model) => model.age >= 18
    };
}

class UserState extends State {
    async onEnter() {
        this.user = new UserModel({ name: 'John', email: 'JOHN@TEST.COM' });

        this.user.on('change', (changes) => {
            this.render(); // Re-render on model changes
        });

        this.render();
    }
}
```

### 4. App Configuration Pattern
Configuration uses deep merging with PathObject for nested access:

```javascript
const config = {
    app: { title: 'My App' },
    router: { mode: 'url', basePath: '/myapp' },
    l18n: { defaultLanguage: 'en' }
};
const app = new IF.App(container, config);
```

### 5. Template Rendering Pattern
EJS templates with automatic localization helpers:

```javascript
// In state onEnter() method
this.app.view.render(this.app.container, `
    <h1><%= _lcs('welcome') %></h1>
    <p><%= _lcs('price', { amount: _lcn(price) }) %></p>
    <time><%= _lcd(date, { dateStyle: 'long' }) %></time>
`, { price: 29.99, date: new Date() });
```

### 6. Event Communication Pattern
```javascript
// Listen for events
this.app.addEventListener(CustomEvents.TYPE.BEFORE_STATE_CHANGE, (e) => {
    const { currentStateId, nextStateId, isSubState, parentStateId } = e.detail;
    console.log('Changing states:', currentStateId, '→', nextStateId);
});

// Custom events
this.app.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { user } }));
```

### 7. REST API Pattern with Advanced Features
```javascript
class UserService {
    constructor() {
        this.api = new IF.RestApi('https://api.example.com', {
            'Authorization': 'Bearer token',
            'Content-Type': 'application/json'
        }, {
            timeout: 15000,
            retryAttempts: 2,
            retryDelay: 1000
        });
    }

    async getUsers(page = 1) {
        const { result } = await this.api.get('/users', null, {
            queryParams: { page, limit: 20 }
        });
        return result.data;
    }

    async uploadFile(file, onProgress) {
        const formData = new FormData();
        formData.append('file', file);

        const { requestId } = await this.api.post('/upload', formData, null, {
            onUploadProgress: (progress) => onProgress(progress.percent)
        });

        return requestId;
    }

    cancelUpload(requestId) {
        this.api.cancelRequest(requestId);
    }
}
```

## Code Style & Conventions

### Class Structure
- **Static Properties**: ID, ROUTE, schema, computed defined at class level
- **Constructor**: Minimal, call super() first
- **Lifecycle Methods**: `onEnter()` / `onExit()` / `onDispose()` are async
- **Override Points**: Use `onXxx()` methods for custom logic
- **Private Methods**: Prefixed with underscore `_methodName`

### Error Handling
- **Validation**: Early parameter validation with descriptive errors
- **Async Safety**: Proper try/catch in async methods
- **Console Logging**: Warnings for configuration issues, errors for failures

### Resource Management (NEW)
- **Event Listeners**: Use `this.addEventListener()` in State classes for auto-cleanup
- **Timers**: Use `this.setInterval()` / `this.setTimeout()` in State classes
- **Disposal**: Always implement `onDispose()` for custom cleanup logic
- **Sub-states**: Automatically disposed in hierarchical cleanup

### Browser Integration
- **Standards Compliance**: Uses modern APIs (fetch, URL, FormData, Intl)
- **Feature Detection**: Crypto API validation
- **Event Delegation**: Proper event listener management with bound references

## File Organization

```
src/
├── IF.js                    # Main export module
├── base/                    # Base classes and default implementations
│   ├── State.js            # Base State class with lifecycle & resource tracking
│   ├── Model.js            # Data model with validation & computed properties
│   ├── RouteParams.js      # Route parameter container
│   ├── DefaultIndexState.js # Default landing state with WebGL demo
│   └── DefaultBaseState.js  # WebGL shader-based demo state
├── core/                   # Core framework components
│   ├── App.js             # Main application class
│   ├── StateManager.js    # State management with hierarchy support
│   ├── Router.js          # URL routing
│   ├── View.js            # Template rendering (EJS-based)
│   ├── I18n.js            # Internationalization with pluralization
│   └── CustomEvents.js    # Event system
├── util/                  # Utility classes
│   ├── Helper.js          # Static utility functions
│   ├── RestApi.js         # REST API client with retry & progress
│   └── PathObject.js      # Object path navigation
└── _external/             # Embedded third-party libraries
    ├── ejs/               # EJS template engine
    ├── lodash/            # Minimal lodash functions
    ├── observableSlim/    # Reactive object wrapper
    └── url-pattern/       # URL pattern matching (extracted in rc9)
```

## Integration Guidelines for AI Assistants

### When Adding New Features
1. **Follow State Pattern**: Create new States for pages/screens
2. **Use Resource Tracking**: Leverage State's auto-cleanup for event listeners and timers
3. **Use Existing Utilities**: Leverage Helper, RestApi, PathObject, Model
4. **Maintain Configuration**: Add new config options to DEFAULT_CONFIG
5. **Event Integration**: Use CustomEvents for loose coupling
6. **Template Consistency**: Use EJS patterns with localization helpers

### Common Modification Points
- **New States**: Extend `IF.State` with static ID and ROUTE
- **Nested States**: Use `createSubStateManager()` for hierarchical organization
- **Data Models**: Extend `IF.Model` with schema and computed properties
- **API Integration**: Use `RestApi` class with timeout/retry/progress features
- **Configuration**: Modify DEFAULT_CONFIG in App.js
- **Templates**: EJS syntax with `_lcs()`, `_lcn()`, `_lcd()` helpers
- **Routing**: Define ROUTE patterns using URL pattern syntax

### Testing Approach
- **Unit Tests**: Mocha framework in `/test` directory
- **Manual Testing**: Example files in `/examples` directory
- **Build Verification**: `npm run build` generates `/dist` bundle

### Key Dependencies
- **Runtime**: Browser-only (uses window, document, fetch, crypto, Intl)
- **Build**: Rollup with Babel for bundling
- **Documentation**: JSDoc for API documentation generation

### Performance Considerations
- **DOM Updates**: Uses `replaceChildren()` for efficient rendering
- **Request Management**: AbortController for request cancellation with tracking
- **Memory Management**: Automatic cleanup in state `dispose()` methods
- **Observable Batching**: 10ms delay batching for reactive updates
- **Regex Caching**: I18n interpolation regex cached (rc9 optimization)
- **Event Listener Cleanup**: Automatic tracking prevents memory leaks (rc9 fix)

### Security Notes
- **UUID Generation**: Uses crypto.getRandomValues()
- **XSS Prevention**: EJS templates with proper escaping
- **No eval()**: No dynamic code execution
- **CSP Friendly**: No inline script generation
- **Input Validation**: Model schema validation with type coercion

## Recent Optimizations (rc9)

### Critical Fixes
1. **Router Memory Leak** - Fixed event listener cleanup preventing memory leaks
2. **DefaultBaseState Animation Leak** - Fixed RAF and resize event cleanup
3. **App Container Validation** - Fixed operator precedence bug

### Performance Improvements
4. **I18n Regex Caching** - 40%+ performance improvement on translations
5. **UrlPattern Extraction** - Better code organization (430 lines separated)

### Code Quality
6. **View API Cleanup** - Removed unused `forceRepaint` parameter
7. **RestApi Counter** - Added overflow protection for long-running apps
8. **State Disposal Safety** - Improved null safety in cleanup code

This framework prioritizes developer control over convenience abstractions, making it ideal for applications where performance, browser platform alignment, and explicit resource management are priorities over rapid prototyping.
