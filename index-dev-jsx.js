//"use strict";

var script_prefix = "assets/solr-ef/";

var async_script_urls = [ 
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

function load_domready_scripts() {
    $.ajax({
	url: script_prefix+"dev/SolrEF-autocomplete.js",          
	dataType: "script",
	success: function() {			
	    $.ajax({
		url: script_prefix+"dev/SolrEF-dom-ready.js",          
		dataType: "script",
		success: function() {
		    $('#solr-ef-container-loading').hide();
		    $('#solr-ef-container-dynamic-load').show();
		    //$('#solr-ef-container-dynamic-load').show("slide", { direction: "up" }, 1000);
		}
	    });
	}
    });
}

function load_async_scripts() {

    var num_scripts = async_script_urls.length;
    var num_loaded_scripts = 0;
    
    for (var i=0; i<num_scripts; i++) {
	
	var script_url = async_script_urls[i];
	$.ajax({
	    url: script_prefix+script_url,
	    dataType: "script",
	    success: function() {
		num_loaded_scripts++;
		if (num_loaded_scripts == num_scripts) {
		    load_domready_scripts();
		}
	    }
        });
	
    }    
}

$(document).ready(function() {
    console.log("*** index-dev-jsx.js: on doc ready called");
    load_async_scripts();
/*
    $("#solr-ef-container-dynamic-load").load("index-dev-body-dynamic-load.html", function() {
	load_async_scripts();
    });
*/
});
