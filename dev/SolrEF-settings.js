var solr_prefix_url = "//solr1.ischool.illinois.edu/solr/";
var solr_collection = "faceted-htrc-full-ef20";

var solr_search_action = solr_prefix_url+solr_collection+"/select";
var solr_stream_action = solr_prefix_url+solr_collection+"/stream";

var babel_prefix_url = "https://babel.hathitrust.org/cgi/pt";
var image_server_base_url = "https://babel.hathitrust.org/cgi/imgsrv/image";

//var ef_download_url  = "http://solr1.ischool.illinois.edu:8080/get";
var ef_download_url  = "https://solr1.ischool.illinois.edu/htrc-ef-access/get";

var workset_base_url = "https://solr1.ischool.illinois.edu/dcWSfetch/";

var num_found_page_limit_str = "700,000";
var num_found_vol_limit_str  = "100,000";
var num_found_page_limit = num_found_page_limit_str.replace(/,/g,"");
var num_found_vol_limit  = num_found_vol_limit_str.replace(/,/g,"");

var num_results_per_page = 15;
var num_found=0;

var arg_indent = "on";
var arg_wt     = "json";

var SolrEFSettings = {
    
    iprogressbar_delay_threshold: 5000 // 5 secs
}
