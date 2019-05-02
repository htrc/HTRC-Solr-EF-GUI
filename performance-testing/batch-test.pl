#!/usr/bin/perl -w

use Fcntl qw(:flock SEEK_END);

sub lock {
    my ($fh) = @_;
    flock($fh, LOCK_EX) or die "Cannot lock mailbox - $!\n";
    # and, in case someone appended while we were waiting...
    seek($fh, 0, SEEK_END) or die "Cannot seek - $!\n";
}

sub unlock {
    my ($fh) = @_;
    flock($fh, LOCK_UN) or die "Cannot unlock mailbox - $!\n";
}
    
sub run_query
{
    my ($TOUT,$batch_no,$query) = @_;

    print "Process $$: Processing '$query'\n";
    
    my $cmd = "./timed-solr-q.sh '$query' 2>&1";
    
    open(PIN, "$cmd |")
	|| die "Failed to run command, $cmd: $!";

    my $num_real_time_matches = 0;

    my $output = "";
    while (defined(my $line = <PIN>)) {
	$output .= $line;

	if ($line =~ m/^real\s+(\d+)m(\d+\.\d+)s$/) {
	    my $min = $1;
	    my $sec = $2;

	    my $total_secs = $min * 60 + $sec;
	    lock($TOUT);		
	    print $TOUT "$batch_no,$total_secs\n";
	    unlock($TOUT);
	    $num_real_time_matches++;
	}	    
    }
    close(PIN);
	
    if ($num_real_time_matches != 1) {
	if ($num_real_time_matches == 0) {
	    print STDERR "Warning: Failed to file real-time value for command\n";
	}
	else {
	    print STDERR "Warning: Found too many real-time values for command\n";
	}
	print STDERR "  $cmd\n";
	print STDERR "Output was:\n$output\n";
    }
}




sub wramp_batch_test
{
    my ($realtime_data_file,$num_forks,$query) = @_;

    print "Saving realtime data output to: $realtime_data_file\n";

    open(TOUT,">$realtime_data_file")
	|| die "Failed to open '$realtime_data_file' for output: $!\n";

    print TOUT "Batch,Realtime\n";

    for (my $batch_no=1; $batch_no<=$num_forks; $batch_no++) {

	for (my $i=0; $i<$batch_no; $i++) {	    
	    my $pid = fork();
	    die "fork failed: $!" unless defined $pid;
	    
	    if ($pid == 0) {
		run_query(TOUT,$batch_no,$query);
		close(TOUT);
		exit;
	    }
	}

	1 while (wait() != -1);
    }


    # print "All done!\n";
    close(TOUT);

    
}

# Example queries:
#   title_t:sherlock
#  ((volumetitle_txt:sherlock)) AND ((en_htrctokentext:violin))

    
my $exptname = $ARGV[0] || "trial";
my $data_tail = "-realtime-data-wramp.csv";

my $title_sherlock_data_file = "$exptname-titlesherlock-$data_tail";
wramp_batch_test($title_sherlock_data_file,5,"title_t:sherlock");

my $entext_violins_data_file = "$exptname-entextviolins-$data_tail";
wramp_batch_test($entext_violins_data_file,5,"en_htrctokentext:violin");
 


