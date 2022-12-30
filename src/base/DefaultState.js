import { State } from "./State.js";

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

export { DefaultState };
