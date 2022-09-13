export const version = "0.2.0";


// Base
import { PropertyObject } from "./base/PropertyObject.js";
import { State } from "./base/State.js";
const base = {};
base.PropertyObject = PropertyObject;
base.State = State;
export { base };

// global functions
export { trim, createUid, isPlainObject } from "./util/Functions.js";

// Core
export { App, destroyApp, getApp } from "./core/App.js";

// Marketing ;-)
console.log( "%c»InfrontJS« Version " + version, "font-family: monospace sans-serif; background-color: black; color: white;" );
