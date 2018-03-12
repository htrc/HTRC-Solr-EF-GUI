
// From https://stackoverflow.com/questions/17005823/getting-deleted-character-or-text-on-pressing-delete-or-backspace-on-a-textbox
$.fn.getCursorPosition = function() {
    var el = $(this).get(0);
    var pos = 0;
    var posEnd = 0;
    if ('selectionStart' in el) {
	pos = el.selectionStart;
	posEnd = el.selectionEnd;
    }
    else if ('selection' in document) {
	el.focus();
	var Sel = document.selection.createRange();
	var SelLength = document.selection.createRange().text.length;
	Sel.moveStart('character', -el.value.length);
	pos = Sel.text.length - SelLength;
	posEnd = Sel.text.length;
    }
    // return both selection start and end;
    return [pos, posEnd];
};

function domready_volume_autocomplete(textbox_id,available_tags)
{
    var dynamic_fields_dic = {  'pubPlace_t': place_dic, 'language_t': language_dic, 'format_t': format_dic };
    var dynamic_fields     = Object.keys(dynamic_fields_dic);
    
    var dynamic_fields_re_str = "^("+dynamic_fields.join("|")+")";
    var dynamic_fields_simple_re   = new RegExp(dynamic_fields_re_str + "$");
    var dynamic_fields_compound_re = new RegExp(dynamic_fields_re_str + ":.+$");

    
    function term_split( val ) {
	var query_terms = val.match(/[^"\s:]+(?::(?:[^"\s:]+|"[^"]+"))?|(?:"[^"]+")/g); // ******
	return query_terms;
    }

    function extract_last_term(term) {
	var terms = term_split(term);
	if (terms != null) {
	    return terms.pop();
	}
	else {
	    return null;
	}
    }

    function expand_autocomplete_field(dynamic_field,label_dic)
    {
	console.log("*** dynamic_field = " + dynamic_field);
	
	var expanded_fields_already_present = false;
	var expanded_field_re = new RegExp("^"+dynamic_field+":.+$");

	// knock out the plain field
	available_tags = jQuery.grep(available_tags, function(val, index) {
	    if ((!expanded_fields_already_present) && (val.key.match(expanded_field_re))) {
		expanded_fields_already_present = true;
	    }
	    return (val.key != dynamic_field);
	});

	if (!expanded_fields_already_present) {
	    // Add in all the mnemonic 'dynamic_field' (e.g., pubPlace_t) names
	    $.each(label_dic, function(key,val) {
		var extra_tag = {'key': dynamic_field+":"+key, 'label':val};
		available_tags.push(extra_tag);
		//available_tags.push({'key': dynamic_field+":"+key, 'label': label_dic[key]}); // ****
	    });
	}

    }
