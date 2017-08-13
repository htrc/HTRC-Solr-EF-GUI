// Utils functions

function htrc_alert(message)
{
    $('#htrc-alert-body').html(message)
    $("#htrc-alert-dialog").dialog( "open" );
}

function escape_solr_query(query)
{

    var pattern = /([\!\*\+\-\=\<\>\&\|\(\)\[\]\{\}\^\~\?\:\\\/\"])/g;
    
    var escaped_query = query.replace(pattern, "\\$1");

    return escaped_query;
}



function ajax_error(jqXHR, textStatus, errorThrown) {
    htrc_alert('ajax_error: An error occurred... Look at the console (F12 or Ctrl+Shift+I, Console tab) for more information!<br />====<br />' + JSON.stringify(jqXHR.responseText.error));

    console.log('textStatus:' + textStatus);
    console.log('errorThrown:' + errorThrown);
    console.log('Full jqXHR:' + JSON.stringify(jqXHR));

}

