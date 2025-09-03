import assert from 'assert';
import * as IF from './../../src/IF.js';

// Mock App class for testing
class MockApp {
    constructor() {
        this.events = {};
        this.config = {
            get: (key) => {
                const configs = {
                    'stateManager.notFoundState': null
                };
                return configs[key] || null;
            }
        };
        this.router = {
            addRoute: () => {},
            redirect: () => {}
        };
    }
    
    addEventListener(type, handler) {
        if (!this.events[type]) {
            this.events[type] = [];
        }
        this.events[type].push(handler);
    }
    
    dispatchEvent(event) {
        const handlers = this.events[event.type] || [];
        handlers.forEach(handler => handler(event));
    }
}

// Test sub-states
class TestSubStateA extends IF.State {
    static ID = 'TEST_SUB_STATE_A';
    
    constructor(app, routeParams, parentState) {
        super(app, routeParams, parentState);
        this.enterCalled = false;
        this.exitCalled = false;
        this.disposeCalled = false;
    }
    
    async onEnter() {
        this.enterCalled = true;
    }
    
    async onExit() {
        this.exitCalled = true;
    }
    
    async onDispose() {
        this.disposeCalled = true;
    }
}

class TestSubStateB extends IF.State {
    static ID = 'TEST_SUB_STATE_B';
    
    constructor(app, routeParams, parentState) {
        super(app, routeParams, parentState);
        this.canExitResult = true;
    }
    
    onCanExit() {
        return this.canExitResult;
    }
}

