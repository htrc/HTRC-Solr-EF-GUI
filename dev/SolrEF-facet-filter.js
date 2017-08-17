
var FacetLevelEnum = {
    Page: 1,
    Volume: 2
};

/*
var RefineQueryEnum = {
    Filter: 1,
    NewQuery: 2
};
*/

// Global variable show_facet to control if faceting is used.
var show_facet  = 0;
var facet_level = null;

var filters = [];
var refine_query = {}; // used to store what checkboxes the user has selected (prior to pressing apply)
var refine_query_count = {};
var refined_filters = [];

var facet = ['genre_ss', 'language_s', 'rightsAttributes_s', 'names_ss', 'pubPlace_s', 'bibliographicFormat_s'];
var facet_display_name = {'genre_ss':'Genre', 'language_s': 'Language', 'rightsAttributes_s': 'Copyright Status',
			  'names_ss': 'Author', 'pubPlace_s': 'Place of Publication',
			  'bibliographicFormat_s': 'Original Format'};


function pretty_print_facet_value(kv,displayed_item)
{
    if (kv == "rightsAttributes_s") {
	if (displayed_item in rights_dic) {
	    displayed_item = rights_dic[displayed_item];
	}
    }
    if (kv == "bibliographicFormat_s") {
	if (displayed_item in format_dic) {
	    displayed_item = format_dic[displayed_item];
	}
    }
    if (kv == "language_s") {
	if (displayed_item in language_dic) {
	    displayed_item = language_dic[displayed_item];
	}
    }
    if (kv == "pubPlace_s") {
	// fix the place code ending with whitespace
	displayed_item = displayed_item.trim();
	if (displayed_item in place_dic) {
	    displayed_item = place_dic[displayed_item];
	}
    }
    
    // The following led to the confusing situation that seemingly the same facet value could
    // turn up twice in the list (e.g. because of 'fiction' and 'fiction.')
    // => So for now, commented out
    //displayed_item = displayed_item.replace(/\.$/,""); // tidy up spurious full-stop at end of string

    return displayed_item;
}



function show_results_facet_html(facet_fields)
{
    var facet_html = "";    
    
    for (k in facet_fields) {
	var facet_dl = "<dl>";
	var kv = k;
	if (facet_level == FacetLevelEnum.Page) {
	    kv = kv.replace(/^volume/,"");
	    kv = kv.replace(/_htrcstrings$/,"_ss"); 
	    kv = kv.replace(/_htrcstring$/,"_s"); 
	}

	var apply_icon = '<span class="ui-icon ui-icon-circle-triangle-e"></span>';
	    
	facet_dl += '<dt class="facetField">';
	facet_dl +=   '<span class="facet-apply-title">' + facet_display_name[kv] + ':</span>';
	facet_dl +=   '<span class="facet-apply-wrapper">&nbsp';
	facet_dl +=     '<span id="refine-'+k+'" class="facet-apply"><a data-key="'+k+'">Refine Search '+apply_icon+'</a></span>'
	facet_dl +=     '<span id="filter-'+k+'" class="facet-apply"><a data-key="'+k+'">Apply Filter '+apply_icon+'</a></span>'
	facet_dl +=   '</span>';
	facet_dl += '</dt> ';
	
	var field_items = facet_fields[k];
	var ii = 0;
	
	for (var j=0; j<field_items.length; j=j+2) {

	    var item_term = field_items[j];
	    var item_freq = field_items[j+1];

	    if (item_freq == 0) {
		break;
	    }
	
	    if ((filters.indexOf(k + "--" + item_term) < 0) && (refined_filters.indexOf(k + "--" + item_term) < 0)) {
		// neither a facet that is currently being used as a filter, nor one used in a refined-search
		var _class = "showfacet";
		if (ii > 5) {
		    _class = "hidefacet";
		}
		var displayed_item_term = item_term;
		var pp_displayed_item_term = pretty_print_facet_value(kv,item_term);
		
		//if (pp_displayed_item_term != displayed_item_term) {
		//var raw_item_term = "Raw facet: '"+displayed_item_term+"'";
		//pp_displayed_item_term = '<span alt="'+raw_item_term+'" title="'+raw_item_term+'">'+pp_displayed_item+'</span>';
		//}
		
		facet_dl += '<dd class="' + _class + ' ' + kv + '">';
		facet_dl +=   '<span>'; // ****
		facet_dl +=     '<input type="checkbox" class="facetbox '+kv+'" data-key="'+k+'"  data-term="'+item_term+'" />&nbsp;';
		facet_dl +=     '<a href="javascript:;" data-key="' + k + '"  data-term="' + item_term + '">';
		facet_dl +=       pp_displayed_item_term;
		facet_dl +=     '</a> <span class="page-count" dir="ltr">(' + item_freq + ') </span>';
		facet_dl +=   '</span>'; // ****
		facet_dl += '</dd>';
		ii++;	    		
	    }
	    
	}
	
	if (ii > 5) {
	    facet_dl += '<dd>';
	    facet_dl +=   '<a href="" class="' + kv + ' morefacets">';
	    facet_dl +=     '<span class="ui-icon ui-icon-caret-1-s"></span><span class="moreless">more...</span>';
	    facet_dl +=   '</a>';
	    facet_dl +=   '<a href="" class="' + kv + ' lessfacets" style="display: none;">';
	    facet_dl +=     '<span class="ui-icon ui-icon-caret-1-n"></span><span class="moreless">less...</span>';
	    facet_dl +=   '</a>';
	    facet_dl += '</dd>';
	}
	
	facet_dl += "</dl>";

	if (ii > 0) {
	    facet_html += facet_dl;
	}
    }

    return facet_html;
}


