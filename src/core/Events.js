/**
 * Events
 * Super simple custom events
 *
 * @example
 * class MyClass {
 *   constructor() {
 *       this.events = new Events( this  );
 *   }
 *   start() {
 *       this.emit( "start", { detail: { ... } } );
 *   }
 * }
 *
 * const myInstance = new MyClass();
 * myInstance.on( "start", e => { ... } );
 *
 */
class Events
{
    static get EVENT() {
        return {
            'READY' : 'ready',
            'BEFORE_STATE_CHANGE' : 'beforeStateChange',
            'AFTER_STATE_CHANGE' : 'afterStateChange'
        }
    };

    constructor()
    {
        const host = this;
        this.proxy = document.createDocumentFragment();
        this.proxy.host = this;

        ["addEventListener", "dispatchEvent", "removeEventListener"].forEach(
            this.delegate,
            this
        );

        host.on = ( eventName, func ) =>
        {
            host.addEventListener( eventName, func );
            return host;
        };

        host.emit = ( eventName, options ) =>
        {
            host.dispatchEvent(new CustomEvent(eventName, options));
        }
    }

    delegate( method )
    {
        this.proxy.host[method] = this.proxy[method].bind(this.proxy);
    }
}

export { Events };