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

    canExit()
    {
        return true;
    }

    getRedirectTo()
    {
        return null;
    }

    enter()
    {
    }

    exit()
    {
    }
}

export { State };
