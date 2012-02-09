StopIteration = require('stopiteration.js');

function Generator(cont_this, cont_stop, cont_array) {
    this._cont_this = cont_this;
    this._cont_stop = cont_stop; // our stand-in for StopIteration
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
        // wrap ex, because we're allowed to throw falsy values (null,undef)
        return this._send({ex:ex}, null);
    },
    close: function() {
        if (this._closed) { return; }
        try {
            // note that catch clauses have to be modified to ignore StopIteration
            this['throw'].call(this, this._cont_stop);
        } catch (e) {
            if (e!==StopIteration) { throw e; }
        } finally {
            // should be impossible to catch this._cont_stop, so this._send
            // should have already closed the generator.
            if (!this._closed) throw new Error("impossible"); // assert
        }
    },
    _close: function() {
        if (this._closed) throw new Error("already closed"); // assert
        this._closed = true;
        // free memory
        this._cont_this = null;
        this._cont_array = null;
        this._cont_next = null;
    },
    _send: function(exception, value) {
        if (this._closed) { throw StopIteration; }
        try {
            var r;
            while (true) { // this lets us do a simpler CPS conversion of loops
                r = this._cont_next.call(this._cont_this, exception, value);
                exception = value = null;
                if (typeof(r)==='number') {
                    this._cont_next = this._cont_array[r];
                } else {
                    this._cont_next = this._cont_array[r.cont];
                    if (r.again) {
                        value = r.fall; // whether to fallthrough, for 'finally'
                        exception = r;  // r is wrapper; r.ex has exception
                    } else {
                        return r.ret;
                    }
                }
            }
        } catch (e) {
            this._close();
            if (e===this._cont_stop) { throw StopIteration; }
            throw e;
        }
    }
};

if (typeof exports !== "undefined") {
    module.exports = Generator;
}
