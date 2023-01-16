import { State } from "../src/base/State.js";

class StateTest extends State
{

    static ID = 'test';

    enter()
    {
        console.log( "Hello from StateTest..." );
    }
}

export { StateTest };
