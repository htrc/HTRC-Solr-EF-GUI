#!/bin/perl -w

sub foo
{
    my ($css) = @_;

    my @css_terms = split(/\s*;\s*/,$css);

    my @jsx_terms = ();

    foreach my $ct (@css_terms) {
	if ($ct =~ m/^\s*$/) {
	    next;
	}
	$ct =~ s/-(.)/\U$1/g;
	$ct =~ s/:\s*(.*)\s*$/:'$1'/g;

	push(@jsx_terms,$ct);
    }

    my $jsx = join(",",@jsx_terms);

    return "style=\{\{$jsx\}\}";
}

my $line;

foreach $line ( <STDIN> ) {
    chomp($line);
    
    $line =~ s/style="([^"]*)"/foo($1)/ge;
    print "$line\n";
}
