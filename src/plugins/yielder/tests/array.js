var log = (typeof console !== "undefined") && console.log || print;
(typeof require !== 'undefined') && require('setup.js');

for each (i in [1,2,3]) { log(i); }
// array comprehensions
function range(begin, end) {
  for (var i = begin; i < end; ++i) {
    yield i;
  }
}

var ten_squares = [ i * i for each (i in range(0, 10))];
log(ten_squares.join(','));

var evens = [ /*a*/ i for each (i in range(0, 21)) if (i % 2 == 0)];
log(evens.join(','));

/* generator expressions */
function foo(it) {
    return it.next();
}
log(foo(i for each (i in range(1, 5))));
