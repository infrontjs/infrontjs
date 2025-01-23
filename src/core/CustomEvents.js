/**
 * Events
 * Super simple custom events
 *
 * @example
 * class MyClass {
 *   constructor() {
 *       this.events = new CustomEvents( this  );
 *   }
 *   start() {
 *       this.dispatchCustomEvent( "start", { detail: { ... } } );
 *   }
 * }
 *
 * const myInstance = new MyClass();
 * myInstance.addEventListener( "start", e => { ... } );
 *
 */
class CustomEvents
{
    static get TYPE() {
        return {
            'READY' : 'ready',
            'POPSTATE' : 'popstate',
            'BEFORE_STATE_CHANGE' : 'beforeStateChange',
            'AFTER_STATE_CHANGE' : 'afterStateChange',
            'BEFORE_LANGUAGE_SWITCH' : 'beforeLanguageSwitch',
            'AFTER_LANGUAGE_SWITCH' : 'afterLanguageSwitch',
            'ON_STATE_NOT_FOUND' : 'onStateNotFound'
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

        host.addCustomEventListener = ( eventName, func ) =>
        {
            host.addCustomEventListener( eventName, func );
            return host;
        };

        host.removeCustomEventListener = ( eventName, func ) =>
        {
            host.removeEventListener( eventName, func );
            return host;
        };

        host.dispatchCustomEvent = ( eventName, optionsDetail = null ) =>
        {
            host.dispatchEvent(
                new CustomEvent(
                    eventName,
                    {
                        "detail": optionsDetail
                    }
                )
            );
        }
    }

    delegate( method )
    {
        this.proxy.host[method] = this.proxy[method].bind(this.proxy);
    }
}

export { CustomEvents };
