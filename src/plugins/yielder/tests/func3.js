var log = (typeof console !== "undefined") && console.log || print;
(typeof require !== 'undefined') && require('setup.js');

// short function literal syntax from JS 1.8

var x = function(y) y+1;
//var y = function() yield 4; // syntax error

log(x(3));
