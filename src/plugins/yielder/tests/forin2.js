var log = (typeof console !== "undefined") && console.log || print;
// adjust path to get generator.js
require && require.paths && typeof __dirname !== "undefined" && require.paths.unshift(__dirname+"/..");
Iterator = require('iterator.js');

function foo() {
    for (var o in { foo: 'bar', baz: 'bat' }) {
        yield o;
        b: break b;
        continue;
    }
}
function bar() {
    foo: for (var o in { foo2: 'bar2', baz2: 'bat2' }) {
        yield o;
        for (;;) break;
        bar: for (;;)
            continue foo;
    }
}

for (var x in foo()) {
    log(x);
}

for (var x in foo()) {
    log(x);
    break;
}

for (var x in bar()) {
    log(x);
}
