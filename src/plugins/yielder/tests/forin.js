var log = (typeof console !== "undefined") && console.log || print;
(typeof require !== 'undefined') && require('setup.js');

function foo(b) {
    try {
        yield 1;
        if (b) throw b;
        yield 2;
    } finally {
        log('finally!');
    }
}

for (var x in foo()) {
    log('a');
    log(x);
    log('b');
    break;
}
log('c');

for (var x in foo()) {
    log(x);
}

try {
    for (var x in foo(true)) {
        log(x);
    }
} catch (e) {
    log(e);
}
