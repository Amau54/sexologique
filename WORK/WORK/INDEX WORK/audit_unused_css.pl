#!/usr/bin/perl
use strict;
use warnings;

my $html_file = 'index.html';
my $css_file = 'style.css';

# 1. Read all unique classes from HTML file into a hash for quick lookup
my %html_classes;
{
    open(my $html_fh, '<', $html_file) or die "Could not open $html_file: $!";
    local $/; # slurp mode
    my $html_content = <$html_fh>;
    close($html_fh);
    
    while ($html_content =~ /class="([^"]+)"/g) {
        foreach my $class (split /\s+/, $1) {
            next if $class eq '';
            $html_classes{$class} = 1;
        }
    }
}

# 2. Process CSS file to get all defined classes
my %css_classes;
{
    open(my $css_fh, '<', $css_file) or die "Could not open $css_file: $!";
    local $/; # slurp mode
    my $css_content = <$css_fh>;
    close($css_fh);

    # This regex is designed to extract valid CSS selectors, ignoring anything
    # inside declaration blocks (`{...}`). It handles nested blocks and comments.
    while ($css_content =~ /([^{}\s][^{}]*?)\s*\{/g) {
        my $selector_group = $1;
        
        # A group can contain multiple selectors separated by commas
        foreach my $selector (split ',', $selector_group) {
            # Trim whitespace
            $selector =~ s/^\s+|\s+$//g;
            
            # Find all class names within the current selector
            while ($selector =~ /\.((?:\\.|[^.\[\s#:>~+,(\\])+|\[.*?\])/g) {
                my $class = $1;
                
                # Un-escape the selector to get the real class name
                $class =~ s/\\([a-fA-F0-9]{1,6})\s?/chr(hex($1))/ge;
                $class =~ s/\\(.)/$1/g;
                
                # Store the clean class name
                $css_classes{$class} = 1;
            }
        }
    }
}

# 3. Print the report for unused CSS classes
print "| Classe CSS | Présente dans le HTML | Détails |\n";
print "|---|---|---|\n";

foreach my $class (sort keys %css_classes) {
    unless (exists $html_classes{$class}) {
        print "| .$class | ❌ Non | Non utilisée |\n";
    }
}
