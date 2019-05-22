#!/usr/bin/perl -w

BEGIN {
    push(@INC,".");
}

use batch;

# Example queries:
#   title_t:sherlock
#  ((volumetitle_txt:sherlock)) AND ((en_htrctokentext:violin))

    
my $exptname = $ARGV[0] || "testrun/trial";
my $data_tail = "-realtime-data-wramp.csv";

my $exptdir = undef;
if ($exptname =~ m@^(.+)/(.*?)$@) {
    $exptdir = $1;
    if ($2 eq "") {
	$exptname = "$exptdir/trial";
    }
    
    if (! -e $exptdir) {
	print "Creating directory: $exptdir\n";
	mkdir($exptdir);
    }
}


my $en_word_freq = batch::read_in_word_frequencies("en-word-freq-top-10000.txt");
#my $de_word_freq = batch::read_in_word_frequencies_2col("de-word-freq-top-5000.txt");

my $en_rand_query_slice2000 = batch::generate_slice($en_word_freq,2000,"en");
my $en_text_slice2000_data_file = "$exptname-randSlice2000-en-$data_tail";
batch::jumpstart_wramp_batch_test($en_text_slice2000_data_file,30,50,10,$en_rand_query_slice2000);


if (defined $exptdir) {
    print "Now move 'json-output' into your '$exptdir' area:\n\n";
    print "  mv json-output $exptdir/.\n\n";
}
