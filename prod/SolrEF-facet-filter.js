//"use strict";

var FacetLevelEnum = {
    Page: 'Page',
    Volume: 'Volume'
};

function FacetFilter()
{
    this.show_facet  = true; // on by default
    this.facet_level = null;

    this.filters = [];
    this.refine_query = {}; // used to store what checkboxes the user has selected (prior to pressing apply)
    this.refine_query_count = {};   
}

// Static member: The facet fields to display
FacetFilter.FacetFieldsDisplay =
    { 'genre_ss'             : 'Genre',
      'language_s'           : 'Language',
      'rightsAttributes_s'   : 'Copyright Status',
      'names_ss'             : 'Author',
      'pubPlace_s'           : 'Place of Publication',
      'bibliographicFormat_s': 'Original Format',
      'classification_lcc_ss': 'Classification',
      'concept_ss': 'Concepts'
    };
    
FacetFilter.prototype.resetRefineQuery = function()
{
    this.refine_query = {}; 
    this.refine_query_count = {};
}


FacetFilter.prototype.resetFilters = function()
{
    // If looking for fuller reset, consider call constructor
    this.filters = [];
    this.resetRefineQuery();
}
				      
FacetFilter.prototype.setShowFacet = function(state)
{
    this.show_facet = state;
}

FacetFilter.prototype.setFacetLevel = function(level)
{
    this.facet_level = level;
}

FacetFilter.prototype.getFacetLevel = function()
{
    return this.facet_level;
}

FacetFilter.prototype.filterExists = function(field_in,term_in)
{
    for (var fi=0; fi<this.filters.length; fi++) {
	var filter = this.filters[fi];
	var filter_split = filter.split("--");
	var field = filter_split[0];

	if (field_in != field) {
	    continue;
	}
	
	var or_terms_str = filter_split[1];
	var or_terms = or_terms_str.split(" OR ");

	for (var ti=0; ti<or_terms.length; ti++) {
	    var term = or_terms[ti];

	    if (term_in == term) {
		return true;
	    }
	}
    }

    // get to here, then found no match
    return false;	
}

FacetFilter.prototype.filterAdd = function(field,term)
{
    this.filters.push(field + "--" + term);
}

FacetFilter.prototype.hasPendingFilters = function(ignore_key,opt_ignore_term)
{
    var pending_filters = false;
    for (var pending_key in this.refine_query) {
	if (pending_key != ignore_key) {
	    pending_filters = true;
	    break;
	}
	else {
	    if (opt_ignore_term) {
		var refine_terms = this.refine_query[pending_key];
		for (var pending_term in refine_terms) {
		    
		    if (pending_term != opt_ignore_term) {
			pending_filters = true;
		    }
		}
	    }
	}
    }

    return pending_filters;
}

FacetFilter.prototype.getFieldNeutral = function(field)
{
    var field_neutral = field;
    if (this.facet_level == FacetLevelEnum.Page) {
	field_neutral = field_neutral.replace(/^volume/,"");
	field_neutral = field_neutral.replace(/_htrcstrings$/,"_ss"); 
	field_neutral = field_neutral.replace(/_htrcstring$/,"_s"); 
    }

    return field_neutral;
}

FacetFilter.prototype.prettyPrintField = function(field)
{
    var field_neutral = this.getFieldNeutral(field);

    var field_display = FacetFilter.FacetFieldsDisplay[field_neutral];

    return field_display;
}

FacetFilter.prototype.prettyPrintTerm = function(field,terms_str)
{
    var field_neutral = this.getFieldNeutral(field);
    
    var or_terms = terms_str.split(" OR ");

    var pp_or_terms = [];

    for (var i=0; i<or_terms.length; i++) {
	var term = or_terms[i];
	
	if (field_neutral == "rightsAttributes_s") {
	    if (term in rights_dic) {
		term = rights_dic[term];
	    }
	}
	else if (field_neutral == "bibliographicFormat_s") {
	    if (term in format_dic) {
		term = format_dic[term];
	    }
	}
	else if (field_neutral == "language_s") {
	    if (term in language_dic) {
		term = language_dic[term];
	    }
	}
	else if (field_neutral == "pubPlace_s") {
	    // fix the place code ending with whitespace
	    term = term.trim();
	    if (term in place_dic) {
		term = place_dic[term];
	    }
	}

	pp_or_terms.push(term);
    }

    var pp_terms_str = pp_or_terms.join(" OR ");
    
    // The following led to the confusing situation that seemingly the same facet value could
    // turn up twice in the list (e.g. because of 'fiction' and 'fiction.')
    // => So for now, commented out
    //displayed_item = displayed_item.replace(/\.$/,""); // tidy up spurious full-stop at end of string

    return pp_terms_str;
}



