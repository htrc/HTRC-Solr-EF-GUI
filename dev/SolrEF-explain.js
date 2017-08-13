
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
    a2a_html += '<div style="float:right;">\n';
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

function show_results_explain_html(query_level_mix,store_search_url)
{
    
    var explain_html = "<hr /><p>Search explanation: " + query_level_mix;
    if (explain_search.group_by_vol != null) {
	explain_html += "<br /> THEN " + explain_search.group_by_vol;
    }

    explain_html += '<br />\n';

    explain_html += add2any_html(store_search_url);

    explain_html += '<div style="float:left;">\n';
    explain_html += '  <button id="show-hide-solr-q">Show full query ...</button>\n';

    explain_html += '  <div class="show-hide-solr-q" style="display:none; padding: 5px; width: 650px;">' + store_search_args.q + '</div>\n';
    explain_html += "</div>\n";
    explain_html += "</p>\n";

    explain_html += '<p style="clear:both"></p>\n';

    return explain_html;
}

