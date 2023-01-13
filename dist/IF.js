(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.IF = {}));
})(this, (function (exports) { 'use strict';

	class State
	{
	    static ID = null;

	    /**
	     * Route(s) which trigger this state
	     * @type {string|array}
	     */
	    static ROUTE = null;

	    constructor( app, routeParams )
	    {
	        this.app = app;
	        this.routeParams = routeParams;
	    }

	    getId()
	    {
	        return this.constructor.ID;
	    }

	    canEnter()
	    {
	        return true;
	    }

	    canExit()
	    {
	        return true;
	    }

	    getRedirectTo()
	    {
	        return null;
	    }

	    async enter()
	    {
	    }

	    async exit()
	    {
	    }
	}

	class RouteParams
	{
	    constructor( params = {}, query = {} )
	    {
	        this._p = params;
	        this._q = query;
	    }

	    getParams()
	    {
	        return this._p;
	    }

	    getParam( key, defaultValue = null )
	    {
	        if ( this._p && this._p.hasOwnProperty( key ) )
	        {
	            return this._p[ key ];
	        }
	        else
	        {
	            return defaultValue;
	        }
	    }

	    getQuery( key, defaultValue = null )
	    {
	        if ( this._q && this._q.hasOwnProperty( key ) )
	        {
	            return this._q[ key ];
	        }
	        else
	        {
	            return defaultValue;
	        }
	    }

	    getQueries()
	    {
	        return this._q;
	    }
	}

	/**
	 * Collection of interal stuff and dependencies packed together with Infront.JS
	 */


	///////////////////////////////////////////////////////////////////////////////////////////////////////
	// start: ObservableSlim

	/*
	 * 	Observable Slim
	 *	Version 0.1.6
	 * 	https://github.com/elliotnb/observable-slim
	 *
	 * 	Licensed under the MIT license:
	 * 	http://www.opensource.org/licenses/MIT
	 *
	 *	Observable Slim is a singleton that allows you to observe changes made to an object and any nested
	 *	children of that object. It is intended to assist with one-way data binding, that is, in MVC parlance,
	 *	reflecting changes in the model to the view. Observable Slim aspires to be as lightweight and easily
	 *	understood as possible. Minifies down to roughly 3000 characters.
	 */
	const ObservableSlim = (function() {
	    // An array that stores all of the observables created through the public create() method below.
	    var observables = [];
	    // An array of all the objects that we have assigned Proxies to
	    var targets = [];

	    // An array of arrays containing the Proxies created for each target object. targetsProxy is index-matched with
	    // 'targets' -- together, the pair offer a Hash table where the key is not a string nor number, but the actual target object
	    var targetsProxy = [];

	    // this variable tracks duplicate proxies assigned to the same target.
	    // the 'set' handler below will trigger the same change on all other Proxies tracking the same target.
	    // however, in order to avoid an infinite loop of Proxies triggering and re-triggering one another, we use dupProxy
	    // to track that a given Proxy was modified from the 'set' handler
	    var dupProxy = null;

	    var _getProperty = function(obj, path) {
	        return path.split('.').reduce(function(prev, curr) {
	            return prev ? prev[curr] : undefined
	        }, obj || self)
	    };

	    /**
	     * Create a new ES6 `Proxy` whose changes we can observe through the `observe()` method.
	     * @param {object} target Plain object that we want to observe for changes.
	     * @param {boolean|number} domDelay If `true`, then the observed changes to `target` will be batched up on a 10ms delay (via `setTimeout()`).
	     * If `false`, then the `observer` function will be immediately invoked after each individual change made to `target`. It is helpful to set
	     * `domDelay` to `true` when your `observer` function makes DOM manipulations (fewer DOM redraws means better performance). If a number greater
	     * than zero, then it defines the DOM delay in milliseconds.
	     * @param {function(ObservableSlimChange[])} [observer] Function that will be invoked when a change is made to the proxy of `target`.
	     * When invoked, this function is passed a single argument: an array of `ObservableSlimChange` detailing each change that has been made.
	     * @param {object} originalObservable The original observable created by the user, exists for recursion purposes, allows one observable to observe
	     * change on any nested/child objects.
	     * @param {{target: object, property: string}[]} originalPath Array of objects, each object having the properties `target` and `property`:
	     * `target` is referring to the observed object itself and `property` referring to the name of that object in the nested structure.
	     * The path of the property in relation to the target on the original observable, exists for recursion purposes, allows one observable to observe
	     * change on any nested/child objects.
	     * @returns {ProxyConstructor} Proxy of the target object.
	     */
	    var _create = function(target, domDelay, originalObservable, originalPath) {

	        var observable = originalObservable || null;

	        // record the nested path taken to access this object -- if there was no path then we provide the first empty entry
	        var path = originalPath || [{"target":target,"property":""}];

	        // in order to accurately report the "previous value" of the "length" property on an Array
	        // we must use a helper property because intercepting a length change is not always possible as of 8/13/2018 in
	        // Chrome -- the new `length` value is already set by the time the `set` handler is invoked
	        if (target instanceof Array) {
	            if (!target.hasOwnProperty("__length"))
	                Object.defineProperty(target, "__length", { enumerable: false, value: target.length, writable: true });
	            else
	                target.__length = target.length;
	        }

	        var changes = [];

	        /**
	         * Returns a string of the nested path (in relation to the top-level observed object) of the property being modified or deleted.
	         * @param {object} target Plain object that we want to observe for changes.
	         * @param {string} property Property name.
	         * @param {boolean} [jsonPointer] Set to `true` if the string path should be formatted as a JSON pointer rather than with the dot notation
	         * (`false` as default).
	         * @returns {string} Nested path (e.g., `hello.testing.1.bar` or, if JSON pointer, `/hello/testing/1/bar`).
	         */
	        var _getPath = function(target, property, jsonPointer) {

	            var fullPath = "";
	            var lastTarget = null;

	            // loop over each item in the path and append it to full path
	            for (var i = 0; i < path.length; i++) {

	                // if the current object was a member of an array, it's possible that the array was at one point
	                // mutated and would cause the position of the current object in that array to change. we perform an indexOf
	                // lookup here to determine the current position of that object in the array before we add it to fullPath
	                if (lastTarget instanceof Array && !isNaN(path[i].property)) {
	                    path[i].property = lastTarget.indexOf(path[i].target);
	                }

	                fullPath = fullPath + "." + path[i].property;
	                lastTarget = path[i].target;
	            }

	            // add the current property
	            fullPath = fullPath + "." + property;

	            // remove the beginning two dots -- ..foo.bar becomes foo.bar (the first item in the nested chain doesn't have a property name)
	            fullPath = fullPath.substring(2);

	            if (jsonPointer === true) fullPath = "/" + fullPath.replace(/\./g, "/");

	            return fullPath;
	        };

	        var _notifyObservers = function(numChanges) {

	            // if the observable is paused, then we don't want to execute any of the observer functions
	            if (observable.paused === true) return;

	            var domDelayIsNumber = typeof domDelay === 'number';

	            // execute observer functions on a 10ms setTimeout, this prevents the observer functions from being executed
	            // separately on every change -- this is necessary because the observer functions will often trigger UI updates
	            if (domDelayIsNumber || domDelay === true) {
	                setTimeout(function() {
	                    if (numChanges === changes.length) {

	                        // we create a copy of changes before passing it to the observer functions because even if the observer function
	                        // throws an error, we still need to ensure that changes is reset to an empty array so that old changes don't persist
	                        var changesCopy = changes.slice(0);
	                        changes = [];

	                        // invoke any functions that are observing changes
	                        for (var i = 0; i < observable.observers.length; i++) observable.observers[i](changesCopy);

	                    }
	                }, (domDelayIsNumber && domDelay > 0) ? domDelay : 10);
	            } else {

	                // we create a copy of changes before passing it to the observer functions because even if the observer function
	                // throws an error, we still need to ensure that changes is reset to an empty array so that old changes don't persist
	                var changesCopy = changes.slice(0);
	                changes = [];

	                // invoke any functions that are observing changes
	                for (var i = 0; i < observable.observers.length; i++) observable.observers[i](changesCopy);

	            }
	        };

	        var handler = {
	            get: function(target, property) {

	                // implement a simple check for whether or not the object is a proxy, this helps the .create() method avoid
	                // creating Proxies of Proxies.
	                if (property === "__getTarget") {
	                    return target;
	                } else if (property === "__isProxy") {
	                    return true;
	                    // from the perspective of a given observable on a parent object, return the parent object of the given nested object
	                } else if (property === "__getParent") {
	                    return function(i) {
	                        if (typeof i === "undefined") var i = 1;
	                        var parentPath = _getPath(target, "__getParent").split(".");
	                        parentPath.splice(-(i+1),(i+1));
	                        return _getProperty(observable.parentProxy, parentPath.join("."));
	                    }
	                    // return the full path of the current object relative to the parent observable
	                } else if (property === "__getPath") {
	                    // strip off the 12 characters for ".__getParent"
	                    var parentPath = _getPath(target, "__getParent");
	                    return parentPath.slice(0, -12);
	                }

	                // for performance improvements, we assign this to a variable so we do not have to lookup the property value again
	                var targetProp = target[property];
	                if (target instanceof Date && targetProp instanceof Function && targetProp !== null) {
	                    return targetProp.bind(target);
	                }

	                // if we are traversing into a new object, then we want to record path to that object and return a new observable.
	                // recursively returning a new observable allows us a single Observable.observe() to monitor all changes on
	                // the target object and any objects nested within.
	                if (targetProp instanceof Object && targetProp !== null && target.hasOwnProperty(property)) {

	                    // if we've found a proxy nested on the object, then we want to retrieve the original object behind that proxy
	                    if (targetProp.__isProxy === true) targetProp = targetProp.__getTarget;

	                    // if the object accessed by the user (targetProp) already has a __targetPosition AND the object
	                    // stored at target[targetProp.__targetPosition] is not null, then that means we are already observing this object
	                    // we might be able to return a proxy that we've already created for the object
	                    if (targetProp.__targetPosition > -1 && targets[targetProp.__targetPosition] !== null) {

	                        // loop over the proxies that we've created for this object
	                        var ttp = targetsProxy[targetProp.__targetPosition];
	                        for (var i = 0, l = ttp.length; i < l; i++) {

	                            // if we find a proxy that was setup for this particular observable, then return that proxy
	                            if (observable === ttp[i].observable) {
	                                return ttp[i].proxy;
	                            }
	                        }
	                    }

	                    // if we're arrived here, then that means there is no proxy for the object the user just accessed, so we
	                    // have to create a new proxy for it

	                    // create a shallow copy of the path array -- if we didn't create a shallow copy then all nested objects would share the same path array and the path wouldn't be accurate
	                    var newPath = path.slice(0);
	                    newPath.push({"target":targetProp,"property":property});
	                    return _create(targetProp, domDelay, observable, newPath);
	                } else {
	                    return targetProp;
	                }
	            },
	            deleteProperty: function(target, property) {

	                // was this change an original change or was it a change that was re-triggered below
	                var originalChange = true;
	                if (dupProxy === proxy) {
	                    originalChange = false;
	                    dupProxy = null;
	                }

	                // in order to report what the previous value was, we must make a copy of it before it is deleted
	                var previousValue = Object.assign({}, target);

	                // record the deletion that just took place
	                changes.push({
	                    "type":"delete"
	                    ,"target":target
	                    ,"property":property
	                    ,"newValue":null
	                    ,"previousValue":previousValue[property]
	                    ,"currentPath":_getPath(target, property)
	                    ,"jsonPointer":_getPath(target, property, true)
	                    ,"proxy":proxy
	                });

	                if (originalChange === true) {

	                    // perform the delete that we've trapped if changes are not paused for this observable
	                    if (!observable.changesPaused) delete target[property];

	                    for (var a = 0, l = targets.length; a < l; a++) if (target === targets[a]) break;

	                    // loop over each proxy and see if the target for this change has any other proxies
	                    var currentTargetProxy = targetsProxy[a] || [];

	                    var b = currentTargetProxy.length;
	                    while (b--) {
	                        // if the same target has a different proxy
	                        if (currentTargetProxy[b].proxy !== proxy) {
	                            // !!IMPORTANT!! store the proxy as a duplicate proxy (dupProxy) -- this will adjust the behavior above appropriately (that is,
	                            // prevent a change on dupProxy from re-triggering the same change on other proxies)
	                            dupProxy = currentTargetProxy[b].proxy;

	                            // make the same delete on the different proxy for the same target object. it is important that we make this change *after* we invoke the same change
	                            // on any other proxies so that the previousValue can show up correct for the other proxies
	                            delete currentTargetProxy[b].proxy[property];
	                        }
	                    }

	                }

	                _notifyObservers(changes.length);

	                return true;

	            },
	            set: function(target, property, value, receiver) {

	                // if the value we're assigning is an object, then we want to ensure
	                // that we're assigning the original object, not the proxy, in order to avoid mixing
	                // the actual targets and proxies -- creates issues with path logging if we don't do this
	                if (value && value.__isProxy) value = value.__getTarget;

	                // was this change an original change or was it a change that was re-triggered below
	                var originalChange = true;
	                if (dupProxy === proxy) {
	                    originalChange = false;
	                    dupProxy = null;
	                }

	                // improve performance by saving direct references to the property
	                var targetProp = target[property];

	                // Only record this change if:
	                // 	1. the new value differs from the old one
	                //	2. OR if this proxy was not the original proxy to receive the change
	                // 	3. OR the modified target is an array and the modified property is "length" and our helper property __length indicates that the array length has changed
	                //
	                // Regarding #3 above: mutations of arrays via .push or .splice actually modify the .length before the set handler is invoked
	                // so in order to accurately report the correct previousValue for the .length, we have to use a helper property.
	                if (targetProp !== value || originalChange === false || (property === "length" && target instanceof Array && target.__length !== value)) {

	                    var foundObservable = true;

	                    var typeOfTargetProp = (typeof targetProp);

	                    // determine if we're adding something new or modifying some that already existed
	                    var type = "update";
	                    if (typeOfTargetProp === "undefined") type = "add";

	                    // store the change that just occurred. it is important that we store the change before invoking the other proxies so that the previousValue is correct
	                    changes.push({
	                        "type":type
	                        ,"target":target
	                        ,"property":property
	                        ,"newValue":value
	                        ,"previousValue":receiver[property]
	                        ,"currentPath":_getPath(target, property)
	                        ,"jsonPointer":_getPath(target, property, true)
	                        ,"proxy":proxy
	                    });

	                    // mutations of arrays via .push or .splice actually modify the .length before the set handler is invoked
	                    // so in order to accurately report the correct previousValue for the .length, we have to use a helper property.
	                    if (property === "length" && target instanceof Array && target.__length !== value) {
	                        changes[changes.length-1].previousValue = target.__length;
	                        target.__length = value;
	                    }

	                    // !!IMPORTANT!! if this proxy was the first proxy to receive the change, then we need to go check and see
	                    // if there are other proxies for the same project. if there are, then we will modify those proxies as well so the other
	                    // observers can be modified of the change that has occurred.
	                    if (originalChange === true) {

	                        // because the value actually differs than the previous value
	                        // we need to store the new value on the original target object,
	                        // but only as long as changes have not been paused
	                        if (!observable.changesPaused) target[property] = value;


	                        foundObservable = false;

	                        var targetPosition = target.__targetPosition;
	                        var z = targetsProxy[targetPosition].length;

	                        // find the parent target for this observable -- if the target for that observable has not been removed
	                        // from the targets array, then that means the observable is still active and we should notify the observers of this change
	                        while (z--) {
	                            if (observable === targetsProxy[targetPosition][z].observable) {
	                                if (targets[targetsProxy[targetPosition][z].observable.parentTarget.__targetPosition] !== null) {
	                                    foundObservable = true;
	                                    break;
	                                }
	                            }
	                        }

	                        // if we didn't find an observable for this proxy, then that means .remove(proxy) was likely invoked
	                        // so we no longer need to notify any observer function about the changes, but we still need to update the
	                        // value of the underlying original objects see below: target[property] = value;
	                        if (foundObservable) {

	                            // loop over each proxy and see if the target for this change has any other proxies
	                            var currentTargetProxy = targetsProxy[targetPosition];
	                            for (var b = 0, l = currentTargetProxy.length; b < l; b++) {
	                                // if the same target has a different proxy
	                                if (currentTargetProxy[b].proxy !== proxy) {

	                                    // !!IMPORTANT!! store the proxy as a duplicate proxy (dupProxy) -- this will adjust the behavior above appropriately (that is,
	                                    // prevent a change on dupProxy from re-triggering the same change on other proxies)
	                                    dupProxy = currentTargetProxy[b].proxy;

	                                    // invoke the same change on the different proxy for the same target object. it is important that we make this change *after* we invoke the same change
	                                    // on any other proxies so that the previousValue can show up correct for the other proxies
	                                    currentTargetProxy[b].proxy[property] = value;

	                                }
	                            }

	                            // if the property being overwritten is an object, then that means this observable
	                            // will need to stop monitoring this object and any nested objects underneath the overwritten object else they'll become
	                            // orphaned and grow memory usage. we execute this on a setTimeout so that the clean-up process does not block
	                            // the UI rendering -- there's no need to execute the clean up immediately
	                            setTimeout(function() {

	                                if (typeOfTargetProp === "object" && targetProp !== null) {

	                                    // check if the to-be-overwritten target property still exists on the target object
	                                    // if it does still exist on the object, then we don't want to stop observing it. this resolves
	                                    // an issue where array .sort() triggers objects to be overwritten, but instead of being overwritten
	                                    // and discarded, they are shuffled to a new position in the array
	                                    var keys = Object.keys(target);
	                                    for (var i = 0, l = keys.length; i < l; i++) {
	                                        if (target[keys[i]] === targetProp) return;
	                                    }

	                                    var stillExists = false;

	                                    // now we perform the more expensive search recursively through the target object.
	                                    // if we find the targetProp (that was just overwritten) still exists somewhere else
	                                    // further down in the object, then we still need to observe the targetProp on this observable.
	                                    (function iterate(target) {
	                                        var keys = Object.keys(target);
	                                        for (var i = 0, l = keys.length; i < l; i++) {

	                                            var property = keys[i];
	                                            var nestedTarget = target[property];

	                                            if (nestedTarget instanceof Object && nestedTarget !== null) iterate(nestedTarget);
	                                            if (nestedTarget === targetProp) {
	                                                stillExists = true;
	                                                return;
	                                            }
	                                        }                                    })(target);

	                                    // even though targetProp was overwritten, if it still exists somewhere else on the object,
	                                    // then we don't want to remove the observable for that object (targetProp)
	                                    if (stillExists === true) return;

	                                    // loop over each property and recursively invoke the `iterate` function for any
	                                    // objects nested on targetProp
	                                    (function iterate(obj) {

	                                        var keys = Object.keys(obj);
	                                        for (var i = 0, l = keys.length; i < l; i++) {
	                                            var objProp = obj[keys[i]];
	                                            if (objProp instanceof Object && objProp !== null) iterate(objProp);
	                                        }

	                                        // if there are any existing target objects (objects that we're already observing)...
	                                        var c = -1;
	                                        for (var i = 0, l = targets.length; i < l; i++) {
	                                            if (obj === targets[i]) {
	                                                c = i;
	                                                break;
	                                            }
	                                        }
	                                        if (c > -1) {

	                                            // ...then we want to determine if the observables for that object match our current observable
	                                            var currentTargetProxy = targetsProxy[c];
	                                            var d = currentTargetProxy.length;

	                                            while (d--) {
	                                                // if we do have an observable monitoring the object thats about to be overwritten
	                                                // then we can remove that observable from the target object
	                                                if (observable === currentTargetProxy[d].observable) {
	                                                    currentTargetProxy.splice(d,1);
	                                                    break;
	                                                }
	                                            }

	                                            // if there are no more observables assigned to the target object, then we can remove
	                                            // the target object altogether. this is necessary to prevent growing memory consumption particularly with large data sets
	                                            if (currentTargetProxy.length == 0) {
	                                                // targetsProxy.splice(c,1);
	                                                targets[c] = null;
	                                            }
	                                        }

	                                    })(targetProp);
	                                }
	                            },10000);
	                        }

	                        // TO DO: the next block of code resolves test case #29, but it results in poor IE11 performance with very large objects.
	                        // UPDATE: need to re-evaluate IE11 performance due to major performance overhaul from 12/23/2018.
	                        //
	                        // if the value we've just set is an object, then we'll need to iterate over it in order to initialize the
	                        // observers/proxies on all nested children of the object
	                        /* if (value instanceof Object && value !== null) {
	                            (function iterate(proxy) {
	                                var target = proxy.__getTarget;
	                                var keys = Object.keys(target);
	                                for (var i = 0, l = keys.length; i < l; i++) {
	                                    var property = keys[i];
	                                    if (target[property] instanceof Object && target[property] !== null) iterate(proxy[property]);
	                                };
	                            })(proxy[property]);
	                        }; */

	                    }
	                    if (foundObservable) {
	                        // notify the observer functions that the target has been modified
	                        _notifyObservers(changes.length);
	                    }

	                }
	                return true;
	            }
	        };

	        var __targetPosition = target.__targetPosition;
	        if (!(__targetPosition > -1)) {
	            Object.defineProperty(target, "__targetPosition", {
	                value: targets.length
	                ,writable: false
	                ,enumerable: false
	                ,configurable: false
	            });
	        }

	        // create the proxy that we'll use to observe any changes
	        var proxy = new Proxy(target, handler);

	        // we don't want to create a new observable if this function was invoked recursively
	        if (observable === null) {
	            observable = {"parentTarget":target, "domDelay":domDelay, "parentProxy":proxy, "observers":[],"paused":false,"path":path,"changesPaused":false};
	            observables.push(observable);
	        }

	        // store the proxy we've created so it isn't re-created unnecessarily via get handler
	        var proxyItem = {"target":target,"proxy":proxy,"observable":observable};

	        // if we have already created a Proxy for this target object then we add it to the corresponding array
	        // on targetsProxy (targets and targetsProxy work together as a Hash table indexed by the actual target object).
	        if (__targetPosition > -1) {

	            // the targets array is set to null for the position of this particular object, then we know that
	            // the observable was removed some point in time for this object -- so we need to set the reference again
	            if (targets[__targetPosition] === null) {
	                targets[__targetPosition] = target;
	            }

	            targetsProxy[__targetPosition].push(proxyItem);

	            // else this is a target object that we had not yet created a Proxy for, so we must add it to targets,
	            // and push a new array on to targetsProxy containing the new Proxy
	        } else {
	            targets.push(target);
	            targetsProxy.push([proxyItem]);
	        }

	        return proxy;
	    };

	    /**
	     * @typedef {object} ObservableSlimChange Observed change.
	     * @property {"add"|"update"|"delete"} type Change type.
	     * @property {string} property Property name.
	     * @property {string} currentPath Property path with the dot notation (e.g. `foo.0.bar`).
	     * @property {string} jsonPointer Property path with the JSON pointer syntax (e.g. `/foo/0/bar`). See https://datatracker.ietf.org/doc/html/rfc6901.
	     * @property {object} target Target object.
	     * @property {ProxyConstructor} proxy Proxy of the target object.
	     * @property {*} newValue New value of the property.
	     * @property {*} [previousValue] Previous value of the property
	     */

	    return {
	        /**
	         * Create a new ES6 `Proxy` whose changes we can observe through the `observe()` method.
	         * @param {object} target Plain object that we want to observe for changes.
	         * @param {boolean|number} domDelay If `true`, then the observed changes to `target` will be batched up on a 10ms delay (via `setTimeout()`).
	         * If `false`, then the `observer` function will be immediately invoked after each individual change made to `target`. It is helpful to set
	         * `domDelay` to `true` when your `observer` function makes DOM manipulations (fewer DOM redraws means better performance). If a number greater
	         * than zero, then it defines the DOM delay in milliseconds.
	         * @param {function(ObservableSlimChange[])} [observer] Function that will be invoked when a change is made to the proxy of `target`.
	         * When invoked, this function is passed a single argument: an array of `ObservableSlimChange` detailing each change that has been made.
	         * @returns {ProxyConstructor} Proxy of the target object.
	         */
	        create: function(target, domDelay, observer) {

	            // test if the target is a Proxy, if it is then we need to retrieve the original object behind the Proxy.
	            // we do not allow creating proxies of proxies because -- given the recursive design of ObservableSlim -- it would lead to sharp increases in memory usage
	            if (target.__isProxy === true) {
	                var target = target.__getTarget;
	                //if it is, then we should throw an error. we do not allow creating proxies of proxies
	                // because -- given the recursive design of ObservableSlim -- it would lead to sharp increases in memory usage
	                //throw new Error("ObservableSlim.create() cannot create a Proxy for a target object that is also a Proxy.");
	            }

	            // fire off the _create() method -- it will create a new observable and proxy and return the proxy
	            var proxy = _create(target, domDelay);

	            // assign the observer function
	            if (typeof observer === "function") this.observe(proxy, observer);

	            // recursively loop over all nested objects on the proxy we've just created
	            // this will allow the top observable to observe any changes that occur on a nested object
	            (function iterate(proxy) {
	                var target = proxy.__getTarget;
	                var keys  = Object.keys(target);
	                for (var i = 0, l = keys.length; i < l; i++) {
	                    var property = keys[i];
	                    if (target[property] instanceof Object && target[property] !== null) iterate(proxy[property]);
	                }
	            })(proxy);

	            return proxy;

	        },

	        /**
	         * Add a new observer function to an existing proxy.
	         * @param {ProxyConstructor} proxy An ES6 `Proxy` created by the `create()` method.
	         * @param {function(ObservableSlimChange[])} observer Function that will be invoked when a change is made to the proxy of `target`.
	         * When invoked, this function is passed a single argument: an array of `ObservableSlimChange` detailing each change that has been made.
	         * @returns {void} Does not return any value.
	         */
	        observe: function(proxy, observer) {
	            // loop over all the observables created by the _create() function
	            var i = observables.length;
	            while (i--) {
	                if (observables[i].parentProxy === proxy) {
	                    observables[i].observers.push(observer);
	                    break;
	                }
	            }        },

	        /**
	         * Prevent any observer functions from being invoked when a change occurs to a proxy.
	         * @param {ProxyConstructor} proxy An ES6 `Proxy` created by the `create()` method.
	         * @returns {void} Does not return any value.
	         */
	        pause: function(proxy) {
	            var i = observables.length;
	            var foundMatch = false;
	            while (i--) {
	                if (observables[i].parentProxy === proxy) {
	                    observables[i].paused = true;
	                    foundMatch = true;
	                    break;
	                }
	            }
	            if (foundMatch == false) throw new Error("ObseravableSlim could not pause observable -- matching proxy not found.");
	        },

	        /**
	         * Resume execution of any observer functions when a change is made to a proxy.
	         * @param {ProxyConstructor} proxy An ES6 `Proxy` created by the `create()` method.
	         * @returns {void} Does not return any value.
	         */
	        resume: function(proxy) {
	            var i = observables.length;
	            var foundMatch = false;
	            while (i--) {
	                if (observables[i].parentProxy === proxy) {
	                    observables[i].paused = false;
	                    foundMatch = true;
	                    break;
	                }
	            }
	            if (foundMatch == false) throw new Error("ObseravableSlim could not resume observable -- matching proxy not found.");
	        },

	        /**
	         * Prevent any changes (i.e., `set`, and `deleteProperty`) from being written to the target object.
	         * However, the observer functions will still be invoked to let you know what changes **WOULD** have been made.
	         * This can be useful if the changes need to be approved by an external source before the changes take effect.
	         * @param {ProxyConstructor} proxy An ES6 `Proxy` created by the `create()` method.
	         * @returns {void} Does not return any value.
	         */
	        pauseChanges: function(proxy){
	            var i = observables.length;
	            var foundMatch = false;
	            while (i--) {
	                if (observables[i].parentProxy === proxy) {
	                    observables[i].changesPaused = true;
	                    foundMatch = true;
	                    break;
	                }
	            }
	            if (foundMatch == false) throw new Error("ObseravableSlim could not pause changes on observable -- matching proxy not found.");
	        },

	        /**
	         * Resume the changes that were taking place prior to the call to `pauseChanges()` method.
	         * @param {ProxyConstructor} proxy An ES6 `Proxy` created by the `create()` method.
	         * @returns {void} Does not return any value.
	         */
	        resumeChanges: function(proxy){
	            var i = observables.length;
	            var foundMatch = false;
	            while (i--) {
	                if (observables[i].parentProxy === proxy) {
	                    observables[i].changesPaused = false;
	                    foundMatch = true;
	                    break;
	                }
	            }
	            if (foundMatch == false) throw new Error("ObseravableSlim could not resume changes on observable -- matching proxy not found.");
	        },

	        /**
	         * Remove the observable and proxy thereby preventing any further callback observers for changes occurring to the target object.
	         * @param {ProxyConstructor} proxy An ES6 `Proxy` created by the `create()` method.
	         * @returns {void} Does not return any value.
	         */
	        remove: function(proxy) {

	            var matchedObservable = null;
	            var foundMatch = false;

	            var c = observables.length;
	            while (c--) {
	                if (observables[c].parentProxy === proxy) {
	                    matchedObservable = observables[c];
	                    foundMatch = true;
	                    break;
	                }
	            }
	            var a = targetsProxy.length;
	            while (a--) {
	                var b = targetsProxy[a].length;
	                while (b--) {
	                    if (targetsProxy[a][b].observable === matchedObservable) {
	                        targetsProxy[a].splice(b,1);

	                        // if there are no more proxies for this target object
	                        // then we null out the position for this object on the targets array
	                        // since we are essentially no longer observing this object.
	                        // we do not splice it off the targets array, because if we re-observe the same
	                        // object at a later time, the property __targetPosition cannot be redefined.
	                        if (targetsProxy[a].length === 0) {
	                            targets[a] = null;
	                        }                    }
	                }            }
	            if (foundMatch === true) {
	                observables.splice(c,1);
	            }
	        }
	    };
	})();

	class Helper
	{
	    /**
	     *
	     * @param {string} str String to trim
	     * @param {string|undefined} characters Characters to trim. Default is empty space.
	     * @param {string|undefined} flags RegExp flag. Default is "g"
	     * @returns {string}
	     */
	    static trim ( str, characters = " ", flags = "g" )
	    {
	        if (typeof str !== "string" || typeof characters !== "string" || typeof flags !== "string")
	        {
	            throw new TypeError("argument must be string");
	        }

	        if (!/^[gi]*$/.test(flags))
	        {
	            throw new TypeError("Invalid flags supplied '" + flags.match(new RegExp("[^gi]*")) + "'");
	        }

	        characters = characters.replace(/[\[\](){}?*+\^$\\.|\-]/g, "\\$&");

	        return str.replace(new RegExp("^[" + characters + "]+|[" + characters + "]+$", flags), '');
	    }

	    /**
	     * Serialize given from
	     * @param form
	     * @returns {{}}
	     */
	    static serializeForm( form )
	    {
	        const object = {};
	        new FormData( form ).forEach(( value, key) =>
	        {
	            // Reflect.has in favor of: object.hasOwnProperty(key)
	            if( !Reflect.has( object, key ) )
	            {
	                object[ key ] = value;
	                return;
	            }

	            if( !Array.isArray( object[ key ] ) )
	            {
	                object[ key ] = [ object[ key ] ];
	            }

	            object[ key ].push( value );
	        });
	        return object;
	    }

	    /**
	     * Creates an unique ID
	     * @returns {string}
	     */
	    static createUid()
	    {
	        return ( [ 1e7 ] + -1e3 + -4e3 + -8e3 + -1e11 ).replace( /[018]/g, c =>
	            ( c ^ crypto.getRandomValues( new Uint8Array( 1 ) )[ 0 ] & 15 >> c / 4 ).toString( 16 )
	        );
	    }

	    /**
	     * Checks if given value is string
	     *
	     * @param {*} v Value to check
	     * @returns {boolean}
	     */
	    static isString( v )
	    {
	        return ( typeof v === 'string' || v instanceof String );
	    }

	    /**
	     * Checks if given value is an array or not
	     *
	     * @param {*} v Value to check
	     * @returns {boolean}
	     */
	    static isArray( v )
	    {
	        return Array.isArray( v );
	    }

	    /**
	     * Refer to:
	     * https://github.com/lodash/lodash/blob/master/isPlainObject.js
	     * @param value
	     * @returns {boolean}
	     */
	    static isPlainObject( value )
	    {
	        if ( !Helper._isObjectLike( value ) || Helper._getTag( value ) != '[object Object]' )
	        {
	            return false
	        }

	        if ( Object.getPrototypeOf( value ) === null )
	        {
	            return true
	        }

	        let proto = value;
	        while ( Object.getPrototypeOf( proto ) !== null)
	        {
	            proto = Object.getPrototypeOf(proto);
	        }

	        return Object.getPrototypeOf( value ) === proto
	    }

	    /**
	     * Checks if given value is a class constructor
	     * Refer:
	     * https://stackoverflow.com/questions/30758961/how-to-check-if-a-variable-is-an-es6-class-declaration
	     * @param v
	     * @returns {boolean}
	     */
	    static isClass( v )
	    {
	        return typeof v === 'function' && /^\s*class\s+/.test(v.toString());
	    }

	    /**
	     * Create an observable object
	     *
	     * @param {function} onChange Optional callback triggered on change. Default is undefined.
	     * @param {object} objReference Optional referenced object which will be transformed to an observable. Default is an empty new object.
	     * @param {boolean} batchUpDelay Optional flag defining if change events are batched up for 10ms before being triggered. Default is true.
	     * @returns {ProxyConstructor}
	     */
	    static createObservable( onChange = undefined, objReference = {}, batchUpDelay = true )
	    {
	        return ObservableSlim.create(
	            objReference,
	            batchUpDelay,
	            onChange
	        );
	    }

	    /**
	     * Refer to:
	     * https://github.com/lodash/lodash/blob/master/isObjectLike.js
	     *
	     * @param value
	     * @returns {boolean}
	     */
	    static _isObjectLike( value )
	    {
	        return typeof value === 'object' && value !== null
	    }

	    /**
	     * Refer to:
	     * https://github.com/lodash/lodash/blob/master/.internal/getTag.js
	     *
	     * @param value
	     * @returns {string|string}
	     */
	    static _getTag( value )
	    {
	        if ( value == null )
	        {
	            return value === undefined ? '[object Undefined]' : '[object Null]'
	        }
	        return Object.prototype.toString.call( value );
	    }
	}

	class DefaultState extends State
	{
	    static ID = 'INFRONT_DEFAULT_INDEX_STATE';

	    static VERTEX_SHADER = `
attribute vec2 inPos;

void main() 
{
    gl_Position = vec4(inPos, 0.0, 1.0);
}
`;
	    static FRAGMENT_SHADER = `
precision mediump float;

uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float iTime;

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 fc = fragCoord;
    
    vec3 col = vec3(0.0);
    for(int j=-2;j<=2;j++){
        for(int k=-2;k<=2;k++){
            vec2 uv = (fc)/iResolution.xy;
            uv += sin(uv.x*(2.0+sin(iTime*0.39))+iTime*0.12)*vec2(j,k)*13.0/iResolution.xy;

            //float i = iTime*0.08+float(j)*0.03;
            float i = iTime*0.16+float(j)*0.03;
            uv.x *= 0.8;
            
            float y = sin(uv.x*3.0+uv.x*sin(uv.x+i*0.37)*1.0+i*2.0+cos(uv.x*0.6+i*0.71)*0.75)*0.25+uv.y-0.5;
            float ys = sign(y);
			col += abs(vec3(max((1.0-pow(y,0.13+sin(uv.x+iTime*0.21)*0.1))*vec3(1.1,0.6,0.15),(1.0-pow(-y,0.13))*vec3(0.9,0.2,0.2))));
        }
    }
	col /= 15.0;
    // Output to screen
    fragColor = vec4(col.r / 2.9, col.r / 1.2, col.r/ 1.9,1.0);
}

void main() 
{
    mainImage( gl_FragColor, gl_FragCoord.xy );
}
`;

	    async enter( params = {} )
	    {
	        this.app.container.innerHTML = `
        <style>
            * { margin: 0; padding: 0;overflow: hidden;}
        </style>
        <canvas id="ds" style="position: fixed; top:0; left:0; z-index: 2;"></canvas>;

            <div style="position: fixed;
                        z-index: 9; 
                        top: 50%; 
                        left: 50%; 
                        transform: translate(-50%, -50%);
                        text-align: center;;
                        font-family: Tahoma; 
                        font-size: 4em;
                        font-weight: bolder;
                        padding: .5em; 
                        background-color: white; 
                        color: black;
                        mix-blend-mode: screen;
                        display: inline-block;">
                        I<span style="font-size: 0.8em">NFRONT</span>JS
                        <h2 style="font-family: 'Courier New'; background-color: black; color: white; margin-top: 0px; font-size: 0.3em;padding: 3px">Version ${this.app.getVersion()}</h2>
            </div>        
        `;
	        this.canvas = null;
	        this.gl = null;
	        this.vp_size = null;
	        this.progDraw = null;
	        this.bufObj = {};
	        this.mousepos = [0,0];
	        this.initScene();
	    }

	    initScene()
	    {
	        this.canvas = document.getElementById( "ds" );
	        this.gl = this.canvas.getContext( "experimental-webgl" );
	        if ( !this.gl )
	            return;

	        this.canvas.addEventListener( 'mousemove', ( e ) =>
	        {
	            this.mousepos = [ e.clientX, e.clientY ];
	        } );

	        this.progDraw = this.gl.createProgram();
	        for ( let i = 0; i < 2; ++i )
	        {
	            let source = i == 0 ? DefaultState.VERTEX_SHADER : DefaultState.FRAGMENT_SHADER;
	            let shaderObj = this.gl.createShader( i == 0 ? this.gl.VERTEX_SHADER : this.gl.FRAGMENT_SHADER );
	            this.gl.shaderSource( shaderObj, source );
	            this.gl.compileShader( shaderObj );
	            let status = this.gl.getShaderParameter( shaderObj, this.gl.COMPILE_STATUS );
	            if ( !status ) { console.error( this.gl.getShaderInfoLog( shaderObj ) ); continue; }
	            this.gl.attachShader( this.progDraw, shaderObj );
	            this.gl.linkProgram( this.progDraw );
	        }
	        const status = this.gl.getProgramParameter( this.progDraw, this.gl.LINK_STATUS );
	        //if ( !status ) alert( this.gl.getProgramInfoLog( this.progDraw ) );
	        if ( !status ) { console.error( this.gl.getProgramInfoLog( this.progDraw ) ); return; }
	        this.progDraw.inPos = this.gl.getAttribLocation( this.progDraw, "inPos" );
	        this.progDraw.iTime = this.gl.getUniformLocation( this.progDraw, "iTime" );
	        this.progDraw.iMouse = this.gl.getUniformLocation( this.progDraw, "iMouse" );
	        this.progDraw.iResolution = this.gl.getUniformLocation( this.progDraw, "iResolution" );
	        this.gl.useProgram( this.progDraw );

	        let pos = [ -1, -1, 1, -1, 1, 1, -1, 1 ];
	        let inx = [ 0, 1, 2, 0, 2, 3 ];
	        this.bufObj.pos = this.gl.createBuffer();
	        this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.bufObj.pos );
	        this.gl.bufferData( this.gl.ARRAY_BUFFER, new Float32Array( pos ), this.gl.STATIC_DRAW );
	        this.bufObj.inx = this.gl.createBuffer();
	        this.bufObj.inx.len = inx.length;
	        this.gl.bindBuffer( this.gl.ELEMENT_ARRAY_BUFFER, this.bufObj.inx );
	        this.gl.bufferData( this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( inx ), this.gl.STATIC_DRAW );
	        this.gl.enableVertexAttribArray( this.progDraw.inPos );
	        this.gl.vertexAttribPointer( this.progDraw.inPos, 2, this.gl.FLOAT, false, 0, 0 );

	        this.gl.enable( this.gl.DEPTH_TEST );
	        this.gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

	        window.onresize = this.resize.bind( this );
	        this.resize();
	        requestAnimationFrame( this.render.bind( this ) );
	    }

	    resize() {
	        //vp_size = [gl.drawingBufferWidth, gl.drawingBufferHeight];
	        //this.vp_size = [window.innerWidth, window.innerHeight];
	        this.vp_size = [512, 512];
	        this.canvas.width = this.vp_size[0];
	        this.canvas.height = this.vp_size[1];
	        this.canvas.style.width = "100vw";
	        this.canvas.style.height = "100vh";
	    }

	    render(deltaMS) {

	        this.gl.viewport( 0, 0, this.canvas.width, this.canvas.height );
	        this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT );

	        this.gl.uniform1f(this.progDraw.iTime, deltaMS/1000.0);
	        this.gl.uniform2f(this.progDraw.iResolution, this.canvas.width, this.canvas.height);
	        this.gl.uniform2f(this.progDraw.iMouse, this.mousepos[0], this.mousepos[1]);
	        this.gl.drawElements( this.gl.TRIANGLES, this.bufObj.inx.len, this.gl.UNSIGNED_SHORT, 0 );

	        requestAnimationFrame(this.render.bind( this ));
	    }

	}

	class StateManager
	{
	    static DEFAULT_STATE_ID = 'INFRONT_DEFAULT_STATE_ID';

	    constructor( appInstance )
	    {
	        this._states =  {};
	        this.app = appInstance;
	        this.currentState = null;
	        this.defaultStateId = null;
	    }

	    add( stateClass )
	    {
	        // @todo Fix this, only check for function or class
	        if ( false === Helper.isClass( stateClass ) )
	        {
	            throw new Error( 'StateManager.addState expects a class/subclass of State.' );
	        }

	        // Throw an error if ID is null or already taken
	        if ( false === Helper.isString( stateClass.ID ) )
	        {
	            stateClass.ID = Helper.createUid();
	            // @todo show warning ... throw new Error( 'Given stateClass does not have a valid static ID' );
	        }

	        if ( true === this._states.hasOwnProperty( stateClass.ID ) )
	        {
	            // @todo Show warning ...
	            return false;
	        }

	        this._states[ stateClass.ID ] = stateClass;

	        if ( Helper.isString( stateClass.ROUTE ) )
	        {
	            this.app.router.addRoute( stateClass.ROUTE, stateClass );
	        }
	        else if ( Helper.isArray( stateClass.ROUTE ) )
	        {
	            for ( let route of stateClass.ROUTE )
	            {
	                this.app.router.addRoute( route, stateClass );
	            }
	        }

	        return true;
	    }

	    create( stateId, routeParams )
	    {
	        let stateInstance = null;

	        if ( this._states.hasOwnProperty( stateId ) )
	        {
	            stateInstance = new this._states[ stateId ]( this.app, routeParams );
	        }
	        else if ( stateId === StateManager.DEFAULT_STATE_ID )
	        {
	            stateInstance = new DefaultState( this.app, routeParams );
	        }

	        return stateInstance;
	    }

	    async switchTo( newState )
	    {
	        if ( false === newState.canEnter() )
	        {
	            const redirectTo = newState.getRedirectTo();
	            if ( redirectTo )
	            {
	                this.app.router.redirect( redirectTo );
	                return false;
	            }

	            throw Error( 'Forbidden to enter new state:' + newState.getId() );
	        }

	        if ( this.currentState )
	        {
	            await this.currentState.exit();
	            delete this.currentState;
	        }

	        this.currentState = newState;
	        await newState.enter();
	    }

	}

	const UrlPattern = new UP();
	class Router
	{
	    constructor( appInstance )
	    {
	        // @todo Implement auto
	        this.isInitialized = false;
	        this.mode = 'url';  // url, hash, auto
	        this._routeActions = [];
	        this.app = appInstance;
	        this.isEnabled = false;
	        this.previousRoute = null;
	        this.currentRoute = null;
	        // @todo only use window.location.pathname if nothing is set in settings and mode is equal to url
	        this.basePath = Helper.trim( window.location.pathname, '/' );
	        const lastPathPart = this.basePath.split( "/" ).pop();
	        if ( lastPathPart && lastPathPart.split( "." ).length > 1 )
	        {
	            this.basePath = this.basePath.replace( lastPathPart, '' );
	            this.basePath = Helper.trim( this.basePath, '/' );
	            window.history.replaceState( null, null, `/${this.basePath}/` );
	        }
	    }

	    // Add third optional param called isIndexAction to be triggered, when route is empty
	    addRoute( route, action )
	    {
	        let sRoute = Helper.trim( route, '/' );
	        sRoute = '/' + sRoute;

	        if ( true === Helper.isClass( action ) ) // @todo fix - this does not work for webpack in production mode && true === isClassChildOf( action, 'State' )  )
	        {
	            this.app.stateManager.add( action );
	            this._routeActions.push(
	                {
	                    "action" : action.ID,
	                    "route" : new UrlPattern( sRoute )
	                }
	            );
	        }
	        // else: check if object and if object has an enter and exit method
	        else
	        {
	            throw new Error( 'Invalid action.' );
	        }
	    }

	    resolveActionDataByRoute( route )
	    {
	        let routeData = null,
	            params = {},
	            query = {},
	            routeSplits = route.split( "?" );

	        route = routeSplits[ 0 ];
	        if ( routeSplits.length > 0 )
	        {
	            let sp = new URLSearchParams( routeSplits[ 0 ] );
	            query = Object.fromEntries( sp.entries() );
	        }

	        for (let si = 0; si < this._routeActions.length; si++ )
	        {
	            params = this._routeActions[ si ].route.match( route );
	            if ( params )
	            {
	                routeData = {
	                    "routeAction" : this._routeActions[ si ].action,
	                    "routeParams" : new RouteParams( params, query )
	                };
	                break;
	            }
	        }

	        // If it is default route
	        if ( null === routeData && route === '/' )
	        {
	            routeData = {
	                "routeAction" : StateManager.DEFAULT_STATE_ID,
	                "routeParams" : null
	            };
	        }

	        return routeData;
	    }

	    createUrl( str ) {
	        // @todo Check whether its hash based routing or not
	        if ( this.mode === 'hash' )
	        {
	            return '#/' + Helper.trim( str, '/' );
	        }
	        else if ( 'url' === this.mode )
	        {
	            return window.location.origin + '/' + this.basePath + '/' + Helper.trim( str, '/' );
	        }
	    }

	    startsWithHash(string)
	    {
	        const regEx = /^#/;
	        const startsWithHash = regEx.test(string);
	        return Boolean(startsWithHash);
	    }
	    enable()
	    {
	        if ( true === this.isEnabled )
	        {
	            return;
	        }
	        this.isEnabled = true;

	        if ( this.mode === 'url' )
	        {
	            document.addEventListener( 'click', this.processUrl.bind( this ), false);
	        }
	        else if ( this.mode = 'hash' )
	        {
	            window.addEventListener( 'hashchange', this.processHash.bind( this ) );
	        }
	    }

	    disable()
	    {
	        this.isEnabled = false;
	    }

	    processHash()
	    {
	        const hash = location.hash || '#';
	        let route = hash.slice(1);

	        // always start with a leading slash
	        route = '/' + Helper.trim( route, '/' );

	        this.previousRoute = this.currentRoute;
	        this.currentRoute = route;
	        console.log( route );
	        this.execute(  this.resolveActionDataByRoute( route ) );
	    }

	    processUrl( event )
	    {
	        const target = event.target.closest('a');

	        // we are interested only in anchor tag clicks
	        if (!target) {
	            return;
	        }

	        const url = target.getAttribute('href');

	        // we don't care about example.com#hash or
	        // example.com/#hash links
	        if (this.startsWithHash(url)) {
	            return;
	        }

	        // if the link is leading to other page we
	        // need to disable default browser behavior
	        // to avoid page refresh
	        if ( target.hostname === location.hostname )
	        {
	            event.preventDefault();
	            //this.redirect(url);
	            let route = url.replace( window.location.origin + '/' + Helper.trim( this.basePath, '/' ), '' );
	            route = '/' + Helper.trim( route, '/' );

	            this.previousRoute = this.currentRoute;
	            this.currentRoute = route;

	            console.log( route );

	            const actionData = this.resolveActionDataByRoute( route );
	            if ( actionData )
	            {
	                window.history.pushState( null, null, url );
	            }
	            this.execute( actionData );
	        }

	        // otherwise go to the given destination
	    }

	    redirect( url, forceReload = false )
	    {
	        if ( 'hash' === this.mode )
	        {
	            location.hash = '/' + Helper.trim( url, '/' );
	            if ( true === forceReload )
	            {
	                this.processHash();
	            }
	        }
	        else if ( 'url' === this.mode )
	        {
	            if ( true === forceReload )
	            {
	                window.history.pushState( null, null, url );
	            }
	            else
	            {
	                window.history.replaceState( null, null, url );
	            }
	        }
	    }

	    resolveRoute( route )
	    {
	        let r = Helper.trim( route, '/#' );
	        r = Helper.trim( r, '#' );
	        r = Helper.trim( r, '/' );

	        return '/' + r;
	    }

	    async execute( actionData )
	    {
	        // Get view call
	        try
	        {
	            if ( actionData && actionData.hasOwnProperty( 'routeAction' ) && actionData.hasOwnProperty( 'routeParams' ) )
	            {
	                let stateInstance = this.app.stateManager.create(
	                    actionData.routeAction,
	                    actionData.routeParams
	                );
	                await this.app.stateManager.switchTo( stateInstance );
	            }
	        }
	        catch( e )
	        {
	            console && console.error( e );
	            // Uncatched error
	        }
	    }
	}


	// Generated by CoffeeScript 1.10.0

	function UP() {
	    var slice = [].slice;
	    var P, UrlPattern, astNodeContainsSegmentsForProvidedParams, astNodeToNames, astNodeToRegexString, baseAstNodeToRegexString, concatMap, defaultOptions, escapeForRegex, getParam, keysAndValuesToObject, newParser, regexGroupCount, stringConcatMap, stringify;
	    escapeForRegex = function(string) {
	        return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	    };
	    concatMap = function(array, f) {
	        var i, length, results;
	        results = [];
	        i = -1;
	        length = array.length;
	        while (++i < length) {
	            results = results.concat(f(array[i]));
	        }
	        return results;
	    };
	    stringConcatMap = function(array, f) {
	        var i, length, result;
	        result = '';
	        i = -1;
	        length = array.length;
	        while (++i < length) {
	            result += f(array[i]);
	        }
	        return result;
	    };
	    regexGroupCount = function(regex) {
	        return (new RegExp(regex.toString() + '|')).exec('').length - 1;
	    };
	    keysAndValuesToObject = function(keys, values) {
	        var i, key, length, object, value;
	        object = {};
	        i = -1;
	        length = keys.length;
	        while (++i < length) {
	            key = keys[i];
	            value = values[i];
	            if (value == null) {
	                continue;
	            }
	            if (object[key] != null) {
	                if (!Array.isArray(object[key])) {
	                    object[key] = [object[key]];
	                }
	                object[key].push(value);
	            } else {
	                object[key] = value;
	            }
	        }
	        return object;
	    };
	    P = {};
	    P.Result = function(value, rest) {
	        this.value = value;
	        this.rest = rest;
	    };
	    P.Tagged = function(tag, value) {
	        this.tag = tag;
	        this.value = value;
	    };
	    P.tag = function(tag, parser) {
	        return function(input) {
	            var result, tagged;
	            result = parser(input);
	            if (result == null) {
	                return;
	            }
	            tagged = new P.Tagged(tag, result.value);
	            return new P.Result(tagged, result.rest);
	        };
	    };
	    P.regex = function(regex) {
	        return function(input) {
	            var matches, result;
	            matches = regex.exec(input);
	            if (matches == null) {
	                return;
	            }
	            result = matches[0];
	            return new P.Result(result, input.slice(result.length));
	        };
	    };
	    P.sequence = function() {
	        var parsers;
	        parsers = 1 <= arguments.length ? slice.call(arguments, 0) : [];
	        return function(input) {
	            var i, length, parser, rest, result, values;
	            i = -1;
	            length = parsers.length;
	            values = [];
	            rest = input;
	            while (++i < length) {
	                parser = parsers[i];
	                result = parser(rest);
	                if (result == null) {
	                    return;
	                }
	                values.push(result.value);
	                rest = result.rest;
	            }
	            return new P.Result(values, rest);
	        };
	    };
	    P.pick = function() {
	        var indexes, parsers;
	        indexes = arguments[0], parsers = 2 <= arguments.length ? slice.call(arguments, 1) : [];
	        return function(input) {
	            var array, result;
	            result = P.sequence.apply(P, parsers)(input);
	            if (result == null) {
	                return;
	            }
	            array = result.value;
	            result.value = array[indexes];
	            return result;
	        };
	    };
	    P.string = function(string) {
	        var length;
	        length = string.length;
	        return function(input) {
	            if (input.slice(0, length) === string) {
	                return new P.Result(string, input.slice(length));
	            }
	        };
	    };
	    P.lazy = function(fn) {
	        var cached;
	        cached = null;
	        return function(input) {
	            if (cached == null) {
	                cached = fn();
	            }
	            return cached(input);
	        };
	    };
	    P.baseMany = function(parser, end, stringResult, atLeastOneResultRequired, input) {
	        var endResult, parserResult, rest, results;
	        rest = input;
	        results = stringResult ? '' : [];
	        while (true) {
	            if (end != null) {
	                endResult = end(rest);
	                if (endResult != null) {
	                    break;
	                }
	            }
	            parserResult = parser(rest);
	            if (parserResult == null) {
	                break;
	            }
	            if (stringResult) {
	                results += parserResult.value;
	            } else {
	                results.push(parserResult.value);
	            }
	            rest = parserResult.rest;
	        }
	        if (atLeastOneResultRequired && results.length === 0) {
	            return;
	        }
	        return new P.Result(results, rest);
	    };
	    P.many1 = function(parser) {
	        return function(input) {
	            return P.baseMany(parser, null, false, true, input);
	        };
	    };
	    P.concatMany1Till = function(parser, end) {
	        return function(input) {
	            return P.baseMany(parser, end, true, true, input);
	        };
	    };
	    P.firstChoice = function() {
	        var parsers;
	        parsers = 1 <= arguments.length ? slice.call(arguments, 0) : [];
	        return function(input) {
	            var i, length, parser, result;
	            i = -1;
	            length = parsers.length;
	            while (++i < length) {
	                parser = parsers[i];
	                result = parser(input);
	                if (result != null) {
	                    return result;
	                }
	            }
	        };
	    };
	    newParser = function(options) {
	        var U;
	        U = {};
	        U.wildcard = P.tag('wildcard', P.string(options.wildcardChar));
	        U.optional = P.tag('optional', P.pick(1, P.string(options.optionalSegmentStartChar), P.lazy(function() {
	            return U.pattern;
	        }), P.string(options.optionalSegmentEndChar)));
	        U.name = P.regex(new RegExp("^[" + options.segmentNameCharset + "]+"));
	        U.named = P.tag('named', P.pick(1, P.string(options.segmentNameStartChar), P.lazy(function() {
	            return U.name;
	        })));
	        U.escapedChar = P.pick(1, P.string(options.escapeChar), P.regex(/^./));
	        U["static"] = P.tag('static', P.concatMany1Till(P.firstChoice(P.lazy(function() {
	            return U.escapedChar;
	        }), P.regex(/^./)), P.firstChoice(P.string(options.segmentNameStartChar), P.string(options.optionalSegmentStartChar), P.string(options.optionalSegmentEndChar), U.wildcard)));
	        U.token = P.lazy(function() {
	            return P.firstChoice(U.wildcard, U.optional, U.named, U["static"]);
	        });
	        U.pattern = P.many1(P.lazy(function() {
	            return U.token;
	        }));
	        return U;
	    };
	    defaultOptions = {
	        escapeChar: '\\',
	        segmentNameStartChar: ':',
	        segmentValueCharset: 'a-zA-Z0-9-_~ %',
	        segmentNameCharset: 'a-zA-Z0-9',
	        optionalSegmentStartChar: '(',
	        optionalSegmentEndChar: ')',
	        wildcardChar: '*'
	    };
	    baseAstNodeToRegexString = function(astNode, segmentValueCharset) {
	        if (Array.isArray(astNode)) {
	            return stringConcatMap(astNode, function(node) {
	                return baseAstNodeToRegexString(node, segmentValueCharset);
	            });
	        }
	        switch (astNode.tag) {
	            case 'wildcard':
	                return '(.*?)';
	            case 'named':
	                return "([" + segmentValueCharset + "]+)";
	            case 'static':
	                return escapeForRegex(astNode.value);
	            case 'optional':
	                return '(?:' + baseAstNodeToRegexString(astNode.value, segmentValueCharset) + ')?';
	        }
	    };
	    astNodeToRegexString = function(astNode, segmentValueCharset) {
	        if (segmentValueCharset == null) {
	            segmentValueCharset = defaultOptions.segmentValueCharset;
	        }
	        return '^' + baseAstNodeToRegexString(astNode, segmentValueCharset) + '$';
	    };
	    astNodeToNames = function(astNode) {
	        if (Array.isArray(astNode)) {
	            return concatMap(astNode, astNodeToNames);
	        }
	        switch (astNode.tag) {
	            case 'wildcard':
	                return ['_'];
	            case 'named':
	                return [astNode.value];
	            case 'static':
	                return [];
	            case 'optional':
	                return astNodeToNames(astNode.value);
	        }
	    };
	    getParam = function(params, key, nextIndexes, sideEffects) {
	        var index, maxIndex, result, value;
	        if (sideEffects == null) {
	            sideEffects = false;
	        }
	        value = params[key];
	        if (value == null) {
	            if (sideEffects) {
	                throw new Error("no values provided for key `" + key + "`");
	            } else {
	                return;
	            }
	        }
	        index = nextIndexes[key] || 0;
	        maxIndex = Array.isArray(value) ? value.length - 1 : 0;
	        if (index > maxIndex) {
	            if (sideEffects) {
	                throw new Error("too few values provided for key `" + key + "`");
	            } else {
	                return;
	            }
	        }
	        result = Array.isArray(value) ? value[index] : value;
	        if (sideEffects) {
	            nextIndexes[key] = index + 1;
	        }
	        return result;
	    };
	    astNodeContainsSegmentsForProvidedParams = function(astNode, params, nextIndexes) {
	        var i, length;
	        if (Array.isArray(astNode)) {
	            i = -1;
	            length = astNode.length;
	            while (++i < length) {
	                if (astNodeContainsSegmentsForProvidedParams(astNode[i], params, nextIndexes)) {
	                    return true;
	                }
	            }
	            return false;
	        }
	        switch (astNode.tag) {
	            case 'wildcard':
	                return getParam(params, '_', nextIndexes, false) != null;
	            case 'named':
	                return getParam(params, astNode.value, nextIndexes, false) != null;
	            case 'static':
	                return false;
	            case 'optional':
	                return astNodeContainsSegmentsForProvidedParams(astNode.value, params, nextIndexes);
	        }
	    };
	    stringify = function(astNode, params, nextIndexes) {
	        if (Array.isArray(astNode)) {
	            return stringConcatMap(astNode, function(node) {
	                return stringify(node, params, nextIndexes);
	            });
	        }
	        switch (astNode.tag) {
	            case 'wildcard':
	                return getParam(params, '_', nextIndexes, true);
	            case 'named':
	                return getParam(params, astNode.value, nextIndexes, true);
	            case 'static':
	                return astNode.value;
	            case 'optional':
	                if (astNodeContainsSegmentsForProvidedParams(astNode.value, params, nextIndexes)) {
	                    return stringify(astNode.value, params, nextIndexes);
	                } else {
	                    return '';
	                }
	        }
	    };
	    UrlPattern = function(arg1, arg2) {
	        var groupCount, options, parsed, parser, withoutWhitespace;
	        if (arg1 instanceof UrlPattern) {
	            this.isRegex = arg1.isRegex;
	            this.regex = arg1.regex;
	            this.ast = arg1.ast;
	            this.names = arg1.names;
	            return;
	        }
	        this.isRegex = arg1 instanceof RegExp;
	        if (!(('string' === typeof arg1) || this.isRegex)) {
	            throw new TypeError('argument must be a regex or a string');
	        }
	        if (this.isRegex) {
	            this.regex = arg1;
	            if (arg2 != null) {
	                if (!Array.isArray(arg2)) {
	                    throw new Error('if first argument is a regex the second argument may be an array of group names but you provided something else');
	                }
	                groupCount = regexGroupCount(this.regex);
	                if (arg2.length !== groupCount) {
	                    throw new Error("regex contains " + groupCount + " groups but array of group names contains " + arg2.length);
	                }
	                this.names = arg2;
	            }
	            return;
	        }
	        if (arg1 === '') {
	            throw new Error('argument must not be the empty string');
	        }
	        withoutWhitespace = arg1.replace(/\s+/g, '');
	        if (withoutWhitespace !== arg1) {
	            throw new Error('argument must not contain whitespace');
	        }
	        options = {
	            escapeChar: (arg2 != null ? arg2.escapeChar : void 0) || defaultOptions.escapeChar,
	            segmentNameStartChar: (arg2 != null ? arg2.segmentNameStartChar : void 0) || defaultOptions.segmentNameStartChar,
	            segmentNameCharset: (arg2 != null ? arg2.segmentNameCharset : void 0) || defaultOptions.segmentNameCharset,
	            segmentValueCharset: (arg2 != null ? arg2.segmentValueCharset : void 0) || defaultOptions.segmentValueCharset,
	            optionalSegmentStartChar: (arg2 != null ? arg2.optionalSegmentStartChar : void 0) || defaultOptions.optionalSegmentStartChar,
	            optionalSegmentEndChar: (arg2 != null ? arg2.optionalSegmentEndChar : void 0) || defaultOptions.optionalSegmentEndChar,
	            wildcardChar: (arg2 != null ? arg2.wildcardChar : void 0) || defaultOptions.wildcardChar
	        };
	        parser = newParser(options);
	        parsed = parser.pattern(arg1);
	        if (parsed == null) {
	            throw new Error("couldn't parse pattern");
	        }
	        if (parsed.rest !== '') {
	            throw new Error("could only partially parse pattern");
	        }
	        this.ast = parsed.value;
	        this.regex = new RegExp(astNodeToRegexString(this.ast, options.segmentValueCharset));
	        this.names = astNodeToNames(this.ast);
	    };
	    UrlPattern.prototype.match = function(url) {
	        var groups, match;
	        match = this.regex.exec(url);
	        if (match == null) {
	            return null;
	        }
	        groups = match.slice(1);
	        if (this.names) {
	            return keysAndValuesToObject(this.names, groups);
	        } else {
	            return groups;
	        }
	    };
	    UrlPattern.prototype.stringify = function(params) {
	        if (params == null) {
	            params = {};
	        }
	        if (this.isRegex) {
	            throw new Error("can't stringify patterns generated from a regex");
	        }
	        if (params !== Object(params)) {
	            throw new Error("argument must be an object or undefined");
	        }
	        return stringify(this.ast, params, {});
	    };
	    UrlPattern.escapeForRegex = escapeForRegex;
	    UrlPattern.concatMap = concatMap;
	    UrlPattern.stringConcatMap = stringConcatMap;
	    UrlPattern.regexGroupCount = regexGroupCount;
	    UrlPattern.keysAndValuesToObject = keysAndValuesToObject;
	    UrlPattern.P = P;
	    UrlPattern.newParser = newParser;
	    UrlPattern.defaultOptions = defaultOptions;
	    UrlPattern.astNodeToRegexString = astNodeToRegexString;
	    UrlPattern.astNodeToNames = astNodeToNames;
	    UrlPattern.getParam = getParam;
	    UrlPattern.astNodeContainsSegmentsForProvidedParams = astNodeContainsSegmentsForProvidedParams;
	    UrlPattern.stringify = stringify;
	    return UrlPattern;
	}

	class ViewManager
	{
	    constructor( appInstance )
	    {
	        this.app = appInstance;
	        this.rootContainer = this.app.container;
	    }

	    setWindowTitle( title )
	    {
	        if ( window && window.document && window.document.title )
	        {
	            window.document.title = title;
	        }
	    }

	    render( html, element = null )
	    {
	        const targetContainer = element instanceof HTMLElement ? element : this.rootContainer;
	        targetContainer.innerHTML = html;
	    }
	}

	const _extendedFunctions = {};

	function _template( html, data )
	{
	    var me = _template;

	    return (function ()
	    {
	        var name = html,
	            string = (name = 'template(string)', html); // no warnings

	        // Add replaces in here
	        string = string.
	                    replace(/<%/g, '\x11').replace(/%>/g, '\x13'). // if you want other tag, just edit this line
	                    replace(/'(?![^\x11\x13]+?\x13)/g, '\\x27').
	                    replace(/^\s*|\s*$/g, '').
	                    replace(/\n|\r\n/g, function () { return "';\nthis.line = " + (++line) + "; this.ret += '\\n" }).
	                    replace(/\x11=raw(.+?)\x13/g, "' + ($1) + '").
	                    replace(/\x11=nl2br(.+?)\x13/g, "' + this.nl2br($1) + '").
	                    replace(/\x11=tmpl(.+?)\x13/g, "' + this.tmpl($1) + '");


	        Object.keys( _extendedFunctions ).forEach( (v) =>
	        {
	            string = string.replace( new RegExp( '\\x11=' + v + '(.+?)\\x13', 'g' ), "' + this.extFunc[ '" + v + "' ]($1) + '" );
	        });

	        string = string.
	                    replace(/\x11=(.+?)\x13/g, "' + this.escapeHTML($1) + '").
	                    replace(/\x11(.+?)\x13/g, "'; $1; this.ret += '");

	        var line = 1, body = (
	            "try { " +
	            (me.variable ?  "var " + me.variable + " = this.stash;" : "with (this.stash) { ") +
	            "this.ret += '"  + string +
	            "'; " + (me.variable ? "" : "}") + "return this.ret;" +
	            "} catch (e) { throw 'TemplateError: ' + e + ' (on " + name + "' + ' line ' + this.line + ')'; } " +
	            "//@ sourceURL=" + name + "\n" // source map
	        ).replace(/this\.ret \+= '';/g, '');
	        var func = new Function(body);
	        var map  = { '&' : '&amp;', '<' : '&lt;', '>' : '&gt;', '\x22' : '&#x22;', '\x27' : '&#x27;' };
	        var escapeHTML = function (string) { return (''+string).replace(/[&<>\'\"]/g, function (_) { return map[_] }) };
	        var nl2br = function(string) { return escapeHTML(string).replace(/(?:\ r\n|\r|\n)/g, '<br>')};
	        var tmpl = function(d) { return _template( d[0], d[1] ); };
	        return function (stash) { return func.call(me.context = { escapeHTML: escapeHTML, nl2br : nl2br, tmpl: tmpl, extFunc : _extendedFunctions, line: 1, ret : '', stash: stash }) };
	    })()(data);
	}


	class TemplateManager
	{
	    // @todo Think about a templateRootDirectory
	    constructor( appInstance )
	    {
	        this.app = appInstance;
	        this._cache = [];
	    }

	    _getTemplateFromCache( templateUrl )
	    {
	        const cachedTemplate =  this._cache.find( tmpl => tmpl.url === templateUrl );
	        if ( cachedTemplate )
	        {
	            return cachedTemplate.html;
	        }
	    }

	    addTemplateFunction( name, fn )
	    {
	        // @todo Add Check of type function
	        _extendedFunctions[ name ] = fn;
	    }

	    removeTemplateFunction( name )
	    {
	        if ( _extendedFunctions.hasOwnProperty( name ) )
	        {
	            delete _extendedFunctions[ name ];
	        }
	    }

	    compile( tmpl, data = {} )
	    {
	        return _template( tmpl, data );
	    }

	    /*
	//
	//https://www.npmjs.com/package/virtual-dom
	//https://www.npmjs.com/package/preact
	    render( htmlElement, tmpl, date = {} )
	    {
	        //render( this.getHtml( tmpl, data ), htmlElement );
	    }
	     */

	    // rename to render
	    render( htmlElement, tmpl, data = {} )
	    {
	        this.renderHtml(htmlElement, this.compile( tmpl, data ) );
	    }

	    renderHtml( htmlElement, html )
	    {
	        if ( !htmlElement || false === ( htmlElement instanceof HTMLElement ) )
	        {
	            throw new Error( 'First parameter is no valid HTMLElement.' );
	        }

	        htmlElement.innerHTML = html;
	    }

	    async get( templateUrl, useCache = true )
	    {
	        let tmplHtml = useCache ? this._getTemplateFromCache( templateUrl ) : null;
	        if ( !tmplHtml )
	        {
	            const response = await fetch( templateUrl );
	            if ( response.status > 399 )
	            {
	                throw new Error( `${response.status}: ${response.statusText}`);
	            }
	            tmplHtml = await response.text();
	            this._cache.push(
	                {
	                    url : templateUrl,
	                    html : tmplHtml
	                }
	            );
	        }
	        return tmplHtml;
	    }
	}

	class L18n
	{
	    constructor( appInstance )
	    {
	        this.app = appInstance;
	        this.defaultLanguage = 'en';
	        this.currentLanguage = this.defaultLanguage;

	        this.dictionary = {};
	    }

	    expose( fnName = '_lc' )
	    {
	        if ( window )
	        {
	            window[ fnName ] = this.getLocale.bind( this );
	        }
	    }

	    getLocale( key, params )
	    {
	        const defaultLanguage = this.defaultLanguage,
	            language = this.currentLanguage,
	            dictionary = this.dictionary;

	        if ( language && dictionary[ language ].hasOwnProperty( key ) )
	        {
	            return dictionary[ language][ key ].replace(/{(\d+)}/g, function(match, number)
	            {
	                return typeof params[number] != 'undefined'
	                    ? params[number]
	                    : match
	                    ;
	            });
	        }
	        else if ( defaultLanguage &&
	            dictionary.hasOwnProperty( defaultLanguage ) &&
	            dictionary[ defaultLanguage ].hasOwnProperty( key ) )
	        {
	            return dictionary[ defaultLanguage ][ key ].replace(/{(\d+)}/g, function(match, number)
	            {
	                return typeof params[number] != 'undefined'
	                    ? params[number]
	                    : match
	                    ;
	            });
	        }
	        else
	        {
	            return '###' + key + '###';
	        }
	    }
	}

	class PathObject
	{
	    constructor( properties = {} )
	    {
	        this._props = properties;
	    }

	    /**
	     * Taken from lodash.
	     * Refer to:
	     * https://github.com/lodash/lodash/blob/4.17.15/lodash.js#L13126
	     *
	     * Gets the value at `path` of `object`. If the resolved value is
	     * `undefined`, the `defaultValue` is returned in its place.
	     *
	     * @param {Array|string} path The path of the property to get.
	     * @param {*} [defaultValue] The value returned for `undefined` resolved values. Default is null
	     * @returns {*} Returns the resolved value.
	     * @example
	     *
	     * const pathObject = new PathObject( { 'a': [{ 'b': { 'c': 3 } }] } );
	     *
	     * pathObject.get('a[0].b.c');
	     * // => 3
	     *
	     * pathObject.get(['a', '0', 'b', 'c']);
	     * // => 3
	     *
	     * pathObject.get('a.b.c', 'default');
	     * // => 'default'
	     */
	    get( path, defaultValue = null )
	    {
	        return get( this._props, path, defaultValue );
	    }

	    /**
	     * Sets the value at `path` of `object`. If a portion of `path` doesn't exist,
	     * it's created. Arrays are created for missing index properties while objects
	     * are created for all other missing properties. Use `_.setWith` to customize
	     * `path` creation.
	     *
	     * **Note:** This method mutates `object`.
	     *
	     * @static
	     * @memberOf _
	     * @since 3.7.0
	     * @category Object
	     * @param {Object} object The object to modify.
	     * @param {Array|string} path The path of the property to set.
	     * @param {*} value The value to set.
	     * @returns {Object} Returns `object`.
	     * @example
	     *
	     * var object = { 'a': [{ 'b': { 'c': 3 } }] };
	     *
	     * _.set(object, 'a[0].b.c', 4);
	     * console.log(object.a[0].b.c);
	     * // => 4
	     *
	     * _.set(object, ['x', '0', 'y', 'z'], 5);
	     * console.log(object.x[0].y.z);
	     * // => 5
	     */
	    set( path, value )
	    {
	        return set( this._props, path, value );
	    }
	}


	/**
	 * lodash (Custom Build) <https://lodash.com/>
	 * Build: `lodash modularize exports="npm" -o ./`
	 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
	 * Released under MIT license <https://lodash.com/license>
	 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
	 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
	 */

	/** Used as the `TypeError` message for "Functions" methods. */
	var FUNC_ERROR_TEXT = 'Expected a function';

	/** Used to stand-in for `undefined` hash values. */
	var HASH_UNDEFINED = '__lodash_hash_undefined__';

	/** Used as references for various `Number` constants. */
	var INFINITY = 1 / 0;

	/** `Object#toString` result references. */
	var funcTag = '[object Function]',
	    genTag = '[object GeneratorFunction]',
	    symbolTag = '[object Symbol]';

	/** Used to match property names within property paths. */
	var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
	    reIsPlainProp = /^\w*$/,
	    reLeadingDot = /^\./,
	    rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

	/**
	 * Used to match `RegExp`
	 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
	 */
	var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

	/** Used to match backslashes in property paths. */
	var reEscapeChar = /\\(\\)?/g;

	/** Used to detect host constructors (Safari). */
	var reIsHostCtor = /^\[object .+?Constructor\]$/;

	/** Detect free variable `global` from Node.js. */
	var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

	/** Detect free variable `self`. */
	var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

	/** Used as a reference to the global object. */
	var root = freeGlobal || freeSelf || Function('return this')();

	/**
	 * Gets the value at `key` of `object`.
	 *
	 * @private
	 * @param {Object} [object] The object to query.
	 * @param {string} key The key of the property to get.
	 * @returns {*} Returns the property value.
	 */
	function getValue(object, key) {
	    return object == null ? undefined : object[key];
	}

	/**
	 * Checks if `value` is a host object in IE < 9.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
	 */
	function isHostObject(value) {
	    // Many host objects are `Object` objects that can coerce to strings
	    // despite having improperly defined `toString` methods.
	    var result = false;
	    if (value != null && typeof value.toString != 'function') {
	        try {
	            result = !!(value + '');
	        } catch (e) {}
	    }
	    return result;
	}

	/** Used for built-in method references. */
	var arrayProto = Array.prototype,
	    funcProto = Function.prototype,
	    objectProto = Object.prototype;

	/** Used to detect overreaching core-js shims. */
	var coreJsData = root['__core-js_shared__'];

	/** Used to detect methods masquerading as native. */
	var maskSrcKey = (function() {
	    var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
	    return uid ? ('Symbol(src)_1.' + uid) : '';
	}());

	/** Used to resolve the decompiled source of functions. */
	var funcToString = funcProto.toString;

	/** Used to check objects for own properties. */
	var hasOwnProperty = objectProto.hasOwnProperty;

	/**
	 * Used to resolve the
	 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
	 * of values.
	 */
	var objectToString = objectProto.toString;

	/** Used to detect if a method is native. */
	var reIsNative = RegExp('^' +
	    funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
	        .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
	);

	/** Built-in value references. */
	var Symbol = root.Symbol,
	    splice = arrayProto.splice;

	/* Built-in method references that are verified to be native. */
	var Map = getNative(root, 'Map'),
	    nativeCreate = getNative(Object, 'create');

	/** Used to convert symbols to primitives and strings. */
	var symbolProto = Symbol ? Symbol.prototype : undefined,
	    symbolToString = symbolProto ? symbolProto.toString : undefined;

	/**
	 * Creates a hash object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function Hash(entries) {
	    var index = -1,
	        length = entries ? entries.length : 0;

	    this.clear();
	    while (++index < length) {
	        var entry = entries[index];
	        this.set(entry[0], entry[1]);
	    }
	}

	/**
	 * Removes all key-value entries from the hash.
	 *
	 * @private
	 * @name clear
	 * @memberOf Hash
	 */
	function hashClear() {
	    this.__data__ = nativeCreate ? nativeCreate(null) : {};
	}

	/**
	 * Removes `key` and its value from the hash.
	 *
	 * @private
	 * @name delete
	 * @memberOf Hash
	 * @param {Object} hash The hash to modify.
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function hashDelete(key) {
	    return this.has(key) && delete this.__data__[key];
	}

	/**
	 * Gets the hash value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf Hash
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function hashGet(key) {
	    var data = this.__data__;
	    if (nativeCreate) {
	        var result = data[key];
	        return result === HASH_UNDEFINED ? undefined : result;
	    }
	    return hasOwnProperty.call(data, key) ? data[key] : undefined;
	}

	/**
	 * Checks if a hash value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf Hash
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function hashHas(key) {
	    var data = this.__data__;
	    return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
	}

	/**
	 * Sets the hash `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf Hash
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the hash instance.
	 */
	function hashSet(key, value) {
	    var data = this.__data__;
	    data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
	    return this;
	}

	// Add methods to `Hash`.
	Hash.prototype.clear = hashClear;
	Hash.prototype['delete'] = hashDelete;
	Hash.prototype.get = hashGet;
	Hash.prototype.has = hashHas;
	Hash.prototype.set = hashSet;

	/**
	 * Creates an list cache object.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function ListCache(entries) {
	    var index = -1,
	        length = entries ? entries.length : 0;

	    this.clear();
	    while (++index < length) {
	        var entry = entries[index];
	        this.set(entry[0], entry[1]);
	    }
	}

	/**
	 * Removes all key-value entries from the list cache.
	 *
	 * @private
	 * @name clear
	 * @memberOf ListCache
	 */
	function listCacheClear() {
	    this.__data__ = [];
	}

	/**
	 * Removes `key` and its value from the list cache.
	 *
	 * @private
	 * @name delete
	 * @memberOf ListCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function listCacheDelete(key) {
	    var data = this.__data__,
	        index = assocIndexOf(data, key);

	    if (index < 0) {
	        return false;
	    }
	    var lastIndex = data.length - 1;
	    if (index == lastIndex) {
	        data.pop();
	    } else {
	        splice.call(data, index, 1);
	    }
	    return true;
	}

	/**
	 * Gets the list cache value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf ListCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function listCacheGet(key) {
	    var data = this.__data__,
	        index = assocIndexOf(data, key);

	    return index < 0 ? undefined : data[index][1];
	}

	/**
	 * Checks if a list cache value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf ListCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function listCacheHas(key) {
	    return assocIndexOf(this.__data__, key) > -1;
	}

	/**
	 * Sets the list cache `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf ListCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the list cache instance.
	 */
	function listCacheSet(key, value) {
	    var data = this.__data__,
	        index = assocIndexOf(data, key);

	    if (index < 0) {
	        data.push([key, value]);
	    } else {
	        data[index][1] = value;
	    }
	    return this;
	}

	// Add methods to `ListCache`.
	ListCache.prototype.clear = listCacheClear;
	ListCache.prototype['delete'] = listCacheDelete;
	ListCache.prototype.get = listCacheGet;
	ListCache.prototype.has = listCacheHas;
	ListCache.prototype.set = listCacheSet;

	/**
	 * Creates a map cache object to store key-value pairs.
	 *
	 * @private
	 * @constructor
	 * @param {Array} [entries] The key-value pairs to cache.
	 */
	function MapCache(entries) {
	    var index = -1,
	        length = entries ? entries.length : 0;

	    this.clear();
	    while (++index < length) {
	        var entry = entries[index];
	        this.set(entry[0], entry[1]);
	    }
	}

	/**
	 * Removes all key-value entries from the map.
	 *
	 * @private
	 * @name clear
	 * @memberOf MapCache
	 */
	function mapCacheClear() {
	    this.__data__ = {
	        'hash': new Hash,
	        'map': new (Map || ListCache),
	        'string': new Hash
	    };
	}

	/**
	 * Removes `key` and its value from the map.
	 *
	 * @private
	 * @name delete
	 * @memberOf MapCache
	 * @param {string} key The key of the value to remove.
	 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
	 */
	function mapCacheDelete(key) {
	    return getMapData(this, key)['delete'](key);
	}

	/**
	 * Gets the map value for `key`.
	 *
	 * @private
	 * @name get
	 * @memberOf MapCache
	 * @param {string} key The key of the value to get.
	 * @returns {*} Returns the entry value.
	 */
	function mapCacheGet(key) {
	    return getMapData(this, key).get(key);
	}

	/**
	 * Checks if a map value for `key` exists.
	 *
	 * @private
	 * @name has
	 * @memberOf MapCache
	 * @param {string} key The key of the entry to check.
	 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
	 */
	function mapCacheHas(key) {
	    return getMapData(this, key).has(key);
	}

	/**
	 * Sets the map `key` to `value`.
	 *
	 * @private
	 * @name set
	 * @memberOf MapCache
	 * @param {string} key The key of the value to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns the map cache instance.
	 */
	function mapCacheSet(key, value) {
	    getMapData(this, key).set(key, value);
	    return this;
	}

	// Add methods to `MapCache`.
	MapCache.prototype.clear = mapCacheClear;
	MapCache.prototype['delete'] = mapCacheDelete;
	MapCache.prototype.get = mapCacheGet;
	MapCache.prototype.has = mapCacheHas;
	MapCache.prototype.set = mapCacheSet;

	/**
	 * Gets the index at which the `key` is found in `array` of key-value pairs.
	 *
	 * @private
	 * @param {Array} array The array to inspect.
	 * @param {*} key The key to search for.
	 * @returns {number} Returns the index of the matched value, else `-1`.
	 */
	function assocIndexOf(array, key) {
	    var length = array.length;
	    while (length--) {
	        if (eq(array[length][0], key)) {
	            return length;
	        }
	    }
	    return -1;
	}

	/**
	 * The base implementation of `_.get` without support for default values.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path of the property to get.
	 * @returns {*} Returns the resolved value.
	 */
	function baseGet(object, path) {
	    path = isKey(path, object) ? [path] : castPath(path);

	    var index = 0,
	        length = path.length;

	    while (object != null && index < length) {
	        object = object[toKey(path[index++])];
	    }
	    return (index && index == length) ? object : undefined;
	}

	/**
	 * The base implementation of `_.isNative` without bad shim checks.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a native function,
	 *  else `false`.
	 */
	function baseIsNative(value) {
	    if (!isObject(value) || isMasked(value)) {
	        return false;
	    }
	    var pattern = (isFunction(value) || isHostObject(value)) ? reIsNative : reIsHostCtor;
	    return pattern.test(toSource(value));
	}

	/**
	 * The base implementation of `_.toString` which doesn't convert nullish
	 * values to empty strings.
	 *
	 * @private
	 * @param {*} value The value to process.
	 * @returns {string} Returns the string.
	 */
	function baseToString(value) {
	    // Exit early for strings to avoid a performance hit in some environments.
	    if (typeof value == 'string') {
	        return value;
	    }
	    if (isSymbol(value)) {
	        return symbolToString ? symbolToString.call(value) : '';
	    }
	    var result = (value + '');
	    return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
	}

	/**
	 * Casts `value` to a path array if it's not one.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @returns {Array} Returns the cast property path array.
	 */
	function castPath(value) {
	    return isArray(value) ? value : stringToPath(value);
	}

	/**
	 * Gets the data for `map`.
	 *
	 * @private
	 * @param {Object} map The map to query.
	 * @param {string} key The reference key.
	 * @returns {*} Returns the map data.
	 */
	function getMapData(map, key) {
	    var data = map.__data__;
	    return isKeyable(key)
	        ? data[typeof key == 'string' ? 'string' : 'hash']
	        : data.map;
	}

	/**
	 * Gets the native function at `key` of `object`.
	 *
	 * @private
	 * @param {Object} object The object to query.
	 * @param {string} key The key of the method to get.
	 * @returns {*} Returns the function if it's native, else `undefined`.
	 */
	function getNative(object, key) {
	    var value = getValue(object, key);
	    return baseIsNative(value) ? value : undefined;
	}

	/**
	 * Checks if `value` is a property name and not a property path.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {Object} [object] The object to query keys on.
	 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
	 */
	function isKey(value, object) {
	    if (isArray(value)) {
	        return false;
	    }
	    var type = typeof value;
	    if (type == 'number' || type == 'symbol' || type == 'boolean' ||
	        value == null || isSymbol(value)) {
	        return true;
	    }
	    return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
	        (object != null && value in Object(object));
	}

	/**
	 * Checks if `value` is suitable for use as unique object key.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
	 */
	function isKeyable(value) {
	    var type = typeof value;
	    return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
	        ? (value !== '__proto__')
	        : (value === null);
	}

	/**
	 * Checks if `func` has its source masked.
	 *
	 * @private
	 * @param {Function} func The function to check.
	 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
	 */
	function isMasked(func) {
	    return !!maskSrcKey && (maskSrcKey in func);
	}

	/**
	 * Converts `string` to a property path array.
	 *
	 * @private
	 * @param {string} string The string to convert.
	 * @returns {Array} Returns the property path array.
	 */
	var stringToPath = memoize(function(string) {
	    string = toString(string);

	    var result = [];
	    if (reLeadingDot.test(string)) {
	        result.push('');
	    }
	    string.replace(rePropName, function(match, number, quote, string) {
	        result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
	    });
	    return result;
	});

	/**
	 * Converts `value` to a string key if it's not a string or symbol.
	 *
	 * @private
	 * @param {*} value The value to inspect.
	 * @returns {string|symbol} Returns the key.
	 */
	function toKey(value) {
	    if (typeof value == 'string' || isSymbol(value)) {
	        return value;
	    }
	    var result = (value + '');
	    return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
	}

	/**
	 * Converts `func` to its source code.
	 *
	 * @private
	 * @param {Function} func The function to process.
	 * @returns {string} Returns the source code.
	 */
	function toSource(func) {
	    if (func != null) {
	        try {
	            return funcToString.call(func);
	        } catch (e) {}
	        try {
	            return (func + '');
	        } catch (e) {}
	    }
	    return '';
	}

	/**
	 * Creates a function that memoizes the result of `func`. If `resolver` is
	 * provided, it determines the cache key for storing the result based on the
	 * arguments provided to the memoized function. By default, the first argument
	 * provided to the memoized function is used as the map cache key. The `func`
	 * is invoked with the `this` binding of the memoized function.
	 *
	 * **Note:** The cache is exposed as the `cache` property on the memoized
	 * function. Its creation may be customized by replacing the `_.memoize.Cache`
	 * constructor with one whose instances implement the
	 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
	 * method interface of `delete`, `get`, `has`, and `set`.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Function
	 * @param {Function} func The function to have its output memoized.
	 * @param {Function} [resolver] The function to resolve the cache key.
	 * @returns {Function} Returns the new memoized function.
	 * @example
	 *
	 * var object = { 'a': 1, 'b': 2 };
	 * var other = { 'c': 3, 'd': 4 };
	 *
	 * var values = _.memoize(_.values);
	 * values(object);
	 * // => [1, 2]
	 *
	 * values(other);
	 * // => [3, 4]
	 *
	 * object.a = 2;
	 * values(object);
	 * // => [1, 2]
	 *
	 * // Modify the result cache.
	 * values.cache.set(object, ['a', 'b']);
	 * values(object);
	 * // => ['a', 'b']
	 *
	 * // Replace `_.memoize.Cache`.
	 * _.memoize.Cache = WeakMap;
	 */
	function memoize(func, resolver) {
	    if (typeof func != 'function' || (resolver && typeof resolver != 'function')) {
	        throw new TypeError(FUNC_ERROR_TEXT);
	    }
	    var memoized = function() {
	        var args = arguments,
	            key = resolver ? resolver.apply(this, args) : args[0],
	            cache = memoized.cache;

	        if (cache.has(key)) {
	            return cache.get(key);
	        }
	        var result = func.apply(this, args);
	        memoized.cache = cache.set(key, result);
	        return result;
	    };
	    memoized.cache = new (memoize.Cache || MapCache);
	    return memoized;
	}

	// Assign cache to `_.memoize`.
	memoize.Cache = MapCache;

	/**
	 * Performs a
	 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * comparison between two values to determine if they are equivalent.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to compare.
	 * @param {*} other The other value to compare.
	 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
	 * @example
	 *
	 * var object = { 'a': 1 };
	 * var other = { 'a': 1 };
	 *
	 * _.eq(object, object);
	 * // => true
	 *
	 * _.eq(object, other);
	 * // => false
	 *
	 * _.eq('a', 'a');
	 * // => true
	 *
	 * _.eq('a', Object('a'));
	 * // => false
	 *
	 * _.eq(NaN, NaN);
	 * // => true
	 */
	function eq(value, other) {
	    return value === other || (value !== value && other !== other);
	}

	/**
	 * Checks if `value` is classified as an `Array` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
	 * @example
	 *
	 * _.isArray([1, 2, 3]);
	 * // => true
	 *
	 * _.isArray(document.body.children);
	 * // => false
	 *
	 * _.isArray('abc');
	 * // => false
	 *
	 * _.isArray(_.noop);
	 * // => false
	 */
	var isArray = Array.isArray;

	/**
	 * Checks if `value` is classified as a `Function` object.
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
	 * @example
	 *
	 * _.isFunction(_);
	 * // => true
	 *
	 * _.isFunction(/abc/);
	 * // => false
	 */
	function isFunction(value) {
	    // The use of `Object#toString` avoids issues with the `typeof` operator
	    // in Safari 8-9 which returns 'object' for typed array and other constructors.
	    var tag = isObject(value) ? objectToString.call(value) : '';
	    return tag == funcTag || tag == genTag;
	}

	/**
	 * Checks if `value` is the
	 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
	 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
	 *
	 * @static
	 * @memberOf _
	 * @since 0.1.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
	 * @example
	 *
	 * _.isObject({});
	 * // => true
	 *
	 * _.isObject([1, 2, 3]);
	 * // => true
	 *
	 * _.isObject(_.noop);
	 * // => true
	 *
	 * _.isObject(null);
	 * // => false
	 */
	function isObject(value) {
	    var type = typeof value;
	    return !!value && (type == 'object' || type == 'function');
	}

	/**
	 * Checks if `value` is object-like. A value is object-like if it's not `null`
	 * and has a `typeof` result of "object".
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
	 * @example
	 *
	 * _.isObjectLike({});
	 * // => true
	 *
	 * _.isObjectLike([1, 2, 3]);
	 * // => true
	 *
	 * _.isObjectLike(_.noop);
	 * // => false
	 *
	 * _.isObjectLike(null);
	 * // => false
	 */
	function isObjectLike(value) {
	    return !!value && typeof value == 'object';
	}

	/**
	 * Checks if `value` is classified as a `Symbol` primitive or object.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to check.
	 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
	 * @example
	 *
	 * _.isSymbol(Symbol.iterator);
	 * // => true
	 *
	 * _.isSymbol('abc');
	 * // => false
	 */
	function isSymbol(value) {
	    return typeof value == 'symbol' ||
	        (isObjectLike(value) && objectToString.call(value) == symbolTag);
	}

	/**
	 * Converts `value` to a string. An empty string is returned for `null`
	 * and `undefined` values. The sign of `-0` is preserved.
	 *
	 * @static
	 * @memberOf _
	 * @since 4.0.0
	 * @category Lang
	 * @param {*} value The value to process.
	 * @returns {string} Returns the string.
	 * @example
	 *
	 * _.toString(null);
	 * // => ''
	 *
	 * _.toString(-0);
	 * // => '-0'
	 *
	 * _.toString([1, 2, 3]);
	 * // => '1,2,3'
	 */
	function toString(value) {
	    return value == null ? '' : baseToString(value);
	}

	/**
	 * Gets the value at `path` of `object`. If the resolved value is
	 * `undefined`, the `defaultValue` is returned in its place.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.7.0
	 * @category Object
	 * @param {Object} object The object to query.
	 * @param {Array|string} path The path of the property to get.
	 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
	 * @returns {*} Returns the resolved value.
	 * @example
	 *
	 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
	 *
	 * _.get(object, 'a[0].b.c');
	 * // => 3
	 *
	 * _.get(object, ['a', '0', 'b', 'c']);
	 * // => 3
	 *
	 * _.get(object, 'a.b.c', 'default');
	 * // => 'default'
	 */
	function get(object, path, defaultValue) {
	    var result = object == null ? undefined : baseGet(object, path);
	    return result === undefined ? defaultValue : result;
	}


	// start: set

	/** Used as references for various `Number` constants. */
	var MAX_SAFE_INTEGER = 9007199254740991;

	// Add methods to `Hash`.
	Hash.prototype.clear = hashClear;
	Hash.prototype['delete'] = hashDelete;
	Hash.prototype.get = hashGet;
	Hash.prototype.has = hashHas;
	Hash.prototype.set = hashSet;

	// Add methods to `ListCache`.
	ListCache.prototype.clear = listCacheClear;
	ListCache.prototype['delete'] = listCacheDelete;
	ListCache.prototype.get = listCacheGet;
	ListCache.prototype.has = listCacheHas;
	ListCache.prototype.set = listCacheSet;

	// Add methods to `MapCache`.
	MapCache.prototype.clear = mapCacheClear;
	MapCache.prototype['delete'] = mapCacheDelete;
	MapCache.prototype.get = mapCacheGet;
	MapCache.prototype.has = mapCacheHas;
	MapCache.prototype.set = mapCacheSet;

	/**
	 * Assigns `value` to `key` of `object` if the existing value is not equivalent
	 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
	 * for equality comparisons.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {string} key The key of the property to assign.
	 * @param {*} value The value to assign.
	 */
	function assignValue(object, key, value) {
	    var objValue = object[key];
	    if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) ||
	        (value === undefined && !(key in object))) {
	        object[key] = value;
	    }
	}

	/**
	 * The base implementation of `_.set`.
	 *
	 * @private
	 * @param {Object} object The object to modify.
	 * @param {Array|string} path The path of the property to set.
	 * @param {*} value The value to set.
	 * @param {Function} [customizer] The function to customize path creation.
	 * @returns {Object} Returns `object`.
	 */
	function baseSet(object, path, value, customizer) {
	    if (!isObject(object)) {
	        return object;
	    }
	    path = isKey(path, object) ? [path] : castPath(path);

	    var index = -1,
	        length = path.length,
	        lastIndex = length - 1,
	        nested = object;

	    while (nested != null && ++index < length) {
	        var key = toKey(path[index]),
	            newValue = value;

	        if (index != lastIndex) {
	            var objValue = nested[key];
	            newValue = customizer ? customizer(objValue, key, nested) : undefined;
	            if (newValue === undefined) {
	                newValue = isObject(objValue)
	                    ? objValue
	                    : (isIndex(path[index + 1]) ? [] : {});
	            }
	        }
	        assignValue(nested, key, newValue);
	        nested = nested[key];
	    }
	    return object;
	}

	/**
	 * Checks if `value` is a valid array-like index.
	 *
	 * @private
	 * @param {*} value The value to check.
	 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
	 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
	 */
	function isIndex(value, length) {
	    length = length == null ? MAX_SAFE_INTEGER : length;
	    return !!length &&
	        (typeof value == 'number' || reIsUint.test(value)) &&
	        (value > -1 && value % 1 == 0 && value < length);
	}

	// Assign cache to `_.memoize`.
	memoize.Cache = MapCache;

	/**
	 * Sets the value at `path` of `object`. If a portion of `path` doesn't exist,
	 * it's created. Arrays are created for missing index properties while objects
	 * are created for all other missing properties. Use `_.setWith` to customize
	 * `path` creation.
	 *
	 * **Note:** This method mutates `object`.
	 *
	 * @static
	 * @memberOf _
	 * @since 3.7.0
	 * @category Object
	 * @param {Object} object The object to modify.
	 * @param {Array|string} path The path of the property to set.
	 * @param {*} value The value to set.
	 * @returns {Object} Returns `object`.
	 * @example
	 *
	 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
	 *
	 * _.set(object, 'a[0].b.c', 4);
	 * console.log(object.a[0].b.c);
	 * // => 4
	 *
	 * _.set(object, ['x', '0', 'y', 'z'], 5);
	 * console.log(object.x[0].y.z);
	 * // => 5
	 */
	function set(object, path, value) {
	    return object == null ? object : baseSet(object, path, value);
	}

	const VERSION = '0.8.2';

	const DEFAULT_PROPS = {
	    "uid" : null,
	    "title" : null,
	    "container" : null
	};

	const DEFAULT_SETTINGS = {
	    "app" : {
	        "sayHello" : true,
	    },
	    "l18n" : {
	        "defaultLanguage" : "en"
	    },
	    "router" : {
	        "isEnabled" : true
	    },
	    "stateManager" : {
	        "rootPath" : ""
	    },
	    "viewManager" : {
	    },
	    "templateManager" : {
	        "rootPath" : ""
	    }
	};

	class App
	{
	    static POOL = {};

	    static get( uid = null )
	    {
	        if ( uid && App.POOL.hasOwnProperty( uid ) )
	        {
	            return App.POOL[ uid ];
	        }
	        else if ( null === uid &&  Object.keys( App.POOL ).length > 0 )
	        {
	            return App.POOL[ Object.keys( App.POOL )[ 0 ] ];
	        }
	        else
	        {
	            return null;
	        }
	    }

	    constructor( props = {}, settings = {} )
	    {
	        props = { ...DEFAULT_PROPS, ...props };
	        for ( let prop in props )
	        {
	            this[ prop ] = props[ prop ];
	        }

	        if ( !this.uid )
	        {
	            this.uid = Helper.createUid();
	        }

	        this.settings = new PathObject( { ...DEFAULT_SETTINGS, settings } );

	        // If container property is a string, check if it is a querySelector
	        if ( Helper.isString( this.container ) )
	        {
	            this.container = document.querySelector( this.container );
	        }

	        if ( !this.container || false === this.container instanceof HTMLElement )
	        {
	            this.container = document.querySelector( 'body' );
	        }

	        // Init core components
	        this.initL18n();
	        this.initStateManager();
	        this.initViewManager();
	        this.initTemplateManager();
	        this.initRouter();

	        // Add app to global app pool
	        App.POOL[ this.uid ] = this;

	        if ( true === this.settings.get( 'app.sayHello' ) && console )
	        {
	            console && console.log( "%c»InfrontJS« Version " + VERSION, "font-family: monospace sans-serif; background-color: black; color: white;" );
	        }
	    }

	    initL18n()
	    {
	        this.l18n = new L18n( this );

	    }
	    initStateManager()
	    {
	        this.stateManager = new StateManager( this );
	    }

	    initRouter()
	    {
	        this.router = new Router( this );
	    }

	    initViewManager()
	    {
	        this.viewManager = new ViewManager( this );
	    }

	    initTemplateManager()
	    {
	        this.templateManager = new TemplateManager( this );
	    }

	    getVersion()
	    {
	        return VERSION;
	    }

	    async run( route = null )
	    {
	        if ( this.title )
	        {
	            this.viewManager.setWindowTitle( this.title );
	        }

	        this.router.enable();
	        if ( route )
	        {
	            // @todo Fix this for "url" router mode
	            this.router.redirect( route, ( this.router.resolveRoute( route ) === this.router.resolveRoute( location.hash ) ) );
	        }
	        else
	        {
	            this.router.processHash();
	        }
	    }

	    async destroy()
	    {
	        // @todo Implement logic, set innerHTML to zero ... etc
	    }
	}

	class Http
	{
	    constructor( endpoint = '', headers = {} )
	    {
	        this.endpoint = Helper.trim( endpoint, '/' );
	        if ( this.endpoint.length <= 1 )
	        {
	            throw new Error( 'No endpoint set.' );
	        }

	        this.headers = new Headers( headers );
	    }

	    async get( route, cb = null )
	    {
	        let r = Helper.trim( route, "/" ),
	            req = new Request( this.endpoint + '/' + r, this._createFetchOptions( "GET" ) );

	        return await this._fetch( req, cb );
	    }

	    async post( route, data = {}, cb = null )
	    {
	        let r = Helper.trim( route, "/" ),
	            req = new Request( this.endpoint + '/' + r, this._createFetchOptions( "POST", data ) );
	        return await this._fetch( req, cb );
	    }

	    async delete( route, cb = null )
	    {
	        let r = Helper.trim( route, "/" ),
	            req = new Request( this.endpoint + '/' + r,  this._createFetchOptions( "DELETE" ) );
	        return await this._fetch( req, cb );
	    }

	    async put( route, data = {}, cb = null )
	    {
	        let r = Helper.trim( route, "/" ),
	            req = new Request( this.endpoint + '/' + r, this._createFetchOptions( "PUT", data )  );
	        return await this._fetch( req, cb );
	    }

	    async patch( route, data = {}, cb = null )
	    {
	        let r = Helper.trim( route, "/" ),
	            req = new Request( this.endpoint + '/' + r, this._createFetchOptions( "PATCH", data ) );
	        return await this._fetch( req, cb );
	    }

	    async _fetch( req, cb = null )
	    {
	        if ( cb )
	        {
	            fetch( req )
	                .then( response => response.json() )
	                .then( json => cb( null, json ) )
	                .catch( error => cb( error, null ) );
	        }
	        else
	        {
	            const response = await fetch( req );
	            const json = await response.json();
	            return json;
	        }
	    }

	    _createFetchOptions( method, data = null )
	    {
	        const opts = {
	            "method" : method.toUpperCase(),
	            "headers" : this.headers
	        };
	        if ( Helper.isPlainObject( data ) )
	        {
	            opts.body = JSON.stringify( data );
	        }
	        return opts;
	    }
	}

	exports.App = App;
	exports.Helper = Helper;
	exports.Http = Http;
	exports.L18n = L18n;
	exports.PathObject = PathObject;
	exports.Router = Router;
	exports.State = State;
	exports.StateManager = StateManager;
	exports.TemplateManager = TemplateManager;
	exports.ViewManager = ViewManager;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
