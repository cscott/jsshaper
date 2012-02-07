var log = (typeof console !== "undefined") && console.log || print;
// adjust path to get generator.js
require && require.paths && typeof __dirname !== "undefined" && require.paths.unshift(__dirname+"/..");

function range(start, end, step) {
    var i;
    step = step || 1;
    for (i=start; i<end; i+=step) {
        yield i;
    }
}

log('Top');
var it=range(1, 5);
try {
    while (true)
        log(it.next());
} catch (e) {
    var StopIteration = require('generator.js').StopIteration;
    if (e!==StopIteration) { throw e; }
}
log('Bottom');
