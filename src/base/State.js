class State
{
    constructor( app, routeParams )
    {
        this.app = app;
        this.routeParams = routeParams;
    }

    canEnter()
    {
        return true;
    }

    enter()
    {
    }

    exit()
    {
    }
}

export { State };
