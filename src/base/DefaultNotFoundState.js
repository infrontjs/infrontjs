import { DefaultBaseState } from "./DefaultBaseState.js";

class DefaultNotFoundState extends DefaultBaseState
{
    static ID = 'INFRONT_DEFAULT_NOTFOUND_STATE';

    async enter()
    {
        await super.enter();
        this.app.container.querySelector( '#if-cover' ).insertAdjacentHTML(
            'beforeend',
            '<div style="position: absolute;top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2; width: 36%; min-width: 360px; display: inline-block; background-color: white; color: black; mix-blend-mode: screen; padding: 32px; font-family: monospace; text-align: center; font-size: 28px; font-weight: bold;outline: 2px solid white; border: 3px solid black;">' +
            '<div style="font-size: 48px">404</div>REQUESTED URL NOT FOUND</div>'
        );
    }
}

export { DefaultNotFoundState };
