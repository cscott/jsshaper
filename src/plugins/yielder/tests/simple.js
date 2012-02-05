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
    x = yield(a);
    y = this.bar(x);
    z = yield(y);
    baz(z);
    return;
};
function bat(arr) {
    var i, j;

    for (i=0; i<arr.length; i++) {
        if (test.apply(arr[i], arguments)) {
            try {
                something(null);
                j = yield arr[i];
                something(j);
            } catch (e) {
                delete arr[i];
            } finally {
                baz(i);
            }
        }
    }
    return;
};
