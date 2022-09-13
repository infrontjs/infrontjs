class App
{
    constructor()
    {
    }
}

const apps = {};

function createApp( id, container )
{
    const app = new App();
    return app;
}

export { createApp };
