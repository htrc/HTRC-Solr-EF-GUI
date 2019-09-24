//"use strict";

// ****
var solr_add_to_history = true; // by default want solr-key-q expressed query URLs added to browser history

function trigger_solr_key_search(solr_key_q,row_start,add_to_history)
{
    $.ajax({
	type: "POST",
	url: ef_accessapi_url, // change this global variable to something more sutiable???
	data: {
	    'action': 'url-shortener',
	    'key': encodeURI(solr_key_q)
	},
	dataType: "text",
	success: function(textData) {	    
	    var text_q = textData.trim();
	    select_optimal_query_tab(text_q);
	    solr_add_to_history = add_to_history;
	    initialize_new_solr_search();
	    advanced_query_set_explain_fields(text_q);

	    initiate_new_solr_search(text_q,row_start,group_by_vol_checked);
	},
	error: function(jqXHR, textStatus, errorThrown) {
	    var mess = "Failed to retrieve expanded form of solr query key: '" + solr_key_q + "'";
	    ajax_message_error(mess,jqXHR,textStatus,errorThrown);
	}
    });
}

function trigger_shoppingcart_key_search(shoppingcart_key_q) {
    // ajax call to get query specified by key		
    $.ajax({
	type: "POST",
	url: ef_accessapi_url, 
	data: {
	    'action': 'key-value-storage',
	    'key': encodeURI(shoppingcart_key_q)
	},
	dataType: "text",
	success: function(textData) {
	    var text_q = textData.trim();
	    select_optimal_query_tab(text_q);
	    $('#search-submit').click();			
	},
	error: function(jqXHR, textStatus, errorThrown) {
	    var mess = "<b>Failed to retrieve expanded form of shoppingcart key: '" + shoppingcart_key_q + "' when accessing the URL:";
	    mess +=  '<div style="margin: 0 0 0 10px">' + ef_accessapi_url +"</div></b>";
	    ajax_message_error(mess,jqXHR,textStatus,errorThrown);
	}
    });
}

function ajax_solr_text_search(newSearch,newResultPage)
{
    var url_args = [];

    for (var ka in store_search_args) {
	var ka_arg = store_search_args[ka];
	
	if (ka == "q") {
	    if (store_search_not_ids.length>0) {
		ka_arg += store_search_not_ids.join(" ");
	    }
	}
	url_args.push(ka + '=' + ka_arg);
    }

    url_args = facet_filter.solrSearchAppendArgs(url_args);
        
    var data_str = url_args.join("&");
    
    store_search_url = store_search_action + "?" + data_str;
    // Clear out any export-item download links generated previously
    $('a.export-item').attr('href',null);

    store_search_xhr = new window.XMLHttpRequest();
    
    $.ajax({
	type: "POST", 
	url: store_search_action,
	data: data_str,
	dataType: "json",
	xhr : function() {
	    return store_search_xhr;
	},
	success: function(jsonData) {
	    if (group_by_vol_checked) {
		// Possible merging of items in search results means
		// page-bar next pages not directly computable
		// => don't show page-bar, only give 'next' and 'prev'
		$('#page-bar').hide();
		$('#next-prev').show();
		show_results(jsonData,newSearch,newResultPage);		
	    }
	    else {
		// No merging of search result items possible
		// => can provide page-bar to user
		if (num_found==0) {
		    num_found=jsonData.response.numFound;
		    if (num_found>0) {

			$('#next-prev').hide();
			$('#page-bar').show();

			var start = (store_search_args.start>0) ? store_search_args.start : 0;

			$('#page-bar').Paging({
			    pagesize: num_results_per_page,
			    count: num_found,
			    current: Math.floor(store_search_args.start / num_results_per_page) +1,
			    toolbar: true ,changePagesize: function(ps) {
				num_results_per_page=ps;
				store_search_args.rows=ps;
				//store_search_args.start=start; // **** jump-start
				num_found=0;
				$('#page-bar').html('');
				ajax_solr_text_search(true,true); // newSearch=true, newResultPage=true
			    },
			    callback: function(a) {
				store_search_args.start = (a-1)* parseInt(num_results_per_page);
				show_updated_results();
			    }
			});
		    }
		}
		if (jsonData.response.numFound==0) {
		    $('#page-bar').html('');
		}
		show_results(jsonData,newSearch,newResultPage);
	    }
	},
	error: function(jqXHR, textStatus, errorThrown) {
	    $('.search-in-progress').css("cursor","auto");
	    iprogressbar.cancel();
	    var mess = "<b>Failed to perform Solr-EF query: '" + store_search_args.q + "' when accessing the URL:";
	    mess +=  '<div style="margin: 0 0 0 10px">' + store_search_action +"</div></b>";
	    ajax_message_error(mess,jqXHR,textStatus,errorThrown);
	}
    });
}


