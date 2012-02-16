var log = (typeof console !== "undefined") && console.log || print;
(typeof require !== 'undefined') && require('setup.js');

var foo = function() {
    for (var i=0; i<3; i++) {
        try {
            yield i;
            if (i==1) {
                break;
            }
        } finally {
            log(i);
        }
    }
};

for each (var p in foo()) {
    log(':'+p);
}

var bar = function() {
    // nested finally
    loop: for (var i=0; i<3; i++) {
        try {
            for (var j=0; j<3; j++) {
                try {
                    if (j!==0) { continue; }
                    yield (i+','+j);
                    if (i===1 && j===0) { break loop; }
                } finally {
                    yield ("::"+i+','+j);
                }
            }
        } finally {
            yield ":"+i+","+j;
        }
    }
    yield "-end-";
};
for each (var p in bar()) {
    log(p);
}
