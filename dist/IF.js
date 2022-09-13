(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.IF = {}));
}(this, (function (exports) { 'use strict';

	class App
	{
	    constructor()
	    {
	    }
	}

	function createApp( id, container )
	{
	    const app = new App();
	    return app;
	}

	const version = "0.01";

	// Marketing ;-)
	console.log( "%c»InfrontJS« Version " + version, "font-family: monospace sans-serif; background-color: black; color: white;" );

	exports.createApp = createApp;
	exports.version = version;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
