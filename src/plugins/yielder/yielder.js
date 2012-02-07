/*jshint globalstrict:true, eqeqeq:true, curly:true, latedef:true, newcap:true,
  undef:true, trailing:true */
/*global require:false, console:false, print:false, tkn:false, Narcissus:false */
"use strict"; "use restrict";

var Ref = Ref || require("ref.js") || Ref;
var Shaper = Shaper || require("shaper.js") || Shaper;
var log = (typeof console !== "undefined") && console.log || print;

// converts functions containing yield/yield() to generators.
Shaper("yielder", function(root) {

    function funcBodyStart(body, start_src) {
        start_src = start_src || '{';
        body.children = [];
        body.srcs = [start_src];
    }
    function funcBodyAdd(body, stmt, src) {
        body.children.push(stmt);
        body.srcs.push(src);
    }
    function funcBodyFinish(body, close_src) {
        close_src = close_src || '}';
        body.srcs[body.srcs.length-1] += close_src;
    }

    function YieldVisitor() {
        this.stack = [null];
    }
    YieldVisitor.prototype = {
        top: function() { return this.stack[this.stack.length-1]; },
        add: function(child, src) {
            var top = this.top();
            if (!top) {
                this.newExternalCont();
                top = this.top();
            }
            funcBodyAdd(top.body, child, src);
        },
        returnStmt: function(val) {
            if (typeof val === 'number') {
                val = String(val);
            }
            if (typeof val === 'string') {
                val = Shaper.parse(val);
            }
            var returnStmt = Shaper.replace(
                'function _(){return $;}',
                val).body.children[0];
            return returnStmt;
        },
        addReturn: function(where) {
            var returnStmt = this.returnStmt(where);
            this.add(returnStmt, '');
            this.canFallThrough = false;
            return returnStmt;
        },
        close: function() {
            var top = this.top();
            if (!top) {
                this.stack.pop();
            } else {
                if (this.canFallThrough) {
                    this.add(Shaper.parse('throw StopIteration;'), '');
                }
                funcBodyFinish(top.body);
            }
        },

        newInternalCont: function() {
            var frame = Shaper.parse('_ = function() {}').children[1];
            funcBodyStart(frame.body);
            var new_top = { func: frame, body: frame.body, catcher:false };
            this.close();
            this.stack.push(new_top);
            this.canFallThrough = true;
        },
        newExternalCont: function() {
            this.newInternalCont();
            this.add(Shaper.parse('if (arguments[0]) { throw arguments[0]; }'),
                     '');
        },

        visit: function(child, src) {
            this.canFallThrough = true;
            if (child.type in this) {
                return this[child.type].call(this, child, src);
            }
            console.assert(!child.isLoop);
            this.add(Shaper.traverse(child, this), src);
        },

        visitBlock: function(children, srcs) {
            var i;
            console.assert(children.length === srcs.length);
            for (i=0; i<children.length; i++) {
                this.visit(children[i], srcs[i]);
            }
        },
        // slightly ugly way to remove tokens from srcs
        removeTokens: function(src, tokens) {
            var t = new Narcissus.lexer.Tokenizer(src);
            var i;
            for (i=1; i<arguments.length; i++) {
                t.mustMatch(arguments[i]);
            }
            var r = '', start = 0;
            for (i=1; i<t.tokens.length; i++) {
                r += src.substring(start, t.tokens[i].start);
                start = t.tokens[i].end;
            }
            r += src.substring(start);
            return r;
        },

        // rewrite arguments, catch expressions, var nodes, etc.
        pre: function(node, ref) {
            if (node.type === tkn.FUNCTION) {
                // skip nested functions.
                return "break";
            }
            if (node.type === tkn.VAR) {
                node.srcs[0] = this.removeTokens(node.srcs[0], tkn.VAR);
                node.type = tkn.COMMA;
            }
            if (node.type === tkn.IDENTIFIER &&
                node.value === 'arguments') {
                Shaper.renameIdentifier(node, '$'+node.value);
            }
            if (node.type === tkn.RETURN) {
                this.canFallThrough = false;
                return ref.set(Shaper.parse('throw StopIteration'));
            }
            if (node.type === tkn.YIELD) {
                var value = Shaper.traverse(node.value, this);
                var rval = Shaper.replace('_={cont:'+this.stack.length+
                                          ',ret:$}', value).children[1];
                var r = this.addReturn(rval);
                this.newExternalCont();
                // XXX this doesn't work for foo((yield a), (yield b))
                //     or (yield a) + (yield b), etc.
                ref.set(Shaper.parse('arguments[1]'));
                return "break";
            }
        }
    };
    YieldVisitor.prototype[tkn.BLOCK] = function(node, src) {
        var leading = node.leadingComment || '';
        leading += this.removeTokens(node.srcs[0],
                                     tkn.LEFT_CURLY);
        var trailing = node.trailingComment || '';
        trailing += src;

        if (node.children.length===0) {
            // make a semicolon node, just to have a place to put the
            // comments.
            var semi = Shaper.parse(';');
            semi.leadingComment = this.removeTokens(leading, tkn.RIGHT_CURLY);
            this.add(semi, trailing);
            return;
        }
        // adjust comments.
        var new_srcs = node.srcs.slice(1);
        new_srcs[new_srcs.length-1] =
            this.removeTokens(new_srcs[new_srcs.length-1], tkn.RIGHT_CURLY) +
            trailing;
        node.children[0].leadingComment = leading +
            (node.children[0].leadingComment || '');
        // visit the statements, in turn.
        this.visitBlock(node.children, new_srcs);
    };
    YieldVisitor.prototype[tkn.DO] = function(child, src) {
        child.condition = Shaper.traverse(child.condition, this);
        var loopStart = this.stack.length;
        var ret = this.addReturn(loopStart);

        this.newInternalCont();
        this.visit(child.body, '');

        // bottom of loop: check the condition.
        var loopCheck = Shaper.parse("if ($) $");
        loopCheck.condition = child.condition;
        loopCheck.thenPart = this.returnStmt(loopStart);
        // transfer comments.
        Shaper.cloneComments(ret, child);
        loopCheck.srcs[0] = child.srcs[1].replace(/^while/, 'if');
        loopCheck.thenPart.srcs[1] = this.removeTokens(src, tkn.RIGHT_PAREN);
        this.add(loopCheck, '');

        this.addReturn(this.stack.length);
        this.newInternalCont();
    };
    YieldVisitor.prototype[tkn.WHILE] = function(child, src) {
        console.assert(src==='');
        child.condition = Shaper.traverse(child.condition, this);
        var loopStart = this.stack.length;
        this.addReturn(loopStart);
        this.newInternalCont();

        // top of loop: check the condition.
        var loopCheck = Shaper.parse("if (!($)) $");
        loopCheck.condition.children[0].children[0] = child.condition;
        loopCheck.thenPart = this.returnStmt(-1);
        // transfer comments.
        Shaper.cloneComments(loopCheck, child);
        loopCheck.srcs[0] = child.srcs[0].replace(/^while/, 'if');
        this.add(loopCheck, '');

        this.visit(child.body, '');
        this.addReturn(loopStart);

        // fixup loop check
        loopCheck.thenPart.expression.value =
            Shaper.parse(String(this.stack.length));
        this.newInternalCont();
    };
    YieldVisitor.prototype[tkn.FOR] = function(child, src) {
        var setup, extraComment;
        // if there is setup, emit it first.
        if (child.setup) {
            child.setup = Shaper.traverse(child.setup, this);
            setup = Shaper.replace('$;', child.setup);
            extraComment = child.srcs[0]+';';
        } else {
            setup = Shaper.parse(';');
            extraComment = child.srcs[0];
        }
        this.add(setup);
        // fixup comments
        setup.leadingComment = child.leadingComment;
        setup.leadingComment += this.removeTokens(
            extraComment, tkn.FOR, tkn.LEFT_PAREN, tkn.SEMICOLON, tkn.END);

        // now proceed like a while loop
        child.condition = Shaper.traverse(child.condition, this);
        var loopStart = this.stack.length;
        this.addReturn(loopStart);
        this.newInternalCont();

        // top of loop: check the condition.
        var loopCheck = Shaper.parse("if (!($)) $");
        loopCheck.condition.children[0].children[0] = child.condition;
        loopCheck.thenPart = this.returnStmt(-1);
        this.add(loopCheck, '');

        // loop body
        this.visit(child.body, '');

        // loop update
        if (child.update) {
            child.update = Shaper.traverse(child.update, this);
            var update = Shaper.replace('$;', child.update);
            this.add(update);
        }
        this.addReturn(loopStart);

        // fixup loop check
        loopCheck.thenPart.expression.value =
            Shaper.parse(String(this.stack.length));
        this.newInternalCont();
    };
    YieldVisitor.prototype[tkn.IF] = function(child, src) {
        child.condition = Shaper.traverse(child.condition, this);
        this.add(child, src);
        this.canFallThrough = false; // both sides of IF will get returns

        var thenPart = this.stack.length;
        this.newInternalCont();
        this.visit(child.thenPart, '');
        var thenPlace = this.addReturn(this.stack.length);
        // replace original thenPart with branch to continuation
        child.thenPart = this.returnStmt(thenPart);

        if (child.elsePart) {
            var elsePart = this.stack.length;
            this.newInternalCont();
            this.visit(child.elsePart, '');
            this.addReturn(this.stack.length);
            // replace original elsePart with branch to continuation
            child.elsePart = this.returnStmt(elsePart);
            // fixup then part
            thenPlace.expression.value =Shaper.parse(String(this.stack.length));
        } else {
            console.assert(child.srcs.length===3);
            child.elsePart = this.returnStmt(this.stack.length);
            child.srcs.splice(2, 0, ' else ');
        }
        this.newInternalCont();
    };

    function alterFunc(node, props, ref) {
        var stmts = [];
        var i;
        if (props.vars.length > 0) {
            stmts.push(Shaper.parse("var "+props.vars.join(',')+";"));
        }
        if (props['arguments']) {
            stmts.push(Shaper.parse('var $arguments = arguments;'));
        }
        if (props['catch']) {
            stmts.push(Shaper.parse('var $block = {};'));
        }
        var yv = new YieldVisitor();
        console.assert(node.body.children.length > 0);
        // first and last node.body.srcs elements stay with outer function.
        var old_srcs = node.body.srcs;
        var inner_srcs = old_srcs.slice(1, old_srcs.length-1);
        inner_srcs.push('');
        yv.visitBlock(node.body.children, inner_srcs);
        yv.close();

        var conts = Shaper.replace('[' +
                                   yv.stack.map(function(){return '$';})
                                     .join(',') +
                                   ']',
                                   yv.stack.map(function(c){return c.func;}));

        // Note that we need to make a bogus function wrapper here or else
        // parse() will complain about the 'return outside of a function'
        var newBody = Shaper.replace(
            'function _(){return new Generator(this, $);}',
            conts).body.children[0];
        stmts.push(newBody);

        // hollow out old function and replace it with new function body
        funcBodyStart(node.body, old_srcs[0]);
        for (i=0; i<stmts.length; i++) {
            funcBodyAdd(node.body, stmts[i], '');
        }
        funcBodyFinish(node.body, old_srcs[old_srcs.length-1]);

        return node;
    }

    // find functions containing 'yield' and take note of uses of
    // 'arguments' and 'catch' as well.
    var fns = [{fake:true,vars:[]}];
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
