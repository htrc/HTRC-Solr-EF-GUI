function htrc_alert(message)
{
    var curr_alert_mess = $('#htrc-alert-body').html()
    if (curr_alert_mess != "") {
	var appended_message = curr_alert_mess + "\n<hr />\n" + message;
	$('#htrc-alert-body').html(appended_message);
    }
    else {

    }

    $('#htrc-alert-body').html(message);
    
    $("#htrc-alert-dialog").dialog({
	modal: true,
        buttons : {
	    "OK" : function() {
		$('#htrc-alert-body').html("");
		$(this).dialog("close");
	    }
	},
	close: function() {
	    $('#htrc-alert-body').html("");
	}
    });
    
    $("#htrc-alert-dialog").dialog( "open" );
}

function htrc_confirm(message,confirm_callback,cancel_callback)
{
    if (!cancel_callback) {
    	cancel_callback = function() {
	    $('#htrc-alert-dialog').dialog("close");
	};
    }

    $('#htrc-alert-body').html(message)
    
    $("#htrc-alert-dialog").dialog({
	modal: true,
	buttons : {
	    "Confirm" : function() {
		$('#htrc-alert-body').html("");
		confirm_callback();
	    },
	    "Cancel" : function() {
		$('#htrc-alert-body').html("");
		cancel_callback();
	    }
	},
	close: function() {
	    $('#htrc-alert-body').html("");
	    $('.search-in-progress').css("cursor","auto");
	    $('.facet-search').removeClass("disabled-div");
	}
    });

    $("#htrc-alert-dialog").dialog( "open" );
}

function htrc_continue(message,continue_callback,cancel_callback)
{
    if (!cancel_callback) {
    	cancel_callback = function() {
	    $('#htrc-alert-dialog').dialog("close");
	    $('#htrc-alert-body').html("");
	};
    }
    
    $('#htrc-alert-body').html(message)
    
    $("#htrc-alert-dialog").dialog({
	modal: true,
	buttons : {
	    "Continue" : function() {
		$('#htrc-alert-dialog').dialog("close");
		$('#htrc-alert-body').html("");
		continue_callback()
	    },
	    "Cancel" : function() {
		cancel_callback();
	    }
	},
	close: function() {
	    $('#htrc-alert-body').html("");
	    $('.search-in-progress').css("cursor","auto");
	    $('.facet-search').removeClass("disabled-div");
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

