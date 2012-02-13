var log = (typeof console !== "undefined") && console.log || print;
(typeof require !== 'undefined') && require('setup.js');

function l(v) {
  log(v);
  return v;
}

function foo(v) {
  switch (l(v)) {
  case l(1): yield -1;
  case l(2): yield -2;
             break;
  case l(3): { yield -3; }
  default:   yield -4;
    if (l(v)==4) break;
    yield -5;
  case l(6): yield -6;
  }
  log('bottom');
}

function bar(v) {
  var arr = [];
  for (var p in foo(v))
    arr.push(''+p);
  log(arr.join(','));
}

bar(1);
bar(2);
bar(3);
bar(4);
bar(5);
bar(6);