function show_updated_results()
{
    $('.search-in-progress').css("cursor","wait");
    
    ajax_solr_text_search(false,true); // newSearch=false, newResultPage=true
}

function show_new_results(delta) {
    
    var start = parseInt(store_search_args.start)
    
    store_search_args.start = start + parseInt(delta);

    show_updated_results();
}


var store_search_args = null;
var store_search_action = null;
var store_search_url = null;
var store_search_not_ids = null;
var store_query_level_mix = null;


// **** Should the following not be moved to globals, or lookup-vars?
var volume_metadata_fields_common =
    ["accessProfile_t", "genre_t", "imprint_t", "isbn_t", "issn_t",
     "issuance_t", "language_t", "lccn_t", "names_t", "oclc_t",
     "pubPlace_t", "pubDate_t", "rightsAttributes_t", "title_t", "typeOfResource_t"
    ];

function expand_vfield(q_term, search_vfield, query_level) {
    var vfields = [];

    var all_vfields = (search_vfield == "all-fields");
    
    if (all_vfields) {
	if (q_term.match(/:/)) {
	    vfields.push(q_term);
	}
	else {
	    for (var fi = 0; fi < volume_metadata_fields_common.length; fi++) {
	    
		var vfield = volume_metadata_fields_common[fi];
		if (query_level == FacetLevelEnum.Page) {
		    vfield = "volume"+ vfield + "xt";
		}
		vfields.push(vfield + ":" + q_term);
	    }
	}
    }
    else {
	if (q_term.match(/:/)) {
	    vfields.push(q_term);
	}
	else {
	    // (now deprecated) before the drop-down menu this part of
	    // the code default to searching by title_t
	    // var vfield = "title_t"; // ****

	    // See which volume metadata field is specified in 'search_vfield'
	    // and prefix that to the term
	    var vfield = search_vfield;
	    if (query_level == FacetLevelEnum.Page) {
		vfield = "volume"+ vfield + "xt";
	    }
	    
	    vfields.push(vfield + ":" + q_term);
	}
    }

    var vfields_str = vfields.join(" OR ");
    
    return vfields_str;
}

function expand_vquery_field_and_boolean(query, search_vfield, query_level) {
    // boolean terms
    //  => pos and lang field
    if (query === "") {
	return ""
    }
    
    //var query_terms = query.split(/\s+/); // ****
    // Based on:
    //   https://stackoverflow.com/questions/4031900/split-a-string-by-whitespace-keeping-quoted-segments-allowing-escaped-quotes
    //var query_terms = query.match(/\w+(?::(?:\w+|"[^"]+"))?|(?:"[^"]+")/g);
    var query_terms = query.match(/[^"\s:]+(?::(?:[^"\s:]+|"[^"]+"))?|(?:"[^"]+")/g);
    
    //console.log("*** query terms = " + query_terms); // ****
    
    var query_terms_len = query_terms.length;
    //console.log("*** query terms len = " + query_terms.length); // ****
    
    var bool_query_term = [];
    
    var i = 0;
    var prev_bool = "";
    
    var and_count = 0;
    var or_count  = 0;
    
    for (var i = 0; i < query_terms_len; i++) {
	var term = query_terms[i];
	
	if (term.match(/^and$/i)) {
	    prev_bool = term.toUpperCase();
	    and_count++;
	}
	else if (term.match(/^or$/i)) {
	    prev_bool = term.toUpperCase();
	    or_count++;
	}
	else {
	    if (i > 0) {
		if (prev_bool == "") {
		    prev_bool = "AND";
		    and_count++;
		}
	    }
	    
	    var expanded_term = expand_vfield(term, search_vfield, query_level); // **** only difference to POS version
	    
	    term = "(" + expanded_term + ")";
	    
	    if (prev_bool != "") {
		bool_query_term.push(prev_bool);
		prev_bool = "";
	    }
	    bool_query_term.push(term);
	}
    }
    
    var op_count = and_count + or_count;

    if (op_count == 1) {
	if (and_count == 1) {
            explain_search.volume_level_terms = "metadata-term AND metadata-term";
	}
	else {
	    // or_count == 1
	    explain_search.volume_level_terms = "metadata-term OR metadata-term";
	}
    }
    else {
	if (op_count>1) {
	    explain_search.volume_level_terms = "metadata-term AND+OR metadata-term ...";
	}
    }
    
    var bool_query = bool_query_term.join(" ");
    
    return bool_query;
}

