
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

	for (var li = 0; li < langs_with_pos.length; li++) {

		var l = langs_with_pos[li];
		var lang_full = isoLangs[l].name;
		var lang_native_full = isoLangs[l].nativeName;
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
	// for each 'langs_without_pos' generate HTML of the form:
	//    <input type="checkbox" name="fr-enabled" id="fr-enabled" />French
	var $other_langs = $('#other-langs');

	for (var i = 0; i < langs_without_pos.length; i++) {
		var lang = langs_without_pos[i];
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
		var lang_full = isoLangs[lang].name;
		var lang_native_full = isoLangs[lang].nativeName;
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
	localStorage.setItem("htrc-ef-query-tab-selected",store_query_tab_selected);
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


function mnemonic_help_text(dic,div_id,num_cols)
{
    var mnemonic_keys = Object.keys(dic).sort();
    
    var mnemonic_keys_str = "<table width=\"100%\"><tr>";
    var pos = 0;
    $.each(mnemonic_keys, function(index,key) {
	var val = dic[key]
	mnemonic_keys_str += "<td><i><nobr>"+key + "</nobr></i>:</td><td> " + val + "</td>";
	pos++;
	if ((pos % num_cols) == 0) {
	    mnemonic_keys_str += '</tr><tr>';
	}
    });
    mnemonic_keys_str += "</tr></table>";
    
    $('#'+div_id).html(mnemonic_keys_str);
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
    $("#volume-help-dialog").dialog({
	autoOpen: false,
	resizable: true,
	width: 790,
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
    
/*
    var vol_md_keys = [];
    for (var key in volume_metadata_fields) {
	vol_md_keys.push(key);
    }
    var vol_md_keys_str = vol_md_keys.sort().join(", ");
    $('#volume-help-fields').html(vol_md_keys_str);
*/
    //fields_help_text(Object.keys(volume_metadata_fields),'volume-help-fields',4);
    mnemonic_help_text(volume_metadata_dic,'volume-help-fields',1);
    
    mnemonic_help_text(format_dic,'volume-help-format',4);
    mnemonic_help_text(place_dic,'volume-help-pubplace',4);
    mnemonic_help_text(language_dic,'volume-help-language',4);
    mnemonic_help_text(rights_dic,'volume-help-rights',3);
    

    $("#volume-help").click(function () {
	$("#volume-help-dialog").dialog( "open" );
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

    var solr_col = getURLParameter("solr-col");
    if (solr_col != null) {
	solr_collection = solr_col;
    }
    if (solr_collection.match(/^solr3456-/)) {
	solr_search_action = robust_solr_prefix_url+solr_collection+"/select";
	solr_stream_action = robust_solr_prefix_url+solr_collection+"/stream";
	do_solr_field_optimization = 1;
    }
    else {
	solr_search_action = solr_prefix_url+solr_collection+"/select";
	solr_stream_action = solr_prefix_url+solr_collection+"/stream";
	do_solr_field_optimization = 0;
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
	var ls_qts = localStorage.getItem("htrc-ef-query-tab-selected");
	if (ls_qts != null) {
	    store_query_tab_selected = ls_qts;
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
	width: 450,
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


    generate_pos_langs();
    generate_other_langs();

    show_hide_lang();

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

	// hide query input area
	$('#droppable-targets').hide();
	$('#select-for-shoppingcart').hide();
	$('#sr-add-delete-wrapper').hide();
	$('#tabs-search').hide();
	$('#search-explain').hide();

	$('#solr-ef-title').hide();
	
	// Show shoppingcartId
	var shoppingcart_key = getShoppingcartId();
	$('#shoppingcart-info-id').attr("size",shoppingcart_key.length);
	$('#shoppingcart-info-id').val(shoppingcart_key);

	if (window.location.hostname.match(/^solr1\./)) {
	    // public facing machine => message that this not available
	    $("#shoppingcart-info-id-export-as-workset").attr("disabled", "disabled")
	    $('#shoppingcart-info-id-export-as-workset-clarification').html('&nbsp;(htrc-admin only)');
	}
	else {
	    // development machine => allow export
	    $("#shoppingcart-info-id-export-as-workset").on('click',export_shoppingcart);
	}
	$('#shoppingcart-info-area').show();

	$("#shoppingcart-info-empty").on('click',empty_shoppingcart);

	console.log("*** changing export header label");
	$('#export-header').html("Export Selection Cart");
	
	load_solr_q(shoppingcart_q);
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
	    var start = parseInt(arg_start)-1; // 'start' value and cgi-arg version work 'off by one' to each other
	    var group_by_vol_checked_arg = getURLParameter("group-by-vol") || "0";
	    group_by_vol_checked = parseInt(group_by_vol_checked_arg);	   
	    trigger_solr_key_search(solr_key_q,start,false); // want this query added to browser history
	}
	else {

	    // see if there is a shoppingcart-key-q
	    var shoppingcart_key_q = getURLParameter("shoppingcart-key-q");
	    if (shoppingcart_key_q != null) {
		trigger_shoppingcart_key_search(shoppingcart_key_q);
		/*
		// ajax call to get query specified by key		
		$.ajax({
		    type: "POST",
		    url: ef_download_url, 
		    data: {
			'action': 'key-value-storage',
			'key': encodeURI(shoppingcart_key_q)
		    },
		    dataType: "text",
		    success: function(textData) {
			var text_q = textData;
			select_optimal_query_tab(text_q);
			$('#search-submit').click();			
		    },
		    error: function(jqXHR, textStatus, errorThrown) {
			console.error("Failed to retrieve expanded form of shoppingcart key: '" + shoppingcart_key_q + "'");
			ajax_error(jqXHR, textStatus, errorThrown)
		    }		
		});
*/
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

	/*
    $('#trashcan-drop').tooltip();
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

	    //var filter_key_count = Object.keys(facet_filter.refine_query).length;

	    	
	    var facet_key = $(this).attr("data-key");
	    var term = $(this).attr("data-term");

	    var pending_filters = facet_filter.hasPendingFilters(facet_key,term);
	    
	    /*
	    var pending_filters = false;
	    for (var pending_key in facet_filter.refine_query) {
		if (pending_key != facet_key) {
		    pending_filters = true;
		    break;
		}
		else {
		    var refine_terms = facet_filter.refine_query[pending_key];
		    for (var pending_term in refine_terms) {
			
			if (pending_term != term) {
			    pending_filters = true;
			}
		    }
		}
	    }*/
	    	    
	    var clicked_elem = this;

	    //var facet_key_count = facet_filter.refine_query_count[facet_key];
	    
	    //if ((filter_key_count>1) || (facet_key_count > 1)) {
	    if (pending_filters) {
		var pp_field = facet_filter.prettyPrintField(facet_key);
		var pp_term = facet_filter.prettyPrintTerm(facet_key,term);

		var message = "Other filter(s) are checked but not yet applied.<br/>";
		message += "Do you want to ignore them and apply just the '"+pp_term+"' filter to "+pp_field+"?",
		
		htrc_confirm(message,
			     function() {
				 $(this).dialog("close");
				 facet_filter.applySingleFilter(clicked_elem,facet_key,term);
			     },
			     function() {
				 $(this).dialog("close");
			     }
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

    var volume_available_keys = Object.keys(volume_metadata_fields).sort();
    var volume_available_tags = [];
    $.each(volume_available_keys,function(index,key) {
	volume_available_tags.push({'key':key, 'label': volume_metadata_dic[key]});
    });
    
    
    domready_volume_autocomplete('vq',volume_available_tags);
    
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
	    retrieve_shoppingcart()
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

