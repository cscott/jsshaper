var log = (typeof console !== "undefined") && console.log || print;
(typeof require !== 'undefined') && require('setup.js');

function normal(a, b, c) {
    return a + b + c;
}
function range(start, end, step) {
    var i;
/*a*/step = step || 1;/*b*/
/*c*/for /*d*/ ( /*e*/ i/*f*/=/*g*/start/*h*/; /*hh*/
                 /*i*/ i/*j*/ < /*k*/end/*l*/; /*m*/
                 /*n*/ i/*o*/+=/*p*/step/*q*/) /*r*/ { /*s*/
/*t*/  yield(i); /*u*/
/*v*/}/*w*/
/*x*/return;/*y*/
}
//m-q out of place,
function range1(start, end, step) {
    var i;
/*a*/step = step || 1;/*b*/
/*c*/i = start;/*d*/
/*e*/for /*f*/ ( /*g*/ ; /*h*/
                 /*i*/ i/*j*/ < /*k*/end/*l*/; /*m*/
                 /*n*/ i/*o*/+=/*p*/step/*q*/) /*r*/ { /*s*/
/*t*/  yield(i); /*u*/
/*v*/}/*w*/
/*x*/return;/*y*/
}
//missing f,g; m-q out of place,
function range2(start, end, step) {
    step = step || 1/*0*/;/*1*/
 /*a*/ while /*b*/ ( /*c*/ start /*d*/ < /*e*/ end /*f*/) /*g*/ { /*h*/
/*A*/ yield /*B*/ start /*C*/;/*D*/
/*E*/ start += step;
    /*i*/}/*j*/
    /*k*/return;/*l*/
}
function range3(start, end, step) { /*a*/
/*b*/step = step || 1;/*c*/
/*d*/do /*e*/ { /*f*/
        yield start;
        start += step;
/*g*/}/*h*/while /*i*/ ( /*j*/start < end /*k*/) /*l*/; /*m*/
    return; /*n*/
}
var foo = function(a,b) {
    var x, y, z;
    x = (yield (a)) + 2;
    y = this.bar(x);
    z = 3 * (yield (y+5));
    if (b) {
        z = (yield z).foo;
    }
    z = bar((yield 1), (yield 2), (yield z));
    baz(z);
    return;
};
function bat(arr) {
    var i, j;

    for (i=0; i<arr.length; i++)/*y*/{/*z*/
        /*0*/   if/*A*/(/*B*/test.apply(arr[i], arguments)/*C*/)/*a*/{/*b*/
/*1*/       try {
                something();
                j = yield arr[i];
                if (j) { return; }
            } catch (e) {
                log(e);
                delete arr[i];
            } finally {
                baz(i);
            }
   }/*d*/
/*q*/}
    return;
}

function emptyblock(b) {
/*a*/if /*b*/ (/*c*/b/*d*/)/*e*/ { /*f*/
/*g*/}/*h*/else/*i*/{/*j*/
/*k*/  yield /*l*/ 1 /*m*/; /*n*/
/*o*/}/*p*/
}

function trytest() {
/*a*/try/*b*/{/*c*/
/*d*/  foo/*e*/(/*f*/)/*g*/;/*h*/
/*i*/}/*j*/catch/*k*/(/*l*/e/*m*/)/*n*/{/*o*/
/*p*/   yield/*q*/e/*r*/;/*s*/
/*t*/}/*u*/
}

function trytest2() {
/*a*/try/*b*/{/*c*/
/*d*/  foo/*e*/(/*f*/)/*g*/;/*h*/
/*i*/}/*j*/catch/*k*/(/*l*/e/*m*/)/*n*/{/*o*/
/*p*/   yield/*q*/e/*r*/;/*s*/
/*t*/}/*u*/finally/*v*/{/*w*/
/*x*/   log('f');/*y*/
/*z*/}/*0*/
}

function forloop() {
/*a*/    for/*b*/(/*c*/var/*d*/ i=0/*e*/;/*f*/ i<5/*g*/;/*h*/ i/*i*/
+=
/*j*/
1
/*k*/
)/*l*/ {/*m*/
/*n*/        yield i;/*o*/
/*p*/        return;/*q*/
/*r*/    }/*s*/
}

function forin(o) {
    var p;
    /*a*/for/*b*/(/*c*/p/*d*/in/*e*/o/*f*/)/*g*/{/*h*/log(p);/*i*/}/*j*/
    /*k*/for/*l*/(/*m*/var/*n*/pp/*o*/in/*p*/o/*q*/)/*r*/{/*s*/log(pp);/*t*/}/*u*/
}

function labels() {
    /*a*/ b/*b*/:/*c*/break/*d*/b/*e*/;/*f*/
    /*g*/ f/*h*/:/*i*/for(;;){/*j*/break/*k*/f/*l*/;/*m*/}/*n*/
    for (;;) /*o*/break/*p*/;/*q*/
    /*r*/ yield;
}

Number.prototype.__iterator__ = function() {
    for ( var i = 0;
          i < this;
          i++ )
        yield i;/*b*/
};

function sw(v) { /*a*/
/*b*/ switch /*c*/ (/*d*/l(v)/*e*/)/*f*/ {/*g*/
/*h*/ case /*i*/ l(1)/*j*/:/*k*/ yield -1; /*l*/
/*m*/ case /*n*/l(2)/*o*/: /*p*/yield -2; /*q*/
/*r*/             break /*s*/; /*t*/
/*u*/ case /*v*/ l(3)/*w*/:/*x*/ {/*y*/ yield -3;/*z*/ }/*0*/
/*1*/ default/*2*/:/*3*/   yield /*4*/ -4 /*5*/; /*6*/
/*7*/    if (l(v)==4) break; /*8*/
/*9*/    yield -5; /*10*/
/*11*/  } /*12*/
/*13*/  log('bottom'); /*14*/
/*15*/
}

function arrayc(range) { /*a*/
/*b*/ return /*c*/ [ /*d*/ i /*e*/ * /*f*/ i /*g*/ for /*h*/ each /*i*/
    ( /*j*/ i /*k*/ in /*l*/
        /*l2*/range /*m*/ ( /*n*/0 /*o*/,/*p*/ 10/*q*/)/*r*/)/*s*/
                   /*s2*/]/*t*/;/*u*/
/*v*/
}