describe( "Testing base.State", () =>
{
    let state, mockApp;
    
    before ( () => {
        mockApp = new MockApp();
        state = new IF.State( mockApp, new IF.RouteParams( { "p1" : "one" }, { "q2" : "two" } ) );
    });

    describe('Basic State Structure and Functionality', () => {
        it( 'Test class and its structure', () =>
        {
            assert.equal( "function" === typeof IF.State, true );
            assert.equal( state instanceof IF.State, true );
            assert.equal( "function" === typeof state.getId, true );
            assert.equal( "function" === typeof state.canEnter, true );
            assert.equal( "function" === typeof state.canExit, true );
            assert.equal( "function" === typeof state.getRedirectUrl, true );
            assert.equal( "function" === typeof state.enter, true );
            assert.equal( "function" === typeof state.getParams, true );
            assert.equal( "function" === typeof state.getParam, true );
            assert.equal( "function" === typeof state.getQueries, true );
            assert.equal( "function" === typeof state.getQuery, true );
        });

        it ( 'Test ID', () =>
        {
            IF.State.ID = 'test';
            assert.equal( 'test' === state.getId(), true );
        });

        it ( 'Test State.canEnter', () =>
        {
            assert.equal( "boolean" === typeof state.canEnter(), true );
            assert.equal( true === state.canEnter(), true );
        });

        it ( 'Test State.canExit', () =>
        {
            assert.equal( "boolean" === typeof state.canExit(), true );
            assert.equal( true === state.canExit(), true );
        });

        it ( 'Test State.getRedirect', () =>
        {
            assert.equal( null === state.getRedirectUrl(), true );
        });

        it ( 'Test State.enter', () =>
        {
            assert.equal( state.enter() instanceof Promise, true );
        });

        it ( 'Test State.exit', () =>
        {
            assert.equal( state.exit() instanceof Promise, true );
        });
    });

    describe('Route Parameters and Queries', () => {
        it ( 'Test State.getParams', () =>
        {
            const params = state.getParams();
            assert.equal( "object" === typeof params, true );
            assert.equal( 1 === Object.keys( params ).length, true );
            assert.equal( true === params.hasOwnProperty( "p1" ), true );
        });

        it ( 'Test State.getParam', () =>
        {
            assert.equal( null === state.getParam( 'does-not-exists' ), true );
            assert.equal( "one" === state.getParam( "p1"), true );
            assert.equal( "my-default" === state.getParam( 'does-not-exists', 'my-default' ), true );
        });

        it ( 'Test State.getQueries', () =>
        {
            const queries = state.getQueries();
            assert.equal( "object" === typeof queries, true );
            assert.equal( 1 === Object.keys( queries ).length, true );
            assert.equal( true === queries.hasOwnProperty( "q2" ), true );
        });

        it ( 'Test State.getQuery', () =>
        {
            assert.equal( null === state.getQuery( 'does-not-exists' ), true );
            assert.equal( "two" === state.getQuery( "q2"), true );
            assert.equal( "my-default" === state.getQuery( 'does-not-exists', 'my-default' ), true );
        });
    });

    describe('State Data Management', () => {
        it('Should set and get state data', () => {
            const testData = { key: 'value', number: 42 };
            state.setStateData(testData);
            
            const retrievedData = state.getStateData();
            assert.deepEqual(retrievedData, testData);
        });

        it('Should handle null state data', () => {
            state.setStateData(null);
            assert.equal(state.getStateData(), null);
        });
    });

    describe('Parent-Child State Relationships', () => {
        it('Should accept parent state in constructor', () => {
            const parentState = new IF.State(mockApp, new IF.RouteParams());
            const childState = new IF.State(mockApp, new IF.RouteParams(), parentState);
            
            assert.equal(childState.parentState, parentState);
        });

        it('Should find root state', () => {
            const rootState = new IF.State(mockApp, new IF.RouteParams());
            const middleState = new IF.State(mockApp, new IF.RouteParams(), rootState);
            const leafState = new IF.State(mockApp, new IF.RouteParams(), middleState);
            
            assert.equal(leafState.getRootState(), rootState);
        });

        it('Should build state path correctly', () => {
            IF.State.ID = 'ROOT';
            const rootState = new IF.State(mockApp, new IF.RouteParams());
            
            class MiddleState extends IF.State {
                static ID = 'MIDDLE';
            }
            const middleState = new MiddleState(mockApp, new IF.RouteParams(), rootState);
            
            class LeafState extends IF.State {
                static ID = 'LEAF';
            }
            const leafState = new LeafState(mockApp, new IF.RouteParams(), middleState);
            
            const path = leafState.getStatePath();
            assert.deepEqual(path, ['ROOT', 'MIDDLE', 'LEAF']);
        });
    });

    describe('Sub-State Management', () => {
        it('Should create sub-state manager', async () => {
            const parentState = new IF.State(mockApp, new IF.RouteParams());
            const subManager = await parentState.createSubStateManager();
            
            assert.ok(subManager);
            assert.equal(parentState.hasSubStates(), true);
            assert.equal(parentState.hasActiveSubState(), false);
        });

        it('Should add and switch to sub-states', async () => {
            const parentState = new IF.State(mockApp, new IF.RouteParams());
            const subManager = await parentState.createSubStateManager();
            
            subManager.add(TestSubStateA, TestSubStateB);
            
            const success = await parentState.switchToSubState('TEST_SUB_STATE_A', { test: 'data' });
            assert.equal(success, true);
            assert.equal(parentState.hasActiveSubState(), true);
            
            const currentSubState = parentState.getCurrentSubState();
            assert.ok(currentSubState instanceof TestSubStateA);
            assert.equal(currentSubState.parentState, parentState);
            assert.deepEqual(currentSubState.getStateData(), { test: 'data' });
            assert.equal(currentSubState.enterCalled, true);
        });

        it('Should handle sub-state canExit logic', async () => {
            const parentState = new IF.State(mockApp, new IF.RouteParams());
            const subManager = await parentState.createSubStateManager();
            
            subManager.add(TestSubStateB);
            await parentState.switchToSubState('TEST_SUB_STATE_B');
            
            const subState = parentState.getCurrentSubState();
            
            // Should be able to exit normally
            assert.equal(parentState.canExit(), true);
            
            // Prevent sub-state from exiting
            subState.canExitResult = false;
            assert.equal(parentState.canExit(), false);
        });
    });

    describe('Memory Management and Resource Cleanup', () => {
        let testState;
        
        beforeEach(() => {
            testState = new IF.State(mockApp, new IF.RouteParams());
        });

        it('Should track event listeners', () => {
            const mockElement = {
                addEventListener: () => {},
                removeEventListener: () => {}
            };
            
            testState.addEventListener(mockElement, 'click', () => {});
            assert.equal(testState._eventListeners.length, 1);
        });

        it('Should track intervals', () => {
            const intervalId = testState.setInterval(() => {}, 1000);
            assert.ok(intervalId !== null);
            assert.equal(testState._intervals.length, 1);
            
            testState.clearInterval(intervalId);
            assert.equal(testState._intervals.length, 0);
        });

        it('Should track timeouts', () => {
            const timeoutId = testState.setTimeout(() => {}, 1000);
            assert.ok(timeoutId !== null);
            assert.equal(testState._timeouts.length, 1);
            
            testState.clearTimeout(timeoutId);
            assert.equal(testState._timeouts.length, 0);
        });

        it('Should prevent operations on disposed state', async () => {
            await testState.dispose();
            
            assert.equal(testState.isDisposed(), true);
            assert.equal(testState.setInterval(() => {}, 1000), null);
            assert.equal(testState.setTimeout(() => {}, 1000), null);
        });

        it('Should dispose hierarchically', async () => {
            const parentState = new IF.State(mockApp, new IF.RouteParams());
            const subManager = await parentState.createSubStateManager();
            
            subManager.add(TestSubStateA);
            await parentState.switchToSubState('TEST_SUB_STATE_A');
            
            const subState = parentState.getCurrentSubState();
            
            // Dispose parent state
            await parentState.dispose();
            
            // Check that sub-state was also disposed
            assert.equal(subState.disposeCalled, true);
            assert.equal(subState.isDisposed(), true);
            assert.equal(parentState.isDisposed(), true);
        });
    });

    describe('Enhanced Exit Logic', () => {
        it('Should call onExit method', async () => {
            const testState = new TestSubStateA(mockApp, new IF.RouteParams());
            
            await testState.exit();
            assert.equal(testState.exitCalled, true);
        });

        it('Should exit sub-states before parent', async () => {
            const parentState = new IF.State(mockApp, new IF.RouteParams());
            const subManager = await parentState.createSubStateManager();
            
            subManager.add(TestSubStateA);
            await parentState.switchToSubState('TEST_SUB_STATE_A');
            
            const subState = parentState.getCurrentSubState();
            
            await parentState.exit();
            
            assert.equal(subState.exitCalled, true);
            assert.equal(subState.disposeCalled, true);
            assert.equal(parentState.currentSubState, null);
        });
    });

    describe('State Hierarchy Navigation', () => {
        it('Should find states in hierarchy', async () => {
            const rootState = new IF.State(mockApp, new IF.RouteParams());
            IF.State.ID = 'ROOT';
            
            const subManager = await rootState.createSubStateManager();
            subManager.add(TestSubStateA);
            await rootState.switchToSubState('TEST_SUB_STATE_A');
            
            const foundState = rootState.findStateInHierarchy('TEST_SUB_STATE_A');
            assert.ok(foundState instanceof TestSubStateA);
            
            const notFound = rootState.findStateInHierarchy('NON_EXISTENT');
            assert.equal(notFound, null);
        });

        it('Should get full state path including sub-states', async () => {
            IF.State.ID = 'ROOT';
            const rootState = new IF.State(mockApp, new IF.RouteParams());
            
            const subManager = await rootState.createSubStateManager();
            subManager.add(TestSubStateA);
            await rootState.switchToSubState('TEST_SUB_STATE_A');
            
            const fullPath = rootState.getFullStatePath();
            assert.deepEqual(fullPath, ['ROOT', 'TEST_SUB_STATE_A']);
        });
    });
});
