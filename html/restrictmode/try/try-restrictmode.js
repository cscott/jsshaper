jQuery(document).ready(function() {
    function viewSource() {
        var source = jQuery("#sourceedit").val();
        jQuery("#sourceview").html(source).chili().show();
        return source;
    }

    // run restricter
    jQuery("form").submit(function() {
        var src = viewSource();
        try {
            var root = Shaper.parseScript(src, "<filename>");
            root = Shaper.run(root, ["annotater", "restricter"]);
            var checked = root.getSrc();
            jQuery("#checkedview").html(checked).chili().show();
        }
        catch (e) {
            var reason = String(e);
            if (e.stack) {
                reason = e.stack;
            }
            jQuery("#checkedview").html(reason).show();
        }

        try {
            var fn = new Function(checked);
            fn();
        }
        catch (e) {
            var reason = String(e);
            if (e.stack) {
                reason = e.stack;
            }
            jQuery("#output").html(reason).show();
        }
        return false;
    });
    // act on keystrokes in editor
    jQuery("#sourceedit").keydown(function(e) {
        // code borrowed from John Resig
        if (this.setSelectionRange) {
            var start = this.selectionStart;
            var val = this.value;

            if (e.keyCode === 13) {
                var match = val.substring(0, start).match(/(^|\n)([ \t]*)([^\n]*)$/);
                if (match) {
                    var spaces = match[2];
                    var length = spaces.length + 1;
                    this.value = val.substring(0, start) +"\n"+ spaces + val.substr(this.selectionEnd);
                    this.setSelectionRange(start + length, start + length);
                    this.focus();
                    return false;
                }
            }
            else if (e.keyCode === 8 && val.substring(start - 2, start) === "  ") {
                this.value = val.substring(0, start - 2) + val.substr(this.selectionEnd);
                this.setSelectionRange(start - 2, start - 2);
                this.focus();
                return false;
            }
            else if (e.keyCode === 9) {
                this.value = val.substring(0, start) +"  "+ val.substr(this.selectionEnd);
                this.setSelectionRange(start + 2, start + 2);
                this.focus();
                return false;
            }
            else if (e.keyCode === 27) { // ESC
                viewSource();
                return false;
            }
        }
    });

    // hide highlighter, show editor
    jQuery("#sourceview").dblclick(function(){
        jQuery("#sourceview").hide();
        jQuery("#sourceedit").focus();
    });

    var sourceedit = '"use restrict";\n\nvar x = 1 + "2";';
    jQuery("#sourceedit").html(sourceedit);
    viewSource();
    jQuery("#checkedview").html("// press run restricter for\n// restricter output here").chili().show();
});
