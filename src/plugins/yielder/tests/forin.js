var log = (typeof console !== "undefined") && console.log || print;
(typeof require !== 'undefined') && require('setup.js');

function foo() {
    try {
        yield 1;
        yield 2;
    } finally {
        log('finally!');
    }
}

for (var x in foo()) {
    log(x);
    break;
}
for (var x in foo()) {
    log(x);
}
