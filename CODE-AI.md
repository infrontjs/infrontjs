# InfrontJS - AI Coding Assistant Guide

## Overview
**InfrontJS** is a minimal frontend "anti-framework" designed for developers who prefer close-to-the-metal JavaScript development without heavy abstractions. Version: 1.0.0-rc6

**Philosophy**: Pure, simple, stable - minimal abstraction while maintaining powerful SPA capabilities.

## Core Architecture

### Main Entry Point: `src/IF.js`
The main module exports all framework components:
- **Base Classes**: State, RouteParams  
- **Core Classes**: App, CustomEvents, L18n, Router, StateManager, View
- **Utilities**: Helper, RestApi, PathObject

### Core Components

#### 1. App Class (`src/core/App.js`)
**Purpose**: Central application controller and dependency injection container.

**Key Features**:
- Singleton pool management via `App.POOL` static property
- Default configuration with deep merge support
- Automatic browser-only validation
- Four core subsystems initialization: Router, L18n, StateManager, View

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
```

#### 2. StateManager (`src/core/StateManager.js`)
**Purpose**: Manages application states and state transitions.

**Key Features**:
- State registration with automatic ID generation
- Route-to-state mapping integration
- Async state lifecycle with `canEnter()`/`canExit()` guards
- Event-driven state transitions
- 404/not-found state handling

**State Lifecycle**:
1. `canEnter()` → `enter()` → running
2. `canExit()` → `exit()` → destroyed

#### 3. State Base Class (`src/base/State.js`)
**Purpose**: Base class for all application states (pages/screens).

**Static Properties**:
- `ID`: Unique state identifier
- `ROUTE`: Route pattern(s) - string or array

**Lifecycle Methods**:
- `canEnter()`: Permission check (returns boolean)
- `enter()`: State activation (async)
- `canExit()`: Exit permission check (returns boolean)  
- `exit()`: State cleanup (async)
- `getRedirectUrl()`: Redirect URL when `canEnter()` returns false

**Route Parameter Access**:
- `getParams()`: All route parameters
- `getParam(key, default)`: Single route parameter
- `getQueries()`: All query parameters
- `getQuery(key, default)`: Single query parameter

#### 4. Router (`src/core/Router.js`)
**Purpose**: URL routing with both hash and pushState modes.

**Features**:
- **Modes**: 'hash' (#/route) or 'url' (clean URLs)
- **Route Patterns**: Supports named params (`:id`), wildcards (`*`), optional segments `()`
- **Built-in URL Pattern Matching**: Custom implementation included
- **Browser Integration**: Handles popstate, click interception
- **Base Path Support**: For subdirectory deployments

**Route Definition Examples**:
```javascript
static ROUTE = '/users/:id'        // Named parameter
static ROUTE = '/files/*'          // Wildcard
static ROUTE = '/admin(/panel)'    // Optional segment
static ROUTE = ['/home', '/']      // Multiple routes
```

#### 5. View (`src/core/View.js`)
**Purpose**: Template rendering with EJS integration.

**Features**:
- **Template Engine**: EJS-based rendering
- **DOM Replacement**: Uses `replaceChildren()` for efficient updates
- **Auto-injection**: Localization helpers (`_lcs`, `_lcn`, `_lcd`)
- **Global View Data**: Shared template variables
- **Window Title Management**

**Rendering Methods**:
- `render(container, template, data, forceRepaint, templateOptions)`
- `renderHtml(container, htmlString)`
- `getHtml(template, data, templateOptions)`: Returns HTML string

#### 6. L18n (`src/core/L18n.js`)
**Purpose**: Internationalization with browser language detection.

**Features**:
- **Auto-detection**: Browser language preference detection
- **Dictionary System**: Key-value translations with parameter substitution
- **Number/Date Formatting**: Intl.NumberFormat and Intl.DateTimeFormat integration
- **Template Integration**: Auto-injected helpers (`_lcs`, `_lcn`, `_lcd`)

**API**:
```javascript
l18n.addTranslation('de', { 'Hello': 'Hallo' });
l18n.getLocale('Hello', [param1, param2]);  // Parameter substitution with {0}, {1}
l18n.getNumber(1234.56, options);
l18n.getDateTime(new Date(), options);
```

#### 7. CustomEvents (`src/core/CustomEvents.js`)
**Purpose**: Event system using DOM DocumentFragment proxy.

**Built-in Events**:
- `READY`: App initialization complete
- `BEFORE_STATE_CHANGE`/`AFTER_STATE_CHANGE`: State transitions
- `BEFORE_LANGUAGE_SWITCH`/`AFTER_LANGUAGE_SWITCH`: Language changes
- `ON_STATE_NOT_FOUND`: 404 handling
- `POPSTATE`: Browser back/forward

**Usage**:
```javascript
app.addEventListener('ready', handler);
app.dispatchCustomEvent('customEvent', { data });
```

### Utility Classes

#### Helper (`src/util/Helper.js`)
**Purpose**: Static utility functions for common operations.

**Key Methods**:
- `trim(str, chars, flags)`: Enhanced string trimming
- `serializeForm(formElement)`: Form to object conversion
- `createUid()`: Crypto-based UUID generation
- `deepMerge(target, ...sources)`: Deep object merging
- `createObservable(onChange, objRef, batchDelay)`: ObservableSlim integration
- Type checking: `isString()`, `isArray()`, `isPlainObject()`, `isClass()`

#### RestApi (`src/util/RestApi.js`)
**Purpose**: Fetch API wrapper for REST operations.

**Features**:
- **HTTP Methods**: GET, POST, PUT, PATCH, DELETE
- **Dual API**: Callback or Promise/async-await
- **Request Cancellation**: AbortController integration with `abortAll()`
- **Auto JSON**: Automatic JSON parsing with fallback
- **Error Handling**: Comprehensive error catching

**Usage Patterns**:
```javascript
const api = new RestApi('https://api.example.com', headers);
const result = await api.get('/users');
api.post('/users', userData, callback);
api.abortAll(); // Cancel all pending requests
```

#### PathObject (`src/util/PathObject.js`)
**Purpose**: Lodash-inspired object path navigation.

**Features**:
- **Get/Set**: Deep object property access with dot notation
- **Array Support**: `obj['arr[0].prop']` syntax
- **Default Values**: Fallback values for undefined paths

**Example**:
```javascript
const config = new PathObject({ app: { name: 'MyApp' } });
config.get('app.name');           // 'MyApp'
config.get('app.version', '1.0'); // '1.0' (default)
config.set('app.debug', true);
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