function lang_pos_all_selected(universal_pos_tags,lang)
{
    var all_selected = true;
    
    for (var ti = 0; ti < universal_pos_tags.length; ti++) {
	var tag = universal_pos_tags[ti];
	var lang_tag_id = lang + "-" + tag + "-htrctoken-cb";
	var $lang_tag_cb = $('#' + lang_tag_id);
	if (!$lang_tag_cb.is(':checked')) {
	    all_selected = false;
	    break;
	}
    }

    return all_selected;
} 


function expand_field_lang_pos(q_text, langs_with_pos, langs_without_pos, search_all_checked) {
	var fields = [];
	var universal_pos_tags = ["VERB", "NOUN", "ADJ", "ADV", "ADP", "CONJ", "DET", "NUM", "PRT", "X"];

        if (do_solr_field_optimization && search_all_checked) {
	    console.log("Search all languages checked on: => (optimizing to use alllangs_htrctokentext Solr field)");
	    return "alllangs_htrctokentext:" + q_text;
	}
    
	for (var li = 0; li < langs_with_pos.length; li++) {
		var lang = langs_with_pos[li];
		var lang_enabled_id = lang + "-enabled";
		var $lang_enabled_cb = $('#' + lang_enabled_id);
	        if ($lang_enabled_cb.is(':checked')) {

		    if (do_solr_field_optimization && lang_pos_all_selected(universal_pos_tags,lang)) {
			console.log("POS tags all selected for: " + lang + " => (optimizing to use combined Solr field)");
			var lang_field = lang + "_htrctokentext";
			fields.push(lang_field + ":" + q_text);
		    }
		    else {
			console.log("Extracting POS tags for: " + lang);

			for (var ti = 0; ti < universal_pos_tags.length; ti++) {
				var tag = universal_pos_tags[ti];
				var lang_tag_id = lang + "-" + tag + "-htrctoken-cb";
				var $lang_tag_cb = $('#' + lang_tag_id);
				if (search_all_checked || ($lang_tag_cb.is(':checked'))) {
					var lang_tag_field = lang + "_" + tag + "_htrctokentext";
					fields.push(lang_tag_field + ":" + q_text);
				}
			}
		    }
		}
	}

	for (var li = 0; li < langs_without_pos.length; li++) {
		var lang = langs_without_pos[li];
		var lang_enabled_id = lang + "-enabled";
		var $lang_enabled_cb = $('#' + lang_enabled_id);

		if (search_all_checked || ($lang_enabled_cb.is(':checked'))) {
			console.log("Adding in non-POS field for: " + lang);
			var lang_tag_field = lang + "_htrctokentext";
			fields.push(lang_tag_field + ":" + q_text);
		}
	}

	var fields_str = fields.join(" OR ");

	return fields_str;
}

function expand_query_field_and_boolean(query, langs_with_pos, langs_without_pos, search_all_checked) {
    // boolean terms
    //  => pos and lang field
    if (query === "") {
	return ""
    }
    
    //var query_terms = query.split(/\s+/);
    // Based on:
    //   https://stackoverflow.com/questions/4031900/split-a-string-by-whitespace-keeping-quoted-segments-allowing-escaped-quotes
    //var query_terms = query.match(/\w+(?::(?:\w+|"[^"]+"))?|(?:"[^"]+")/g);
    var query_terms = query.match(/[^"\s:]+(?::(?:[^"\s:]+|"[^"]+"))?|(?:"[^"]+")/g);
    
    var query_terms_len = query_terms.length;
    
    var bool_query_term = [];
    
    var i = 0;
    var prev_bool = "";
    
    for (var i = 0; i < query_terms_len; i++) {
	var term = query_terms[i];
	if (term.match(/^(and|or)$/i)) {
	    prev_bool = term.toUpperCase();
	} else {
	    if (i > 0) {
		if (prev_bool == "") {
		    prev_bool = "AND";
		}
	    }
	    
	    var expanded_term = expand_field_lang_pos(term, langs_with_pos, langs_without_pos, search_all_checked)
	    
	    term = "(" + expanded_term + ")";
	    
	    if (prev_bool != "") {
		bool_query_term.push(prev_bool);
		prev_bool = "";
	    }
	    bool_query_term.push(term);
	}
    }
    
    var bool_query = bool_query_term.join(" ");
    
    return bool_query;
}

function initialize_new_solr_search()
{
    if ($('#search-results-page').is(":visible")) {
	$('#search-results-page').hide();
    }
    $('.search-in-progress').css("cursor","wait");

    // determine if publishing result will need login authentication
    authentication_check_for_publish_workset();

    num_found=0;
    $('#page-bar').html('');

    facet_filter.resetFilters(); // ****
    facet_filter.facetlistSet();    
    
    store_search_action = solr_search_action;

    explain_search = { 'group_by_vol': null,
		       'volume_level_terms': 'metadata-term', 'volume_level_desc': null,
		       'page_level_terms': 'POS-term OR ...', 'page_level_desc': null };

}


