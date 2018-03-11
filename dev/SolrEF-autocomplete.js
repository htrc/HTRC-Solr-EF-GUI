
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
    function term_split( val ) {
	var query_terms = val.match(/[^"\s:]+(?::(?:[^"\s:]+|"[^"]+"))?|(?:"[^"]+")/g);
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
    
    function dynamically_adjust_autocomplete(terms,typed_text)
    {
	var adjusted_tags = false;

	var dynamic_fields     = [ "pubPlace_t", "language_t", "format_t" ];
	var dynamic_fields_dic = [ place_dic,    language_dic, format_dic ];

	for (var i=0; i<dynamic_fields.length; i++) {
	    var field = dynamic_fields[i];
	    var field_dic = dynamic_fields_dic[i];
	    var field_re = new RegExp("^"+field+":.+$");
					       
	    if (typed_text == field) {
		terms.push( typed_text + ":" ); // add the selected item
		
		available_tags = jQuery.grep(available_tags, function(val, index) {
		    return (val != field);
		});
		
		// Add in all the mnemonic pubPlace names
		$.each(field_dic, function(key,val) {
		    available_tags.push(field+":"+key);
		});

		adjusted_tags = true;
		break;
	    }
	    else if (typed_text.match(field_re)) {
		terms.push( typed_text + " "); // add the selected item
		
		available_tags = jQuery.grep(available_tags, function(val, index) {
		    return (!val.key.match(field_re));
		});
		available_tags.push(field);
		adjusted_tags = true;
		break;
	    }
	}
	    
	if (!adjusted_tags) {
	    terms.push(typed_text + ":"); // add the selected item
	}
	
    }

    $('#'+textbox_id )
	.on( "keydown", function( event ) {
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

	    if (pos_start == typed_text_len) {
		// cursor is at the end of the line => 
		// => append
		
		if (event.key == ':') {
		    console.log("Pressed ':' =>  typed text = " + typed_text);
		    var last_term = extract_last_term(typed_text);
		    if (last_term == "pubPlace_t") {
			expand_autocomplete_field("pubPlace_t",place_dic);
		    }

		}
		else if (event.key == ' ') {
		    console.log("Pressed ' ' typed_text = " + typed_text);		    
		    // consider removing if not within double-quotes // ******
		    var last_term = extract_last_term(typed_text);
		    if (last_term.match(/^pubPlace_t:.+$/)) {
			// => filter out the extended pubPlace_t:xxx entries, and add in the simpler 'pubPlace_t'
			contract_autocomplete_field("pubPlace_t",volume_metadata_dic);			
		    }
		}
		else if ((event.keyCode == $.ui.keyCode.DELETE) || (event.keyCode == $.ui.keyCode.BACKSPACE)) {
		    console.log("Delete/Backspace=" + event.keyCode + ", typed_text = " + typed_text);

		    var last_term = extract_last_term(typed_text); // Note trailing colon stripped off, as term incomplete

		    if (typed_text.match(/:$/) && (last_term.match(/^pubPlace_t$/))) {
			console.log("contract field");
			contract_autocomplete_field("pubPlace_t",volume_metadata_dic);
		    }
		}

	    }
	    else {
		// support insert mid-way??? (hard!)
		// By leaving blank, user left to their own devices when inserting partway through already entered text
	    }
		
	})
	.autocomplete({
	    minLength: 0,
	    source: function( request, response ) {
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

		    response(filtered_available_tags);
		}
		else {
		    console.log("returning empty string");
		    response("");
		}
	    },
	    focus: function() {
		// prevent value inserted on focus
		return false;
	    },
	    select: function( event, ui ) {
		var terms = term_split(this.value);		
		terms.pop();                       // remove the current input	

		if (ui.item.key == "pubPlace_t") {
		    terms.push( ui.item.key + ":" ); // add the selected item

		    expand_autocomplete_field("pubPlace_t",place_dic);
		}
		else if (ui.item.key.match(/^pubPlace_t:.+$/)) {
		    terms.push( ui.item.key + " "); // add the selected item

		    contract_autocomplete_field("pubPlace_t",volume_metadata_dic);
		}
		else {
		    terms.push( ui.item.key + ":" ); // add the selected item
		}
		
		//// add placeholder to get the comma-and-space at the end
		//terms.push( "" );
		this.value = terms.join(" ");
		return false;
	    }
	})
	.autocomplete( "instance" )._renderItem = function( ul, item ) {

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
