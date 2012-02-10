var log = (typeof console !== "undefined") && console.log || print;
// adjust path to get generator.js
require && require.paths && typeof __dirname !== "undefined" && require.paths.unshift(__dirname+"/..");
StopIteration = require('stopiteration.js');

function foo() {
    log("1");
    try {
        log('2');
        throw 3;
    } catch (e) {
        log(e);
        throw 4;
    } finally {
        log('finally');
        throw 7;
    }
}

function bar(b, c) {
    log("1");
    try {
        log('2');
        if (b) throw 3;
    } catch (e) {
        log(e);
        throw 4;
    } finally {
        log('finally');
        if (c) throw 7;
    }
    log('after');
    yield 8;
}

try {
    log(foo());
    log('x');
} catch (e) {
    log(e);
}

try {
    log(bar(true, true).next());
    log('x');
} catch (e) {
    log(e);
}

try {
    log(bar(false,false).next());
    log('x');
} catch (e) {
    log(e);
}
