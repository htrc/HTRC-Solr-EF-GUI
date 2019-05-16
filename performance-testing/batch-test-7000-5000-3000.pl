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

#my $title_sherlock_data_file = "$exptname-titleSherlock-$data_tail";
#wramp_batch_test($title_sherlock_data_file,5,1,["title_t:sherlock"]);

#my $entext_violins_data_file = "$exptname-entextViolins-$data_tail";
#wramp_batch_test($entext_violins_data_file,10,1,["en_htrctokentext:violins"]);

#my $entext_violin_data_file = "$exptname-entextViolin-$data_tail";
#wramp_batch_test($entext_violin_data_file,10,1,["en_htrctokentext:violin"]);
 

my $rand_query_slice7000 = batch::generate_slice($word_freq,7000);
my $entext_slice7000_data_file = "$exptname-randSlice7000-$data_tail";
batch::wramp_batch_test($entext_slice7000_data_file,5,1,$rand_query_slice7000);

my $rand_query_slice5000 = batch::generate_slice($word_freq,5000);
my $entext_slice5000_data_file = "$exptname-randSlice5000-$data_tail";
batch::wramp_batch_test($entext_slice5000_data_file,10,1,$rand_query_slice5000);

my $rand_query_slice3000 = batch::generate_slice($word_freq,3000);
my $entext_slice3000_data_file = "$exptname-randSlice3000-$data_tail";
batch::wramp_batch_test($entext_slice3000_data_file,25,2,$rand_query_slice3000);

if (defined $exptdir) {
    print "Now move 'json-output' into your '$exptdir' area:\n\n";
    print "  mv json-output $exptdir/.\n\n";
}
