function volumeFieldToLabel(field)
{
    var label = camelCaseToDisplayLabel(field);
    label = label.replace(/_(t|s|i|ss)$/,"");
    label = label.replace(/_(ddc|lcc)$/, function(match,capture) { return " "+capture.toUpperCase(); });
    label = label.replace(/(?:^|\s+)(Isbn|Issn|Lccn|Oclc|Ht|Url)/g,function(match,capture) { return match.toUpperCase(); });

    label = label.replace(/^id$/i,"Volume Identifier");
    label = label.replace(/^htid$/i,"HathiTrust URL Id");
    
    return label;
}

function generate_query_field_menu()
{
    var $select = $("<select>");
    $select.attr("id","vqf-menu");

    var $option = $("<option>");
    $option.attr("value","all-fields");
    $option.text("All Fields");
    $option.attr("selected","selected");
    $select.append($option);

    var metadata_fields = Object.keys(lup_volume_metadata_fields);

    for (var i = 0; i < metadata_fields.length; i++) {
	var field = metadata_fields[i];

	var label = volumeFieldToLabel(field);
	
	var $option = $("<option>");
	$option.attr("value",field);
	$option.text(label);

	$select.append($option);
    }
    
    $('#volume-query-field').append($select);
    $select.selectmenu({ width : '170px', padding: "0px" });

}

function generate_volume_field_help_dict()
{
    var restructured_dict = {}
    $.each(lup_volume_metadata_dict, function(field,help_text) {
	var label = volumeFieldToLabel(field);
	restructured_dict[label] = field+"</td><td>"+help_text ;
    });
    
    return restructured_dict;	   
}

function lang_pos_toggle(event) {
	var $this = $(this);
	var checked_state = $this.prop("checked");

	var id = $this.attr("id");
	var split_id = id.split("-");
	var related_id = split_id[0] + "-pos-choice";

	var disable_state = !checked_state;
	$('#' + related_id + " *").prop('disabled',disable_state);
}


function generate_pos_langs() {

	var $pos_fieldsets = $('#pos-fieldsets');

	for (var li = 0; li < lup_langs_with_pos.length; li++) {

		var l = lup_langs_with_pos[li];
		var lang_full = lup_isoLangs[l].name;
		var lang_native_full = lup_isoLangs[l].nativeName;
		var opt_title = (lang_full !== lang_native_full) ? 'title="' + lang_native_full + '"' : "";

		var opt_enabled = (l == "en") ? 'checked="checked"' : "";

		var legend = "";
		legend += '    <legend style="margin-bottom: 5px; padding-top: 15px;">\n';
		legend += '      <input type="checkbox" name="' + l + '-enabled" id="' + l + '-enabled" ' + opt_enabled + '/>\n';
		legend += '      <span ' + opt_title + '>' + lang_full + '</span>\n';
		legend += '    </legend>\n';


		var check_box_list = [];

		for (var pi = 0; pi < pos_checkbox.length; pi++) {
			var pos_info = pos_checkbox[pi];
			var pos = pos_info.pos;
			var label = pos_info.label;
			var tooltip = pos_info.tooltip;
			var opt_tooltip = (tooltip != null) ? 'title="' + tooltip + '"' : "";

			var check_box = "";
			check_box += '    <input type="checkbox" name="' + l + '-' + pos + '-htrctoken-cb" id="' + l + '-' + pos + '-htrctoken-cb" checked="checked" />\n';
			check_box += '    <label for="' + l + '-' + pos + '-htrctoken-cb" ' + opt_tooltip + '>' + label + '</label>\n';

			check_box_list.push(check_box);
		}

		var fieldset = "";
		var opt_showhide_class = (li > 0) ? 'class="show-hide-lang"' : "";

		if (li == 1) {
			fieldset += '<button id="show-hide-lang">Show other languages ...</button>';
		}

		fieldset += '<fieldset ' + opt_showhide_class + '>\n';
		fieldset += legend;
		fieldset += '  <div id="' + l + '-pos-choice">\n';

		var check_box_join = check_box_list.join('&nbsp;');
		fieldset += check_box_join;

		fieldset += '  </div>\n';
		fieldset += '</fieldset>\n';

		$pos_fieldsets.append(fieldset);
		$('#' + l + '-enabled').click(lang_pos_toggle);

		if (l == "en") {
			$('#en-pos-choice *').prop('disabled',false);
		} else {
			$('#' + l + '-pos-choice *').prop('disabled',true);
		}
	}

}



