![InfrontJS logo](https://www.infrontjs.com/assets/ext/ifjs-colored-bg-logo.png)

# [InfrontJS](https://www.infrontjs.com)

A simple, smart and pure vanilla javascript framework.

**For developers who...**

* ... like simple and smart solutions
* ... want to have full control of your code and no black boxes 
* ... prefer to stay close to the platform and want to use its full power
* ... know vanilla javascript, css3 and html5
* ... want to avoid unnecessary abstractions
* ... do not want to learn additional domain specific languages and concepts (e.g. for templates etc)
* ... prefer a painless and easy-to-configure toolchain

**For managers who...**

* ... are tired of wasting time on permanent framework version updates 
* ... don't want to take the risk that their product is built upon a framework which might become outdated in the future
* ... want their developers spending most of their energy on the product and not about the underlying technology
* ... want to avoid unnecessary third party dependencies
* ... want to stay flexible

### [www](https://wwww.infronts.js) &middot; [apidocs](https://apidocs.infrontjs.com) &middot; [examples](https://examples.infrontjs.com) &middot; [twitter](https://twitter.com/infrontjs)

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
class TestState extends IF.State
{
    async enter()
    {
        this.app.view.render( this.app.container, '<h1>Hello World</h1>' );
    }
}

const myApp = new IF.App();
myApp.states.add( TestState );
myApp.run();
```

## Build & Test

Feel free to fork and work with the library. After cloning it,  make sure to 

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
* Like reading api documentation. Have a look at the [api docs](https://apidocs.infrontjs.com).
* Do you prefer to learn by example? Check out the [official examples](https://examples.infrontjs.com).
* Get the latest development updates on [twitter](https://twitter.com/infrontjs).

## Roadmap to 1.0

We are currently working hard on the release of version 1.0

- [ ] State Not Found handling
- [ ] Implement Router.createLink function
- [ ] L18N add automatic locale resolving
- [ ] L18N add NumberFormat logic
- [ ] L18N add DateTimeFormat logic
- [ ] Create Guides
- [ ] Complete unit tests
- [ ] Think about centralized loader
- [ ] Add minification version to rollup build
- [x] Complete api docs

## Credits

This framework is build upon some great other open source projects...

* View class encapsulates [EJS](https://ejs.co/)
* DOM diffing enabled rendering is powered by [diffDOM](https://github.com/fiduswriter/diffDOM)
* Observables from the Helper class are supported by [ObservableSlim](https://github.com/elliotnb/observable-slim)
* UrlPattern used by the Router class relies on [UrlPattern](https://github.com/snd/url-pattern)
* PathObject implementation heavily relies on some [Lodash](https://github.com/lodash/lodash) methods
* The background fx of our Shameless plug DefaultScene is based on this [shader](https://www.shadertoy.com/view/wlSSD3])

## Contributing

By contributing or commenting on issues in this repository, whether you've read them or not, you're agreeing to the [Contributor Code of Conduct](CODE-OF-CONDUCT.md). Much like traffic laws, ignorance doesn't grant you immunity.

## License

This content is released under the (http://opensource.org/licenses/MIT) MIT License.
