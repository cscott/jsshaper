var log = (typeof console !== "undefined") && console.log || print;
(typeof require !== 'undefined') && require('setup.js');

var foo1 = function() {
    bat: {
    bar: {
    foo: try {
        log(1);
        break bat;
    } finally {
        log(1.5);
    }
    log(2);
    }
    log(3);
    }
    log(4);
};
foo1();
log('---');

var foo2 = function() {
    bat: {
    bar: {
    foo: try {
        log(1);
        break bat;
    } finally {
        log(1.5);
    }
    log(2);
    }
    log(3);
    }
    log(4);
    yield;
};
foo2().next();
log('---');

var foo3 = function(pc) {
    pc2: {
        pc1: {
            if (pc==0) {
                log(0);
                pc=2;
                break pc2;
            }
        }
        if (pc==1) {
            log(1);
            pc=2;
        }
    }
    if (pc==2) {
        log(2);
    }
    yield;
};
foo3(0).next();

var foo4 = function(pc) {
    not2: {
        pc2: {
            not1: {
                pc1: {
                    not0: {
                        if (pc!==0) break not0;
                        log(0);
                        pc=2;
                        break pc2;
                    }
                    if (pc!==1) break not1;
                }
                log(1);
                pc=2;
            }
            if (pc!==2) break not2;
        }
        log(2);
    }
    yield;
};
foo4(0).next();
