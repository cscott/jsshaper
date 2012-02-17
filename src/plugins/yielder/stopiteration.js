if (typeof define !== 'function') { var define = require('amdefine')(module); }

define([], function() {

StopIteration = new Error();

if (typeof global !== "undefined") {
    global.StopIteration = StopIteration;
}

return StopIteration;
});
