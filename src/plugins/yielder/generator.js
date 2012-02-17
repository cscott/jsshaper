if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(['./stopiteration'], function(StopIteration) {

function Generator(cont_func) {
    this._cont_func = cont_func;
    this._cont_stop = {}; // our stand-in for StopIteration
}
Generator.prototype = {
    __iterator__: function() { return this; },
    next: function() {
        var undef;
        return this.send(undef);
    },
    send: function(val) {
        return this._send(null, val);
    },
    'throw': function(ex) {
        // wrap ex, because we're allowed to throw falsy values (null,undef)
        return this._send({ex:ex}, null);
    },
    close: function() {
        try {
            this['throw'].call(this, this._cont_stop);
        } catch (e) {
            if (e!==StopIteration) { throw e; }
        }
    },
    _send: function(exception, value) {
        try {
            return this._cont_func(this._cont_stop, exception, value);
        } catch (e) {
            // close iterator and free memory held by _cont_func
            this._cont_func = function($stop) { throw $stop; };
            if (e===this._cont_stop) { throw StopIteration; }
            throw e;
        }
    },
    toArray: function(arr) {
        arr = arr || [];
        while(true) {
            try {
                arr.push(this.next());
            } catch (e) {
                if (e===StopIteration) { return arr; }
                throw e;
            }
        }
    }
};

if (typeof global !== "undefined") {
    global.Generator = Generator;
}

return Generator;
});
