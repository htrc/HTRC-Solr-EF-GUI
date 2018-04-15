//"use strict";

var jsx_url_prefix = "/assets/solr-ef/";

var page_viewer_async_link_css_urls = [ 
    //"assets/flat.css", 
    //"assets/font-awesome.css", 
    //"assets/tomorrow.css", 

    "assets/jquery-ui-lightness-1.12.1/jquery-ui.min.css",
    "assets/paging.css",
    "dev/SolrEF.css",
    //"dev/SolrEF-jsx.css",
    "dev/SolrEF-progressbar.css",
    "assets/pager-icons.css"
];

var page_viewer_async_script_urls = [ 
    //"assets/highlight.js",
    //"assets/stupidtable.js",

    //"assets/bowser.js",
    //"assets/download.min.js",

    "assets/paging.js",
    "dev/iso-639-1.js",
    "dev/opennlp-lang-pos-mapping.js", // defines var 'universalPOSMapping'
    "dev/lookup-vars.js",
    "dev/SolrEF-settings.js",
    "dev/SolrEF-utils.js",
    "dev/SolrEF-authentication.js",
    "dev/SolrEF-iprogressbar.js",
    "dev/SolrEF-facet-filter.js"
];

function page_viewer_load_async_link_css(url_prefix) 
{
    var react_component = $('#json-page-viewer-type').data("react-component");
    if (react_component) {
	page_viewer_async_link_css_urls.push("dev/SolrEF-jsx.css");
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
	url: url_prefix+"dev/JsonEF-page-viewer.js",
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
    //console.log("*** json-page-viewer-dev-jsx.js: on doc ready called");

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
