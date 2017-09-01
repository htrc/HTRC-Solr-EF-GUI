
var explain_search = { 'group_by_vol': null,
		       'volume_level_terms': null, 'volume_level_desc': null,
		       'page_level_terms': null, 'page_level_desc': null };

function add2any_html(store_search_url)
{
    //var a2a_config = a2a_config || {};
    //a2a_config.linkname = "HathiTrust Research Center (HTRC) Extracted Feature Search";
    //var base_url = location.protocol + '//' + location.host + location.pathname;
    // //a2a_config.linkurl = base_url + "?pub-name=" + published_id.replace(/ /g,"+");
    //a2a_config.linkurl = store_search_url;

    var data_a2a = "";
    data_a2a += 'data-a2a-url="'+store_search_url+'"';
    data_a2a += ' data-a2a-title="HathiTrust Research Center (HTRC) Extracted Feature Search"';
    
    var a2a_html = "";
    a2a_html += '<div class="no-user-select" style="float:right;">\n';
    a2a_html += '  <div class="a2a_kit a2a_kit_size_32 a2a_default_style"' + data_a2a + '>\n';
    a2a_html += '    <a class="a2a_button_email"></a>\n';
    a2a_html += '    <a class="a2a_button_facebook"></a>\n';
    a2a_html += '    <a class="a2a_button_google_plus"></a>\n';
    //a2a_html += '  <a class="a2a_button_twitter"></a>\n';
    a2a_html += '    <a class="a2a_dd" href="https://www.addtoany.com/share"></a>\n';
    //a2a_html += '  <a class="a2a_dd" href="https://www.addtoany.com/share_save"></a>\n';
    a2a_html += '  </div>\n';
    a2a_html += '</div>\n';
    a2a_html += '\n';
    a2a_html += '<script type="text/javascript" src="//static.addtoany.com/menu/page.js"></script>\n';

    return a2a_html;
}

function filter_fq_args(filters)
{
    var fq_args = [];
    
    for (var filter_key_pair in filters) {
	var fkp_split = filters[filter_key_pair].split("--");
	var filter_field = fkp_split[0];
	var filter_term = fkp_split[1];
	filter_term = escape_solr_query(filter_term);
	
	var or_terms = filter_term.split(" OR ");
	var quoted_or_terms = or_terms.map(function(v) { return '"'+v+'"'; });
	var quoted_or_terms_str = quoted_or_terms.join(" OR ");
	
	fq_args.push(filter_field + ':(' + quoted_or_terms_str + ')');
    }

    return fq_args;
    
}

function show_results_explain_html(query_level_mix,store_search_url)
{
    
    var explain_html = "<hr /><p>Search explanation: " + query_level_mix;
    if (explain_search.group_by_vol != null) {
	explain_html += "<br /> THEN " + explain_search.group_by_vol;
    }
    
    explain_html += '<br />\n';

    explain_html += add2any_html(store_search_url);    

    var raw_query = store_search_args.q;
    var fq_args = filter_fq_args(facet_filter.filters);
    if (fq_args.length>0) {
	//raw_query += '<hr title="facet filters below" style="height: 5px; padding: 0px 50px 0px 50px;"/>';
	raw_query += '<br /><span class="no-user-select">Facet filters:</span>';
	raw_query += " AND (" + fq_args.join(" AND ") + ")";
    }
    if (store_search_not_ids.length>0) {
	raw_query += '<br /><span class="no-user-select">Excluded IDs:</span>';
	raw_query += store_search_not_ids.join(" ");
    }
    
    explain_html += '<div style="float:left;">\n';
    explain_html += '  <button id="show-hide-solr-q">Show full query ...</button>\n';

    explain_html += '  <div class="show-hide-solr-q" style="display:none; padding: 5px; width: 650px;">' + raw_query + '</div>\n';
    explain_html += "</div>\n";
    explain_html += "</p>\n";

    explain_html += '<p style="clear:both"></p>\n';

    return explain_html;
}

