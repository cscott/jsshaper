var log = (typeof console !== "undefined") && console.log || print;
// adjust path to get generator.js
require && require.paths && typeof __dirname !== "undefined" && require.paths.unshift(__dirname+"/..");
Iterator = require('iterator.js');
StopIteration = require('stopiteration.js');

function range(start, end, step) {
    var i;
    step = step || 1;
    for (i=start; (step>0)?(i < end):(step<0)?(i > end):false; i+=step) {
        yield i;
    }
}

log('while/catch');
var it=range(1, 5);
try {
    while (true)
        log(it.next());
} catch (e) {
    if (e!==StopIteration) { throw e; }
}

log('for...in');
foo: for (var n in range(5, 0, -1)) {
    log(n);
    break foo;
}

log('for...in w/ Iterator');
var nn;
bar: for (nn in Iterator(range(0, 3, 2))) {
    log(nn);
    continue bar;
}

log('done.');
