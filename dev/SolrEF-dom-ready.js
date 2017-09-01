


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
	var pos_checkbox = [{
		pos: "VERB",
		label: "Verbs",
		tooltip: "Verbs (all tenses and modes)"
	}, {
		pos: "NOUN",
		label: "Nouns",
		tooltip: "Nouns (common and proper)"
	}, {
		pos: "ADJ",
		label: "Adjectives",
		tooltip: null
	}, {
		pos: "ADV",
		label: "Adverbs",
		tooltip: null
	}, {
		pos: "ADP",
		label: "Adpositions",
		tooltip: "Adpositions (prepositions and postpositions)"
	}, {
		pos: "CONJ",
		label: "Conjunctions",
		tooltip: null
	}, {
		pos: "DET",
		label: "Determiners",
		tooltip: null
	}, {
		pos: "NUM",
		label: "Numbers",
		tooltip: "Cardinal numbers"
	}, {
		pos: "PRT",
		label: "Particles",
		tooltip: "Particles or other function words"
	}, {
		pos: "X",
		label: "Other",
		tooltip: "Other words, such as foreign words, typos, abbreviations"
	}];

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
		legend += '      <span ' + opt_title + '>' + lang_full + ':</span>\n';
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

$(document).ready(function(){
    
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
	width: 400,
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

    $( "#htrc-publish-dialog" ).dialog({
	modal: true,
	autoOpen: false,
	resizable: true,
	width: 750,
	height: 620,
	buttons: {
	    "Publish": function() {
		$( this ).dialog( "close" );
	    },
	    "Cancel": function() {
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

    $("#export-ef-to-registry").click(function () {
	solr_ef_login_to_publish();
    });

    
    $("#volume-help-dialog").dialog({
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

    var vol_md_keys = [];
    for (var key in volume_metadata_fields) {
	vol_md_keys.push(key);
    }
    var vol_md_keys_str = vol_md_keys.sort().join(", ");
    $('#volume-help-fields').html(vol_md_keys_str);
    

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


    $('#export-ef-zip').click(function (event) {
	//console.log("**** ef export link clicked: href = " + $('#export-ef-zip').attr('href'));
	if (!$('#export-ef-zip').attr('href')) {
	    // lazy evaluation, workout out what href should be, and then trigger click once more
	    event.preventDefault();
	    $('.export-item').css("cursor","wait");
	    if (facet_filter.getFacetLevel() == FacetLevelEnum.Page) {
		ajax_solr_stream_volume_count(store_search_args.q,true,stream_export_ef); // doRollup=true
	    }
	    else {
		ajax_solr_stream_volume_count(store_search_args.q,false,stream_export_ef); // doRollup=false
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

    if ($('#search-submit').length > 0) {
	$('#search-submit').click(submit_action);
    }

});