function facet_html_add_checkbox_handlers()
{
    $('input.facetbox[type="checkbox"]').on("change",function () {
	
	// User has clicked on one of the currently applied filters
	// => remove it from 'filters', then instigate an updated search
	
	var facet_key = $(this).attr("data-key");
	var term = $(this).attr("data-term");

	var checkbox_inc = $(this).is(":checked");
	var checkbox_dec = !checkbox_inc;
	
	if (checkbox_inc) {
	    // just been checked on
	    if (!(facet_key in refine_query)) {
		refine_query[facet_key] = {};
		refine_query_count[facet_key] = 0;
	    }
	    refine_query[facet_key][term] = 1;	    
	    refine_query_count[facet_key]++;
	    
	    //console.log("**## Added [" + facet_key + "]." + term);
	}
	else {
	    delete refine_query[facet_key][term];
	    refine_query_count[facet_key]--;
	    //console.log("**## Removed [" + facet_key + "]." + term);
	}

	//var fk_terms = Object.keys(refine_query[facet_key]);
	//var fk_terms_count = fk_terms.length;
	var fk_terms_count = refine_query_count[facet_key];
	
	if (checkbox_inc && (fk_terms_count == 1)) {
	    // change back to filter
	    $('#filter-'+facet_key).show("slide", { direction: "left" }, 1000);
	}
	else if (checkbox_inc && (fk_terms_count == 2)) {
	    // change to refine-search
	    $('#filter-'+facet_key).hide("slide", { direction: "right" }, 1000);
	    $('#refine-'+facet_key).show("slide", { direction: "left" }, 1000);
	}
	else if (checkbox_dec && (fk_terms_count == 1)) {
	    // change back to filter
	    $('#refine-'+facet_key).hide("slide", { direction: "left" }, 1000);
	    $('#filter-'+facet_key).show("slide", { direction: "right" }, 1000);
	}
	else if (fk_terms_count == 0) {
	    $('#filter-'+facet_key).hide("slide", { direction: "left" }, 1000);
	}
	
    });

    $('dt.facetField').on("click","a", function () {
	var parent_id = $(this).parent().attr("id");
	var facet_key = $(this).attr("data-key");

	if ("filter-"+facet_key == parent_id) {
	    console.log("***filter: " + facet_key);

	    var term = Object.keys(refine_query[facet_key])[0];
	    	    
	    if (filters.indexOf(facet_key + "--" + term) < 0) {
		filters.push(facet_key + "--" + term);
	    }

	    //// remove item from facet area
	    //$(this).parent().remove();

	    facetlist_set();
	    store_search_args.start = store_start;
	    show_updated_results();
	    
	}
	else {
	    // "refine-"+key
	    console.log("***refine: " + facet_key);

	    var facet_or_terms = [];
	    
	    var terms = Object.keys(refine_query[facet_key]); // **** replace with keys in
	    for (var i=0; i<terms.length; i++) {
		var term = terms[i];
		term = term.replace(/\//g,"\\/").replace(/:/g,"\\:");
		
		facet_or_terms.push(facet_key+':"'+term+'"');

		if (refined_filters.indexOf(facet_key + "--" + term) < 0) {
		    console.log("*** pushing on refined filter: " + facet_key + "--" + term);
		    refined_filters.push(facet_key + "--" + term);
		}

	    }
	    
	    var facet_terms_arg = "("+facet_or_terms.join(" OR ")+")";
	    
	    var filter_and_terms = [];
	    for (k in filters) {
		var filter_split = filters[k].split("--");
		var filter_key = filter_split[0];
		var filter_term = filter_split[1];
		filter_term = filter_term.replace(/\//g,"\\/").replace(/:/g,"\\:");
		
		filter_and_terms.push(filter_key+':"'+filter_term+'"');

		if (refined_filters.indexOf(filter_key + "--" + filter_term) < 0) {
		    console.log("*** pushing on refined filter for existing filter: " + filter_key + "--" + filter_term);
		    refined_filters.push(filter_key + "--" + filter_term);
		}

	    }

	    var extra_q_arg = facet_terms_arg;
	    if (filter_and_terms.length>0) {
		var filter_terms_arg = "("+filter_and_terms.join(" AND ")+")";

		extra_q_arg = "("+extra_q_arg+" AND "+filter_terms_arg+")";
	    }
	    
	    store_search_args.q += " AND " + extra_q_arg;

	    // Now that all the selectted refine_query terms and existing filters
	    // have been merged into the main query arg, reset these values
	    filters = [];
	    refine_query = {};
	    refine_query_count = {};
	    
	    facetlist_set();
	    
	    // Trigger a brand new search
	    if ($('#search-results-page').is(":visible")) {
		$('#search-results-page').hide();
	    }
	    $('.search-in-progress').css("cursor","wait");
	    
	    store_search_args.start = 0;
	    iprogressbar.trigger_delayed_display(SolrEFSettings.iprogressbar_delay_threshold);
	    
	    ajax_solr_text_search(true,true); // newSearch=true, newResultPage=true

	}
	
	return false;
    });
    
	
}

function facetlist_set()
{
    // Display the filters that are currently in effect
    
    var facetlist_html = "";

    var cancel_png = "assets/jquery-ui-lightness-1.12.1/images/cancel.png";
    
    for (f in filters) {
	var f_split = filters[f].split("--");

	var kv0 = f_split[0];
	var kv1 = f_split[1];

	if (facet_level == FacetLevelEnum.Page) {
	    kv0 = kv0.replace(/^volume/,"");
	    kv0 = kv0.replace(/_htrcstrings$/,"_ss"); 
	    kv0 = kv0.replace(/_htrcstring$/,"_s"); 
	}
	var kv0_display = facet_display_name[kv0]

	var facet_val  = pretty_print_facet_value(kv0,kv1);	
	
	facetlist_html += '<li>';
	facetlist_html +=   '<a href="javascript:;" class="unselect">';
	facetlist_html +=     '<img alt="Delete" src="'+cancel_png+'" class="removeFacetIcon">';
	facetlist_html +=   '</a>';
	facetlist_html +=   '&nbsp;<span class="selectedfieldname">' + kv0_display + '</span>';
	facetlist_html +=   ':  ' + facet_val;
	facetlist_html += '</li>';
    }

    if (facetlist_html != "") {
	$('#selectedFacets').show();
	$(".filters").html(facetlist_html);
    }
    else {
	$('#selectedFacets').hide();
    }
}


$(function () {
    //Facet related page setup
    
    $("#facetlist").on("click","a",function () {

	$class = $(this).attr("class");
	
	if ($(this).hasClass("morefacets")) {
	    obj = $class.split(" ")[0];
	    $(this).hide();
	    $("[class='" + obj + " lessfacets']").show();
	    $("[class='hidefacet " + obj + "']").css({
		display: "block",
		visibility: "visible"
	    });
	    return false;
	}
	else if ($(this).hasClass("lessfacets")) {
	    obj = $class.split(" ")[0];
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

	    
	    if (filters.indexOf(facet_key + "--" + term) < 0) {
		console.log("*** pushing on filter: " + facet_key + "--" + term);
		filters.push(facet_key + "--" + term);
	    }

	    // remove item from facet area
	    $(this).parent().remove();
	    facetlist_set();
	    //console.log("*** facetlist on-click: store_search_args.start = " + store_search_args.start + ", store_start = " + store_start);
	    store_search_args.start = store_start;
	    show_updated_results();
	}
    });
    
    $(".filters").on("click","a",function () {
	// User has clicked on one of the currently applied filters
	// => remove it from 'filters', then instigate an updated search
	
	filters.splice($(this).parent().index(), 1);
	facetlist_set();
	//console.log("*** filters on-click: store_search_args.start = " + store_search_args.start + ", store_start = " + store_start);
	
	store_search_args.start = store_start;
	show_updated_results();
    });


});


