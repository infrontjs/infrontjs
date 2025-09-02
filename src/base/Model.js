/**
 * Model - A flexible data model with schema validation, computed properties, and event system
 * 
 * Features:
 * - Schema-based validation with type coercion and defaults
 * - Nested property access using dotted paths (e.g., 'user.profile.name')
 * - Computed properties that update automatically
 * - Event system for change notifications
 * - Deep merging and batch operations
 * - JSON serialization support
 * 
 * @example
 * // Basic usage
 * const user = new Model({ name: 'John', age: 30 });
 * user.name = 'Jane';
 * console.log(user.getValues()); // { name: 'Jane', age: 30 }
 * 
 * @example
 * // With schema validation
 * class UserModel extends Model {
 *   static schema = {
 *     name: { type: 'string', required: true },
 *     age: { type: 'number', default: 18 },
 *     email: { type: 'string', transform: v => v?.toLowerCase() },
 *     status: { type: 'string', enum: ['active', 'inactive'], default: 'active' }
 *   };
 * }
 * 
 * const user = new UserModel({ name: 'John', email: 'JOHN@TEST.COM' });
 * console.log(user.email); // 'john@test.com' (transformed)
 * console.log(user.age);   // 18 (default value)
 * 
 * @example
 * // Nested properties with dotted paths
 * class ProfileModel extends Model {
 *   static schema = {
 *     'user.name': { type: 'string', required: true },
 *     'user.email': { type: 'string', default: 'noemail@test.com' },
 *     'settings.theme': { type: 'string', default: 'light' }
 *   };
 * }
 * 
 * const profile = new ProfileModel({ 'user.name': 'Alice' });
 * console.log(profile.get('user.name'));      // 'Alice'
 * console.log(profile.get('settings.theme')); // 'light'
 * 
 * @example
 * // Computed properties
 * class PersonModel extends Model {
 *   static computed = {
 *     fullName: (model) => `${model.firstName || ''} ${model.lastName || ''}`.trim(),
 *     isAdult: (model) => (model.age || 0) >= 18
 *   };
 * }
 * 
 * const person = new PersonModel({ firstName: 'John', lastName: 'Doe', age: 25 });
 * console.log(person.fullName); // 'John Doe'
 * console.log(person.isAdult);  // true
 * 
 * @example
 * // Event handling
 * const model = new Model({ count: 0 });
 * model.on('change:count', ({ from, to }) => {
 *   console.log(`Count changed from ${from} to ${to}`);
 * });
 * model.count = 5; // Triggers event
 * 
 * @example
 * // Batch operations and merging
 * const model = new Model({ user: { name: 'John', age: 30 } });
 * 
 * // Deep merge - preserves existing nested properties
 * model.mergeValues({ user: { email: 'john@test.com' } });
 * console.log(model.get('user.name')); // 'John' (preserved)
 * console.log(model.get('user.email')); // 'john@test.com' (added)
 * 
 * // Batch replace
 * model.setValues({ user: { name: 'Jane' } }); // Replaces entire user object
 * console.log(model.get('user.age')); // undefined (lost)
 * 
 * @example
 * // Factory method
 * const model = Model.fromJSON({ name: 'John', nested: { value: 42 } });
 * const json = model.toJSON(); // Deep cloned plain object
 */
