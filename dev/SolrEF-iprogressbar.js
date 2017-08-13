// Indeterminante Progressbar

function IndeterminateProgressbar(wrapper_id,label_id,progressbar_id) {
    this.wrapper_id     = wrapper_id;
    this.label_id       = label_id;
    this.progressbar_id = progressbar_id;
    
    this.timeout_id = null;
}

IndeterminateProgressbar.prototype.display = function()
{
    this.timeout_id = null;

    // For display purposes, determine how many terms in query
    var count_terms = (store_search_args.q.match(/:/g) || []).length;

    if (count_terms>1) {
	$('#'+this.label_id).html("for " + count_terms + " fields/terms");
    }
    else {
	$('#'+this.label_id).html("");
    }
    
    $('#'+this.wrapper_id).show("slide", { direction: "up" }, 1000);
}


IndeterminateProgressbar.prototype.cancel = function()
{
    if (this.timeout_id != null) {
	window.clearTimeout(this.timeout_id);
	this.timeout_id = null;
    }
    $('#'+this.wrapper_id).hide("slide", { direction: "up" }, 1000);
}


IndeterminateProgressbar.prototype.trigger_delayed_display = function(delay)
{
    var that = this;
    this.timeout_id = window.setTimeout(function() { that.display() },delay);
}

var iprogressbar = new IndeterminateProgressbar('search-indeterminate-div',
						'search-indeterminate-label',
						'search-progressbar-indeterminate');


$(document).ready(function(){
    //$("#search-progressbar-indeterminate" ).progressbar({ value: false });
    $('#'+iprogressbar.progressbar_id).progressbar({ value: false });
});
