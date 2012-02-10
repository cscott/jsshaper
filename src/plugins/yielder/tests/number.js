var log = (typeof console !== "undefined") && console.log || print;
(typeof require !== 'undefined') && require('setup.js');

// Groovy iterator demo from: http://ejohn.org/blog/javascript-18-progress/

// Add an iterator to all numbers
Number.prototype.__iterator__ = function() {
    for ( var i = 0; i < this; i++ )
        yield i;
};
// Spit out three alerts
var i;
for ( i in 3 ) log( i );

/* The other examples require array comprehensions:

// Create a 100-unit array, filled with zeros
[ 0 for ( i in 100 ) ]

// Create a 10-by-10 identity matrix
[[ i == j ? 1 : 0 for ( i in 10 ) ] for ( j in 10 )]

*/
