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
	    print $TOUT "$batch_no;$query;$total_secs\n";
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
    my ($realtime_data_file,$num_forks,$step_size,$query_array) = @_;

    print "Saving realtime data output to: $realtime_data_file\n";

    open(TOUT,">$realtime_data_file")
	|| die "Failed to open '$realtime_data_file' for output: $!\n";

    print TOUT "Batch;Query;Realtime\n";

    for (my $batch_no=1; $batch_no<=$num_forks; $batch_no+=$step_size) {

	print "Batch Number: $batch_no\n";
	for (my $i=0; $i<$batch_no; $i++) {	    
	    my $pid = fork();
	    die "fork failed: $!" unless defined $pid;
	    
	    if ($pid == 0) {
		my $query = $query_array->[rand @$query_array];
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


sub read_in_word_frequencies
{
    my ($in_filename) = @_;

    open(WIN, "<$in_filename")
	|| die "Failed to open file '$in_filename': $!";

    while (defined(my $line = <WIN>)) {
	chomp($line);
	my ($word) = ($line =~ m/\d+\t(.+)\t\d+/);
	push(@$word_freq,$word)
    }

    close(WIN);

    return $word_freq;
}

sub generate_slice
{
    my ($word_freq,$slice_no) = @_;

    my $slice_start = $slice_no;
    my $slice_end = $slice_no + 999;

    #my @rand_query_slice = @{$word_freq->[$slice_no..$slice_end]};
    my @rand_query_slice = ();
    for (my $i=$slice_start; $i<=$slice_end; $i++) {
	my $word = $word_freq->[$i];
	
	# Make sure it is only letters (i.e. no punctuation)
	# before pushing on
	if ($word =~ m/^\w+$/) {
	    push(@rand_query_slice,$word);
	}
    }
    
    map { $_ = "en_htrctokentext:$_" }  @rand_query_slice;

#    foreach my $q (@rand_query_slice) {
#	print "$q\n";
#    }

    return \@rand_query_slice;
}

# Example queries:
#   title_t:sherlock
#  ((volumetitle_txt:sherlock)) AND ((en_htrctokentext:violin))

    
my $exptname = $ARGV[0] || "trial";
my $data_tail = "-realtime-data-wramp.csv";

my $word_freq = read_in_word_frequencies("en-word-freq-top-10000.txt");

#my $title_sherlock_data_file = "$exptname-titleSherlock-$data_tail";
#wramp_batch_test($title_sherlock_data_file,5,1,["title_t:sherlock"]);

#my $entext_violins_data_file = "$exptname-entextViolins-$data_tail";
#wramp_batch_test($entext_violins_data_file,10,1,["en_htrctokentext:violins"]);

#my $entext_violin_data_file = "$exptname-entextViolin-$data_tail";
#wramp_batch_test($entext_violin_data_file,10,1,["en_htrctokentext:violin"]);
 

my $rand_query_slice7000 = generate_slice($word_freq,7000);
my $entext_slice7000_data_file = "$exptname-randSlice7000-$data_tail";
wramp_batch_test($entext_slice7000_data_file,5,1,$rand_query_slice7000);

my $rand_query_slice5000 = generate_slice($word_freq,5000);
my $entext_slice5000_data_file = "$exptname-randSlice5000-$data_tail";
wramp_batch_test($entext_slice5000_data_file,10,1,$rand_query_slice5000);

my $rand_query_slice3000 = generate_slice($word_freq,3000);
my $entext_slice3000_data_file = "$exptname-randSlice3000-$data_tail";
wramp_batch_test($entext_slice3000_data_file,20,2,$rand_query_slice3000);