function load_solr_q(solr_q)
{
    initialize_new_solr_search();

    doc_unit  = " volume ";
    doc_units = " volumes ";

    
    var arg_start = 0;
    var group_by_vol_checked = false;

    initiate_new_solr_search(solr_q,arg_start,group_by_vol_checked);
}

function submit_action(event) {
    event.preventDefault();

    initialize_new_solr_search();
    
    var arg_q = null;

    var q_text = $('#q').val().trim();
    var vq_text = $('#vq').val().trim();

    var lang_mismatch_list = [];

    var tokenize_mode = $("#tokenize-mode :radio:checked").attr('id');

    var submit_action_tokenized_confirmed = function(json_data) {
	q_text = json_data.text_out

	group_by_vol_checked = $('#group-results-by-vol:checked').length;
	
	var search_all_langs_checked = $('#search-all-langs:checked').length;
	//var search_all_vfields_checked = $('#search-all-vfields:checked').length; // ****
	//var search_all_vfields_checked = ($('#vqf-menu').val() == "all-fields");
	var search_vfield = $('#vqf-menu').val();
	
	if (store_query_tab_selected == QueryTabEnum.Advanced) {
	    // **** first part of this now dulilcates some of the same code below
	    var advanced_q_text = $('#advanced-q').val().trim();
	    if (advanced_q_text === "") {
		$('.search-in-progress').css("cursor","auto");
		htrc_alert("No query term(s) entered");
		return;
	    }
	    arg_q = advanced_q_text;

	    advanced_query_set_explain_fields(arg_q);
	    
	}
	else {
	    if ((q_text === "") && (vq_text === "")) {
		$('.search-in-progress').css("cursor","auto");
		htrc_alert("No query term(s) entered");
		return;
	    }
	    	    
	    arg_q = expand_query_field_and_boolean(q_text, langs_with_pos, langs_without_pos, search_all_langs_checked);
	    
	    if (arg_q == "") {
		// Potentially only looking at volume level terms
		facet_filter.setFacetLevel(FacetLevelEnum.Volume);
	    }
	    else {
		facet_filter.setFacetLevel(FacetLevelEnum.Page);
	    }

	    var query_level = facet_filter.getFacetLevel();
	    var arg_vq = expand_vquery_field_and_boolean(vq_text, search_vfield, query_level);
	    
	    if (arg_q == "") {
		if (arg_vq == "") {
		    // arg_vq was empty to start with, but attempt to expand non-empty arg_q
		    //   lead to an empty arg_q being returned
		    $('.search-in-progress').css("cursor","auto");
		    htrc_alert("No languages selected");
		    return;
		} else {
		    arg_q = arg_vq;
		    doc_unit = " volume ";
		    doc_units = " volumes ";
		    explain_search.volume_level_desc  = "[Volume: Terms]";
		    if (group_by_vol_checked) {
			explain_search.group_by_vol = "Search results sorted by volume ID";
		    }
		}
	    }
	    else {
		if (arg_vq != "") {
		    // Need to watch out for any XXXX_t fields in 'arg_vq', as these need to
		    // be changed to volumeXXXX_txt fields when searching with page-level terms
		    // _txt
		    arg_vq = arg_vq.replace(/(\w+)_t:/g,"volume$1_txt:");
		    
		    // join the two with an AND
		    arg_q = "(" + arg_vq + ")" + " AND " + "(" + arg_q + ")"; 
		    
		    explain_search.volume_level_desc = "[Volume: Terms]";
		    explain_search.page_level_desc   = "[Page-level: POS-Terms]";
		}
		else {
		    explain_search.page_level_desc  = "[Page-level: POS-Terms]";
		}
		if (group_by_vol_checked) {
		    explain_search.group_by_vol = "Search results sorted by volume ID";
		}		    
		
		doc_unit  = " page ";
		doc_units = " pages ";
	    }
	}
	
	//console.log("*** NOW arg_q = " + arg_q);

	// Example search on one of the htrc-full-ef fields is: 
	//  q=en_NOUN_htrctokentext:farming
	
	var arg_start = $('#start').attr('value');

	gtag('event','search',	     
	     { //'event_category': 'engagement', // default, used to be 'query' // ****
	       'search_term': arg_q,
	       'event_label': '[page: ' + q_text + '], [volume: ' + vq_text + ']',
	       'user-q-text': q_text, 'user-vq-text': vq_text,
	       'query-level': facet_filter.getFacetLevel(),
	       'arg-start': arg_start,
	       'group-by-vol': group_by_vol_checked});
	
	initiate_new_solr_search(arg_q,arg_start,group_by_vol_checked);
    }

    var submit_action_tokenized = function(json_data) {

	var needs_clarification = false;
	var $lang_html = $('<div>');
	var $tok_html = $('<div>');

//	if (0) {	
	if (lang_mismatch_list.length > 0) {
	    needs_clarification = true;
	    $lang_html.append("Based on language identification of your query,"
			      + " the language search fields currently selected in the query form"
			      + " <i>potentially</i> do not match the language of the enetered query.")
		.append("<br>")
		.append("Would you like to add any of the following language field(s) prior to executing your search?")
		.append("<br>");
	    
	    for (var gli=0; gli<lang_mismatch_list.length; gli++) {

		var gl = lang_mismatch_list[gli];
		var lang_full = isoLangs[gl].name;
		var lang_native_full = isoLangs[gl].nativeName;
		var opt_title = (lang_full !== lang_native_full) ? 'title="' + lang_native_full + '"' : "";
		
		var $lang_span = $('<span>');
		if (lang_full !== lang_native_full) {
		    $lang_span.attr('title',lang_native_full);
		}
		$lang_span.text(lang_full);
		
		var $check_box_item = $('<nobr>')
		var $input = $('<input>')
		    .attr('type','checkbox')
		    .attr('name',gl+'-enabled')
		    .attr('id',gl+'-enabled');
		var $label = $('<label>')
		    .attr('for',gl+'-enabled')
		    .css('padding-left','5px')
		    .css('padding-right','10px')
		    .html($lang_span);
		$check_box_item.append($input).append($label);
		
		$lang_html.append($check_box_item);		
	    }	    

	    $lang_html.append('<hr>');
	}
		
	if ((tokenize_mode == "tokenize-on") && (q_text != json_data.text_out)) {
	    needs_clarification = true;
	    $tok_html.append("The OCR'd Page-level Text in the corpus you are searching has been tokenized prior to indexing.")
		.append('<br>')
		.append('Do you want to keep your query as it is, or tokenize it the same way as the corpus has been processed?')
		.append("<br>")

	    var $radio_choice = $('<fieldset>')
		.attr('id','tokenize-refinement');

	    var $radio_input_orig = $('<input>')
		.attr('type','radio')
		.attr('name','tokenize-refinement')
		.attr('id','tokenize-refinement-orig')
		.attr('checked','checked');
	    var $radio_label_orig = $('<label>')
		.attr('for','tokenize-refinement-orig')
		.text(q_text);

	    var $radio_div_orig = $('<div>');
	    $radio_div_orig.append($radio_input_orig).append($radio_label_orig);
	    $radio_choice.append($radio_div_orig);

	    var $radio_input_repl = $('<input>')
		.attr('type','radio')
		.attr('name','tokenize-refinement')
		.attr('id','tokenize-refinement-repl');
	    var $radio_label_repl = $('<label>')
		.attr('for','tokenize-refinement-repl')
		.text(json_data.text_out);

	    var $radio_div_repl = $('<div>');
	    $radio_div_repl.append($radio_input_repl).append($radio_label_repl);
	    $radio_choice.append($radio_div_repl);

	    $tok_html.append($radio_choice);
	    
	    //$tok_html += "Query input: " + q_text + "<br>";
	    //$tok_html += "Tokenized as: " + json_data.text_out.split(" ").join(", ");
	}
	
	if (needs_clarification) {
	    var $mess = $('<div>').append($lang_html).append($tok_html);
	    
	    /*
	    htrc_confirm($mess,
			  function() {
			      $(this).dialog("close");
			      $('#q').val(json_data.text_out);
			      submit_action_tokenized_confirmed(json_data);
			  },
			  function() {
			      $(this).dialog("close");
			      submit_action_tokenized_confirmed({"text_out":q_text});
			  }
			 );
	    */
	    	    
	    htrc_continue($mess,
			  function() {
			      $(this).dialog("close");
			      var tokenize_refinement = $("#tokenize-refinement :radio:checked").attr('id');
			      if (tokenize_refinement == "tokenize-refinement-orig") {
				  submit_action_tokenized_confirmed({"text_out":q_text});
			      }
			      else {
				  $('#q').val(json_data.text_out);
				  submit_action_tokenized_confirmed(json_data);
			      }
			  },
			  function() {
			      $('.search-in-progress').css("cursor","auto");
			      $(this).dialog("close");
			  }
			 );
	}
	else {
	    submit_action_tokenized_confirmed(json_data);
	}
    }

    var submit_action_check_language = function(json_data) {

	// [ {lang, prob}+ ]

	lang_mismatch_list = [];

	var search_all_langs_checked = $('#search-all-langs:checked').length;
	
	if (!search_all_langs_checked && json_data.length>0) {

	    // Check to see if guess-lang aligned with what the user has selected

	    // => Count how many guessed languages are switched on in the query form
	    //    and make sure > 0
	    
	    var guess_on_count = 0;

	    for (var gli=0; gli<json_data.length; gli++) {
		var guess_lang = json_data[gli].lang;
		var lang_enabled_id = guess_lang + "-enabled"; // Handles POS and non-POS languages
		var $lang_enabled_cb = $('#' + lang_enabled_id);
		if ($lang_enabled_cb.is(':checked')) {
		    guess_on_count++;
		}
		else {
		    lang_mismatch_list.push(guess_lang);
		}
	    }
	    
	}		
	
	if (tokenize_mode == "tokenize-on") {
	    $.ajax({
	    type: "POST",
		url: ef_accessapi_url,
		data: { "action": "icu-tokenize",
			"text-in": q_text },
		dataType: "json",
		success: submit_action_tokenized,
		error: function(jqXHR, textStatus, errorThrown) {
		    var mess = "<b>ICU tokenize query: '" + q_text + "' failed when accessing URL: ";
		    mess +=  '<div style="margin: 0 0 0 10px">' + ef_accessapi_url +"</div></b>";
		    ajax_message_error(mess,jqXHR,textStatus,errorThrown);
		}
	    });
	}
	else {
	    submit_action_tokenized({"text_out":q_text});
	}
    }


    submit_action_tokenized_confirmed({"text_out":q_text});

    // The following block of code includes an example of using the
    // 'guess-language' API action
    /*
    if (store_query_tab_selected == QueryTabEnum.Advanced) {
	var advanced_q_text = $('#advanced-q').val().trim();
	if (advanced_q_text === "") {
	    $('.search-in-progress').css("cursor","auto");
	    htrc_alert("No query term(s) entered");
	    return;
	}
	submit_action_tokenized_confirmed({"text_out":advanced_q_text});
    }
    else {

	// Check language (and possible tokenization) before submitting query

	var lang_text = "";
	if (q_text != "") {
	    lang_text = q_text;
	}
	//if (vq_text != "") {
	//    if (lang_text != "") {
	//	lang_text += " ";
	//    }
	//    lang_text += vq_text;
	//}


	if (lang_text != "") {
	    $.ajax({
		type: "POST",
		url: ef_accessapi_url,
		data: { "action": "guess-language",
			"text-in": lang_text },
		dataType: "json",
		success: submit_action_check_language,
		error: __ajax_error // needs to be changed to ajax_message_error() // ****
	    });
	}
	else {
	    // **** duplicates code in block above => refactor
	    if (tokenize_mode == "tokenize-on") {
		$.ajax({
		    type: "POST",
		    url: ef_accessapi_url,
		    data: { "action": "icu-tokenize",
			    "text-in": q_text },
		    dataType: "json",
		    success: submit_action_tokenized,
		    error: __ajax_error // needs to be changed to ajax_message_error() // ****
		});
	    }
	    else {
		submit_action_tokenized({"text_out":q_text});
	    }	    
	}
    }
    */

}

