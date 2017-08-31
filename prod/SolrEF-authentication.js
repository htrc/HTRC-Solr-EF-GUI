function solr_ef_login()
{
    htrc_login({
	"Sign In" : function() {

	    var $iframe_contents = $('#loginFrame').contents();
	    var username = $iframe_contents.find('#username').val();
	    var password = $iframe_contents.find('#password').val();

	    if ((username != "")  && (password != "")) {
		$iframe_contents.find("#error-message").hide();
		$(this).dialog("close");
	    }
	    else {
		$iframe_contents.find("#error-message").show();
	    }
	},
	"Cancel"  : function() {
	    $(this).dialog("close");
	}

    });
    
}