class Model {
    constructor(props = {}) {
        if (!Model.isPlainObject(props)) {
            throw new Error("Model expects a plain object.");
        }

        this._props = {};
        this._events = Object.create(null);

        // Precompute computed names for conflict checks
        const computed = this.constructor.computed || {};
        this._computedNames = new Set(Object.keys(computed));

        // Apply schema defaults first (top-level & dotted paths)
        const schema = this.constructor.schema || {};
        for (const [k, rule] of Object.entries(schema)) {
            if (!rule || !Object.prototype.hasOwnProperty.call(rule, "default")) continue;
            // Only apply default if not provided in props (supports dotted or top-level)
            const hasProvided = k.includes(".")
                ? Model.#hasPath(props, k)
                : Object.prototype.hasOwnProperty.call(props, k);
            if (!hasProvided) {
                const defVal = (typeof rule.default === "function")
                    ? rule.default()
                    : Model.#deepClone(rule.default);
                if (k.includes(".")) {
                    Model.#setByPath(this._props, k, defVal);
                } else {
                    this._props[k] = defVal;
                }
            }
        }

        // Ingest initial props with validation & coercion
        this.setValues(props, { addNew: true, silent: true, validate: true, coerce: true });

        // Expose initial top-level accessors
        for (let field of Object.keys(this._props)) {
            this.#definePropAccessor(field);
        }

        // Add computed fields
        for (let [field, fn] of Object.entries(computed)) {
            if (Object.prototype.hasOwnProperty.call(this, field) || Object.prototype.hasOwnProperty.call(this._props, field)) {
                throw new Error(`Computed property "${field}" conflicts with a data property.`);
            }
            Object.defineProperty(this, field, {
                get: () => fn(this),
                enumerable: true
            });
        }

        // Enforce required (both top-level & dotted)
        for (const [k, rule] of Object.entries(schema)) {
            if (rule && rule.required) {
                const val = k.includes(".")
                    ? Model.#getByPath(this._props, k, undefined)
                    : this._props[k];
                if (typeof val === "undefined") {
                    throw new Error(`Missing required property "${k}".`);
                }
            }
        }
    }

    // ===== Helpers =====
    static isPlainObject(obj) {
        return (
            typeof obj === "object" &&
            obj !== null &&
            Object.getPrototypeOf(obj) === Object.prototype
        );
    }

    static #deepClone(value) {
        if (typeof structuredClone === "function") return structuredClone(value);
        if (Array.isArray(value)) return value.map(v => Model.#deepClone(v));
        if (Model.isPlainObject(value)) {
            const out = {};
            for (const k in value) out[k] = Model.#deepClone(value[k]);
            return out;
        }
        return value;
    }

