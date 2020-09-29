//"use strict";

if (typeof runtime_mode == "undefined") {
  runtime_mode = "prod";
}

var jsx_url_prefix = "/assets/solr-ef/";

var page_viewer_async_link_css_urls = [ 
    //"assets/flat.css", 
    //"assets/font-awesome.css", 
    //"assets/tomorrow.css", 

    "assets/jquery-ui-lightness-1.12.1/jquery-ui.min.css",
    "assets/paging.css",
    runtime_mode+"/SolrEF.css",
    runtime_mode+"/SolrEF-progressbar.css",
    "assets/pager-icons.css"
];

/*
var versioned_lookup_vars;
if (runtime_mode == "dev") {
    if (json_ef_version == "2.0") {
	versioned_lookup_vars = "/SolrEF20-lookup-vars.js";
    }
    else {
	versioned_lookup_vars = "/SolrEF15-lookup-vars.js";
    }
}
else {
    versioned_lookup_vars = "/lookup-vars.js";
}
*/

if (json_ef_version == "2.0") {
    versioned_lookup_vars = "/SolrEF20-lookup-vars.js";
}
else {
    versioned_lookup_vars = "/SolrEF15-lookup-vars.js";
}


var page_viewer_async_script_urls = [ 
    //"assets/highlight.js",
    //"assets/stupidtable.js",

    //"assets/bowser.js",
    //"assets/download.min.js",

    "assets/paging.js",
    runtime_mode+"/iso-639-1.js",
    runtime_mode+"/opennlp-lang-pos-mapping.js", // defines var 'universalPOSMapping'
    runtime_mode+versioned_lookup_vars,
    runtime_mode+"/SolrEF-lookup-vars-common.js",
    runtime_mode+"/SolrEF-settings.js",
    runtime_mode+"/SolrEF-utils.js",
    runtime_mode+"/SolrEF-dialog-utils.js",
    runtime_mode+"/SolrEF-authentication.js",
    runtime_mode+"/SolrEF-iprogressbar.js",
    runtime_mode+"/SolrEF-facet-filter.js"
];

function page_viewer_load_async_link_css(url_prefix) 
{
    var react_component = $('#json-page-viewer-type').data("react-component");
    if (react_component) {
	page_viewer_async_link_css_urls.push(runtime_mode+"/SolrEF-jsx.css");
    }

    var num_links = page_viewer_async_link_css_urls.length;
    
    for (var i=0; i<num_links; i++) {
	
	var link_url = page_viewer_async_link_css_urls[i];
	var full_link_url = url_prefix+link_url;

	if (document.createStyleSheet){
            document.createStyleSheet(full_link_url);
        }
	else {
	    $("<link/>", {
		rel: "stylesheet",
		type: "text/css",
		href: full_link_url
	    }).appendTo("head");
	}
    }
}

function page_viewer_load_domready_scripts(url_prefix) 
{
    $.ajax({
	url: url_prefix+runtime_mode+"/JsonEF-page-viewer.js",
	dataType: "script",	
	success: function() {
	    //$('#json-page-viewer-container-loading').hide();
	    //$('#json-page-viewer-container-dynamic-load').show();
	}
    });
}


function page_viewer_load_async_scripts(url_prefix) 
{
    var num_scripts = page_viewer_async_script_urls.length;
    var num_loaded_scripts = 0;
    
    for (var i=0; i<num_scripts; i++) {
	
	var script_url = page_viewer_async_script_urls[i];
	$.ajax({
	    url: url_prefix+script_url,
	    dataType: "script",
	    success: function() {
		num_loaded_scripts++;

		if (num_loaded_scripts == num_scripts) {
		    page_viewer_load_domready_scripts(url_prefix);
		}
	    }
        });
	
    }    
}


$(document).ready(function() {
    //console.log("*** json-page-viewer-body-dl.js: on doc ready called");

    //alert("runtime mode = " + runtime_mode);

    var react_component = $('#json-page-viewer-type').data("react-component");

    var url_prefix;
    if (react_component) {
	url_prefix = jsx_url_prefix;
    }
    else {
	url_prefix = document.location.pathname.replace(/\/[^\/]+$/,"\/");
    }

    page_viewer_load_async_link_css(url_prefix);
    page_viewer_load_async_scripts(url_prefix);
});
