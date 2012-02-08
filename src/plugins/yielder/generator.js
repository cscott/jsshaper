StopIteration = require('stopiteration.js');

function Generator(cont_this, cont_array) {
    this._cont_this = cont_this;
    this._cont_array = cont_array;
    this._cont_next = cont_array[0];
    this._first = true;
    this._closed = false;
}
Generator.prototype = {
    __iterator__: function() { return this; },
    next: function() {
        var undef;
        return this.send(undef);
    },
    send: function(val) {
        var undef;
        if (this._first) {
            this._first = false;
            if (val !== undef) { throw new TypeError(); }
        }
        return this._send(null, val);
    },
    'throw': function(ex) {
        return this._send(ex, null);
    },
    close: function() {
        try {
            // note that catch clauses have to be modified to ignore StopIteration
            this['throw'].call(this, StopIteration);
        } catch (e) {
            if (e!==StopIteration) { throw e; }
        } finally {
            // generator should never be able to catch a StopIteration
            // but just in case...
            this._closed = true;
        }
    },
    _send: function(exception, value) {
        try {
            if (this._closed) { throw StopIteration; }
            var r;
            while (true) { // this lets us do a simpler CPS conversion of loops
                r = this._cont_next.call(this._cont_this, exception, value);
                exception = value = null;
                if (typeof(r)==='number') {
                    this._cont_next = this._cont_array[r];
                } else {
                    this._cont_next = this._cont_array[r.cont];
                    if (r.again) {
                        exception = r.ex;
                    } else {
                        return r.ret;
                    }
                }
            }
        } catch (e) {
            this._closed = true;
            throw e;
        }
    }
};

// allow StopIteration to be accessed via Generator if we only want to
// export a single name.
Generator.StopIteration = StopIteration;

if (typeof exports !== "undefined") {
    module.exports = Generator;
}
