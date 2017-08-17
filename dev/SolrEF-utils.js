// Utils functions

function strtrim(s)
{
    return s.trim();
}

function htrc_alert(message)
{
    $('#htrc-alert-body').html(message)
    $("#htrc-alert-dialog").dialog( "open" );
}

function escape_solr_query(query)
{

    // consider adding in \, also? // ****
    var pattern = /([\!\*\+\-\=\<\>\&\|\(\)\[\]\{\}\^\~\?\:\\\/\"])/g;
    
    var escaped_query = query.replace(pattern, "\\$1");

    return escaped_query;
}



function ajax_error(jqXHR, textStatus, errorThrown)
{
    var mess = 'Network AJAX Error: An error occurred...<br /> ';
    mess += 'View the web console (F12 or Ctrl+Shift+I, Console tab) for more information!<br /><hr /><br />';
    mess += JSON.stringify(jqXHR.responseText);

    htrc_alert(mess);
    console.log('====');
    console.log('Network AJAX Error');
    console.log('====');
    console.log('textStatus:' + textStatus);
    console.log('errorThrown:' + errorThrown);
    console.log('Full jqXHR:' + JSON.stringify(jqXHR));

}

