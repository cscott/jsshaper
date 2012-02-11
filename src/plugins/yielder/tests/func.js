var log = (typeof console !== "undefined") && console.log || print;
(typeof require !== 'undefined') && require('setup.js');

function foo() {
    log(!!sum);
    function sum(x, y) { return x + y; }
    log(!!sum);
};/* deliberate trailing semicolon */
function foo2(b) {
    log(!!sum);
    if (b) {
        function sum(x, y) { return x + y; }
    }
    log(!!sum);
}
function bar() {
    log(!!sum);
    var sum = function sum2(x, y) { return x + y; };
    log(!!sum);
}
var x = 2;
function baz() {
    log(x);
    var x = 3;
    log(x);
}
var e = 42;
function bat() {
    try {
        throw 1;
    } catch (e) {
        log(e);
        function xx() { return e; }
        var x = function x2() { return e; };
        log(x());
        log(xx());
    }
}
foo();
log('vs');
foo2(false);
log('vs');
foo2(true);
log('vs');
bar();
log('---');
baz();
log('---');
bat();
