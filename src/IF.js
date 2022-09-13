export const version = "0.01";


// base
import { Util } from "./base/Util.js";
import { PropertyObject } from "./base/PropertyObject.js";
import { State } from "./base/State.js";
const base = {};
base.Util = Util;
base.PropertyObject = PropertyObject;
base.State = State;

export { base };

export { App, destroyApp, getApp } from "./core/App.js";

// Marketing ;-)
console.log( "%c»InfrontJS« Version " + version, "font-family: monospace sans-serif; background-color: black; color: white;" );
