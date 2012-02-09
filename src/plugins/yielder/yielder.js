/*jshint globalstrict:true, eqeqeq:true, curly:true, latedef:true, newcap:true,
  undef:true, trailing:true */
/*global require:false, console:false, print:false, tkn:false, Narcissus:false */
"use strict"; "use restrict";

var Ref = Ref || require("ref.js") || Ref;
var Shaper = Shaper || require("shaper.js") || Shaper;
var log = (typeof console !== "undefined") && console.log || print;

// converts functions containing yield/yield() to generators.
Shaper("yielder", function(root) {
    var gensym = (function(){
        var i = 0;
        return function(base) {
            base = base || 'tmp';
            return '$'+base+'$'+(i++);
        };
    })();

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
        this.tryStack = [];
        this.breakFixup = [];
        this.continueFixup = [];
        this.newExternalCont();
    }
    YieldVisitor.prototype = {
        top: function() { return this.stack[this.stack.length-1]; },
        add: function(child, src) {
            var top = this.top();
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
            if (!this.canFallThrough) {
                log("// Adding unreachable return");
            }
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
                    this.add(Shaper.parse('throw $stop;'), '');
                }
                funcBodyFinish(top.body);
            }
        },

        newInternalCont: function() {
            this.close();

            var frame = Shaper.parse('_ = function() {}').children[1];
            // number the continuation, for easier human tracing
            frame.srcs[0] = 'function/*['+this.stack.length+']*/() ';

            var new_top = { func: frame, body: frame.body, catcher:false };

            // find active try block
            var tb = null;
            for (var i=this.tryStack.length-1; i>=0; i--) {
                if (!this.tryStack[i].inCatch) {
                    tb = this.tryStack[i];
                    break;
                }
            }
            if (tb) {
                var v = tb.varName;
                var tryBlock = Shaper.parse('try { $ } catch ('+v+') { }');
                funcBodyStart(frame.body);
                funcBodyAdd(frame.body, tryBlock, '');
                funcBodyFinish(frame.body);
                new_top.body = tryBlock.tryBlock;

                // fill out catch block
                var c = tryBlock.catchClauses[0].block, s;
                funcBodyStart(c);
                s = Shaper.parse('if ('+v+'===$stop) { throw '+v+'; }');
                funcBodyAdd(c, s, '');
                s = Shaper.parse('_={ cont:$, ex:'+v+', again:true }').
                    children[1];
                // record fixup needed for catch block.
                tb.fixups.push(new Ref(s, 'children', 0, 'children', 1));
                s = this.returnStmt(s);
                funcBodyAdd(c, s, '');
                // XXX fix handling of finally blocks
                funcBodyFinish(c);
            }
            funcBodyStart(new_top.body);

            this.stack.push(new_top);
            this.canFallThrough = true;
        },
        newExternalCont: function() {
            this.newInternalCont();
            // optimization: can't throw before generator has been started
            if (this.stack.length===1) { return; }
            this.add(Shaper.parse('if (arguments[0]) {throw arguments[0].ex;}'),
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
            return this.splitTokens.apply(this, arguments).join('');
        },
        splitTokens: function(src, token) {
            var t = new Narcissus.lexer.Tokenizer(src);
            var i, tt, r=[], start=0;
            for (i=1; i<arguments.length; i++) {
                tt = t.mustMatch(arguments[i]);
                if (arguments[i]===tkn.END) { continue; }
                r.push(src.substring(start, tt.start));
                start = tt.end;
            }
            r.push(src.substring(start));
            return r;
        },

        // rewrite arguments, catch expressions, var nodes, etc.
        pre: function(node, ref) {
            if (node.type === tkn.FUNCTION) {
                // skip nested functions.
                // XXX this means that references to block-scoped catch
                //     variables in nested functions will be wrong, ie:
                //     try {
                //       ...
                //     } catch (e) {
                //       return function() { return e; }
                //     }
                //     We should really do a much-more limited transformation
                //     on nested functions to catch this case, being careful
                //     to let function-scoped variables properly overshadow
                //     the block scoped variable, ie:
                //     try {
                //       ...
                //     } catch (e) {
                //       return function(e) { return e; }
                //       // or function() { var e; ... }
                //     }
                return "break";
            }
            if (node.type === tkn.VAR) {
                node.srcs[0] = this.removeTokens(node.srcs[0], tkn.VAR);
                node.type = tkn.COMMA;
            }
            if (node.type === tkn.IDENTIFIER) {
                if (node.value === 'arguments') {
                    Shaper.renameIdentifier(node, '$'+node.value);
                } else {
                    // is this an identifier on the try stack?
                    for (var i=this.tryStack.length-1; i>=0; i--) {
                        var t = this.tryStack[i];
                        if (t.inCatch && t.varName === node.value) {
                            var nn = Shaper.parse('$block.$'+node.value);
                            Shaper.cloneComments(nn, node);
                            return ref.set(nn);
                        }
                    }
                }
            }
            if (node.type === tkn.BREAK ||
                node.type === tkn.CONTINUE) {
                var r = this.returnStmt(-1).expression;// strip semicolon
                var fixup = (node.type===tkn.BREAK) ?
                    this.breakFixup : this.continueFixup;
                fixup.push({ret:r, target:node.target});
                // tweak comments.
                Shaper.cloneComments(r, node);
                if (node.label) {
                    var extra = this.removeTokens(node.srcs[0], node.type,
                                                  tkn.IDENTIFIER, tkn.END);
                    r.srcs[0]+=extra;
                }
                this.canFallThrough = false;
                return ref.set(r);
            }
            if (node.type === tkn.RETURN) {
                this.canFallThrough = false;
                return ref.set(Shaper.parse('throw $stop'));
            }
            if (node.type === tkn.THROW) {
                this.canFallThrough = false;
                // no other modification needed
                return;
            }
            if (node.type === tkn.YIELD) {
                var value;
                if (node.value) {
                    value = Shaper.traverse(node.value, this,
                                            new Ref(node, 'value'));
                } else {
                    value = Shaper.parse("void(0)");// 'undefined'
                }
                var rval = Shaper.replace('_={cont:'+this.stack.length+
                                          ',ret:$}', value).children[1];
                this.addReturn(rval);
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

        // XXX could wrap '$block = Object.create($block);' and
        //     '$block = Object.getPrototypeOf($block);' around contents
        //     here to implement block scoping.

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
    YieldVisitor.prototype[tkn.LABEL] = function(node, src) {
        // transfer comments/whitespace around label
        var leading = (node.leadingComment || '') +
            (node._label.trailingComment || '');
        node.statement.leadingComment = leading +
            (node.statement.leadingComment || '');

        var this_target = node.statement;
        if (this_target.type===tkn.SEMICOLON) {
            this_target = this_target.expression;
        }
        this.visit(node.statement, src); // may mutate node.statement

        var labelEnd = this.stack.length;
        if (this.canFallThrough) {
            this.addReturn(labelEnd);
        }
        this.newInternalCont();
        this.fixupJumps(this.breakFixup, this_target, labelEnd);
    };
    YieldVisitor.prototype.fixupJumps = function(fixups, this_target, labelEnd) {
        // fixup all break statements targetting this.
        for (var i=fixups.length-1; i>=0; i--) {
            var bf = fixups[i];
            if (bf.target === this_target) {
                fixups.splice(i, 1);
                bf.ret.value = Shaper.parse(String(labelEnd));
            }
        }
    };
    YieldVisitor.prototype[tkn.DO] = function(child, src) {
        child.condition = Shaper.traverse(child.condition, this,
                                          new Ref(child, 'condition'));
        var loopStart = this.stack.length;
        var ret = this.addReturn(loopStart);

        this.newInternalCont();
        this.visit(child.body, '');
        var loopContinue = this.stack.length;
        if (this.canFallThrough) {
            this.addReturn(loopContinue);
        }
        this.newInternalCont();

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

        this.fixupJumps(this.breakFixup, child, this.stack.length);
        this.fixupJumps(this.continueFixup, child, loopContinue);
        this.newInternalCont();
    };
    YieldVisitor.prototype[tkn.WHILE] = function(child, src) {
        console.assert(src==='');
        child.condition = Shaper.traverse(child.condition, this,
                                          new Ref(child, 'condition'));
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
        if (this.canFallThrough) {
            this.addReturn(loopStart);
        }

        // fixup loop check
        loopCheck.thenPart.expression.value =
            Shaper.parse(String(this.stack.length));
        this.fixupJumps(this.breakFixup, child, this.stack.length);
        this.fixupJumps(this.continueFixup, child, loopStart);
        this.newInternalCont();
    };
    YieldVisitor.prototype[tkn.FOR_IN] = function(node, src) {
        console.assert(false, "should have been removed in previous pass");
    };
    YieldVisitor.prototype[tkn.FOR] = function(child, src) {
        var setup;
        // if there is setup, emit it first.
        if (child.setup) {
            child.setup = Shaper.traverse(child.setup, this,
                                          new Ref(child, 'setup'));
            setup = Shaper.replace('$;', child.setup);
        } else {
            setup = Shaper.parse(';');
        }
        this.add(setup, '');

        // fixup comments
        var extraComment = child.srcs.slice(
            0, 1+(child.setup?1:0)+(child.condition?1:0)+(child.update?1:0)).
            join('');
        extraComment = this.removeTokens(extraComment, tkn.FOR, tkn.LEFT_PAREN);
        var split = this.splitTokens(extraComment, tkn.SEMICOLON,
                                     tkn.SEMICOLON, tkn.RIGHT_PAREN,
                                     tkn.END);
        setup.leadingComment = (child.leadingComment || '') + split[0] +
            (setup.leadingComment || '');
        setup.trailingComment = (setup.trailingComment||'') + split[1];

        // now proceed like a while loop
        child.condition = Shaper.traverse(child.condition, this,
                                          new Ref(child, 'condition'));
        var loopStart = this.stack.length;
        this.addReturn(loopStart);
        this.newInternalCont();

        // top of loop: check the condition.
        var loopCheck = Shaper.parse("if (!($)) $");
        loopCheck.condition.children[0].children[0] = child.condition ||
            Shaper.parse('true');
        loopCheck.thenPart = this.returnStmt(-1);
        loopCheck.thenPart.trailingComment = split[2] + split[3];
        this.add(loopCheck, '');

        // loop body
        this.visit(child.body, src);

        // loop update
        if (this.canFallThrough) {
            if (child.update) {
                child.update = Shaper.traverse(child.update, this,
                                               new Ref(child, 'update'));
                var update = Shaper.replace('$;', child.update);
                this.add(update);
            }
            this.addReturn(loopStart);
        } else if (child.update) {
            // XXX transfer comments from child.update
        }

        // fixup loop check
        loopCheck.thenPart.expression.value =
            Shaper.parse(String(this.stack.length));
        this.fixupJumps(this.breakFixup, child, this.stack.length);
        this.fixupJumps(this.continueFixup, child, loopStart);
        if (child.formerly) { // handle converted for-in loops
            this.fixupJumps(this.breakFixup, child.formerly, this.stack.length);
            this.fixupJumps(this.continueFixup, child.formerly, loopStart);
        }
        this.newInternalCont();
    };
    YieldVisitor.prototype[tkn.IF] = function(child, src) {
        child.condition = Shaper.traverse(child.condition, this,
                                          new Ref(child, 'condition'));
        this.add(child, '');
        this.canFallThrough = false; // both sides of IF will get returns

        var thenPart = this.stack.length;
        this.newInternalCont();
        this.visit(child.thenPart, child.elsePart ? '' : src);
        var thenPlace = this.canFallThrough ?
            this.addReturn(this.stack.length) : null /*optimization*/;
        // replace original thenPart with branch to continuation
        child.thenPart = this.returnStmt(thenPart);

        if (child.elsePart) {
            var elsePart = this.stack.length;
            this.newInternalCont();
            this.visit(child.elsePart, src);
            if (this.canFallThrough) {
                this.addReturn(this.stack.length);
            }
            // replace original elsePart with branch to continuation
            child.elsePart = this.returnStmt(elsePart);
            if (child.srcs[2].length===4) {
                child.srcs[2] += ' '; // ensure token separation
            }
            // fixup then part
            if (thenPlace) {
                thenPlace.expression.value =
                    Shaper.parse(String(this.stack.length));
            }
        } else {
            console.assert(child.srcs.length===3);
            child.elsePart = this.returnStmt(this.stack.length);
            child.srcs.splice(2, 0, ' else ');
        }
        this.newInternalCont();
    };
    YieldVisitor.prototype[tkn.TRY] = function(node, src) {
        var c,i,j;
        var r = this.addReturn(this.stack.length);
        if (node.leadingComment) {
            r.leadingComment = node.leadingComment;
        }
        for (i=0; i<node.catchClauses.length; i++) {
            c = node.catchClauses[i];
            this.tryStack.push({varName:c.varName, fixups:[], inCatch:false});
        }

        this.newInternalCont();
        this.visit(node.tryBlock, src); // XXX src should be used after finally
        var finallyFixups = [];
        finallyFixups.push(this.addReturn(-1));

        // catch blocks
        for (i=0; i<node.catchClauses.length; i++) {
            var catchStart = this.stack.length;
            c = this.tryStack[this.tryStack.length-1];
            c.inCatch = true;
            for (j=0; j<c.fixups.length; j++) {
                c.fixups[j].set(Shaper.parse(String(catchStart)));
            }
            this.newInternalCont();
            // set up scope
            this.add(Shaper.parse('$block = Object.create($block);'), '');
            var cc = node.catchClauses[i];
            var s = Shaper.parse('$block.$'+cc.varName+' = arguments[0].ex;');
            Shaper.cloneComments(s, cc._name);
            var extra = (cc.leadingComment||'') +
                this.removeTokens(cc.srcs[0], tkn.CATCH, tkn.LEFT_PAREN);
            s.leadingComment = extra + (s.leadingComment||'');
            this.add(s, '');

            this.visit(cc.block, '');

            // XXX if we leave this block via exception we need to clean up
            //     the block scope
            if (this.canFallThrough) {
                this.add(Shaper.parse('$block = Object.getPrototypeOf($block);'), '');
                finallyFixups.push(this.addReturn(-1));
            }
            this.tryStack.pop();
        }

        // after try / finally (XXX finally isn't really supported yet)
        var finallyLabel = this.stack.length;
        this.newInternalCont();
        for (i=0; i<finallyFixups.length; i++) {
            finallyFixups[i].expression.value =
                Shaper.parse(String(finallyLabel));
        }
    };

    function alterFunc(node, props, ref) {
        var stmts = [];
        var i;
        // export the Generator and StopIteration
        stmts.push(Shaper.parse('var $Generator = require("generator.js");'));
        stmts.push(Shaper.parse('var $stop = {};'));
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
            'function _(){return new $Generator(this, $stop, $);}',
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
          if (node.type === tkn.FOR_IN) {
              // convert to use iterator
              var it = gensym('it'), e = gensym('e');
              var newFor = Shaper.replace('for(var '+it+'=Iterator($,true);;){'+
                                          'try { $='+it+'.next(); } '+
                                          'catch ('+e+') { '+
                                          'if ('+e+'===StopIteration) break; '+
                                          'throw '+e+'; }'+
                                          '$}',
                                          node.object,
                                          node.varDecl || node.iterator,
                                          node.body);
              newFor.labels = node.labels;
              Shaper.cloneComments(newFor, node);
              newFor.srcs[0] = node.srcs[0];
              newFor.formerly = node; // for matching up break/continue
              // looks better if we move the trailing comment from the old body
              // to the new body
              var trailing = node.body.trailingComment || '';
              delete node.body.trailingComment;
              newFor.body.trailingComment = trailing +
                  (newFor.body.trailingComment || '');
              return ref.set(newFor);
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
