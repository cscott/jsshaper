var log = (typeof console !== "undefined") && console.log || print;
(typeof require !== 'undefined') && require('setup.js');

// for each statement

for each (var i in [4,5,6,'foo']) {
    log(i);
}
