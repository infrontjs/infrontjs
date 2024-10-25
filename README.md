![InfrontJS logo](https://www.infrontjs.com/assets/ext/ifjs-colored-bg-logo.png)

# [InfrontJS](https://www.infrontjs.com)

The **anti framework** for real javascript developers.

pure. simple. stable.

### [Homepage](https://www.infrontjs.com) &middot; [Guides](https://guides.infrontjs.com) &middot; [ApiDocs](https://apidocs.infrontjs.com) &middot; [Examples](https://examples.infrontjs.com) &middot; [Twitter](https://twitter.com/infrontjs)

## Installation

### CDN

```html
<script src="https://unpkg.com/infrontjs/dist/IF.js"></script>
```

### npm

```bash
npm install infrontjs
```

## Example

```javascript
class GreetingState extends IF.State
{
    async enter()
    {
        this.app.view.render( this.app.container, '<h1>Hello InfrontJS World</h1>' );
    }
}

const myApp = new IF.App();
myApp.states.add( GreetingState );
myApp.run();
```

## Build & Test

Feel free to fork and work with the library. After cloning it, make sure to 

```bash
npm install
```

in order to install all dependencies.

### Build library

Run the following command. The library will be generated and saved in the `./dist` folder.

```bash
npm run build
```

### Generate api docs

To generate the api docs, run the following command. The generated api docs are in the folder `./apidocs`.

```bash
npm run generate-docs
```

### Run unit tests

Unit tests can be executed by the following command

```bash
npm run test
```

## Resources

* Find general information and interesting news on our [website](https://www.infrontjs.com).
* Guides to certain aspects of the framework. [guides](https://guides.infrontjs.com).
* Like reading api documentation. Have a look at the [api docs](https://apidocs.infrontjs.com).
* Do you prefer to learn by example? Check out the [official examples](https://examples.infrontjs.com).
* Get the latest development updates on [twitter](https://twitter.com/infrontjs).

## Credits

This framework is build upon some great other open source projects...

* View class encapsulates [EJS](https://ejs.co/)
* Re-conception of L18N/dictionary logic by [antag0n1st](https://github.com/antag0n1st)
* Observables from the Helper class are supported by [ObservableSlim](https://github.com/elliotnb/observable-slim)
* UrlPattern used by the Router class relies on [UrlPattern](https://github.com/snd/url-pattern)
* PathObject implementation heavily relies on some [Lodash](https://github.com/lodash/lodash) methods
* The background fx of our Shameless plug DefaultScene is based on this [shader](https://www.shadertoy.com/view/wlSSD3])

## Contributing

By contributing or commenting on issues in this repository, whether you've read them or not, you're agreeing to the [Contributor Code of Conduct](CODE-OF-CONDUCT.md). Much like traffic laws, ignorance doesn't grant you immunity.

## License

This content is released under the (http://opensource.org/licenses/MIT) MIT License.