FacetFilter.prototype.showResultsHtml = function(facet_fields)
{
    var facet_html = "";    
    
    for (var facet_field in facet_fields) {

	var facet_field_neutral = this.getFieldNeutral(facet_field);
	var facet_field_neutral_display = this.prettyPrintField(facet_field);

	var facet_dl = '<dl id="facet_'+facet_field_neutral+'">';

	if (facet_field_neutral == "classification_lcc_ss") {
	    console.log("**** start ajax retrieve lcc vals"); //xxxxx adsfkjakldfs = 5:;
	}
	

	var apply_icon = '<span class="ui-icon ui-icon-circle-triangle-e"></span>';

	facet_dl += '<dt class="facetField">';
	facet_dl +=   '<span class="facet-apply-title">' + facet_field_neutral_display + ':</span>';
	facet_dl +=   '<span class="facet-apply-wrapper">&nbsp';
	//facet_dl +=     '<span id="refine-'+facet_field+'" class="facet-apply"><a data-key="'+facet_field+'">Refine Search '+apply_icon+'</a></span>'
	facet_dl +=     '<span id="filter-'+facet_field+'" class="facet-apply">';
	facet_dl +=        '<a data-key="'+facet_field+'">Apply Filter '+apply_icon+'</a>';
	facet_dl +=     '</span>'
	facet_dl +=   '</span>';
	facet_dl += '</dt> ';
	
	var field_items = facet_fields[facet_field];
	var ii = 0;
	
	for (var j=0; j<field_items.length; j=j+2) {

	    var item_term = field_items[j];
	    var item_freq = field_items[j+1];

	    if (item_freq == 0) {
		break;
	    }

	    if (!this.filterExists(facet_field,item_term)) {
		// not a facet that is currently being used as a filter
		var _class = "showfacet";
		if (ii > 5) {
		    _class = "hidefacet";
		}
		var displayed_item_term = item_term;
		var pp_displayed_item_term = this.prettyPrintTerm(facet_field,item_term);
		
		//if (pp_displayed_item_term != displayed_item_term) {
		//var raw_item_term = "Raw facet: '"+displayed_item_term+"'";
		//pp_displayed_item_term = '<span alt="'+raw_item_term+'" title="'+raw_item_term+'">'+pp_displayed_item+'</span>';
		//}
		
		facet_dl += '<dd class="' + _class + ' ' + facet_field_neutral + '">';
		facet_dl +=   '<span>'; // ****
		facet_dl +=     '<input type="checkbox" class="facetbox '+facet_field_neutral+'" data-key="'+facet_field+'"  data-term="'+item_term+'" />&nbsp;';
		facet_dl +=     '<a href="javascript:;" data-key="' + facet_field + '"  data-term="' + item_term + '">';
		facet_dl +=       pp_displayed_item_term;
		facet_dl +=     '</a> <span class="page-count" dir="ltr">(' + item_freq + ') </span>';
		facet_dl +=   '</span>'; // ****
		facet_dl += '</dd>';
		ii++;	    		
	    }
	    
	}
	
	if (ii > 5) {
	    facet_dl += '<dd>';
	    facet_dl +=   '<a href="" class="' + facet_field_neutral + ' morefacets">';
	    facet_dl +=     '<span class="ui-icon ui-icon-caret-1-s"></span><span class="moreless">more...</span>';
	    facet_dl +=   '</a>';
	    facet_dl +=   '<a href="" class="' + facet_field_neutral + ' lessfacets" style="display: none;">';
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

// **** Not currently used, would need updating

FacetFilter.prototype.refine_query_unused = function()
{
    // merge items in refine_query and filter into into main Solr query q= ...
    
    // "refine-"+key
    console.log("***refine: " + facet_key);
    
    var facet_or_terms = [];
    
    var terms = Object.keys(that.refine_query[facet_key]); // **** replace with keys in
    for (var i=0; i<terms.length; i++) {
	var term = terms[i];
	term = term.replace(/\//g,"\\/").replace(/:/g,"\\:");
	
	facet_or_terms.push(facet_key+':"'+term+'"');
	
	if (that.refined_filters.indexOf(facet_key + "--" + term) < 0) {
	    console.log("*** pushing on refined filter: " + facet_key + "--" + term);
	    that.refined_filters.push(facet_key + "--" + term);
	}
	
    }
    
    var facet_terms_arg = "("+facet_or_terms.join(" OR ")+")";
    
    var filter_and_terms = [];
    for (var k in that.filters) {
	var filter_split = that.filters[k].split("--");
	var filter_key = filter_split[0];
	var filter_term = filter_split[1];
	filter_term = filter_term.replace(/\//g,"\\/").replace(/:/g,"\\:");
	
	filter_and_terms.push(filter_key+':"'+filter_term+'"');

	if (that.refined_filters.indexOf(filter_key + "--" + filter_term) < 0) {
	    console.log("*** pushing on refined filter for existing filter: " + filter_key + "--" + filter_term);
	    that.refined_filters.push(filter_key + "--" + filter_term);
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
    that.filters = [];
    that.refine_query = {};
    that.refine_query_count = {};

    facet_filter.facetlistSet();
    
    // Trigger a brand new search
    if ($('#search-results-page').is(":visible")) {
	$('#search-results-page').hide();
    }
    $('.search-in-progress').css("cursor","wait");
    
    store_search_args.start = 0;
    iprogressbar.trigger_delayed_display(SolrEFSettings.iprogressbar_delay_threshold,
					 "Applying filter");
    
    ajax_solr_text_search(true,true); // newSearch=true, newResultPage=true
}

FacetFilter.prototype.addCheckboxHandlers = function()
{
    var that = this;
    
    $('input.facetbox[type="checkbox"]').on("change",function() {
	
	// User has clicked on one of the currently applied filters
	// => remove it from 'filters', then instigate an updated search
	
	var facet_key = $(this).attr("data-key");
	var term = $(this).attr("data-term");

	var checkbox_inc = $(this).is(":checked");
	//var checkbox_dec = !checkbox_inc;
	
	if (checkbox_inc) {
	    // just been checked on
	    if (!(facet_key in that.refine_query)) {
		that.refine_query[facet_key] = {};
		that.refine_query_count[facet_key] = 0;
	    }
	    that.refine_query[facet_key][term] = 1;	    
	    that.refine_query_count[facet_key]++;
	    
	    //console.log("**## Added [" + facet_key + "]." + term);
	}
	else {
	    delete that.refine_query[facet_key][term];
	    that.refine_query_count[facet_key]--;
	    //console.log("**## Removed [" + facet_key + "]." + term);

	    if (that.refine_query_count[facet_key] == 0) {
		delete that.refine_query[facet_key];
		delete that.refine_query_count[facet_key];
	    }
	}

	var fk_terms_count = that.refine_query_count[facet_key] || 0;
	
	if (checkbox_inc && (fk_terms_count == 1)) {
	    // change to filter
	    $('#filter-'+facet_key).show("slide", { direction: "left" }, 1000);
	}/*
	else if (checkbox_inc && (fk_terms_count == 2)) {
	    // change to refine-search
	    $('#filter-'+facet_key).hide("slide", { direction: "right" }, 1000);
	    $('#refine-'+facet_key).show("slide", { direction: "left" }, 1000);
	}
	else if (checkbox_dec && (fk_terms_count == 1)) {
	    // change back to filter
	    $('#refine-'+facet_key).hide("slide", { direction: "left" }, 1000);
	    $('#filter-'+facet_key).show("slide", { direction: "right" }, 1000);
	}*/ // ****
	else if (fk_terms_count == 0) {
	    $('#filter-'+facet_key).hide("slide", { direction: "left" }, 1000);
	}
	
    });

    $('dt.facetField').on("click","a", function() {
	var parent_id = $(this).parent().attr("id");
	var facet_key = $(this).attr("data-key");

	if ("filter-"+facet_key == parent_id) {

	    var pending_filters = that.hasPendingFilters(facet_key);
	    
	    if (pending_filters) {
		var pp_field = facet_filter.prettyPrintField(facet_key);

		var message = "Other filter(s) are checked but not yet applied.<br/>";
		message += "Do you want to ignore them and apply just the one for '"+pp_field+"'?",
		
		htrc_confirm(message,
			     function() {
				 $(this).dialog("close");
				 facet_filter.applyMultiFilter(facet_key);
			     },
			     function() {
				 $(this).dialog("close");
			     }
			    );
	    }
	    else {
		facet_filter.applyMultiFilter(facet_key);
	    }

/*
	    var or_terms = [];
	    
	    for (var term in that.refine_query[facet_key]) {
		
	    	or_terms.push(term);
		
		//Work out the related <a> single-click facet element,
		// and remove item from <dd> area
		var $filter_elem = $('#facetlist a[data-key="'+facet_key+'"][data-term="'+term+'"]')	    
		$filter_elem.parent().remove();
	    }

	    delete that.refine_query[facet_key];
	    delete that.refine_query_count[facet_key];

	    var or_terms_str = or_terms.join(" OR ");

	    if (!that.filterExists(facet_key,or_terms_str)) {
		that.filterAdd(facet_key,or_terms_str);
	    }

	    facet_filter.facetlistSet(); // that????
	    store_search_args.start = store_start;
	    show_updated_results();
*/
	    
	}
	
	return false;
    });
    
	
}

FacetFilter.prototype.display = function(jsonFacetCounts)
{
    if (this.show_facet) {
	if (this.facet_level == FacetLevelEnum.Page) {
	    $('#facet-units').html(" (page count)");
	}
	else {
	    $('#facet-units').html(" (volume count)");
	}
	
	var facet_fields = jsonFacetCounts.facet_fields;
	
	var facet_html = this.showResultsHtml(facet_fields);
	
	$(".narrowsearch").show();
	$("#facetlist").html(facet_html);
	this.addCheckboxHandlers();
	
    }
    else {
	$(".narrowsearch").hide();
	$("#facetlist").html("");
    }
}

FacetFilter.prototype.facetlistSet = function()
{
    // Display the filters that are currently in effect
    
    var filterlist_html = "";
    
    for (var f in this.filters) {
	var f_split = this.filters[f].split("--");

	var filter_field = f_split[0];
	var filter_term = f_split[1].replace(/\"/g,"");
/*
	if (this.facet_level == FacetLevelEnum.Page) {
	    filter_field = filter_field.replace(/^volume/,"");
	    filter_field = filter_field.replace(/_htrcstrings$/,"_ss"); 
	    filter_field = filter_field.replace(/_htrcstring$/,"_s"); 
	}
	var filter_field_display = FacetFilter.FacetFieldsDisplay[filter_field];
*/

	var filter_field_display = this.prettyPrintField(filter_field);
	var filter_term_display  = this.prettyPrintTerm(filter_field,filter_term);	
	
	filterlist_html += '<li>';
	filterlist_html +=   '<a href="javascript:;" class="unselect">';
	filterlist_html +=     '<span alt="Delete" class="custom-ui-icon removeFacetIcon" />';
	filterlist_html +=   '</a>';
	filterlist_html +=   '&nbsp;<span class="selectedfieldname">' + filter_field_display + '</span>';
	filterlist_html +=   ':  ' + filter_term_display;
	filterlist_html += '</li>';
    }

    if (filterlist_html != "") {
	$('#selectedFacets').show();
	$(".filters").html(filterlist_html);
    }
    else {
	$('#selectedFacets').hide();
    }
}


FacetFilter.prototype.solrSearchAppendArgs = function(url_args)
{
    for (var facet_field in FacetFilter.FacetFieldsDisplay) {

	if (this.facet_level == FacetLevelEnum.Page) {
	    facet_field = "volume" + facet_field;
	    facet_field = facet_field.replace(/_ss$/,"_htrcstrings");
	    facet_field = facet_field.replace(/_s$/,"_htrcstring");
	}
	url_args.push('facet.field=' + facet_field);
    }
    
    for (var filter_key_pair in this.filters) {
	var ks = this.filters[filter_key_pair].split("--");
	var filter_field = ks[0];
	var filter_term = ks[1];
	//filter_term = filter_term.replace(/\//g,"\\/").replace(/:/g,"\\:").replace(/,/g,"\\,"); // ****
	filter_term = escape_solr_query(filter_term);

	var or_terms = filter_term.split(" OR ");
	var quoted_or_terms = or_terms.map(function(v) { return '"'+v+'"'; });
	var quoted_or_terms_str = quoted_or_terms.join(" OR ");
	
	//url_args.push('fq=' + filter_field + ':("' + filter_term + '")');
	//url_args.push('fq=' + filter_field + ':(' + filter_term + ')');

	url_args.push('fq=' + filter_field + ':(' + quoted_or_terms_str + ')');
    }

    return url_args;
}

FacetFilter.prototype.applySingleFilter = function(clicked_elem,facet_key,term)
{
    if (!this.filterExists(facet_key,term)) {
	this.filterAdd(facet_key,term);
    }
    
    // remove item from facet area
    $(clicked_elem).parent().remove();

    // deselect all the checkboxes
    $('input.facetbox[type="checkbox"]').prop('checked', false);

    this.resetRefineQuery();    
    this.facetlistSet();
    //console.log("*** facetlist on-click: store_search_args.start = " + store_search_args.start + ", store_start = " + store_start);
    store_search_args.start = store_start;
    show_updated_results();
}

FacetFilter.prototype.applyMultiFilter = function(facet_key)
{
    $('#filter-'+facet_key).hide("slide", { direction: "left" }, 1000);

    var or_terms = [];
	    
    for (var term in this.refine_query[facet_key]) {
	
	or_terms.push(term);
	
	//Work out the related <a> single-click facet element,
	// and remove item from <dd> area
	var $filter_elem = $('#facetlist a[data-key="'+facet_key+'"][data-term="'+term+'"]')	    
	$filter_elem.parent().remove();
    }

    var or_terms_str = or_terms.join(" OR ");
    
    if (!this.filterExists(facet_key,or_terms_str)) {
	this.filterAdd(facet_key,or_terms_str);
    }

    this.resetRefineQuery(); 
    this.facetlistSet();
    store_search_args.start = store_start;
    show_updated_results();
    
}

var facet_filter = new FacetFilter();