function initiate_new_solr_search(arg_q,arg_start,group_by_vol_checked)
{
    var num_rows = (group_by_vol_checked) ? 10*num_results_per_page : num_results_per_page;

    store_search_args = {
	q: arg_q,
	indent: arg_indent,
	wt: arg_wt,
	start: arg_start,
	rows: num_rows,
	facet: "on"
    };

    store_search_not_ids = [];
    store_query_level_mix = null;
    
    if (group_by_vol_checked) {
	store_search_args.sort = "id asc";
    }

    // For display purposes, determine how many terms in query
    var count_terms = 0;
    var num_vols_mil = solr_total_num_vols / 1000000;
    var num_vols_mil_str = Math.round( num_vols_mil * 10) / 10;

    var num_pages_bil = solr_total_num_pages / 1000000000;
    var num_pages_bil_str = Math.round( num_pages_bil * 10) / 10;

    var iprogressbar_message = "Searching ...";
    
    if (store_query_display_mode == QueryDisplayModeEnum.ShoppingCart) {
	iprogressbar_message = "Retrieving items from shopping-cart";
    }
    else {
	iprogressbar_message = "Searching " + num_vols_mil_str + " million volumes/" + num_pages_bil_str + " billion pages";

	if (store_search_args != null) {
	    count_terms = (store_search_args.q.match(/:/g) || []).length;
	}

	if (count_terms>1) {
	    iprogressbar_message += " for " + count_terms + " fields/terms";
	}
    }
    

    var launch_query = function() {
        iprogressbar.trigger_delayed_display(SolrEFSettings.iprogressbar_delay_threshold,iprogressbar_message);
	ajax_solr_text_search(true,true); // newSearch=true, newResultPage=true
    }
    

    // Ping the Solr-EF-Access API to make sure it's working
    // If not, some features of the result-set will need to be disabled
    // Give the user the choice of whether they want to continue or not
    
    $.ajax({
	type: "POST",
	url: ef_accessapi_url, // With no data arguments, prints out a usage message
	dataType: "text",
	success: function(unusedTextData) {	    
	    // The act of reaching the success function is enough evidence the server is alive
	    launch_query();
	    
	},
	error: function(jqXHR, textStatus, errorThrown) {
	    ef_accessapi_failed = true;
	    
	    var mess = '<div>Searching the Extracted Features Dataset is still operational,'
	    mess += ' however some supporting services such as';
	    mess += ' the shopping-cart, exporting IDs, and downloading';
	    mess += ' extracted-feature JSON files are currently offline.</div><hr />';
	    
	    mess += '<div>Failed to access URL:</div>';
	    mess +=  '<div style="margin: 0 0 0 10px">' + ef_accessapi_url +"</div><hr />";
	    mess += '<div><b>Do you wish to proceed with the query?</b></div>';

	    htrc_continue(mess,launch_query);
	}
    });
}


