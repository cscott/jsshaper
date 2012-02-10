var log = (typeof console !== "undefined") && console.log || print;
(typeof require !== 'undefined') && require('setup.js');

function normal(a, b, c) {
    return a + b + c;
}
function range(start, end, step) {
    var i;
    step = step || 1;
    for (i=start; i<end; i+=step) {
        yield(i);
    }
}
var foo = function(a,b) {
    var x, y, z;
    x = (yield (a)) + 2;
    y = this.bar(x);
    z = 3 * (yield y);
    z = (yield z).foo;
    z = bar((yield 1), (yield 2), (yield z));
    baz(z);
    return;
};
function bat(arr) {
    var i, j;

    for (i=0; i<arr.length; i++) {
        if (test.apply(arr[i], arguments)) {
            try {
                something();
                j = yield arr[i];
                if (j) {
                  something(j);
                  return;
                }
            } catch (e) {
                log(e);
                delete arr[i];
            } finally {
                baz(i);
            }
        }
    }
    return;
}
function props(obj) {
    for (var prop in obj)
        yield prop;
}
