var log = (typeof console !== "undefined") && console.log || print;
// adjust path to get generator.js
require && require.paths && typeof __dirname !== "undefined" && require.paths.unshift(__dirname+"/..");
Iterator = require('iterator.js');

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