function show_hide_solr_q() {
    $("#show-hide-solr-q").click(function (event) {
	event.preventDefault();
	if ($('.show-hide-solr-q:visible').length) {
	    $('.show-hide-solr-q').hide("slide", { direction: "up" }, 500);
	    $('#show-hide-solr-q').html("Show full query ...");
	}
	else {
	    $('.show-hide-solr-q').show("slide", { direction: "up" }, 500);
	    $('#show-hide-solr-q').html("Hide full query ...");
	}
    });
    
    $("#show-hide-solr-q-paste").click(function (event) {
	event.preventDefault();
	//var raw_q = $('#show-hide-solr-q-raw').html(); // ****
	var raw_q = $('#raw-q-base').text();
	raw_q += " " + $('#raw-q-facets').text();
	raw_q += " " + $('#raw-q-exclude').text();
	
	$('#advanced-q').val(raw_q);
	$('#show-hide-solr-q').trigger("click");

	var tabs = $('#tabs-search');
	tabs.tabs({ active: QueryTabEnum.Advanced});
	activate_tab_id(QueryTabEnum.Advanced);
	
    });
}

function show_hide_more_seqs(line_num) {
    var sid_label = "#show-hide-more-seqs-"+line_num;
    var sid_block = sid_label + "-block";

    $(sid_label).addClass("show-hide-seqs");
	
    $(sid_label).click(function (event) {
	event.preventDefault();
	if ($(sid_block+':visible').length) {
	    $(sid_block).hide("slide", { direction: "up" }, 1000);
	    $(sid_label).html("Show more pages ...");
	}
	else {
	    $(sid_block).show("slide", { direction: "up" }, 1000);
	    $(sid_label).html("Hide pages ...");
	}
    });
}

