var log = (typeof console !== "undefined") && console.log || print;
(typeof require !== 'undefined') && require('setup.js');

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
