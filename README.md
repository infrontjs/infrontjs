# InfrontJS

The aim of this project is to provide a fast, unobstrusive and lightweight Vanilla Javascript Frontend framework.

## Dependencies

- observable-slim for watchables

Check
https://www.npmjs.com/package/nollup
for Frontfire build tool


## Stuff included

- Lodash _.get / _.set functionality wrapped into PathObject
- UrlPattern
- microtemplate 
- https://www.shadertoy.com/view/wlSSD3

## ToDos

- [X] Rename Api to Http (Client)
- [x] Move Http to Util
- [x] Rethink PropertyObject -> maybe just a simple set/get method that interacts with [this] instance properties
- [x] Move RouteParams/UrlPattern into Router/Controller
- [x] Work on non-hash-based actions
- [x] Add Front.js observables
- [ ] Think about own wrapper of HTMLElements using custom attributes like if-bind
- [x] Wrap Functions to static Helper class
- [x] Remove is_default state because it does not make sense, use route array instead
- [ ] Examples, XX - States Transition, XX - States, Routing, Templates, Components, DataBinding, VirtualDom
- [ ] JSDoc
- [ ] infront-cli
