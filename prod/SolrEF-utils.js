// Utils functions

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function strtrim(s)
{
    return s.trim();
}

function htrc_alert(message)
{
    $('#htrc-alert-body').html(message)

    $("#htrc-alert-dialog").dialog({
        buttons : {
	    "OK" : function() {
		$(this).dialog("close");
	    }
	}
    });
    
    $("#htrc-alert-dialog").dialog( "open" );
}

function htrc_confirm(message,confirm_callback,cancel_callback)
{
    $('#htrc-alert-body').html(message)
    
    $("#htrc-alert-dialog").dialog({
	buttons : {
	    "Confirm" : confirm_callback,
	    "Cancel" : cancel_callback
	}
    });

    $("#htrc-alert-dialog").dialog( "open" );
}

function htrc_login(buttons)
{

    var message='<iframe id="loginFrame" src="flogin.html" width="100%" height="500" frameBorder="0" style="padding: 0px;" >Browser not compatible.</iframe>';
    $('#htrc-login-body').html(message);
	
    $("#htrc-login-dialog").dialog({ buttons : buttons });
    
    $("#htrc-login-dialog").dialog( "open" );
}


function escape_solr_query(query)
{

    // consider adding in \, also? // ****
    var pattern = /([\,\!\*\+\-\=\<\>\&\|\(\)\[\]\{\}\^\~\?\:\\\/\"])/g;
    
    var escaped_query = query.replace(pattern, "\\$1");

    return escaped_query;
}



function ajax_error(jqXHR, textStatus, errorThrown)
{
    
    if (errorThrown != "") {
	var mess = 'Network AJAX Error: An error occurred...<br />';
	mess += '<pre>';
	mess += '  Status: ' + textStatus + '\n';
	mess += '  Error: ' + errorThrown + '\n';
	mess += '</pre>';
	mess += '<hr />View the web console (F12 or Ctrl+Shift+I, Console tab) for more information.';

	htrc_alert(mess);
    }
    
    console.log('====');
    console.log('Detected Network AJAX Error/Abort');
    console.log('====');
    console.log('textStatus:' + textStatus);
    console.log('errorThrown:' + errorThrown);
    console.log('responseText:' + jqXHR.responseText);
    console.log('Full jqXHR:' + JSON.stringify(jqXHR));

}
