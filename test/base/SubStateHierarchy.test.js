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

// Complex test states for hierarchy testing
class DashboardState extends IF.State {
    static ID = 'DASHBOARD';
    static ROUTE = '/dashboard';
    
    constructor(app, routeParams, parentState) {
        super(app, routeParams, parentState);
        this.setupCalled = false;
    }
    
    async onEnter() {
        this.setupCalled = true;
        
        // Create sub-state manager for dashboard tabs
        const subManager = await this.createSubStateManager();
        subManager.add(OverviewTabState, AnalyticsTabState, SettingsTabState);
        
        // Switch to default tab
        await this.switchToSubState('OVERVIEW_TAB', { defaultData: 'dashboard' });
    }
}

class OverviewTabState extends IF.State {
    static ID = 'OVERVIEW_TAB';
    
    constructor(app, routeParams, parentState) {
        super(app, routeParams, parentState);
        this.renderCalled = false;
    }
    
    async onEnter() {
        this.renderCalled = true;
    }
}

class AnalyticsTabState extends IF.State {
    static ID = 'ANALYTICS_TAB';
    
    constructor(app, routeParams, parentState) {
        super(app, routeParams, parentState);
        this.hasNestedStates = false;
    }
    
    async onEnter() {
        // Create nested sub-states for analytics views
        const subManager = await this.createSubStateManager();
        subManager.add(RealtimeAnalyticsState, HistoricalAnalyticsState);
        
        await this.switchToSubState('REALTIME_ANALYTICS', { 
            analyticsType: 'realtime' 
        });
        
        this.hasNestedStates = true;
    }
}

class SettingsTabState extends IF.State {
    static ID = 'SETTINGS_TAB';
    
    constructor(app, routeParams, parentState) {
        super(app, routeParams, parentState);
        this.canExitOverride = true;
    }
    
    onCanExit() {
        return this.canExitOverride;
    }
}

class RealtimeAnalyticsState extends IF.State {
    static ID = 'REALTIME_ANALYTICS';
    
    constructor(app, routeParams, parentState) {
        super(app, routeParams, parentState);
        this.dataReceived = false;
    }
    
    async onEnter() {
        const data = this.getStateData();
        this.dataReceived = data && data.analyticsType === 'realtime';
    }
}

class HistoricalAnalyticsState extends IF.State {
    static ID = 'HISTORICAL_ANALYTICS';
}

// Wizard states for complex flow testing
class CheckoutWizardState extends IF.State {
    static ID = 'CHECKOUT_WIZARD';
    
    constructor(app, routeParams, parentState) {
        super(app, routeParams, parentState);
        this.wizardData = {};
        this.currentStepIndex = 0;
        this.steps = ['SHIPPING_STEP', 'PAYMENT_STEP', 'REVIEW_STEP'];
    }
    
    async onEnter() {
        const subManager = await this.createSubStateManager();
        subManager.add(ShippingStepState, PaymentStepState, ReviewStepState);
        
        await this.switchToSubState(this.steps[0], { 
            wizardData: this.wizardData,
            stepIndex: 0
        });
    }
    
    async nextStep(stepData) {
        Object.assign(this.wizardData, stepData);
        const nextIndex = this.currentStepIndex + 1;
        
        if (nextIndex < this.steps.length) {
            await this.switchToSubState(this.steps[nextIndex], {
                wizardData: this.wizardData,
                stepIndex: nextIndex
            });
            // Only increment if state switch was successful
            this.currentStepIndex = nextIndex;
            return true;
        }
        return false;
    }
    
    async previousStep() {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            await this.switchToSubState(this.steps[this.currentStepIndex], {
                wizardData: this.wizardData,
                stepIndex: this.currentStepIndex
            });
        }
        return this.currentStepIndex > 0;
    }
}

class ShippingStepState extends IF.State {
    static ID = 'SHIPPING_STEP';
    
    constructor(app, routeParams, parentState) {
        super(app, routeParams, parentState);
        this.formValid = false;
    }
    
    onCanExit() {
        return this.formValid;
    }
    
    validateForm() {
        this.formValid = true;
    }
}

class PaymentStepState extends IF.State {
    static ID = 'PAYMENT_STEP';
    