    #definePropAccessor(field) {
        if (this._computedNames.has(field)) {
            throw new Error(`Cannot expose "${field}" as data accessor: name is used by computed property.`);
        }
        if (Object.prototype.hasOwnProperty.call(this, field)) return;
        Object.defineProperty(this, field, {
            get: function () {
                return this._props[field];
            },
            set: function (newValue) {
                const processed = this.#applySchemaOnSet(field, newValue, { validate: true, coerce: true });
                const prev = this._props[field];
                if (!Object.is(prev, processed)) {
                    this._props[field] = processed;
                    this.emit(`change:${field}`, { key: field, from: prev, to: processed });
                    this.emit("change", { [field]: { from: prev, to: processed } });
                }
            },
            enumerable: true,
        });
    }

    static #setByPath(target, path, value) {
        const parts = path.split(".");
        let obj = target;
        for (let i = 0; i < parts.length - 1; i++) {
            const k = parts[i];
            if (!Model.isPlainObject(obj[k])) obj[k] = {};
            obj = obj[k];
        }
        const last = parts[parts.length - 1];
        const prev = obj[last];
        obj[last] = value;
        return prev;
    }

    static #getByPath(target, path, defValue) {
        return path.split(".").reduce((prev, curr) => {
            return prev && Object.prototype.hasOwnProperty.call(prev, curr) ? prev[curr] : defValue;
        }, target);
    }

    static #hasPath(target, path) {
        const parts = path.split(".");
        let obj = target;
        for (let i = 0; i < parts.length; i++) {
            const k = parts[i];
            if (!obj || !Object.prototype.hasOwnProperty.call(obj, k)) return false;
            obj = obj[k];
        }
        return true;
    }

    static #deleteByPath(target, path) {
        const parts = path.split(".");
        let obj = target;
        for (let i = 0; i < parts.length - 1; i++) {
            const k = parts[i];
            if (!Model.isPlainObject(obj[k])) return undefined;
            obj = obj[k];
        }
        const last = parts[parts.length - 1];
        const prev = obj[last];
        if (Object.prototype.hasOwnProperty.call(obj, last)) {
            delete obj[last];
            return prev;
        }
        return undefined;
    }

    // ===== Schema / Validation (supports dotted paths) =====
    // schema example:
    // static schema = {
    //   "firstname": { type: "string", required: true, transform: v => v?.trim() },
    //   "address.city": { type: "string", required: true },
    //   "tags": { type: "array", default: () => [] }
    // }
    #applySchemaOnSet(keyOrPath, value, { validate = true, coerce = true } = {}) {
        const schema = this.constructor.schema || {};
        const rule = schema[keyOrPath] ?? (keyOrPath.includes(".") ? undefined : schema[keyOrPath]);
        if (!rule) return value;

        let v = value;

        // type handling / coercion
        if (rule.type && v !== undefined && v !== null) {
            v = this.#coerceType(v, rule.type, coerce);
        }

        // enum
        if (validate && rule.enum && !rule.enum.includes(v)) {
            throw new Error(`Invalid value for "${keyOrPath}". Expected one of [${rule.enum.join(", ")}].`);
        }

        // transform
        if (rule.transform) {
            v = rule.transform(v);
        }

        // custom validate
        if (validate && rule.validate) {
            const ok = rule.validate(v, { key: keyOrPath, model: this });
            if (ok !== true) {
                const msg = typeof ok === "string" ? ok : `Validation failed for "${keyOrPath}".`;
                throw new Error(msg);
            }
        }

        return v;
    }

    #coerceType(value, type, coerce) {
        const t = Array.isArray(type) ? type : [type];
        for (const candidate of t) {
            if (candidate === "string") {
                if (typeof value === "string") return value;
                if (coerce && value != null) return String(value);
            } else if (candidate === "number") {
                if (typeof value === "number" && Number.isFinite(value)) return value;
                if (coerce) {
                    const n = Number(value);
                    if (Number.isFinite(n)) return n;
                }
            } else if (candidate === "boolean") {
                if (typeof value === "boolean") return value;
                if (coerce) {
                    if (value === "true" || value === "1" || value === 1) return true;
                    if (value === "false" || value === "0" || value === 0) return false;
                }
            } else if (candidate === "object") {
                if (Model.isPlainObject(value)) return value;
            } else if (candidate === "array") {
                if (Array.isArray(value)) return value;
                if (coerce && value != null) return [value];
            } else if (candidate === "date") {
                if (value instanceof Date && !isNaN(value.getTime())) return value;
                if (coerce) {
                    const d = new Date(value);
                    if (!isNaN(d.getTime())) return d;
                }
            }
        }
        return value;
    }

    // ===== Events =====
    on(event, handler) {
        if (!this._events[event]) this._events[event] = new Set();
        this._events[event].add(handler);
        return this;
    }
    off(event, handler) {
        if (!event) { this._events = Object.create(null); return this; }
        const set = this._events[event];
        if (!set) return this;
        if (handler) set.delete(handler);
        else delete this._events[event];
        return this;
    }
    once(event, handler) {
        const wrap = (payload) => { this.off(event, wrap); handler(payload); };
        return this.on(event, wrap);
    }
    emit(event, payload) {
        const set = this._events[event];
        if (set) for (const fn of Array.from(set)) { try { fn(payload); } catch(_){} }
        return this;
    }

    // ===== API =====
    get(key, defValue = null) {
        if (key.includes(".")) {
            return Model.#getByPath(this._props, key, defValue);
        } else if (Object.prototype.hasOwnProperty.call(this._props, key)) {
            return this._props[key];
        } else {
            return defValue;
        }
    }

    getValuesExcept(excludedKeys = []) {
        if (Array.isArray(excludedKeys) && excludedKeys.length > 0) {
            const vals = {};
            for (let k in this._props) {
                if (!excludedKeys.includes(k)) {
                    vals[k] = this._props[k];
                }
            }
            return vals;
        }
        return this._props;
    }

    getValues() {
        return this._props;
    }

    toJSON() {
        return Model.#deepClone(this._props);
    }

    /**
     * Batch update values (overwrites object nodes).
     */
    setValues(values = {}, { addNew = true, silent = true, removeMissing = false, validate = true, coerce = true } = {}) {
        if (!Model.isPlainObject(values)) {
            throw new Error("setValues expects a plain object.");
        }

        const changes = {};
        const schema = this.constructor.schema || {};

        // Add/update provided values
        for (const [key, rawNext] of Object.entries(values)) {
            if (!key.includes(".") && this._computedNames.has(key)) {
                throw new Error(`Cannot set "${key}": it is a computed property.`);
            }

            if (!key.includes(".") && addNew && !(key in this)) {
                this.#definePropAccessor(key);
            }

            const next = this.#applySchemaOnSet(key, rawNext, { validate, coerce });
            const prev = key.includes(".")
                ? Model.#setByPath(this._props, key, next)
                : (() => { const p = this._props[key]; this._props[key] = next; return p; })();

            if (!Object.is(prev, next)) {
                changes[key] = { from: prev, to: next };
                if (!silent) {
                    if (key.includes(".")) this.emit(`changePath:${key}`, { path: key, from: prev, to: next });
                    else this.emit(`change:${key}`, { key, from: prev, to: next });
                }
            }
        }

        // Remove missing top-level keys if requested
        if (removeMissing) {
            const keep = new Set(Object.keys(values).filter(k => !k.includes(".")));
            for (const k of Object.keys(this._props)) {
                if (!keep.has(k)) {
                    const rule = schema[k];
                    if (rule && rule.required) continue;
                    const prev = this._props[k];
                    if (typeof prev !== "undefined") {
                        delete this._props[k];
                        changes[k] = { from: prev, to: undefined };
                        if (!silent) this.emit(`remove:${k}`, { key: k, from: prev, to: undefined });
                    }
                }
            }
        }

        if (!silent && Object.keys(changes).length) {
            this.emit("change", changes);
            if (removeMissing) this.emit("remove", changes);
        }

        return changes;
    }

    /**
     * Deep-merge values into model (object nodes are merged, not replaced).
     * Arrays: configurable strategy: 'replace' (default) | 'concat' | 'byIndex'
     */
    mergeValues(values = {}, {
        addNew = true,
        silent = true,
        validate = true,
        coerce = true,
        arrayStrategy = "replace" // 'replace' | 'concat' | 'byIndex'
    } = {}) {
        if (!Model.isPlainObject(values)) {
            throw new Error("mergeValues expects a plain object.");
        }

        const changes = {};
        const walk = (base, patch, pathPrefix = "") => {
            for (const [k, rawNext] of Object.entries(patch)) {
                const path = pathPrefix ? `${pathPrefix}.${k}` : k;

                // Computed guard for top-level keys
                if (!path.includes(".") && this._computedNames.has(path)) {
                    throw new Error(`Cannot set "${path}": it is a computed property.`);
                }

                // Ensure accessor for top-level new keys
                if (!path.includes(".") && addNew && !(k in this)) {
                    this.#definePropAccessor(k);
                }

                const prev = Model.#getByPath(this._props, path, undefined);

                // Recurse for object merges
                if (Model.isPlainObject(rawNext) && Model.isPlainObject(prev)) {
                    // Merge object recursively
                    walk(base, rawNext, path);
                    continue;
                }

                // Array handling
                let next = rawNext;
                if (Array.isArray(rawNext) && Array.isArray(prev)) {
                    if (arrayStrategy === "concat") next = prev.concat(rawNext);
                    else if (arrayStrategy === "byIndex") {
                        next = prev.slice();
                        for (let i = 0; i < rawNext.length; i++) next[i] = rawNext[i];
                    } // else 'replace' -> keep rawNext
                }

                // Apply schema (per-path supported)
                next = this.#applySchemaOnSet(path, next, { validate, coerce });

                // Write and diff
                const old = Model.#setByPath(this._props, path, next);
                if (!Object.is(old, next)) {
                    changes[path] = { from: old, to: next };
                    if (!silent) {
                        if (path.includes(".")) this.emit(`changePath:${path}`, { path, from: old, to: next });
                        else this.emit(`change:${path}`, { key: path, from: old, to: next });
                    }
                }
            }
        };

        walk(this._props, values, "");

        if (!silent && Object.keys(changes).length) {
            this.emit("change", changes);
        }

        return changes;
    }

    // ===== Factory =====
    static fromJSON(json) {
        if (!Model.isPlainObject(json)) {
            throw new Error("fromJSON expects a plain object.");
        }
        // Ensure we don’t retain references to caller's object
        return new this(Model.#deepClone(json));
    }
}

export { Model };
