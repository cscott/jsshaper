all: test

tree-%: tests/%.js
	@cd ../.. ; node run-shaper.js -- plugins/yielder/$< --tree

tests/%.yielder.js: tests/%.js yielder.js
	@cd ../.. ; node run-shaper.js -- plugins/yielder/$< plugins/yielder/yielder.js --source > plugins/yielder/$@

run-%: tests/%.yielder.js
	@node $<

check-%: tests/%.yielder.js
	@node $< 2>&1 > tests/$*.actual
	@-diff -u tests/$*.expected tests/$*.actual

runrhino-%: tests/%.js
	@rhino -version 180 $<

checkrhino-%: tests/%.js
	@-rhino -version 180 $< 2>&1 > tests/$*.rhino
	@-diff -u tests/$*.expected tests/$*.rhino

checklines-%: tests/%.yielder.js
	@wc -l tests/$*.js | cut -f 1 -d ' ' > tmp1
	@wc -l tests/$*.yielder.js | cut -f 1 -d ' ' > tmp2
	@if ! cmp -s tmp1 tmp2 ; then \
	  wc -l tests/$*.js $< | head -2 ; \
        fi
	@$(RM) tmp1 tmp2

test: $(patsubst tests/%.expected,check-%,$(wildcard tests/*.expected)) \
      $(patsubst tests/%.expected,checklines-%,$(wildcard tests/*.expected)) \
      $(patsubst tests/%.expected,checkrhino-%,$(wildcard tests/*.expected)) \
	checklines-comments checklines-simple

.SECONDARY: # preserve generated *.yielder.js files

clean:
	$(RM) tests/*.yielder.js tests/*.actual