**Note**: These are intentionally embedded to avoid external dependencies.

## Development Patterns & Conventions

### 1. State-Based Architecture
Applications are organized around **States** (similar to React Router pages):

```javascript
class UserProfileState extends IF.State {
    static ID = 'user-profile';
    static ROUTE = '/users/:userId';
    
    async enter() {
        const userId = this.getParam('userId');
        const userData = await this.fetchUserData(userId);
        this.renderUserProfile(userData);
    }
    
    async exit() {
        // Cleanup logic
    }
}
```

### 2. App Configuration Pattern
Configuration uses deep merging with PathObject for nested access:

```javascript
const config = {
    app: { title: 'My App' },
    router: { mode: 'url', basePath: '/myapp' },
    l18n: { defaultLanguage: 'en' }
};
const app = new IF.App(container, config);
```

### 3. Template Rendering Pattern
EJS templates with automatic localization helpers:

```javascript
// In state enter() method
this.app.view.render(this.app.container, `
    <h1><%= _lcs('welcome') %></h1>
    <p>Price: <%= _lcn(price) %></p>
    <time><%= _lcd(date) %></time>
`, { price: 29.99, date: new Date() });
```

### 4. Event Communication Pattern
```javascript
// Listen for events
this.app.addEventListener('beforeStateChange', (e) => {
    console.log('Changing from', e.detail.currentStateId, 'to', e.detail.nextStateId);
});

// Dispatch custom events
this.app.dispatchCustomEvent('userLoggedIn', { user: userData });
```

