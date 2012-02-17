var log = (typeof console !== "undefined") && console.log || print;
(typeof require !== 'undefined') && require('setup.js');

// test variable renaming: proper scoping of variables named in catch blocks
// (the only block-level scoping in javascript) and renaming of the
// 'arguments' array in a function.

function foo(f) {
    try {
        yield 1;
    } catch (e) {
        var a = function() {
            return e; // this is the captured exception
        };
        var b = function(e) {
            return e; // this is the argument, not the captured exception
        };
        var c = function() {
            try {
                throw 5;
            } catch (e) {
                return e; // this is c's variable e, not foo's
            }
        };
        var d = function() {
            try {
                yield 64;
            } catch (e) { // this is d's variable e, not foo's
                yield e;
            }
        };
        var ff = { e: e }; // property name should not be captured.
        var g = function() {
            var e = 32; // this is a new variable
            return e;
        };
        var h = function() {
            return arguments[0];
        };
        e: while (true) { // this is a label, not foo's variable 'e'
            break e; // this is a label, not a variable
        }
        log(a());
        log(b(42));
        log(c());
        var it = d();
        log(it.next());
        log(it['throw'].call(it, 65));
        log(f.e); // property reference should not be rewritten
        log(f.arguments);
        log(arguments[0].arguments + 1);
        log(ff.e); // property reference should not be rewritten
        log(g());
        log(h(33));
        yield 2;
        yield 3; // should not reach here
    } finally {
        function fff() {
            var e = "finally"; // this is *not* foo's e.
            return e;
        }
        log(fff());
    }
}

var it = foo({ e: 6, arguments: 7 });
log(it.next());
log(it['throw'].call(it, 0));
log(4);
try {
    it.close(); // should not throw an exception
} catch (e) {
    log("should not reach here");
}