function generate_other_langs() {
	// setup other languages
	// for each 'lup_langs_without_pos' generate HTML of the form:
	//    <input type="checkbox" name="fr-enabled" id="fr-enabled" />French
	var $other_langs = $('#other-langs');

	for (var i = 0; i < lup_langs_without_pos.length; i++) {
		var lang = lup_langs_without_pos[i];
		var labeled_checkbox = '<nobr>';

		labeled_checkbox += '<input type="checkbox" name="' + lang + '-enabled" id="' + lang + '-enabled" />';
		/*
	if (lang === "zh-cn") {
	    console.log("Mapping zh-cn => zh");
	    lang = "zh";
	}
	if (lang === "zh-tw") {
	    console.log("Mapping zh-tw => zh");
	    lang = "zh";
	}
*/
		var lang_full = lup_isoLangs[lang].name;
		var lang_native_full = lup_isoLangs[lang].nativeName;
		var opt_title = (lang_full !== lang_native_full) ? 'title="' + lang_native_full + '"' : "";

		labeled_checkbox += '<label for="' + lang + '-enabled" style="padding-left: 5px; padding-right: 10px;" ' + opt_title + '>' + lang_full + '</label>';

		labeled_checkbox += '</nobr> ';

		$other_langs.append(labeled_checkbox);

	}
}


function show_hide_lang() {
	$("#show-hide-lang").click(function (event) {
		event.preventDefault();
		if ($('.show-hide-lang:visible').length) {
			$('.show-hide-lang').hide("slide", { direction: "up" }, 1000);
			$('#show-hide-lang').html("Show other languages ...");
		} else {
			$('.show-hide-lang').show("slide", { direction: "up" }, 1000);
			$('#show-hide-lang').html("Hide other languages ...");
		}
	});
}

function activate_tab_id(tab_id)
{
    if (tab_id == "tab-page") {
	tab_id = QueryTabEnum.Page;
    }
    else if (tab_id == "tab-volume") {
	tab_id = QueryTabEnum.Volume;
    }
    else if (tab_id == "tab-combined") {
	tab_id = QueryTabEnum.Combined;
    }
    else if (tab_id == "tab-advanced") {
	tab_id = QueryTabEnum.Advanced;
    }

    store_query_tab_selected = tab_id;
    if (typeof(Storage) !== "undefined") {
	try {
	    localStorage.setItem("htrc-ef-query-tab-selected",store_query_tab_selected);
	}
	catch (err) {
	    console.error("Issue detected trying to store value in localStorage.");
	    //console.error("Issue detected trying to store value in localStorage.  Clearing all values!");
	    //sessionStorage.clear();
	    //localStorage.clear();
	}
    }
	    
    if (tab_id == QueryTabEnum.Advanced) {
	$('.volume-query-row').hide();
	$('.page-query-row').hide();
	$('.page-or-advanced-query-row').show();
	$('.advanced-query-row').show();
    }
    else {
	$('.advanced-query-row').hide();
	
	if ((tab_id == QueryTabEnum.Volume) || (tab_id == QueryTabEnum.Combined)) {
	    if (tab_id == QueryTabEnum.Volume) {
		$('#q').val("");
	    }

	    $('.volume-query-row').show();
	}
	else {
	    // page	    
	    $('.volume-query-row').hide();	    
	}
	
	if ((tab_id == QueryTabEnum.Page) || (tab_id == QueryTabEnum.Combined)) {
	    if (tab_id == QueryTabEnum.Page) {
		$('#vq').val("");
	    }
	    
	    $('.page-query-row').show();
	    $('.page-or-advanced-query-row').show();
	}
	else {
	    $('.page-query-row').hide();
	    $('.page-or-advanced-query-row').hide();	    
	}
    }
}


