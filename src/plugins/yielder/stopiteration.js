StopIteration = new Error();

if (typeof global !== "undefined") {
    global.StopIteration = StopIteration;
}
if (typeof exports !== 'undefined') {
    module.exports = StopIteration;
}
