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

// Test states for various scenarios
class TestState extends IF.State {
    static ID = 'test-state';
    static ROUTE = null;    // Note: set no route on purpose in order to make test work
    
    constructor(app, routeParams, parentState) {
        super(app, routeParams, parentState);
        this.enterCalled = false;
        this.exitCalled = false;
        this.canEnterResult = true;
        this.canExitResult = true;
    }
    
    canEnter() {
        return this.canEnterResult;
    }
    
    onCanExit() {
        return this.canExitResult;
    }
    
    async onEnter() {
        this.enterCalled = true;
    }
    
    async onExit() {
        this.exitCalled = true;
    }
    
    getRedirectUrl() {
        return this.canEnterResult ? null : '/redirect';
    }
}

class TestTwoState extends TestState {
    static ID = 'test-state-two';
}

class TestBlockingState extends IF.State {
    static ID = 'test-blocking-state';
    static ROUTE = null;
    
    constructor(app, routeParams, parentState) {
        super(app, routeParams, parentState);
        this.shouldBlockExit = false;
    }
    
    onCanExit() {
        return !this.shouldBlockExit;
    }
}

class TestSubState extends IF.State {
    static ID = 'test-sub-state';
    static ROUTE = null;
}

describe('Testing core.StateManager', () => {
    let mockApp, stateManager;
    
    beforeEach(() => {
        mockApp = new MockApp();
        stateManager = new IF.StateManager(mockApp);
    });
    
    describe('Basic Structure and Functionality', () => {
        it('Checks for StateManager class and its structure', () => {
            assert.equal("function" === typeof IF.StateManager, true);
            const states = new IF.StateManager(null);
            assert.equal(states instanceof IF.StateManager, true);
            assert.equal("function" === typeof states.add, true);
            assert.equal("function" === typeof states.create, true);
            assert.equal("function" === typeof states.switchTo, true);
        });

        it('Should accept parent state parameter', () => {
            const parentState = new IF.State(mockApp, new IF.RouteParams());
            const subStateManager = new IF.StateManager(mockApp, parentState);
            
            assert.equal(subStateManager.parentState, parentState);
        });

        it('Checks for States.add function', () => {
            assert.equal("object" === typeof stateManager._states, true);
            
            stateManager.add(TestState, TestTwoState);
            assert.equal(stateManager._states.hasOwnProperty(TestState.ID), true);
            assert.equal(stateManager._states.hasOwnProperty(TestTwoState.ID), true);
        });
    });

    describe('State Creation and Parent Context', () => {
        beforeEach(() => {
            stateManager.add(TestState, TestTwoState);
        });

        it('Should create state instance with null parent', () => {
            const routeParams = new IF.RouteParams();
            const stateInstance = stateManager.create('test-state', routeParams);
            
            assert.ok(stateInstance instanceof TestState);
            assert.equal(stateInstance.parentState, null);
            assert.equal(stateInstance.app, mockApp);
            assert.equal(stateInstance.routeParams, routeParams);
        });

        it('Should create state instance with parent state', () => {
            const parentState = new IF.State(mockApp, new IF.RouteParams());
            const subStateManager = new IF.StateManager(mockApp, parentState);
            subStateManager.add(TestSubState);
            
            const routeParams = new IF.RouteParams();
            const stateInstance = subStateManager.create('test-sub-state', routeParams);
            
            assert.ok(stateInstance instanceof TestSubState);
            assert.equal(stateInstance.parentState, parentState);
        });

        it('Should return null for non-existent state', () => {
            const stateInstance = stateManager.create('non-existent-state', new IF.RouteParams());
            assert.equal(stateInstance, null);
        });
    });

    describe('State Transitions and canExit Logic', () => {
        beforeEach(() => {
            stateManager.add(TestState, TestTwoState, TestBlockingState);
        });

        it('Should switch to new state successfully', async () => {
            const routeParams = new IF.RouteParams();
            const stateInstance = stateManager.create('test-state', routeParams);
            
            const result = await stateManager.switchTo(stateInstance);
            
            assert.equal(result, true);
            assert.equal(stateManager.currentState, stateInstance);
            assert.equal(stateInstance.enterCalled, true);
        });

        it('Should prevent state transition when canEnter returns false', async () => {
            const routeParams = new IF.RouteParams();
            const stateInstance = stateManager.create('test-state', routeParams);
            stateInstance.canEnterResult = false;
            
            const result = await stateManager.switchTo(stateInstance);
            
            assert.equal(result, false);
            assert.equal(stateManager.currentState, null);
        });

        it('Should throw error when canEnter returns false without redirect', async () => {
            const routeParams = new IF.RouteParams();
            const stateInstance = stateManager.create('test-state', routeParams);
            stateInstance.canEnterResult = false;
            stateInstance.getRedirectUrl = () => null;
            
            try {
                await stateManager.switchTo(stateInstance);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.ok(error.message.includes('Forbidden to enter new state'));
            }
        });

        it('Should check canExit before switching states', async () => {
            // Set up first state
            const firstState = stateManager.create('test-blocking-state', new IF.RouteParams());
            await stateManager.switchTo(firstState);
            
            // Block exit
            firstState.shouldBlockExit = true;
            
            // Try to switch to second state
            const secondState = stateManager.create('test-state', new IF.RouteParams());
            
            try {
                await stateManager.switchTo(secondState);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.ok(error.message.includes('Cannot exit current state'));
                assert.equal(stateManager.currentState, firstState);
            }
        });

        it('Should exit and dispose current state when switching', async () => {
            // Set up first state
            const firstState = stateManager.create('test-state', new IF.RouteParams());
            await stateManager.switchTo(firstState);
            
            // Switch to second state
            const secondState = stateManager.create('test-state-two', new IF.RouteParams());
            await stateManager.switchTo(secondState);
            
            // Check first state was properly exited and disposed
            assert.equal(firstState.exitCalled, true);
            assert.equal(firstState.isDisposed(), true);
            assert.equal(stateManager.currentState, secondState);
            assert.equal(secondState.enterCalled, true);
        });
    });

    describe('Hierarchical State Management', () => {
        it('Should emit hierarchy-aware events', async () => {
            let eventReceived = false;
            let eventDetail = null;
            
            mockApp.addEventListener('beforeStateChange', (e) => {
                eventReceived = true;
                eventDetail = e.detail;
            });
            
            const parentState = new IF.State(mockApp, new IF.RouteParams());
            const subStateManager = new IF.StateManager(mockApp, parentState);
            subStateManager.add(TestSubState);
            
            const subState = subStateManager.create('test-sub-state', new IF.RouteParams());
            await subStateManager.switchTo(subState);
            
            assert.equal(eventReceived, true);
            assert.equal(eventDetail.isSubState, true);
            assert.equal(eventDetail.parentStateId, parentState.getId());
        });

        it('Should update parent state reference for sub-states', async () => {
            const parentState = new IF.State(mockApp, new IF.RouteParams());
            const subStateManager = new IF.StateManager(mockApp, parentState);
            subStateManager.add(TestSubState);
            
            const subState = subStateManager.create('test-sub-state', new IF.RouteParams());
            await subStateManager.switchTo(subState);
            
            assert.equal(parentState.currentSubState, subState);
            assert.equal(subStateManager.currentState, subState);
        });

        it('Should handle redirect for sub-states', async () => {
            let redirectCalled = false;
            mockApp.router.redirect = () => { redirectCalled = true; };
            
            const parentState = new IF.State(mockApp, new IF.RouteParams());
            const subStateManager = new IF.StateManager(mockApp, parentState);
            subStateManager.add(TestState);
            
            const subState = subStateManager.create('test-state', new IF.RouteParams());
            subState.canEnterResult = false;
            
            const result = await subStateManager.switchTo(subState);
            
            assert.equal(result, false);
            assert.equal(redirectCalled, true);
        });
    });

    describe('State Manager Integration with Sub-States', () => {
        it('Should properly clean up sub-state manager when parent exits', async () => {
            // Create parent state with sub-states
            stateManager.add(TestState);
            const parentState = stateManager.create('test-state', new IF.RouteParams());
            await stateManager.switchTo(parentState);
            
            // Create sub-state manager and add sub-state
            const subManager = await parentState.createSubStateManager();
            subManager.add(TestSubState);
            await parentState.switchToSubState('test-sub-state');
            
            const subState = parentState.getCurrentSubState();
            
            // Switch parent to different state
            stateManager.add(TestTwoState);
            const newParentState = stateManager.create('test-state-two', new IF.RouteParams());
            await stateManager.switchTo(newParentState);
            
            // Check cleanup
            assert.equal(parentState.isDisposed(), true);
            assert.equal(subState.isDisposed(), true);
            assert.equal(stateManager.currentState, newParentState);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('Should handle null state in switchTo', async () => {
            try {
                await stateManager.switchTo(null);
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.ok(error);
            }
        });

        it('Should handle errors in enter/exit methods', async () => {
            class ErrorState extends IF.State {
                static ID = 'error-state';
                static ROUTE = null;
                
                async onEnter() {
                    throw new Error('Enter failed');
                }
            }
            
            stateManager.add(ErrorState);
            const errorState = stateManager.create('error-state', new IF.RouteParams());
            
            try {
                await stateManager.switchTo(errorState);
                assert.fail('Should have propagated the error');
            } catch (error) {
                assert.equal(error.message, 'Enter failed');
            }
        });

        it('Should handle disposal errors gracefully', async () => {
            class DisposalErrorState extends IF.State {
                static ID = 'disposal-error-state';
                static ROUTE = null;
                
                async dispose() {
                    throw new Error('Disposal failed');
                }
            }
            
            stateManager.add(DisposalErrorState, TestState);
            const errorState = stateManager.create('disposal-error-state', new IF.RouteParams());
            await stateManager.switchTo(errorState);
            
            const normalState = stateManager.create('test-state', new IF.RouteParams());
            
            // Should not throw despite disposal error
            await stateManager.switchTo(normalState);
            assert.equal(stateManager.currentState, normalState);
        });
    });

    describe('State Existence and Validation', () => {
        beforeEach(() => {
            stateManager.add(TestState, TestTwoState);
        });

        it('Should check if state exists', () => {
            assert.equal(stateManager.exists('test-state'), true);
            assert.equal(stateManager.exists('test-state-two'), true);
            assert.equal(stateManager.exists('non-existent'), false);
        });

        it('Should validate state classes when adding', () => {
            try {
                stateManager.add('not-a-class');
                assert.fail('Should have thrown an error');
            } catch (error) {
                assert.ok(error.message.includes('expects a class/subclass'));
            }
        });

        it('Should handle duplicate state IDs', () => {
            class DuplicateState extends IF.State {
                static ID = 'test-state'; // Same as TestState
                static ROUTE = null;
            }
            
            // Should not add duplicate and return false
            const result = stateManager.add(DuplicateState);
            assert.equal(result, false);
        });
    });
});

