// Global variable show_facet to control if faceting is used.
var show_facet = 0;
var facet_level = null;

var filters = [];
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
    var _class = '';
    
    for (k in facet_fields) {
	//console.log("**** show results: k = " + k);
	facet_html += "<dl>";
	var kv = k;
	if (facet_level == "page") {
	    kv = kv.replace(/^volume/,"");
	    kv = kv.replace(/_htrcstrings$/,"_ss"); 
	    kv = kv.replace(/_htrcstring$/,"_s"); 
	}
	//console.log("**** kv = " + kv);
	
	facet_html += "<dt class=\"facetField\">" + facet_display_name[kv] + "</dt> ";
	item = facet_fields[k];
	ii = 0;
	for (var j = 0; j <= item.length / 2; j = j + 2) {
	    
	    if (item[j + 1] > 0) {
		if (filters.indexOf(kv + "--" + item[j]) < 0) {
		    _class = "showfacet";
		    if (ii > 5) {
			_class = "hidefacet";
		    }
		    var displayed_item = item[j];
		    var pp_displayed_item = pretty_print_facet_value(kv,item[j]);

		    //if (pp_displayed_item != displayed_item) {
			//var raw_item = "Raw facet: '"+displayed_item+"'";
			//pp_displayed_item = '<span alt="'+raw_item+'" title="'+raw_item+'">'+pp_displayed_item+'</span>';
		    //}
		    
		    facet_html += '<dd class="' + _class + ' ' + kv + '"><a href="javascript:;" data-obj="' + k + '"  data-key="' + item[j] + '">' + pp_displayed_item + '</a><span dir="ltr">&nbsp;(' + item[j + 1] + ') </span></dd>';
		    ii++;
		}
		
	    }
	    
	}
	if (ii > 5) {
	    facet_html += '<dd><a href="" class="' + kv + ' morefacets"><span class="moreless">more...</span></a><a href="" class="' + kv + ' lessfacets" style="display: none;"><span class="moreless">less...</span></a></dd>'
	}
	facet_html += "</dl>";
    }

    return facet_html;
}




function facetlist_set() {
    var facetlist_html = '';
    for (k in filters) {
	var ks = filters[k].split("--");

	var kv0 = ks[0];
	var kv1 = ks[1];

	if (facet_level == "page") {
	    kv0 = kv0.replace(/^volume/,"");
	    kv0 = kv0.replace(/_htrcstrings$/,"_ss"); 
	    kv0 = kv0.replace(/_htrcstring$/,"_s"); 
	}
	var kv0_display = facet_display_name[kv0]

	var facet_val  = pretty_print_facet_value(kv0,kv1);	
	
	facetlist_html += '<li><a href="javascript:;" class="unselect"><img alt="Delete" src="assets/jquery-ui-lightness-1.12.1/images/cancel.png" class="removeFacetIcon"></a>&nbsp;<span class="selectedfieldname">' + kv0_display + '</span>:  ' + facet_val + '</li>';
    }

	$(".filters").html(facetlist_html);
}

