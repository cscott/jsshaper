var log = (typeof console !== "undefined") && console.log || print;
(typeof require !== 'undefined') && require('setup.js');

// test block scoping of catch

function foo() {
  var a = [];
  for (var i=0; i<10; i++) {
    try {
      throw i;
    } catch (j) {
      a[i] = function() { return j++; };
    }
  }
  log(a[0]());
  log(a[0]());
  log(a[0]());
  log(a[1]());
  log(a[1]());
}

function bar() {
  var a = [];
  for (var i=0; i<10; i++) {
    try {
      throw i;
    } catch (j) {
      a[i] = function() { return j++; };
    }
  }
  log(a[0]());
  log(a[0]());
  log(a[0]());
  log(a[1]());
  log(a[1]());
  yield;
}

foo();
log('-vs-');
bar().next();
