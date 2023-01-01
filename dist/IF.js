(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.IF = {}));
})(this, (function (exports) { 'use strict';

	class State
	{
	    static ID = null;
	    static IS_DEFAULT = false;

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

	class Router
	{
	    static ACTION_TYPE_FUNCTION = "function";
	    static ACTION_TYPE_STATE = "state";

	    constructor( appInstance )
	    {
	        this._routeActions = [];
	        this.app = appInstance;
	        this.isEnabled = false;
	        this.previousRoute = null;
	        this.currentRoute = null;
	    }

	    // Add third optional param called isIndexAction to be triggered, when route is empty
	    addRoute( route, action )
	    {
	        Helper.trim( route, '/' );
	            let type = Router.ACTION_TYPE_FUNCTION;

	        if ( true === Helper.isClass( action ) ) // @todo fix - this does not work for webpack in production mode && true === isClassChildOf( action, 'State' )  )
	        {
	            type = Router.ACTION_TYPE_STATE;
	            this.app.stateManager.addState( action );
	            this._routeActions.push(
	                {
	                    "type" : type,
	                    "action" : action.ID,
	                    "route" : new UrlPattern()
	                }
	            );
	        }
	        // else: check if object and if object has an enter and exit method
	        else
	        {
	            throw new Error( 'Invalid action type.' );
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
	            let sp = new URLSearchParams( routeSplits[ 1 ] );
	            query = Object.fromEntries( sp.entries() );
	        }

	        for (let si = 0; si < this._routeActions.length; si++ )
	        {
	            params = this._routeActions[ si ].route.match( route );
	            if ( params )
	            {
	                routeData = {
	                    "routeActionData" : this._routeActions[ si ],
	                    "routeParams" : new RouteParams( params, query )
	                };
	                break;
	            }
	        }

	        return routeData;
	    }

	    enable()
	    {
	        if ( true === this.isEnabled )
	        {
	            return;
	        }
	        this.isEnabled = true;
	        window.addEventListener( 'hashchange', this.processHash.bind( this ) );
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
	        this.execute( route );
	    }

	    redirect( url, forceReload = false )
	    {
	        location.hash = '/' + Helper.trim( url, '/' );
	        if ( true === forceReload )
	        {
	            this.processHash();
	        }
	    }

	    resolveRoute( route )
	    {
	        let r = Helper.trim( route, '/#' );
	        r = Helper.trim( r, '#' );
	        r = Helper.trim( r, '/' );

	        return '/' + r;
	    }

	    async execute( route )
	    {
	        // Get view call
	        try
	        {
	            const actionData = this.resolveActionDataByRoute( route );
	            if ( actionData && actionData.hasOwnProperty( 'routeActionData' ) && actionData.hasOwnProperty( 'routeParams' ) )
	            {
	                switch( actionData.routeActionData.type )
	                {
	                    case Router.ACTION_TYPE_STATE:
	                        let stateInstance = this.app.stateManager.createState(
	                            actionData.routeActionData.action,
	                            actionData.routeParams
	                        );
	                        await this.app.stateManager.switchTo( stateInstance );
	                    break;
	                }
	            }
	            else if ( null === actionData && null !== this.app.stateManager.getDefaultStateId() )
	            {
	                const defaultStateInstance = this.app.stateManager.createState( this.app.stateManager.getDefaultStateId(), new RouteParams() );
	                await this.app.stateManager.switchTo( defaultStateInstance );
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
	function UrlPattern() {
	    var slice = [].slice;
	    var P, UP, astNodeContainsSegmentsForProvidedParams, astNodeToNames, astNodeToRegexString, baseAstNodeToRegexString, concatMap, defaultOptions, escapeForRegex, getParam, keysAndValuesToObject, newParser, regexGroupCount, stringConcatMap, stringify;
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
	    UP = function(arg1, arg2) {
	        var groupCount, options, parsed, parser, withoutWhitespace;
	        if (arg1 instanceof UP) {
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
	    UP.prototype.match = function(url) {
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
	    UP.prototype.stringify = function(params) {
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
	    UP.escapeForRegex = escapeForRegex;
	    UP.concatMap = concatMap;
	    UP.stringConcatMap = stringConcatMap;
	    UP.regexGroupCount = regexGroupCount;
	    UP.keysAndValuesToObject = keysAndValuesToObject;
	    UP.P = P;
	    UP.newParser = newParser;
	    UP.defaultOptions = defaultOptions;
	    UP.astNodeToRegexString = astNodeToRegexString;
	    UP.astNodeToNames = astNodeToNames;
	    UP.getParam = getParam;
	    UP.astNodeContainsSegmentsForProvidedParams = astNodeContainsSegmentsForProvidedParams;
	    UP.stringify = stringify;
	    return UP;
	}

	class StateManager
	{
	    constructor( appInstance )
	    {
	        this._states =  {};
	        this.app = appInstance;
	        this.currentState = null;
	        this.defaultStateId = null;
	    }

	    addState( stateClass )
	    {
	        // @todo Fix this, only check for function or class
	        if ( false === Helper.isClass( stateClass ) )
	        {
	            throw new Error( 'StateManager.addState expects a class/subclass of State.' );
	        }

	        // Throw an error if ID is null or already taken
	        if ( false === Helper.isString( stateClass.ID ) )
	        {
	            throw new Error( 'Given stateClass does not have a valid static ID' );
	        }

	        if ( true === this._states.hasOwnProperty( stateClass.ID ) )
	        {
	            return false;
	        }

	        this._states[ stateClass.ID ] = stateClass;

	        if ( Helper.isString( stateClass.ROUTE ) )
	        {
	            this.app.router.addRoute( stateClass.ROUTE, stateClass );
	        }
	        else if ( Helper.isArray( stateClass.ROUTE ) )
	        {
	            for ( let route in stateClass.ROUTE )
	            {
	                this.app.router.addRoute( route, stateClass );
	            }
	        }

	        if ( stateClass.IS_DEFAULT )
	        {
	            // @todo Add warning if defaultState is already set and not of the same ID
	            this.defaultStateId = stateClass.ID;
	        }

	        return true;
	    }

	    createState( stateId, routeParams )
	    {
	        let stateInstance = null;

	        if ( this._states.hasOwnProperty( stateId ) )
	        {
	            stateInstance = new this._states[ stateId ]( this.app, routeParams );
	        }

	        return stateInstance;
	    }

	    getDefaultStateId()
	    {
	        return this.defaultStateId;
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

	    getHtml( tmpl, data = {} )
	    {
	        return _template( tmpl, data );
	    }

	    async get( templateUrl, useCache = true )
	    {
	        let tmplHtml = useCache ? this._getTemplateFromCache( templateUrl ) : null;
	        if ( !tmplHtml )
	        {
	            const response = await fetch( templateUrl );
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

	class DefaultState extends State
	{
	    static ID = 'INFRONT_DEFAULT_INDEX_STATE';
	    static IS_DEFAULT = true;

	    async enter( params = {} )
	    {
	        console.log("default state");
	        this.app.container.innerHTML = '<h1>Infront.js</h1>';
	    }
	}

	const VERSION = '0.7.8';

	const DEFAULT_PROPS = {
	    "uid" : null,
	    "title" : "InfrontJS",
	    "container" : null
	};

	const DEFAULT_SETTINGS = {
	    "sayHello" : true,
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

	        this.settings = { ...DEFAULT_SETTINGS, settings };

	        if ( !this.uid )
	        {
	            this.uid = Helper.createUid();
	        }

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
	        //apps[ this.uid ] = this;
	        App.POOL[ this.uid ] = this;

	        if ( true === this.settings.sayHello && console )
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

	    /**
	     * Get setting of key
	     * @param {string} key Setting property
	     * @param {*} defVal Default return value. Default is null.
	     * @returns {*|null}
	     */
	    getSetting( key, defVal = null )
	    {
	        if ( this.settings.hasOwnProperty( key ) )
	        {
	            return this.settings[ key ];
	        }
	        else
	        {
	            return defVal;
	        }
	    }

	    async run( route = null )
	    {
	        this.viewManager.setWindowTitle( this.title );

	        // @todo Check if default state is set
	        // @todo Check if DefaultStates are allowed by setting configuration

	        this.stateManager.addState( DefaultState );

	        this.router.enable();
	        if ( route )
	        {
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

	class PropertyObject
	{
	    constructor( props = {} )
	    {
	        if ( false === Helper.isPlainObject( props ) )
	        {
	            throw new Error( 'PropertyObject expects a plain object.' );
	        }

	        this._props = props;

	        for ( let field in this._props )
	        {
	            Object.defineProperty(
	                this,
	                field,
	                {
	                    get : function()
	                    {
	                        return this._props[ field ];
	                    },
	                    set : function( newValue )
	                    {
	                        // @todo Trigger propertyChange event
	                        this._props[ field ] = newValue;
	                    }
	                }
	            );
	        }
	    }

	    getPropertyValue( key, defValue = null )
	    {
	        if ( -1 < key.indexOf( '.') )
	        {
	            return key.split('.').reduce(function(prev, curr) {
	                return prev ? prev[curr] : defValue
	            }, this._props );
	        }

	        else if ( this._props.hasOwnProperty( key ) )
	        {
	            return this._props[ key ];
	        }
	        else
	        {
	            return defValue;
	        }
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
	exports.PropertyObject = PropertyObject;
	exports.Router = Router;
	exports.State = State;
	exports.StateManager = StateManager;
	exports.TemplateManager = TemplateManager;
	exports.ViewManager = ViewManager;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
