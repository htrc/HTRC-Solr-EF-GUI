// Utils functions

String.prototype.capitalize = function()
{
    return this.charAt(0).toUpperCase() + this.slice(1);
}

function escapeRegExp(string)
{
    // https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
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

function setURLParameter(sParam,sVal)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');

    for (var i=0; i<sURLVariables.length; i++) {
	var sParameterName = sURLVariables[i].split('=');
	if (sParameterName[0] == sParam)
	{
	    sURLVariables[i]=sParameterName[0]+'='+sVal;
	}
    }

    window.location.search = '?' + sURLVariables.join('&');
}

// From: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function uuidv4()
{
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getShoppingcartId()
{
    // First look to see if there is a logged in username that can be used
    var shoppingcart_id = null;

    if (typeof(Storage) !== "undefined") {

	shoppingcart_id = sessionStorage.getItem("shoppingcart-id");
	var username = sessionStorage.getItem("htrc-username");

	if ((shoppingcart_id != null) && (username != null) && (!shoppingcart_id.match(/^shoppingcart-username-/))) {
	    // Trigger upgrade  // ******
	    shoppingcart_id = shoppingcart_id.replace(/^shoppingcart-([^-]+)-(.*)$/,"shoppingcart-username-"+username);
	}
	
	if (shoppingcart_id == null) {
	    // See if it can be based around a logged in username
	    if (username != null) {
		shoppingcart_id = "shoppingcart-username-"+username;
	    }
	}
    }

    if (shoppingcart_id == null) {
	var xsid = document.cookie.match(/XSESSIONID=[^;]+/);

	if (xsid != null) {
	    if (xsid instanceof Array) {
		xsid = xsid[0].substring(11);
	    }
	    else {
		xsid = xsid.substring(11);
	    }
	    shoppingcart_id = "session-xsid-" + xsid;
	}
	else {
	    shoppingcart_id = "session-rnd-"+uuidv4(); // probably running local server spawned from Eclipse
	}
    }

    if (typeof(Storage) !== "undefined") {	
	sessionStorage.setItem("shoppingcart-id",shoppingcart_id);
    }
    
    return shoppingcart_id;
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
	},
	close: function() { $('.search-in-progress').css("cursor","auto"); }
    });

    $("#htrc-alert-dialog").dialog( "open" );
}

function htrc_continue(message,continue_callback,cancel_callback)
{
    $('#htrc-alert-body').html(message)
    
    $("#htrc-alert-dialog").dialog({
	buttons : {
	    "Continue" : continue_callback,
	    "Cancel" : cancel_callback
	},
	close: function() { $('.search-in-progress').css("cursor","auto"); }
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



function ajax_error_console(jqXHR, textStatus, errorThrown)
{        
    console.log('====');
    console.log('Detected Network AJAX Error/Abort');
    console.log('====');
    console.log('textStatus:' + textStatus);
    console.log('errorThrown:' + errorThrown);
    console.log('responseText:' + jqXHR.responseText);
    console.log('Full jqXHR:' + JSON.stringify(jqXHR));

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

    ajax_error_console(jqXHR, textStatus, errorThrown);
}

function load_async_scripts(async_script_urls, on_complete_callback) {

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
		    on_complete_callback();
		}
	    },
	    error: ajax_error
        });
	
    }    
}
