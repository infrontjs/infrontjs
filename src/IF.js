export const version = "0.3.0";


// Base
import { Api } from "./base/Api.js";
import { PropertyObject } from "./base/PropertyObject.js";
import { State } from "./base/State.js";

export { Api, PropertyObject, State };

// global functions
export { trim, createUid, isPlainObject, isClass, isClassChildOf } from "./util/Functions.js";

// Core
export { App, destroyApp, getApp } from "./core/App.js";

// Marketing ;-)
console.log( "%c»InfrontJS« Version " + version, "font-family: monospace sans-serif; background-color: black; color: white;" );