function show_hide_query_tabs() {
    var base_id = "#show-hide-query-tabs";
    var box_id       = base_id+"-box";
    var turnstyle_id = base_id+"-turnstyle";
    var block_id     = "#tabs-shared";
    
    $(box_id).click(function (event) {
	event.preventDefault();
	if ($(block_id+':visible').length) {
	    $(block_id).hide("slide", { direction: "up" }, 1000);
	    $(turnstyle_id).html('<span class="ui-icon ui-icon-triangle-1-e"></span>');
	}
	else {
	    $(block_id).show("slide", { direction: "up" }, 1000);
	    $(turnstyle_id).html('<span class="ui-icon ui-icon-triangle-1-s"></span>');
	}
    });
}


function result_set_delete_item(line_num) {
    var di_id = "result-set-delete-"+line_num;

    $('#'+di_id).on("click.deleteitem", function (event) {
	// not sure why this is not the more usual stopPropagation()
	// perhaps there was a test in one of the browsers that proved
	// problematic, needing the move to stopImmediatePropagation()
	event.stopImmediatePropagation(); // **** 
	//event.stopPropagation();
	
	var $close_div = $(this).parent();
	var $wrapper_line_div = $close_div.parent();
	
	var id = $close_div.next().attr("name");

	delete_item_if_shoppingcart(id,$close_div);	
	$wrapper_line_div.slideUp(500, function() { $wrapper_line_div.remove(); });

	//var escaped_id = id.replace(/:/g,"\\:").replace(/\\/g,"\\\\");
	var escaped_id = id.replace(/:/g,"\\:");
	
	console.log("Exclude escaped id: " + escaped_id);

	if (facet_filter.getFacetLevel() == FacetLevelEnum.Page) {
	    
	    var $a_seqs = $wrapper_line_div.find('a[class^="seq"]');
	    $a_seqs.each(function() {
		var seq_str = $(this).text();
		var seq = seq_str.replace(/^seq\s+/,"");
		// sprintf("%06d")
		var page_str = "" + (seq-1); // solr page numbers in ID start at 0!!
		var pad = "000000";
		var seq_pad = pad.substring(0, pad.length - page_str.length) + page_str
		store_search_not_ids.push("-id:"+escaped_id+".page-"+seq_pad); // solr ID
	    });
	}
	else {
	    store_search_not_ids.push("-id:"+escaped_id);		
	}

	var $results_total_num = $('#results-total-num');
	var results_total_int = parseInt($results_total_num.data('raw-num'));

	//var $result_line = $("[name='" + htid + "']").parent(); // ****
	var query_level = facet_filter.getFacetLevel();
	if (query_level == FacetLevelEnum.Volume) {
	    // decrease num results found by 1

	    results_total_int--;
	    $results_total_num.data('raw-num',results_total_int)
	    $results_total_num.text(results_total_int.toLocaleString());

	    // 2. decrease 'showing page-level matches ... to' by 1
	    showing_matches_delta_adjustment(-1);
	    // ****
	    /*
	    var sm_to_int = $('#sm_to').data('raw-num');
	    var sm_from_int = $('#sm-from').data('raw-num');
	    //var sm_to_int = parseInt($sm_to_num.text());
	    var sm_new_to_int = sm_to_int-1;
	    console.log("**** new_to="+sm_new_to_int+", from="+sm_from_int);
	    if (sm_new_to_int < sm_from_int) {
		// e.g. no items left to display
		$('#sm-from-to').hide();
	    }
	    // ... but still worth keeping values represented up to date
	    $('#sm-to').data('raw-num',sm_new_to_int);
	    $('#sm-to').text(sm_new_to_int.toLocaleString());
*/
	}
	else {
	    // Page level
	    if (group_by_vol_checked) {
		// 1. decrease num results by num_deleted

		var $seq_matches = $wrapper_line_div.find("nobr>a[class^='seq']");	    
		var num_deleted = $seq_matches.length;
		results_total_int -= num_deleted;
		$results_total_num.data('raw-num',results_total_int);
		$results_total_num.text(results_total_int.toLocaleString());
		
		// 2. decrease volume count by 1
		var $vol_count_num = $('#srt-vol-count-num');
		var vol_count_int = parseInt($vol_count_num.data('raw-num'));
		vol_count_int--;
		$vol_count_num.data('raw-num',vol_count_int);
		$vol_count_num.text(vol_count_int.toLocaleString());

		// 3. decrease 'showing page-level matches ... to' by num_deleted
		showing_matches_delta_adjustment(-num_deleted);
		// ****
		/*
		var $sm_to_num = $('#sm-to');		
		var sm_to_int = parseInt($sm_to_num.text());
		sm_to_int -= num_deleted;
		$sm_to_num.data('raw-num',sm_to_int);
		$sm_to_num.text(sm_to_int.toLocaleString());
*/
	    }
	    else {
		// 1. decrease num results by 1
		results_total_int--;
		$results_total_num.data('raw-num',results_total_int);
		$results_total_num.text(results_total_int.toLocaleString());
		
		// 2. recompute num vols in case this seq entry was the last one for this volume
		$('#srt-vol-count').css("cursor","wait");
		ajax_solr_stream_volume_count(store_search_args.q,true,show_volume_count); // doRollup=true

		// 3. decrease 'showing page-level matches ... to' by 1
		showing_matches_delta_adjustment(-1);
		// ****
		/*
		var $sm_to_num = $('#sm-to');		
		var sm_to_int = parseInt($sm_to_num.text());
		sm_to_int--;
		$sm_to_num.data('raw-num',sm_to_int);
		$sm_to_num.text(sm_to_int.toLocaleString());		
*/
	    }
	}

	var explain_html = show_results_explain_html(store_query_level_mix,store_search_url)
	$('#search-explain').html(explain_html);
	show_hide_solr_q(); 
	// Clear out any export-item download links generated previously
	$('a.export-item').attr('href',null);

    });
}
