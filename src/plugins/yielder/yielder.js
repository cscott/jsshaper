/*jshint globalstrict:true, eqeqeq:true, curly:true, latedef:true, newcap:true,
  undef:true, trailing:true */
/*global require:false, console:false, print:false, tkn:false */
"use strict"; "use restrict";

var Ref = Ref || require("ref.js") || Ref;
var Shaper = Shaper || require("shaper.js") || Shaper;
var log = (typeof console !== "undefined") && console.log || print;

// converts functions containing yield/yield() to generators.
Shaper("yielder", function(root) {
    var fns = [{fake:true,vars:[]}];

    function stmts2conts(stmts, srcs, first) {
        var i, c;
        // look for the unsafe statement
        var j = 1; // XXX really do this
        var frame = Shaper.parse('_ = function() {}').children[1];
        frame.body.children = stmts.slice(0, j);
        frame.body.srcs = [].concat('{', srcs.slice(0, j));
        if (srcs.length===0) { frame.body.srcs.push(''); }
        frame.body.srcs[frame.body.srcs.length-1] += '}';
        c = [ frame ];
        if (j < stmts.length) {
            c.push.apply(c, stmts2conts(stmts.slice(j), srcs.slice(j), first+c.length));
        }
        return c;
    }

    function alterFunc(node, props, ref) {
        var stmts = [];
        var v=null, i;
        if (props.vars.length > 0) {
            v = "var "+props.vars[0];
            for (i=1; i<props.vars.length; i++) {
                v += ', '+props.vars[i];
            }
            v += ';';
            stmts.push(Shaper.parse(v));
        }
        if (props['arguments']) {
            stmts.push(Shaper.parse('var $arguments = arguments;'));
        }
        if (props['catch']) {
            stmts.push(Shaper.parse('var $block = {};'));
        }
        var conts = Shaper.parse('[]');
        var c = stmts2conts(node.body.children, node.body.srcs.slice(1,-1), 0);
        if (c.length) {
            conts.children = c;
            conts.srcs = [ '[' ];
            for (i=1; i<c.length; i++) {
                conts.srcs.push(',');
            }
            conts.srcs.push(']');
        }

        // Note that we need to make a bogus function wrapper here or else
        // parse() will complain about the 'return outside of a function'
        var newBody = Shaper.replace('function _(){return new Generator(this, $);}', conts).body.children[0];
        stmts.push(newBody);

        var l = node.body.children.length;

        for (i=0; i<stmts.length; i++) {
            Shaper.insertBefore(new Ref(node.body, "children", i),
                                stmts[i]);
        }

        for (i=0; i<l; i++) {
            Shaper.remove(new Ref(node.body, "children", node.body.children.length-1));
        }

        return node;
    }

    //var yieldTempl = Shaper.parse("yield($)");
    return Shaper.traverse(root, {
        pre: function(node, ref) {
            if (node.type === tkn.FUNCTION) {
                fns.push({node: node, vars: [],
                          'yield': false, 'arguments': false, 'catch': false});
            }
            var fn = fns[fns.length-1];
            if (node.type === tkn.YIELD) {
                if (fn.fake) {
                    Shaper.error(node, "yield outside function");
                } else {
                    fn['yield'] = true;
                }
            }
            if (node.type === tkn.VAR) {
                for (var i=0; i<node.children.length; i++) {
                    var child = node.children[i];
                    if (child.type===tkn.ASSIGN) {
                        child = child.children[0];
                    }
                    console.assert(child.type===tkn.IDENTIFIER);
                    fn.vars.push(child.value);
                }
            }
            if (node.type === tkn.CATCH) {
                fn['catch'] = true;
            }
            if (node.type === tkn.IDENTIFIER && node.value === 'arguments') {
                // a bit conservative:: you might have defined your own
                // variable named arguments, etc.  no worries.
                fn['arguments'] = true;
            }
        },
        post: function(node, ref) {
            var fn;
            if (node.type === tkn.FUNCTION) {
                fn = fns.pop();
                if (fn['yield']) {
                    return alterFunc(node, fn, ref);
                }
            }
            return node;
        }
    });
});
