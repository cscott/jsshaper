var log = (typeof console !== "undefined") && console.log || print;
(typeof require !== 'undefined') && require('setup.js');

var e = 42;
function foo() {
    var bar = function() { return 3; };
    var bat = function baz(x) {
        if (x<=0) return 1;
        return x * baz(x-1);
    };
    function baf() { return 5; }
    if (true) {
        function barge() { return 6; }
        function bargh() { return 7; };
    }
    var x = (function f(y) { if (y<=0) return 0; return y+f(y-1); })(4) + 1;
    try {
        function b1() { return 8; }
        throw b1();
    } catch (e) {
        function b2() { return e; }
    }
    return bar() + bat(3) + baf() + barge() + x + b1() + b2();
}
log(foo());
