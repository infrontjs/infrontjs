# InfrontJS

The aim of this project is to provide a fast, unobstrusive and lightweight Vanilla Javascript Frontend framework.

## Stuff included

- Lodash _.get / _.set functionality wrapped into PathObject
- UrlPattern
- microtemplate
- observable-slim for watchables
- https://www.shadertoy.com/view/mt23WK forked from: https://www.shadertoy.com/view/wlSSD3

## ToDos

**Version 1.0**

- [ ] Remove TemplateManager
- [ ] Rename ViewManager to View
- [ ] Add engine property and by default, set it to "ejs"
- [ ] JSDoc
- [ ] infront-cli
- [ ] Add tests
- [ ] UserGuide
- [ ] 404 State
- [X] Rename Api to Http (Client)
- [x] Move Http to Util
- [x] Rethink PropertyObject -> maybe just a simple set/get method that interacts with [this] instance properties
- [x] Move RouteParams/UrlPattern into Router/Controller
- [x] Work on non-hash-based actions
- [x] Add Front.js observables
- [x] Wrap Functions to static Helper class
- [x] Remove is_default state because it does not make sense, use route array instead

**Version 2.0**

- [ ] Add verbose mode and/or logger
- [ ] Investigate on Typescript support