/*
    function expand_autocomplete_fields(typed_text)
    {
	var last_term = extract_last_term(typed_text);

	for (var i=0; i<dynamic_fields.length; i++) {
	    var dynamic_field = dynamic_fields[i];
	    var dynamic_field_dic = dynamic_fields_dic[i];

	    if (last_term == dynamic_field) {
		expand_autocomplete_field(dynamic_field,dynamic_field_dic);
		break;
	    }
	}
    }
*/
    
    function contract_autocomplete_field(dynamic_field,label_dic)
    {
	var contracted_field_already_present = false;
	var dynamic_field_re = new RegExp("^"+dynamic_field+":.+$");
	
	available_tags = jQuery.grep(available_tags, function(val, index) {
	    if (val.key == dynamic_field) {
		contracted_field_already_present = true;
	    }
	    return (!val.key.match(dynamic_field_re));
	});

	if (!contracted_field_already_present) {
	    available_tags.push({'key': dynamic_field, 'label': label_dic[dynamic_field]});
	}
    }

    /*
    function contract_autocomplete_fields(typed_text)
    {
	var last_term = extract_last_term(typed_text);

	for (var i=0; i<dynamic_fields.length; i++) {
	    var dynamic_field = dynamic_fields[i];
	    var dynamic_field_re = new RegExp("^"+dynamic_field+":.+$");

	    if (typed_text.match(field_re)) {
		terms.push( typed_text + " "); // add the selected item

		contract_autocomplete_field(dynamic_field,volume_metadata_dic);
		break;
	    }
	}
    }
    */

    function autocomplete_keydown(event)
    {
	if ( event.keyCode === $.ui.keyCode.TAB &&  $(this).autocomplete("instance").menu.active ) {
	    // don't navigate away from the field on tab when selecting an item
	    event.preventDefault();
	}
	
	var typed_text = $(this).val();
	var typed_text_len = typed_text.length;
	
	//typed_text = $('#'+textbox_id).val(); // ****
	var position = $(this).getCursorPosition();
	var pos_start = position[0];
	var pos_end   = position[1];

	console.log("autocomplete_keydown(): text cursor/selected range = [" + pos_start + "," + pos_end +"]");
	console.log("autocomplete_keydown(): number of available_tags = " + available_tags.length );
	
	if (pos_start == typed_text_len) {
	    // cursor is at the end of the line => 
	    // => append
	    
	    if (event.key == ':') {
		console.log("Pressed ':' =>  typed text = " + typed_text);
		var last_term = extract_last_term(typed_text);
		if (!last_term.match(/_t$/)) {
		    // auto-correct to include it
		    if (last_term.match(/_$/)) {
			last_term += "t"; // ******
			$(this).val(typed_text + "t");
		    }
		    else {
			last_term += "_t"; // ******
			$(this).val(typed_text + "_t");
		    }
		}
		    
		var simple_match = dynamic_fields_simple_re.exec(last_term);
		//if (last_term == "pubPlace_t") {
		if (simple_match) {	   
		    var dynamic_field = simple_match[1];
		    var dynamic_field_dic = dynamic_fields_dic[dynamic_field];
		    expand_autocomplete_field(dynamic_field,dynamic_field_dic);
		}

	    }
	    else if (event.key == ' ') {
		console.log("Pressed ' ' typed_text = " + typed_text);		    
		// consider removing if not within double-quotes // ******
		var last_term = extract_last_term(typed_text);

		//if (last_term.match(/^pubPlace_t:.+$/)) {
		var compound_match = dynamic_fields_compound_re.exec(last_term);
		if (compound_match) {	   	    
		    var dynamic_field = compound_match[1];
		    // => filter out the extended entries, e.g., pubPlace_t:xxx, and add in the simpler 'pubPlace_t'
		    contract_autocomplete_field(dynamic_field,volume_metadata_dic);			
		}
	    }
//	    else if ((event.keyCode == $.ui.keyCode.DELETE) || (event.keyCode == $.ui.keyCode.BACKSPACE)) { / ****
	    else if (event.keyCode == $.ui.keyCode.BACKSPACE) {
		// Consider handling $.ui.keyCode.DELETE ???
		
		console.log("Delete/Backspace=" + event.keyCode + ", typed_text = " + typed_text);
		
		var last_term = extract_last_term(typed_text); // Note trailing colon stripped off, as term incomplete

		//if (typed_text.match(/:$/) && (last_term.match(/^pubPlace_t$/))) {

		
		if (typed_text.match(/:$/)) {

		    //if (typed_text.match(/:$/) && (last_term.match(/^pubPlace_t$/))) {
		    var simple_match = dynamic_fields_simple_re.exec(last_term);
		    if (simple_match) {
			var dynamic_field = simple_match[1];
			console.log("contract field");
			contract_autocomplete_field(dynamic_field,volume_metadata_dic);
		    }
		}
	    }
	    
	}
	else {
	    // support insert mid-way??? (hard!)
	    // By leaving blank, user left to their own devices when inserting partway through already entered text
	}	
    }
    
    function autocomplete_source(request,response)
    {
	// delegate back to autocomplete, but extract the last term
	var last_term = extract_last_term(request.term);
	if (last_term != null) {
	    
	    var filtered_available_tags = [];
	    var last_term_re = new RegExp(last_term,'i');
	    
	    var last_term_field_split_pos = last_term.indexOf(':');
	    var last_label_re = null;
	    var last_term_field_re = null;
	    
	    if (last_term_field_split_pos>0) {
		var last_label = last_term.substring(last_term_field_split_pos+1);
		if (last_label != "") {
		    last_label_re = new RegExp(last_label,'i');
		    var last_term_field = last_term.substring(0,last_term_field_split_pos);
		    last_term_field_re = new RegExp("^"+last_term_field,'i');
		    
		    console.log("*** last term field = " + last_term_field);
		    console.log("*** last label = " + last_label);
		}
	    }
	    
	    $(available_tags).each(function(index,elem) {
		if (elem.key.match(last_term_re)) {
		    filtered_available_tags.push(elem);
		}
		else if (elem.label) {
		    if  (elem.label.match(last_term_re)) { // && last_term.length>=2 ??
			filtered_available_tags.push(elem);
		    }			    
		    else {
			if (last_label_re != null) {
			    if  (elem.key.match(last_term_field_re) && elem.label.match(last_label_re)) {
				filtered_available_tags.push(elem);
			    }
			}
		    }
		}
	    });

	    console.log("autocomplete_source(): number of filtered tags   = " + filtered_available_tags.length);
	    response(filtered_available_tags);
	}
	else {
	    console.log("returning empty string");
	    response("");
	}
    }

    function autocomplete_select(event,ui)
    {
	var terms = term_split(this.value);		
	terms.pop();                       // remove the current input	

	//if (ui.item.key.match(dynamic_fields_simple_re)) {
	var simple_match = dynamic_fields_simple_re.exec(ui.item.key);
	if (simple_match) {	   
	    var dynamic_field = simple_match[1];
	    var dynamic_field_dic = dynamic_fields_dic[dynamic_field];
	    
	    terms.push( ui.item.key + ":" ); // add the selected item
	    
	    expand_autocomplete_field(dynamic_field,dynamic_field_dic);
	}
	else {
	    //if (ui.item.key.match(dynamic_fields_compound_re)) {
	    var compound_match = dynamic_fields_compound_re.exec(ui.item.key);
	    if (compound_match) {	   	    
		var dynamic_field = compound_match[1];
		
		terms.push( ui.item.key + " "); // add the selected item
		contract_autocomplete_field(dynamic_field,volume_metadata_dic);
	    }	
	    else {
		terms.push( ui.item.key + ":" ); // add the selected item
	    }
	}
	
	//// add placeholder to get the comma-and-space at the end
	//terms.push( "" );
	this.value = terms.join(" ");
	return false;
    }
    
    $('#'+textbox_id )
	.on( "keydown", autocomplete_keydown)
	.autocomplete({
	    minLength: 0,
	    source: autocomplete_source,
	    focus: function() {
		// prevent value inserted on focus
		return false;
	    },
	    select: autocomplete_select
	})
	.autocomplete("instance")._renderItem = function( ul, item ) {

	    var key = item.key;
	    var lab = item.label;
	    var typed_text = $('#'+textbox_id).val();
	    var last_term = extract_last_term(typed_text);
	    if (last_term != null) {
		var last_term_re = new RegExp("("+last_term+")",'i');	
		key = key.replace(last_term_re,"<b>$1</b>");
	    }

	    return $( "<li>" )
	        .append( "<div>" + key + "&nbsp;<i>" + lab + "</i></div>" )
	        .appendTo( ul );
	};
    
}
