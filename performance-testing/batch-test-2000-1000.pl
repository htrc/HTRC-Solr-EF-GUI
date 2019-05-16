#!/usr/bin/perl -w

use batch;

# Example queries:
#   title_t:sherlock
#  ((volumetitle_txt:sherlock)) AND ((en_htrctokentext:violin))

    
my $exptname = $ARGV[0] || "trial";
my $data_tail = "-realtime-data-wramp.csv";

my $exptdir = undef;
if ($exptname =~ m@^(.*)/@) {
    $exptdir = $1;

    if (! -e $exptdir) {
	print "Creating directory: $exptdir\n";
	mkdir($exptdir);
    }
}


my $word_freq = batch::read_in_word_frequencies("en-word-freq-top-10000.txt");
#my $de_word_freq = batch::read_in_word_frequencies_2col("de-word-freq-top-5000.txt");

my $rand_query_slice2000 = batch::generate_slice($word_freq,2000);
my $entext_slice2000_data_file = "$exptname-randSlice2000-$data_tail";
batch::wramp_batch_test($entext_slice2000_data_file,30,2,$rand_query_slice2000);

my $rand_query_slice1000 = batch::generate_slice($word_freq,1000);
my $entext_slice1000_data_file = "$exptname-randSlice1000-$data_tail";
batch::wramp_batch_test($entext_slice1000_data_file,30,2,$rand_query_slice1000);


if (defined $exptdir) {
    print "Now move 'json-output' into your '$exptdir' area:\n\n";
    print "  mv json-output $exptdir/.\n\n";
}
