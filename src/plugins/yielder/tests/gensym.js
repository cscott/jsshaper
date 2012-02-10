var log = (typeof console !== "undefined") && console.log || print;
(typeof require !== 'undefined') && require('setup.js');

// Torture test: try to name real variables to conflict with automatically-generated symbols.
// gensym to the rescue.

function $Generator$0() {
    var $stop = 0, $stop$0 = 1, $stop$1 = 2, $stop$2 = 3, $stop$3 = 4;
    yield $stop + $stop$0 + $stop$1 + $stop$2 + $stop$3;
}
for (var $it$6 in $Generator$0())
    log($it$6);
