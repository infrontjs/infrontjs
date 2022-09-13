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

export { createApp, version };
