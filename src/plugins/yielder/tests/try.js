var log = (typeof console !== "undefined") && console.log || print;
(typeof require !== 'undefined') && require('setup.js');

function foo() {
    try {
        yield 1;
    } catch (e) {
        log(e);
        yield 2;
        yield 3; // should not reach here
    } finally {
        log('finally!');
    }
}

var it = foo();
log(it.next());
log(it['throw'].call(it, 0));
log(4);
try {
    it.close(); // should not throw an exception
} catch (e) {
    log("should not reach here");
}
