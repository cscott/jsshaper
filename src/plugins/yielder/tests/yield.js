var log = (typeof console !== "undefined") && console.log || print;
(typeof require !== 'undefined') && require('setup.js');

function foo() {
    var v = (yield) + (yield) + (yield);
    yield v;
}
function bar() {
    var sum = function(a,b,c) { return a+b+c; }
    yield sum((yield 1), (yield 2), (yield 3));
}

var f = foo();
f.next();
f.send(1);
f.send(2);
log(f.send(3));
f.close();

var g = bar();
log(g.next());
log(g.send(4));
log(g.send(5));
log(g.send(6));
g.close();
