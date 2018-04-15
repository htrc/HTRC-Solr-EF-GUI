//"use strict";

var solr_ef_url_prefix = "/assets/solr-ef/";

var solr_ef_async_link_css_urls = [
    //"assets/flat.css",
    //"assets/font-awesome.css",
    //"assets/tomorrow.css",

    "assets/jquery-ui-lightness-1.12.1/jquery-ui.min.css",

    "assets/paging.css",
    "dev/SolrEF.css",
    "dev/SolrEF-progressbar.css"
];

var solr_ef_async_script_urls = [ 
    "assets/highlight.js",
    "assets/stupidtable.js",

    "assets/bowser.js",
    "assets/download.min.js",
    "assets/lucene-query-parser.js",

    "assets/htrcwarnings.js",
    "assets/uploadws.js",

    "assets/paging.js",
    "dev/iso-639-1.js",
    "dev/lookup-vars.js",
    "dev/SolrEF-globals.js",
    "dev/SolrEF-settings.js",
    "dev/SolrEF-utils.js",
    "dev/SolrEF-authentication.js",
    "dev/SolrEF-iprogressbar.js",
    "dev/SolrEF-worksets.js",
    "dev/SolrEF-stream.js",
    "dev/SolrEF-explain.js",
    "dev/SolrEF-facet-filter.js",
    "dev/SolrEF-shoppingcart.js",
    "dev/SolrEF-query-breakdown.js",
    "dev/SolrEF.js",
    "dev/SolrEF-result-set.js"
 ];


function solr_ef_error(jqXHR, textStatus, errorThrown)
{
    
    if (errorThrown != "") {
	var mess = 'Network AJAX Error: An error occurred...<br />';
	mess += '  Status: ' + textStatus + '\n';
	mess += '  Error: ' + errorThrown + '\n';
	
	console.error(mess);
    }
    else {
	console.error("solr_ef_error(): Error occurred loading script")
    }
}

function solr_ef_load_async_link_css(url_prefix) 
{
    var react_component = $('#solr-ef-search-type').data("react-component");
    if (react_component) {
	solr_ef_async_link_css_urls.push("dev/SolrEF-jsx.css");
    }

    var num_links = solr_ef_async_link_css_urls.length;
    
    for (var i=0; i<num_links; i++) {
	
	var link_url = solr_ef_async_link_css_urls[i];
	var full_link_url = url_prefix+link_url;

	console.log("*** full link url = " + full_link_url);

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


function solr_ef_load_domready_scripts(url_prefix) {
    $.ajax({
	url: url_prefix+"dev/SolrEF-autocomplete.js",          
	dataType: "script",
	success: function() {			
	    $.ajax({
		url: url_prefix+"dev/SolrEF-dom-ready.js",          
		dataType: "script",
		success: function() {
		    console.log("**** finished loading scripts, away to show page");
		    $('#solr-ef-container-loading').hide();
		    $('#solr-ef-container-dynamic-load').show();
		    //$('#solr-ef-container-dynamic-load').show("slide", { direction: "up" }, 1000);
		},
		error: solr_ef_error
	    });
	},
	error: solr_ef_error
    });
}

function solr_ef_load_async_scripts(url_prefix) {

    var num_scripts = solr_ef_async_script_urls.length;
    var num_loaded_scripts = 0;
    
    for (var i=0; i<num_scripts; i++) {
	
	var script_url = solr_ef_async_script_urls[i];
	$.ajax({
	    url: url_prefix+script_url,
	    dataType: "script",
	    success: function() {
		num_loaded_scripts++;
		if (num_loaded_scripts == num_scripts) {
		    solr_ef_load_domready_scripts(url_prefix);
		}
	    },
	    error: solr_ef_error
        });
	
    }    
}

$(document).ready(function() {
    console.log("*** index-dev-jsx.js: on doc ready called");

    var react_component = $('#solr-ef-search-type').data("react-component");

    var url_prefix;
    if (react_component) {
	url_prefix = solr_ef_url_prefix;
    }
    else {
	url_prefix = document.location.pathname.replace(/\/[^\/]*$/,"\/");
    }
    console.log("*** index-dev-jsx domready(), url_prefix = " + url_prefix);

    solr_ef_load_async_link_css(url_prefix);
    solr_ef_load_async_scripts(url_prefix);
/*
    $("#solr-ef-container-dynamic-load").load("index-dev-body-dynamic-load.html", function() {
	solr_ef_load_async_scripts();
    });
*/
});
