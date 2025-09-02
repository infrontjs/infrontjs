import assert from 'assert';
import { Model } from '../../src/base/Model.js';

describe("Testing base.Model", () => {

    describe("Basic Model Creation and Properties", () => {
        
        it('should create a model with empty props', () => {
            const model = new Model();
            assert.equal(typeof model, 'object');
            assert.equal(model instanceof Model, true);
            assert.deepEqual(model.getValues(), {});
        });

        it('should create a model with initial props', () => {
            const model = new Model({ name: 'John', age: 30 });
            assert.equal(model.name, 'John');
            assert.equal(model.age, 30);
            assert.deepEqual(model.getValues(), { name: 'John', age: 30 });
        });

        it('should throw error for non-plain object props', () => {
            assert.throws(() => new Model(null), /Model expects a plain object/);
            assert.throws(() => new Model('string'), /Model expects a plain object/);
            assert.throws(() => new Model([]), /Model expects a plain object/);
            assert.throws(() => new Model(new Date()), /Model expects a plain object/);
        });

        it('should create property accessors for initial props', () => {
            const model = new Model({ name: 'Alice', email: 'alice@test.com' });
            assert.equal(model.name, 'Alice');
            assert.equal(model.email, 'alice@test.com');
            
            // Test property setters
            model.name = 'Bob';
            assert.equal(model.name, 'Bob');
            assert.equal(model.getValues().name, 'Bob');
        });
    });

    describe("Schema Support", () => {
        
        class UserModel extends Model {
            static schema = {
                name: { type: 'string', required: true },
                age: { type: 'number', default: 18 },
                email: { type: 'string', transform: v => v?.toLowerCase() },
                status: { type: 'string', enum: ['active', 'inactive'], default: 'active' },
                tags: { type: 'array', default: () => [] }
            };
        }

        it('should apply default values from schema', () => {
            const user = new UserModel({ name: 'John' });
            assert.equal(user.name, 'John');
            assert.equal(user.age, 18);
            assert.equal(user.status, 'active');
            assert.deepEqual(user.tags, []);
        });

        it('should enforce required fields', () => {
            assert.throws(() => new UserModel({}), /Missing required property "name"/);
            assert.throws(() => new UserModel({ age: 25 }), /Missing required property "name"/);
        });

        it('should apply type coercion', () => {
            const user = new UserModel({ name: 'John', age: '25' });
            assert.equal(user.age, 25);
            assert.equal(typeof user.age, 'number');
        });

        it('should apply transforms', () => {
            const user = new UserModel({ name: 'John', email: 'JOHN@TEST.COM' });
            assert.equal(user.email, 'john@test.com');
        });

        it('should validate enum values', () => {
            assert.throws(() => new UserModel({ name: 'John', status: 'invalid' }), 
                /Invalid value for "status". Expected one of/);
            
            const user = new UserModel({ name: 'John', status: 'inactive' });
            assert.equal(user.status, 'inactive');
        });

        it('should support custom validation', () => {
            class ValidatedModel extends Model {
                static schema = {
                    password: { 
                        type: 'string', 
                        validate: (v) => v.length >= 8 || 'Password must be at least 8 characters'
                    }
                };
            }

            assert.throws(() => new ValidatedModel({ password: '123' }), 
                /Password must be at least 8 characters/);
            
            const model = new ValidatedModel({ password: 'password123' });
            assert.equal(model.password, 'password123');
        });
    });

    describe("Nested Properties (Dotted Paths)", () => {
        
        class ProfileModel extends Model {
            static schema = {
                'user.name': { type: 'string', required: true },
                'user.email': { type: 'string', default: 'noemail@test.com' },
                'settings.theme': { type: 'string', default: 'light' }
            };
        }

        it('should support dotted path schema', () => {
            const profile = new ProfileModel({ 'user.name': 'John' });
            assert.equal(profile.get('user.name'), 'John');
            assert.equal(profile.get('user.email'), 'noemail@test.com');
            assert.equal(profile.get('settings.theme'), 'light');
        });

        it('should support nested object initialization', () => {
            const profile = new ProfileModel({ 
                user: { name: 'Alice', email: 'alice@test.com' },
                settings: { theme: 'dark' }
            });
            assert.equal(profile.get('user.name'), 'Alice');
            assert.equal(profile.get('user.email'), 'alice@test.com');
            assert.equal(profile.get('settings.theme'), 'dark');
        });

        it('should get/set nested values', () => {
            const model = new Model({ user: { name: 'John', age: 30 } });
            assert.equal(model.get('user.name'), 'John');
            assert.equal(model.get('user.age'), 30);
            assert.equal(model.get('user.missing', 'default'), 'default');
        });
    });

    describe("Computed Properties", () => {
        
        class PersonModel extends Model {
            static computed = {
                fullName: (model) => `${model.firstName || ''} ${model.lastName || ''}`.trim(),
                isAdult: (model) => (model.age || 0) >= 18
            };
        }

        it('should create computed properties', () => {
            const person = new PersonModel({ firstName: 'John', lastName: 'Doe', age: 25 });
            assert.equal(person.fullName, 'John Doe');
            assert.equal(person.isAdult, true);
        });

        it('should update computed properties when dependencies change', () => {
            const person = new PersonModel({ firstName: 'John', age: 16 });
            assert.equal(person.fullName, 'John');
            assert.equal(person.isAdult, false);
            
            person.lastName = 'Smith';
            person.age = 20;
            assert.equal(person.fullName, 'John Smith');
            assert.equal(person.isAdult, true);
        });

        it('should prevent computed property conflicts during construction', () => {
            class ConflictModel extends Model {
                static computed = {
                    name: () => 'computed'
                };
            }
            
            assert.throws(() => new ConflictModel({ name: 'data' }), 
                /Cannot set "name": it is a computed property/);
        });
    });

    describe("Event System", () => {
        
        it('should emit change events on property updates', () => {
            const model = new Model({ name: 'John' });
            let changeEvent = null;
            let fieldEvent = null;
            
            model.on('change', (payload) => changeEvent = payload);
            model.on('change:name', (payload) => fieldEvent = payload);
            
            model.name = 'Jane';
            
            assert.deepEqual(changeEvent, { name: { from: 'John', to: 'Jane' } });
            assert.deepEqual(fieldEvent, { key: 'name', from: 'John', to: 'Jane' });
        });

        it('should support once() for single-use handlers', () => {
            const model = new Model({ count: 0 });
            let callCount = 0;
            
            model.once('change:count', () => callCount++);
            
            model.count = 1;
            model.count = 2;
            
            assert.equal(callCount, 1);
        });

        it('should support off() to remove handlers', () => {
            const model = new Model({ name: 'John' });
            let eventFired = false;
            const handler = () => eventFired = true;
            
            model.on('change:name', handler);
            model.off('change:name', handler);
            model.name = 'Jane';
            
            assert.equal(eventFired, false);
        });

        it('should clear all events with off() without parameters', () => {
            const model = new Model({ name: 'John' });
            let eventFired = false;
            
            model.on('change:name', () => eventFired = true);
            model.off();
            model.name = 'Jane';
            
            assert.equal(eventFired, false);
        });
    });

    describe("Value Management", () => {
        
        it('should batch update with setValues()', () => {
            const model = new Model({ name: 'John', age: 30 });
            let changeCount = 0;
            model.on('change', () => changeCount++);
            
            const changes = model.setValues({ name: 'Jane', age: 31, city: 'NYC' }, { silent: false });
            
            assert.equal(model.name, 'Jane');
            assert.equal(model.age, 31);
            assert.equal(model.city, 'NYC');
            assert.equal(changeCount, 1);
            assert.deepEqual(Object.keys(changes), ['name', 'age', 'city']);
        });

        it('should merge values with mergeValues()', () => {
            const model = new Model({ 
                user: { name: 'John', age: 30 }, 
                settings: { theme: 'light' } 
            });
            
            model.mergeValues({ 
                user: { email: 'john@test.com' },
                settings: { notifications: true }
            });
            
            assert.equal(model.get('user.name'), 'John');
            assert.equal(model.get('user.age'), 30);
            assert.equal(model.get('user.email'), 'john@test.com');
            assert.equal(model.get('settings.theme'), 'light');
            assert.equal(model.get('settings.notifications'), true);
        });

        it('should handle array merge strategies', () => {
            const model = new Model({ tags: ['tag1', 'tag2'] });
            
            // Replace strategy (default)
            model.mergeValues({ tags: ['tag3'] });
            assert.deepEqual(model.tags, ['tag3']);
            
            // Concat strategy
            model.setValues({ tags: ['tag1', 'tag2'] });
            model.mergeValues({ tags: ['tag3'] }, { arrayStrategy: 'concat' });
            assert.deepEqual(model.tags, ['tag1', 'tag2', 'tag3']);
            
            // By index strategy
            model.setValues({ tags: ['a', 'b', 'c'] });
            model.mergeValues({ tags: ['x', 'y'] }, { arrayStrategy: 'byIndex' });
            assert.deepEqual(model.tags, ['x', 'y', 'c']);
        });

        it('should remove missing properties with removeMissing option', () => {
            const model = new Model({ name: 'John', age: 30, city: 'NYC' });
            
            model.setValues({ name: 'Jane' }, { removeMissing: true });
            
            assert.equal(model.name, 'Jane');
            assert.equal(model.age, undefined);
            assert.equal(model.city, undefined);
        });

        it('should get values with exclusions', () => {
            const model = new Model({ name: 'John', age: 30, password: 'secret' });
            const values = model.getValuesExcept(['password']);
            
            assert.deepEqual(values, { name: 'John', age: 30 });
        });

        it('should serialize to JSON', () => {
            const model = new Model({ name: 'John', nested: { value: 42 } });
            const json = model.toJSON();
            
            assert.deepEqual(json, { name: 'John', nested: { value: 42 } });
            
            // Should be deep cloned
            json.nested.value = 100;
            assert.equal(model.get('nested.value'), 42);
        });
    });

    describe("Factory Methods", () => {
        
        it('should create instance from JSON', () => {
            const json = { name: 'John', age: 30, nested: { value: 42 } };
            const model = Model.fromJSON(json);
            
            assert.equal(model.name, 'John');
            assert.equal(model.age, 30);
            assert.equal(model.get('nested.value'), 42);
            
            // Should be deep cloned
            json.name = 'Changed';
            assert.equal(model.name, 'John');
        });

        it('should throw error for invalid JSON input', () => {
            assert.throws(() => Model.fromJSON(null), /fromJSON expects a plain object/);
            assert.throws(() => Model.fromJSON('string'), /fromJSON expects a plain object/);
            assert.throws(() => Model.fromJSON([]), /fromJSON expects a plain object/);
        });
    });

    describe("Type Coercion", () => {
        
        class TypeModel extends Model {
            static schema = {
                stringVal: { type: 'string' },
                numberVal: { type: 'number' },
                booleanVal: { type: 'boolean' },
                arrayVal: { type: 'array' },
                objectVal: { type: 'object' },
                dateVal: { type: 'date' }
            };
        }

        it('should coerce string types', () => {
            const model = new TypeModel({ stringVal: 123 });
            assert.equal(model.stringVal, '123');
            assert.equal(typeof model.stringVal, 'string');
        });

        it('should coerce number types', () => {
            const model = new TypeModel({ numberVal: '42.5' });
            assert.equal(model.numberVal, 42.5);
            assert.equal(typeof model.numberVal, 'number');
        });

        it('should coerce boolean types', () => {
            let model = new TypeModel({ booleanVal: 'true' });
            assert.equal(model.booleanVal, true);
            
            model = new TypeModel({ booleanVal: '0' });
            assert.equal(model.booleanVal, false);
            
            model = new TypeModel({ booleanVal: 1 });
            assert.equal(model.booleanVal, true);
        });

        it('should coerce array types', () => {
            const model = new TypeModel({ arrayVal: 'single' });
            assert.deepEqual(model.arrayVal, ['single']);
            assert.equal(Array.isArray(model.arrayVal), true);
        });

        it('should coerce date types', () => {
            const model = new TypeModel({ dateVal: '2023-01-01' });
            assert.equal(model.dateVal instanceof Date, true);
            assert.equal(model.dateVal.getFullYear(), 2023);
        });

        it('should support multiple type options', () => {
            class FlexibleModel extends Model {
                static schema = {
                    flexValue: { type: ['string', 'number'] }
                };
            }
            
            let model = new FlexibleModel({ flexValue: 'text' });
            assert.equal(model.flexValue, 'text');
            
            model = new FlexibleModel({ flexValue: 42 });
            assert.equal(model.flexValue, 42);
        });
    });

    describe("Error Handling", () => {
        
        it('should prevent setting computed properties', () => {
            class ComputedModel extends Model {
                static computed = {
                    fullName: (model) => `${model.first} ${model.last}`
                };
            }
            
            const model = new ComputedModel({ first: 'John', last: 'Doe' });
            
            assert.throws(() => model.setValues({ fullName: 'Changed' }), 
                /Cannot set "fullName": it is a computed property/);
        });

        it('should validate setValues input', () => {
            const model = new Model();
            
            assert.throws(() => model.setValues(null), /setValues expects a plain object/);
            assert.throws(() => model.setValues('string'), /setValues expects a plain object/);
        });

        it('should validate mergeValues input', () => {
            const model = new Model();
            
            assert.throws(() => model.mergeValues(null), /mergeValues expects a plain object/);
            assert.throws(() => model.mergeValues([]), /mergeValues expects a plain object/);
        });
    });

    describe("Static Helper Methods", () => {
        
        it('should identify plain objects correctly', () => {
            assert.equal(Model.isPlainObject({}), true);
            assert.equal(Model.isPlainObject({ a: 1 }), true);
            assert.equal(Model.isPlainObject(null), false);
            assert.equal(Model.isPlainObject([]), false);
            assert.equal(Model.isPlainObject(new Date()), false);
            assert.equal(Model.isPlainObject('string'), false);
        });
    });

    describe("Complex Usage Scenarios", () => {
        
        it('should handle complex user profile scenario', () => {
            class UserProfile extends Model {
                static schema = {
                    name: { type: 'string', required: true },
                    email: { type: 'string', required: true, transform: v => v?.toLowerCase() },
                    'profile.bio': { type: 'string', default: '' },
                    'profile.avatar': { type: 'string', default: '/default-avatar.png' },
                    'settings.notifications': { type: 'boolean', default: true },
                    'settings.theme': { type: 'string', enum: ['light', 'dark'], default: 'light' },
                    tags: { type: 'array', default: () => [] },
                    createdAt: { type: 'date', default: () => new Date() }
                };

                static computed = {
                    initials: (model) => {
                        const name = model.name || '';
                        return name.split(' ').map(n => n[0]).join('').toUpperCase();
                    },
                    hasProfile: (model) => !!model.get('profile.bio')
                };
            }

            const user = new UserProfile({
                name: 'John Doe',
                email: 'JOHN@TEST.COM',
                tags: ['developer', 'javascript']
            });

            // Test computed properties
            assert.equal(user.initials, 'JD');
            assert.equal(user.hasProfile, false); // No bio provided initially

            // Test schema transformations
            assert.equal(user.email, 'john@test.com');

            // Test nested properties with defaults (when paths not provided)
            assert.equal(user.get('profile.bio'), '');
            assert.equal(user.get('profile.avatar'), '/default-avatar.png');
            assert.equal(user.get('settings.notifications'), true);
            assert.equal(user.get('settings.theme'), 'light');

            // Test events and bio update
            let profileChanged = false;
            user.on('changePath:profile.bio', () => profileChanged = true);
            
            user.mergeValues({ profile: { bio: 'Software developer' } }, { silent: false });
            assert.equal(profileChanged, true);
            assert.equal(user.get('profile.bio'), 'Software developer');
            assert.equal(user.hasProfile, true); // Now should be true

            // Test array handling
            user.mergeValues({ tags: ['senior'] }, { arrayStrategy: 'concat' });
            assert.deepEqual(user.tags, ['developer', 'javascript', 'senior']);
        });
    });
});