function mnemonic_help_text_filtered(dic,filter_re,div_id,num_cols,opt_header_row)
{
    var mnemonic_keys = Object.keys(dic).sort();
    
    var mnemonic_keys_str = "<table width=\"100%\">";
    if (opt_header_row) {
	mnemonic_keys_str += opt_header_row;
    }
    mnemonic_keys_str += "<tr>";
    
    var pos = 0;
    $.each(mnemonic_keys, function(index,key) {
	var val = dic[key]
	// if filter_re is null, always want to append key:label entry
	if ((filter_re == null) || (key.match(filter_re))) {
	    mnemonic_keys_str += "<td><i><nobr>"+key + "</nobr></i></td><td> " + val + "</td>";
	    pos++;
	    if ((pos % num_cols) == 0) {
		mnemonic_keys_str += '</tr><tr>';
	    }
	}
    });
    mnemonic_keys_str += "</tr></table>";
    
    $('#'+div_id).html(mnemonic_keys_str);
}


function mnemonic_help_text(dic,div_id,num_cols,opt_header_row)
{
    mnemonic_help_text_filtered(dic,null,div_id,num_cols,opt_header_row);
}

function fields_help_text(arr,div_id,num_cols)
{
    var fields_keys = arr.sort();
    
    var fields_keys_str = "<table width=\"100%\"><tr>";
    var pos = 0;
    $.each(fields_keys, function(index,val) {
	fields_keys_str += "<td>" + val + "</td>";
	pos++;
	if ((pos % num_cols) == 0) {
	    fields_keys_str += '</tr><tr>';
	}
    });
    fields_keys_str += "</tr></table>";
    
    $('#'+div_id).html(fields_keys_str);
}

function domready_help_dialogs()
{
    // ****
    /*
        $("#buildaworkset-help-dialog").dialog({
	autoOpen: false,
	resizable: true,
	width: 650,
	height: 300,
	modal: true,
	buttons: {
	    "OK": function () {
		$(this).dialog("close");
	    }
	},
	hide: { effect: "fadeOut" },
	show: { effect: "fadeIn" }
    }).keypress(function (e) {
	if (e.keycode == $.ui.keyCode.ENTER) {
	    $(this).dialog("close");
	}
    });
    $("#buildaworkset-help").click(function () {
	$("#buildaworkset-help-dialog").dialog( "open" );
    });
*/

    lup_volume_metadata_help_dict = generate_volume_field_help_dict();

    $("#volume-help-dialog").dialog({
	autoOpen: false,
	resizable: true,
	width: 1000,
	height: 600,
	modal: true,
	buttons: {
	    "OK": function () {
		$(this).dialog("close");
	    }
	},
	hide: { effect: "fadeOut" },
	show: { effect: "fadeIn" }
    }).keypress(function (e) {
	if (e.keycode == $.ui.keyCode.ENTER) {
	    $(this).dialog("close");
	}
    });
    
    // Entries in following hashmap have <td>'s spliced into them to cause an extra
    // column in the table to be produced
    var header_row = '<tr class="help-table-header"><td style="min-width:220px;">Field name</td><td style="min-width:220px;">Field name in Solr syntax</td><td>Field description</td></tr>';
    mnemonic_help_text(lup_volume_metadata_help_dict,'volume-help-fields',1,header_row); //numCols=1        

    $("#volume-help").click(function () {
	$("#volume-help-dialog").dialog( "open" );
    });

    
    $("#volume-advanced-help-dialog").dialog({
	autoOpen: false,
	resizable: true,
	width: 790,
	height: 280,
	modal: true,
	buttons: {
	    "OK": function () {
		$(this).dialog("close");
	    }
	},
	hide: { effect: "fadeOut" },
	show: { effect: "fadeIn" }
    }).keypress(function (e) {
	if (e.keycode == $.ui.keyCode.ENTER) {
	    $(this).dialog("close");
	}
    });

    $("#volume-advanced-help").click(function () {
	$("#volume-advanced-help-dialog").dialog( "open" );
    });

    
    $("#page-help-dialog").dialog({
	autoOpen: false,
	resizable: true,
	width: 790,
	modal: true,
	buttons: {
	    "OK": function () {
		$(this).dialog("close");
	    }
	},
	hide: { effect: "fadeOut" },
	show: { effect: "fadeIn" }
    }).keypress(function (e) {
	if (e.keycode == $.ui.keyCode.ENTER) {
	    $(this).dialog("close");
	}
    });
    
    $("#page-help").click(function () {
	$("#page-help-dialog").dialog( "open" );
    });

    $("#advanced-query-help-dialog").dialog({
	autoOpen: false,
	resizable: true,
	width: 790,
	modal: true,
	buttons: {
	    "OK": function () {
		$(this).dialog("close");
	    }
	},
	hide: { effect: "fadeOut" },
	show: { effect: "fadeIn" }
    }).keypress(function (e) {
	if (e.keycode == $.ui.keyCode.ENTER) {
	    $(this).dialog("close");
	}
    });
    
    $("#advanced-query-help").click(function () {
	$("#advanced-query-help-dialog").dialog( "open" );
    });
}

