// Utils functions

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function strtrim(s)
{
    return s.trim();
}

function getURLParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');

    for (var i=0; i<sURLVariables.length; i++) {
	var sParameterName = sURLVariables[i].split('=');
	if (sParameterName[0] == sParam)
	{
	    return sParameterName[1];
	}
    }

    return null;
}

function getXSessionId()
{
    var xsId = document.cookie.match(/XSESSIONID=[^;]+/);

    if (xsId != null) {
	if (xsId instanceof Array)
	    xsId = xsId[0].substring(11);
	else
	    xsId = xsId.substring(11);
    }
    return xsId;
}

function getSelectedText()
{
    // retrieve highlighted text the user has selected
    // return empty string if none present
    
    var text = "";

    if (window.getSelection) {
	text = window.getSelection().toString();
    }
    else if (document.selection && document.selection.type != "Control") {
	text = document.selection.createRange().text;
    }

    return text;
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