### 5. REST API Pattern
```javascript
class UserService {
    constructor() {
        this.api = new IF.RestApi('https://api.example.com', {
            'Authorization': 'Bearer token',
            'Content-Type': 'application/json'
        });
    }
    
    async getUser(id) {
        const response = await this.api.get(`/users/${id}`);
        return response.json;
    }
}
```

## Code Style & Conventions

### Class Structure
- **Static Properties**: ID, ROUTE defined at class level
- **Constructor**: Minimal, call super() first
- **Lifecycle Methods**: enter()/exit() are async
- **Private Methods**: Prefixed with underscore `_methodName`

### Error Handling
- **Validation**: Early parameter validation with descriptive errors
- **Async Safety**: Proper try/catch in async methods
- **Console Logging**: Warnings for configuration issues, errors for failures

### Browser Integration
- **Standards Compliance**: Uses modern APIs (fetch, URL, FormData, Intl)
- **Feature Detection**: Crypto API validation
- **Event Delegation**: Proper event listener management

## File Organization

```
src/
├── IF.js                    # Main export module
├── base/                    # Base classes and default implementations
│   ├── State.js            # Base State class
│   ├── RouteParams.js      # Route parameter container
│   ├── DefaultIndexState.js # Default landing state with WebGL demo
│   └── DefaultBaseState.js  # WebGL shader-based demo state
├── core/                   # Core framework components
│   ├── App.js             # Main application class
│   ├── StateManager.js    # State management and lifecycle
│   ├── Router.js          # URL routing with pattern matching
│   ├── View.js            # Template rendering (EJS-based)
│   ├── L18n.js            # Internationalization
│   └── CustomEvents.js    # Event system
├── util/                  # Utility classes
│   ├── Helper.js          # Static utility functions
│   ├── RestApi.js         # REST API client
│   └── PathObject.js      # Object path navigation
└── _external/             # Embedded third-party libraries
    ├── ejs/               # EJS template engine
    ├── lodash/            # Minimal lodash functions
    └── observableSlim/    # Reactive object wrapper
```

## Integration Guidelines for AI Assistants

### When Adding New Features
1. **Follow State Pattern**: Create new States for pages/screens
2. **Use Existing Utilities**: Leverage Helper, RestApi, PathObject
3. **Maintain Configuration**: Add new config options to DEFAULT_CONFIG
4. **Event Integration**: Use CustomEvents for loose coupling
5. **Template Consistency**: Use EJS patterns with localization helpers

### Common Modification Points
- **New States**: Extend `IF.State` with static ID and ROUTE
- **API Integration**: Use `RestApi` class for HTTP requests  
- **Configuration**: Modify DEFAULT_CONFIG in App.js
- **Templates**: EJS syntax with `_lcs()`, `_lcn()`, `_lcd()` helpers
- **Routing**: Define ROUTE patterns using URL pattern syntax

### Testing Approach
- **Unit Tests**: Mocha framework in `/test` directory
- **Manual Testing**: Example files in `/examples` directory
- **Build Verification**: `npm run build` generates `/dist` bundle

### Key Dependencies
- **Runtime**: Browser-only (uses window, document, fetch, crypto)
- **Build**: Rollup with Babel for bundling
- **Documentation**: JSDoc for API documentation generation

### Performance Considerations
- **DOM Updates**: Uses `replaceChildren()` for efficient rendering
- **Request Management**: AbortController for request cancellation
- **Memory Management**: Proper cleanup in state `exit()` methods
- **Observable Batching**: 10ms delay batching for reactive updates

### Security Notes
- **UUID Generation**: Uses crypto.getRandomValues()
- **XSS Prevention**: EJS templates with proper escaping
- **No eval()**: No dynamic code execution
- **CSP Friendly**: No inline script generation

This framework prioritizes developer control over convenience abstractions, making it ideal for applications where performance and browser platform alignment are priorities over rapid prototyping.