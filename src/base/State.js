class State
{
    static ID = null;
    static IS_DEFAULT = false;

    /**
     * Route(s) which trigger this state
     * @type {string|array}
     */
    static ROUTE = null;

    constructor( app, routeParams )
    {
        this.app = app;
        this.routeParams = routeParams;
    }

    getId()
    {
        return this.constructor.ID;
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

    async enter()
    {
    }

    async exit()
    {
    }
}

export { State };