function solref_dom_ready() {
    //console.log("**** solref_dom_ready() called!!");
    
    var solr_col = getURLParameter("solr-col");
    if (solr_col != null) {
	solr_collection = solr_col;
    }
    if (solr_collection.match(/^solr3456(78)?-/)) {
	solr_search_action = robust_solr_prefix_url+solr_collection+"/select";
	solr_stream_action = robust_solr_prefix_url+solr_collection+"/stream";
	do_solr_field_optimization = 1;
    }
    else {
	solr_search_action = solr_prefix_url+solr_collection+"/select";
	solr_stream_action = solr_prefix_url+solr_collection+"/stream";
	do_solr_field_optimization = 0;
    }

    if (json_ef_version == "2.0") {
	$('#for-wb-ef-format').html('for Extracted Features 2.0');
    }
    
    if (runtime_mode == "dev")  {
	$('#solr-col-name').html('<br/><tt>[specified solr collection:' + solr_collection + ']</tt>');
    }

    $('#search-form').attr("action",solr_search_action);

    //$('.volume-query-row').hide(); // ****
    var tabs = $('#tabs-search').tabs({
	activate: function( event, ui ) {	    
	    var tab_id = ui.newTab.context.id;

	    activate_tab_id(tab_id);	    
	}
    });

    store_query_tab_selected = QueryTabEnum.Page;
    if (typeof(Storage) !== "undefined") {
	try {
	    var ls_qts = localStorage.getItem("htrc-ef-query-tab-selected");
	    if (ls_qts != null) {
		store_query_tab_selected = ls_qts;
	    }
	}
	catch (err) {
	    console.error("Issue detected in trying to load value from localStorage.  Clearing all values!");
	    //sessionStorage.clear();
	    localStorage.clear();
	}
    }
        
    tabs.tabs({ active: store_query_tab_selected});
    activate_tab_id(store_query_tab_selected);
	
    tabs.find( ".ui-tabs-nav" ).sortable({
	axis: "x",
	stop: function() {
	    tabs.tabs( "refresh" );
	}
    });
    show_hide_query_tabs();
    
    if (typeof(Storage) !== "undefined") {
	username = sessionStorage.getItem("htrc-username");
	if ((username != null) && (username != "")) {
    	    $('#navbar-username').html(username);
	    $('#navbar-login').hide();
	    $('#navbar-logout').show();
	}
    }

    
    $( "#htrc-alert-dialog" ).dialog({
	modal: true,
	autoOpen: false,
	resizable: true,
	width: 550,
	buttons: {
	    "OK": function() {
		$( this ).dialog( "close" );
	    }
	},
	hide: { effect: "fadeOut" },
	show: { effect: "fadeIn" }
    }).keypress(function (e) {
	if (e.keycode == $.ui.keyCode.ENTER) {
	    $(this).dialog("close");
	}
    });

    $( "#htrc-login-dialog" ).dialog({
	modal: true,
	autoOpen: false,
	resizable: true,
	width: 650,
	height: 620,
	buttons: {
	    "Sign In": function() {
		$(this).dialog("close");
	    }
	},
	hide: { effect: "fadeOut" },
	show: { effect: "fadeIn" }
    }).keypress(function (e) {
	if (e.keycode == $.ui.keyCode.ENTER) {
	    $(this).dialog("close");
	}
    });

    $( "#htrc-publish-dialog" ).dialog({
	modal: true,
	autoOpen: false,
	resizable: true,
	width: 750,
	height: 620,
	buttons: {
	    "Save": function() {
		solr_ef_publish_workset($(this));
	    },
	    "Cancel": function() {
		$(this).dialog("close");
	    }
	},
	hide: { effect: "fadeOut" },
	show: { effect: "fadeIn" }
    }).keypress(function (e) {
	if (e.keycode == $.ui.keyCode.ENTER) {
	    $(this).dialog("close");
	}
    });

    $("#export-ef-to-registry").click(function () {
	solr_ef_login_to_publish();
    });

    
    domready_help_dialogs();
    
    $( "#search-lm-progressbar-bot" ).progressbar({ value: 0 });
    $( "#search-lm-progressbar-top" ).progressbar({ value: 0 });
    
    $('#export-by-vol').click(function (event) {
	event.preventDefault();
	$('.export-item').css("cursor","wait");
	if (facet_filter.getFacetLevel() == FacetLevelEnum.Page) {
	    ajax_solr_stream_volume_count(store_search_args.q,true,stream_export); // doRollup=true
	}
	else {
	    ajax_solr_stream_volume_count(store_search_args.q,false,stream_export); // doRollup=false
	}
    });

    $('#export-by-page').click(function (event) {
	event.preventDefault();	
	$('.export-item').css("cursor","wait");
	ajax_solr_stream_volume_count(store_search_args.q,false,stream_export); // doRollup=false
    });

    $('#export-ef-metadata-json').click(function (event) {
	if (!$('#export-ef-metadata-json').attr('href')) {
	    // lazy evaluation, workout out what href should be, and then trigger click once more
	    event.preventDefault();	
	    $('.export-item').css("cursor","wait");
	    if (facet_filter.getFacetLevel() == FacetLevelEnum.Page) {
		ajax_solr_stream_volume_count(store_search_args.q,true,stream_export_ef_metadata_json); // doRollup=true
	    }
	    else {
		ajax_solr_stream_volume_count(store_search_args.q,false,stream_export_ef_metadata_json); // doRollup=false
	    }
	}
    });

    $('#export-ef-metadata-csv').click(function (event) {
	if (!$('#export-ef-metadata-csv').attr('href')) {
	    // lazy evaluation, workout out what href should be, and then trigger click once more

	    event.preventDefault();	
	    $('.export-item').css("cursor","wait");
	    if (facet_filter.getFacetLevel() == FacetLevelEnum.Page) {
		ajax_solr_stream_volume_count(store_search_args.q,true,stream_export_ef_metadata_csv); // doRollup=true
	    }
	    else {
		ajax_solr_stream_volume_count(store_search_args.q,false,stream_export_ef_metadata_csv); // doRollup=false
	    }
	}
    });

    $('#export-ef-metadata-tsv').click(function (event) {
	if (!$('#export-ef-metadata-tsv').attr('href')) {
	    // lazy evaluation, workout out what href should be, and then trigger click once more

	    event.preventDefault();	
	    $('.export-item').css("cursor","wait");
	    if (facet_filter.getFacetLevel() == FacetLevelEnum.Page) {
		ajax_solr_stream_volume_count(store_search_args.q,true,stream_export_ef_metadata_tsv); // doRollup=true
	    }
	    else {
		ajax_solr_stream_volume_count(store_search_args.q,false,stream_export_ef_metadata_tsv); // doRollup=false
	    }
	}
    });

    $('#export-ef-zip').click(function (event) {
	//console.log("**** ef export link clicked: href = " + $('#export-ef-zip').attr('href'));
	if (!$('#export-ef-zip').attr('href')) {
	    // lazy evaluation, workout out what href should be, and then trigger click once more
	    event.preventDefault();
	    $('.export-item').css("cursor","wait");
	    if (facet_filter.getFacetLevel() == FacetLevelEnum.Page) {
		ajax_solr_stream_volume_count(store_search_args.q,true,stream_export_ef_zip); // doRollup=true
	    }
	    else {
		ajax_solr_stream_volume_count(store_search_args.q,false,stream_export_ef_zip); // doRollup=false
	    }
	}
    });

    
    $('#search-prev').click(function (event) {
	var start = store_search_args.start;
	var prev_start = store_result_page_starts.pop();
	var diff = prev_start - start;
	
	show_new_results(diff);
    });
    
    $('#search-next').click(function (event) {
	store_result_page_starts.push(store_start);
	show_new_results(store_num_pages); // used to be num_results_per_page
    });


    generate_query_field_menu();
    generate_pos_langs();
    generate_other_langs();

    show_hide_lang();
    
    //$("input[type='radio']" ).checkboxradio();

    if (json_ef_version == "2.0") {
	$("#ef-json-format-radio-choice").hide()
	$("#coverup-ef-json-format-radio-choice").hide()

	$('.info-ef15').hide();
	$('.info-ef20').show();
    }
    else {
	$('.info-ef20').hide();
	$('.info-ef15').show();
	
	$('#export-json-format15').on("change", function(event){
	    dynamically_set_accessapi_url("1.5");
	});
	$('#export-json-format20').on("change", function(event){
	    dynamically_set_accessapi_url("2.0");
	});
	// Note: if-statement above now trumps the else part of this if-statement
	// Kept in things work for 1.5, and to show how things used to go for 2.0
	if (json_ef_version == "1.5") {
	    $('#export-json-format15').attr('checked','checked'); //.button("refresh");
	}
	else {
	    $('#export-json-format20').attr('checked','checked'); //.button("refresh");; //
	}
    }
    
//    $("#ef-json-format-radio-choice").click(function(){
//	var ef_format_val = $("input[name='export-json-format']:checked").val();
//	console.log("*** ef format var = " + ef_format_val);
//    });
	    
    
    if (runtime_mode == "dev")  {
	$('#additional-resources').show();
    }
    
    if ($('#search-submit').length > 0) {
	$('#search-submit').click(submit_action);
    }

    var workset_id = getURLParameter("workset-id");
    if (workset_id != null) {
	// hide query input area
	if ($('#tabs-shared:visible').length) {
	    $('#tabs-shared').slideUp(1000, function() { load_workset_id(workset_id) } );
	    $('#show-hide-query-tabs-turnstyle').html('<span class="ui-icon ui-icon-triangle-1-e"></span>');
	}
	else {
	    load_workset_id(workset_id);
	}
    }

    var shoppingcart_q = getURLParameter("shoppingcart-q");
    if (shoppingcart_q != null) {
	store_query_display_mode = QueryDisplayModeEnum.ShoppingCart;

	trigger_shoppingcart_q_search(shoppingcart_q);
    }
    else {
	store_query_display_mode = QueryDisplayModeEnum.GeneralQuery;
    }

    var solr_q = getURLParameter("solr-q");
    if (solr_q != null) {
	// hide query input area
	$('#droppable-targets').hide();
	$('#select-for-shoppingcart').hide();
	$('#sr-add-delete-wrapper').hide();
	$('#tabs-search').hide();
	load_solr_q(solr_q);
    }
    
    if ((shoppingcart_q == null) && (solr_q == null)) { // **** also need to check workset_id ??/
	// see if there is a solr-key-q
	var solr_key_q = getURLParameter("solr-key-q");
	if (solr_key_q != null) {
	    // ajax call to get query specified by key

	    var arg_start = getURLParameter("start") || 1;
	    var parsed_arg_start = parseInt(arg_start);
	    if (isNaN(parsed_arg_start) || (parsed_arg_start<1)) {
		parsed_arg_start = 1;
	    }
	    var start = parsed_arg_start-1; // 'start' value and cgi-arg version work 'off by one' to each other
	    var group_by_vol_checked_arg = getURLParameter("group-by-vol") || "0";
	    group_by_vol_checked = parseInt(group_by_vol_checked_arg);	   
	    trigger_solr_key_search(solr_key_q,start,false); // want this query added to browser history
	}
	else {

	    // see if there is a shoppingcart-key-q
	    var shoppingcart_key_q = getURLParameter("shoppingcart-key-q");
	    if (shoppingcart_key_q != null) {
		store_query_display_mode = QueryDisplayModeEnum.ShoppingCart;
		setShoppingcartId(shoppingcart_key_q);
		trigger_shoppingcart_key_search(shoppingcart_key_q);
	    }
	}
	
    $('input[name="interactive-style"]:radio').on("click",function(event) {
	var radio_id = $(this).attr("id");
	if (radio_id == "pref-drag-and-drop") {
	    $('.drag-and-drop-style').removeClass("style-hidden");
	    
	    $('.drag-and-drop-style').show("slide", { direction: "up" }, 1000);
	    $('.checkbox-style').hide("slide", { direction: "up" }, 1000);

	    selectable_and_draggable_hard_reset();
	    store_interaction_style = InteractionStyleEnum.DragAndDrop;
	}
	else if (radio_id == "pref-checkboxes") {
	    $('.checkbox-style').removeClass("style-hidden");

	    $('.checkbox-style').show("slide", { direction: "up" }, 1000);
	    $('.drag-and-drop-style').hide("slide", { direction: "up" }, 1000);

	    make_unselectable();
	    //selectable_and_draggable_hard_reset();
	    //$('.drag-and-drop-style').addClass("style-hidden");
	    store_interaction_style = InteractionStyleEnum.Checkboxes;
	}
	else if (radio_id == "pref-hybrid") {
	    $('.drag-and-drop-style').removeClass("style-hidden");
	    $('.checkbox-style').removeClass("style-hidden");
	    
	    $('.drag-and-drop-style').show("slide", { direction: "up" }, 1000);
	    $('.checkbox-style').show("slide", { direction: "up" }, 1000);

	    selectable_and_draggable_hard_reset();	    
	    store_interaction_style = InteractionStyleEnum.Hybrid;
	}
	else {
	    console.error("Error: unrecognized interaction style '" + radio_id + "'");
	}
    });
    $('#pref-hybrid').trigger("click"); // ******
	
	
    $('#sr-select-all').on("click",function(event) {
	event.preventDefault();
	if (store_interaction_style == InteractionStyleEnum.Checkboxes) {
	    $('#search-results input.sr-input-item').prop("checked",true);
	    update_select_all_none_buttons();
	}
	else {
	    $('#search-results > div.ui-selectee').each(function() {
		var $this = $(this);
		$this.addClass("ui-selected");
		make_draggable($this);
	    });
	}
    });
    
    $('#sr-deselect-all').on("click",function(event) {
	event.preventDefault();
	selectable_and_draggable_hard_reset();
    });

    $('#sr-invert-selection').on("click",function(event) {
	event.preventDefault();
	if (store_interaction_style == InteractionStyleEnum.Checkboxes) {
	    var $my_checkboxes = $('#search-results input.sr-input-item');
	    $my_checkboxes.each(function() {
		var $this = $(this);
		if ($this.prop("checked")) {
		    $this.prop("checked",false);
		}
		else {
		    $this.prop("checked",true);
		}
	    });
	    update_select_all_none_buttons();
	}
	else {
	    $('#search-results > div.ui-selectee').each(function() {

		var $this = $(this);	    
		var $checkbox = $this.find('input.sr-input-item');	    
		
		if ($checkbox.prop("checked")) {
		    make_undraggable($this);
		}
		else {
		    $this.addClass("ui-selected");
		    make_draggable($this);
		}
	    });
	}

    });

    $('#trashcan-drop').attr("title","Click on items in the result set and drag them to the trashcan to delete them");
	/*
    $('#trashcan-drop').tooltip(); // ****
	*/
	
    $('.adi-delete').on("click",function(event) {
	event.preventDefault();
	do_delete_drop_action();
    });

    $('.adi-add').on("click",function(event) {
	event.preventDefault();
	do_shoppingcart_drop_action();
    });

    $('.adi-goto').on("click",function(event) {
	event.preventDefault();
	open_shoppingcart();
    });

/*
    //$('#pref-drag-and-drop').prop("checked",true);
    $('#pref-hybrid').prop("checked",true);
    //store_interaction_style = InteractionStyleEnum.DragAndDrop; // **** 
    store_interaction_style = InteractionStyleEnum.Hybrid; // default
    $('.drag-and-drop-style').show("slide", { direction: "up" }, 1000);
    $('.checkbox-style').show("slide", { direction: "up" }, 1000);
*/
	
    if (store_interaction_style == null) {
	store_interaction_style = InteractionStyleEnum.Hybrid; // default
    }

    } // if solr_q == null

    // 
    //Facet related page setup
    //
    
    if (store_query_display_mode == QueryDisplayModeEnum.ShoppingCart) {
	$('#facets-sidebar').hide();
	$('#resultset-main').width("95%");

	var prev_url_is_search = false;

	if (document.referrer != "") {

	    try {
		var prev_url = new URL(document.referrer);
	    
		if ((prev_url.host == document.location.host)
		    && (prev_url.pathname == document.location.pathname)
		    && (prev_url.search.match(/(solr-q)|(solr-key-q)=/))) {
		    prev_url_is_search = true;
		}
	    }
	    catch(err) {
		// Older versions of Safari don't have URL class
		// => safest to assume there is a valid previous page to gop back to
		prev_url_is_search = true;
		
	    }
	}
	
	if (prev_url_is_search) {
	    // There is a previous link, and it is to a search page within solr-ef
	    $('#back-to-search-sidebar-href').attr("href",document.referrer);
	    $('#back-to-search-sidebar').width("140px");
	    $('#back-to-search-sidebar').show();
	}
	else {
	    // either no previous link, or else not to a solr-ef search URL
	    // => offer a link to start a solr-ef search
	    var new_search_url = window.location.protocol + "//" + window.location.host + window.location.pathname;
	    $('#goto-search-sidebar-href').attr("href",new_search_url);
	    $('#goto-search-sidebar').width("140px");
	    $('#goto-search-sidebar').show();
	}
    }

    $("#facetlist").on("click","a",function() {
     
	var $class = $(this).attr("class");
	num_found=0;
	if ($(this).hasClass("morefacets")) {
	    var obj = $class.split(" ")[0];
	    $(this).hide();
	    $("[class='" + obj + " lessfacets']").show();
	    $("[class='hidefacet " + obj + "']").css({
		display: "block",
		visibility: "visible"
	    });
	    return false;
	}
	else if ($(this).hasClass("lessfacets")) {
	    var obj = $class.split(" ")[0];
	    $(this).hide();
	    $("[class='" + obj + " morefacets']").show();
	    $("[class='hidefacet " + obj + "']").css({
		display: "none",
		visibility: "visible"
	    });
	    return false;
	}
	else {
	    // User has clicked on a facet
	    // => Add it to 'filters', then instigate an updated search

	    var facet_key = $(this).attr("data-key");
	    var term = $(this).attr("data-term");

	    var pending_filters = facet_filter.hasPendingFilters(facet_key,term);
	    	    	    
	    var clicked_elem = this;

	    if (pending_filters) {
		var pp_field = facet_filter.prettyPrintField(facet_key);
		var pp_term = facet_filter.prettyPrintTerm(facet_key,term);

		var message = "Other filter(s) are checked but not yet applied.<br/>";
		message += "Do you want to ignore them and apply just the '"+pp_term+"' filter to "+pp_field+"?",
		
		htrc_confirm(message,
			     function() {
				 //$(this).dialog("close"); // ****
				 $('#htrc-alert-dialog').dialog("close");
				 facet_filter.applySingleFilter(clicked_elem,facet_key,term);
			     },
			     null // trigger default, which is to reset alert message and close
			     /*
			     function() {
				 $(this).dialog("close"); // ****
			     }*/
			    );
	    }
	    else {
		facet_filter.applySingleFilter(clicked_elem,facet_key,term);
	    }

	    return false;
	    
	}
    });
    
    $(".filters").on("click","a",function() {
	// User has clicked on one of the currently applied filters
	// => remove it from 'filters', then instigate an updated search
	
	facet_filter.filters.splice($(this).parent().index(), 1);
	facet_filter.facetlistSet();
	//console.log("*** filters on-click: store_search_args.start = " + store_search_args.start + ", store_start = " + store_start);
	
	store_search_args.start = store_start;
	show_updated_results();
    });

    var volume_available_keys = Object.keys(lup_volume_metadata_fields).sort();
    var volume_available_tags = [];
    $.each(volume_available_keys,function(index,key) {
	volume_available_tags.push({'key':key, 'label': lup_volume_metadata_dict[key]});
    });
    
    if (runtime_mode == "dev")  {    
	domready_volume_autocomplete('vq',volume_available_tags);
    }
    
}

function recompute_shoppingcart_on_history_back()
{
    // Based on:
    //   https://stackoverflow.com/questions/43043113/how-to-force-reloading-a-page-when-using-browser-back-button
    
    window.addEventListener( "pageshow", function ( event ) {
	var historyTraversal = event.persisted ||
	    ( typeof window.performance != "undefined" &&
	      window.performance.navigation.type === 2 );
	if ( historyTraversal ) {
	    // Handle page restore.
	    //window.location.reload();
	    retrieve_shoppingcart(0)
	}
    });
}


$(document).ready(function() {
    //console.log("*** Away to call solref_dom_ready()");
    
    solref_dom_ready();

    // The following was planned, but was in the end found not to be
    // needed, given how JS calls to browser history replace/push/pop was used
    //recompute_shoppingcart_on_history_back(); // **** 
    solref_home_pathname = document.location.pathname;

});