    constructor(app, routeParams, parentState) {
        super(app, routeParams, parentState);
        this.paymentProcessed = false;
    }
    
    async processPayment() {
        // Simulate payment processing
        this.paymentProcessed = true;
    }
}

class ReviewStepState extends IF.State {
    static ID = 'REVIEW_STEP';
    
    async onEnter() {
        const data = this.getStateData();
        assert.ok(data.wizardData, 'Should have wizard data');
        assert.ok(typeof data.stepIndex === 'number', 'Should have step index');
    }
}

describe('Testing Sub-State Composition and Hierarchy', () => {
    let mockApp, stateManager;
    
    beforeEach(() => {
        mockApp = new MockApp();
        stateManager = new IF.StateManager(mockApp);
    });

    describe('Multi-Level State Hierarchy', () => {
        it('Should create and navigate complex hierarchy (Dashboard -> Tab -> Analytics)', async () => {
            // Set up dashboard state
            stateManager.add(DashboardState);
            const dashboard = stateManager.create('DASHBOARD', new IF.RouteParams());
            
            await stateManager.switchTo(dashboard);
            
            // Verify dashboard setup
            assert.equal(dashboard.setupCalled, true);
            assert.equal(dashboard.hasSubStates(), true);
            assert.equal(dashboard.hasActiveSubState(), true);
            
            // Check that overview tab is active
            const overviewTab = dashboard.getCurrentSubState();
            assert.ok(overviewTab instanceof OverviewTabState);
            assert.equal(overviewTab.renderCalled, true);
            assert.deepEqual(overviewTab.getStateData(), { defaultData: 'dashboard' });
            
            // Switch to analytics tab (which has nested states)
            await dashboard.switchToSubState('ANALYTICS_TAB');
            
            const analyticsTab = dashboard.getCurrentSubState();
            assert.ok(analyticsTab instanceof AnalyticsTabState);
            assert.equal(analyticsTab.hasNestedStates, true);
            
            // Check nested analytics state
            const realtimeAnalytics = analyticsTab.getCurrentSubState();
            assert.ok(realtimeAnalytics instanceof RealtimeAnalyticsState);
            assert.equal(realtimeAnalytics.dataReceived, true);
            
            // Verify full hierarchy path
            const fullPath = realtimeAnalytics.getFullStatePath();
            assert.deepEqual(fullPath, ['DASHBOARD', 'ANALYTICS_TAB', 'REALTIME_ANALYTICS']);
        });

        it('Should properly handle state path navigation', async () => {
            stateManager.add(DashboardState);
            const dashboard = stateManager.create('DASHBOARD', new IF.RouteParams());
            await stateManager.switchTo(dashboard);
            
            // Navigate to analytics tab
            await dashboard.switchToSubState('ANALYTICS_TAB');
            const analyticsTab = dashboard.getCurrentSubState();
            
            // Switch to historical analytics
            await analyticsTab.switchToSubState('HISTORICAL_ANALYTICS', { 
                timeRange: '30days' 
            });
            
            const historicalAnalytics = analyticsTab.getCurrentSubState();
            
            // Test hierarchy navigation
            assert.equal(historicalAnalytics.getRootState(), dashboard);
            assert.equal(historicalAnalytics.parentState, analyticsTab);
            assert.equal(analyticsTab.parentState, dashboard);
            assert.equal(dashboard.parentState, null);
            
            // Test state finding
            const foundState = dashboard.findStateInHierarchy('HISTORICAL_ANALYTICS');
            assert.equal(foundState, historicalAnalytics);
            
            const notFound = dashboard.findStateInHierarchy('NON_EXISTENT');
            assert.equal(notFound, null);
        });
    });

    describe('Complex State Flows (Wizard Pattern)', () => {
        it('Should handle wizard flow with step navigation', async () => {
            stateManager.add(CheckoutWizardState);
            const wizard = stateManager.create('CHECKOUT_WIZARD', new IF.RouteParams());
            
            await stateManager.switchTo(wizard);
            
            // Should start at shipping step
            let currentStep = wizard.getCurrentSubState();
            assert.ok(currentStep instanceof ShippingStepState);
            assert.equal(currentStep.formValid, false);
            
            // Try to proceed without validation (should fail)
            try {
                await wizard.nextStep({ shippingInfo: 'test' });
                assert.fail('Should not proceed with invalid form');
            } catch (error) {
                assert.ok(error.message.includes('Cannot exit current state'));
            }
            
            // Validate form and proceed
            currentStep.validateForm();
            const hasNext = await wizard.nextStep({ shippingInfo: 'validated' });
            assert.equal(hasNext, true);
            
            // Should now be at payment step
            currentStep = wizard.getCurrentSubState();
            assert.ok(currentStep instanceof PaymentStepState);
            
            // Process payment and continue
            await currentStep.processPayment();
            const stillHasNext = await wizard.nextStep({ paymentToken: 'abc123' });
            assert.equal(stillHasNext, true);
            
            // Should now be at review step
            currentStep = wizard.getCurrentSubState();
            assert.ok(currentStep instanceof ReviewStepState);
            
            // Try to go to next step (should return false as we're at the end)
            const shouldBeFalse = await wizard.nextStep({ confirmed: true });
            assert.equal(shouldBeFalse, false);
            
            // Test going back
            const canGoBack = await wizard.previousStep();
            assert.equal(canGoBack, true);
            
            currentStep = wizard.getCurrentSubState();
            assert.ok(currentStep instanceof PaymentStepState);
        });
    });

    describe('Hierarchical Cleanup and Memory Management', () => {
        it('Should cleanup entire hierarchy when parent state changes', async () => {
            stateManager.add(DashboardState);
            const dashboard = stateManager.create('DASHBOARD', new IF.RouteParams());
            await stateManager.switchTo(dashboard);
            
            // Navigate to nested analytics
            await dashboard.switchToSubState('ANALYTICS_TAB');
            const analyticsTab = dashboard.getCurrentSubState();
            await analyticsTab.switchToSubState('REALTIME_ANALYTICS');
            const realtimeAnalytics = analyticsTab.getCurrentSubState();
            
            // Create another top-level state
            class ProfileState extends IF.State {
                static ID = 'PROFILE';
            }
            stateManager.add(ProfileState);
            const profile = stateManager.create('PROFILE', new IF.RouteParams());
            
            // Switch to profile (should cleanup entire dashboard hierarchy)
            await stateManager.switchTo(profile);
            
            // Verify cleanup
            assert.equal(dashboard.isDisposed(), true);
            assert.equal(analyticsTab.isDisposed(), true);
            assert.equal(realtimeAnalytics.isDisposed(), true);
            assert.equal(stateManager.currentState, profile);
        });

        it('Should cleanup sub-states when switching between tabs', async () => {
            stateManager.add(DashboardState);
            const dashboard = stateManager.create('DASHBOARD', new IF.RouteParams());
            await stateManager.switchTo(dashboard);
            
            // Go to analytics tab with nested state
            await dashboard.switchToSubState('ANALYTICS_TAB');
            const analyticsTab = dashboard.getCurrentSubState();
            const realtimeAnalytics = analyticsTab.getCurrentSubState();
            
            // Switch to settings tab
            await dashboard.switchToSubState('SETTINGS_TAB');
            const settingsTab = dashboard.getCurrentSubState();
            
            // Analytics tab and its nested state should be disposed
            assert.equal(analyticsTab.isDisposed(), true);
            assert.equal(realtimeAnalytics.isDisposed(), true);
            assert.ok(settingsTab instanceof SettingsTabState);
            assert.equal(dashboard.getCurrentSubState(), settingsTab);
        });
    });

    describe('Hierarchical canExit Logic', () => {
        it('Should prevent parent state exit when child state blocks exit', async () => {
            stateManager.add(DashboardState);
            const dashboard = stateManager.create('DASHBOARD', new IF.RouteParams());
            await stateManager.switchTo(dashboard);
            
            // Switch to settings tab
            await dashboard.switchToSubState('SETTINGS_TAB');
            const settingsTab = dashboard.getCurrentSubState();
            
            // Block settings tab exit
            settingsTab.canExitOverride = false;
            
            // Parent should not be able to exit
            assert.equal(dashboard.canExit(), false);
            
            // Allow settings tab exit
            settingsTab.canExitOverride = true;
            assert.equal(dashboard.canExit(), true);
        });

        it('Should prevent state manager from switching when nested state blocks exit', async () => {
            stateManager.add(DashboardState);
            const dashboard = stateManager.create('DASHBOARD', new IF.RouteParams());
            await stateManager.switchTo(dashboard);
            
            await dashboard.switchToSubState('SETTINGS_TAB');
            const settingsTab = dashboard.getCurrentSubState();
            settingsTab.canExitOverride = false;
            
            // Try to switch to different top-level state
            class ProfileState extends IF.State {
                static ID = 'PROFILE';
            }
            stateManager.add(ProfileState);
            const profile = stateManager.create('PROFILE', new IF.RouteParams());
            
            try {
                await stateManager.switchTo(profile);
                assert.fail('Should not allow state switch');
            } catch (error) {
                assert.ok(error.message.includes('Cannot exit current state'));
                assert.equal(stateManager.currentState, dashboard);
            }
        });
    });

    describe('Event Handling in Hierarchies', () => {
        it('Should emit hierarchy-aware events for nested state changes', async () => {
            const events = [];
            
            mockApp.addEventListener('beforeStateChange', (e) => {
                events.push({
                    type: 'before',
                    ...e.detail
                });
            });
            
            mockApp.addEventListener('afterStateChange', (e) => {
                events.push({
                    type: 'after',
                    ...e.detail
                });
            });
            
            stateManager.add(DashboardState);
            const dashboard = stateManager.create('DASHBOARD', new IF.RouteParams());
            await stateManager.switchTo(dashboard);
            
            // Navigate to analytics tab (this creates sub-events)
            await dashboard.switchToSubState('ANALYTICS_TAB');
            
            // Should have main state change events and sub-state events
            const subStateEvents = events.filter(e => e.isSubState);
            assert.ok(subStateEvents.length > 0, 'Should have sub-state events');
            
            const lastSubEvent = subStateEvents[subStateEvents.length - 1];
            assert.equal(lastSubEvent.isSubState, true);
            assert.equal(lastSubEvent.parentStateId, 'DASHBOARD');
        });
    });

    describe('Complex Integration Scenarios', () => {
        it('Should handle switching between different hierarchical structures', async () => {
            // Set up dashboard
            stateManager.add(DashboardState);
            const dashboard = stateManager.create('DASHBOARD', new IF.RouteParams());
            await stateManager.switchTo(dashboard);
            
            await dashboard.switchToSubState('ANALYTICS_TAB');
            const analyticsTab = dashboard.getCurrentSubState();
            await analyticsTab.switchToSubState('HISTORICAL_ANALYTICS');
            
            // Switch to wizard (different hierarchy)
            stateManager.add(CheckoutWizardState);
            const wizard = stateManager.create('CHECKOUT_WIZARD', new IF.RouteParams());
            await stateManager.switchTo(wizard);
            
            // Verify complete cleanup of dashboard hierarchy
            assert.equal(dashboard.isDisposed(), true);
            assert.equal(analyticsTab.isDisposed(), true);
            
            // Verify wizard is properly set up
            assert.equal(wizard.hasActiveSubState(), true);
            const shippingStep = wizard.getCurrentSubState();
            assert.ok(shippingStep instanceof ShippingStepState);
        });

        it('Should maintain data consistency across hierarchy levels', async () => {
            stateManager.add(CheckoutWizardState);
            const wizard = stateManager.create('CHECKOUT_WIZARD', new IF.RouteParams());
            await stateManager.switchTo(wizard);
            
            // Progress through wizard, accumulating data
            const shippingStep = wizard.getCurrentSubState();
            shippingStep.validateForm();
            
            await wizard.nextStep({ 
                address: '123 Main St',
                city: 'Springfield'
            });
            
            const paymentStep = wizard.getCurrentSubState();
            await paymentStep.processPayment();
            
            await wizard.nextStep({
                cardNumber: '****-****-****-1234',
                paymentId: 'pay_123'
            });
            
            // Check that data accumulated properly
            assert.ok(wizard.wizardData.address);
            assert.ok(wizard.wizardData.city);
            assert.ok(wizard.wizardData.cardNumber);
            assert.ok(wizard.wizardData.paymentId);
            
            const reviewStep = wizard.getCurrentSubState();
            const stepData = reviewStep.getStateData();
            assert.deepEqual(stepData.wizardData, wizard.wizardData);
        });
    });
});