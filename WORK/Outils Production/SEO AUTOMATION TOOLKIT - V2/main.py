import argparse
import sys
from urllib.parse import urlparse

def is_valid_url(url):
    """Checks if a string is a valid URL."""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except AttributeError:
        return False

from core.orchestrator import SeoOrchestrator
from datetime import datetime

def handle_submit(args):
    """Handler for the 'submit' command."""
    print(f"Submitting URL: {args.url}")
    if not is_valid_url(args.url):
        print("Error: Please provide a valid URL (e.g., http://example.com/page).")
        sys.exit(1)
    
    try:
        orchestrator = SeoOrchestrator()
        
        # Prepare data for the orchestrator
        sitemap_data = {
            "loc": args.url,
            "lastmod": datetime.now().strftime('%Y-%m-%d')
        }
        # For CLI usage, metadata would likely be fetched from a CMS or DB,
        # but here we'll use a simple placeholder.
        metadata = {
            "headline": f"Data for {args.url}",
            "title": f"Title for {args.url}"
        }

        orchestrator.process_new_url(sitemap_data, metadata)
        print("\\n" + "="*30)
        print("✅ URL processing completed successfully!")
        print("="*30)

    except Exception as e:
        print(f"\\n" + "="*30)
        print(f"❌ An error occurred: {e}")
        print("="*30)
        sys.exit(1)

def handle_submit_bulk(args):
    """Handler for the 'submit-bulk' command."""
    print(f"Starting bulk submission from file: {args.file}")
    
    try:
        with open(args.file, 'r') as f:
            urls = [line.strip() for line in f if line.strip() and is_valid_url(line.strip())]
        
        if not urls:
            print("No valid URLs found in the file.")
            sys.exit(1)

        orchestrator = SeoOrchestrator()
        total_urls = len(urls)
        success_count = 0

        for i, url in enumerate(urls):
            print(f"\\n[{i+1}/{total_urls}] Processing: {url}")
            try:
                sitemap_data = {
                    "loc": url,
                    "lastmod": datetime.now().strftime('%Y-%m-%d')
                }
                metadata = {
                    "headline": f"Data for {url}",
                    "title": f"Title for {url}"
                }
                orchestrator.process_new_url(sitemap_data, metadata)
                success_count += 1
            except Exception as e:
                print(f"  └── ❌ Error processing URL {url}: {e}")

        print("\\n" + "="*30)
        print("✅ Bulk processing completed!")
        print(f"Successfully processed: {success_count}/{total_urls}")
        print("="*30)

    except FileNotFoundError:
        print(f"Error: The file '{args.file}' was not found.")
        sys.exit(1)
    except Exception as e:
        print(f"\\nAn unexpected error occurred during bulk processing: {e}")
        sys.exit(1)


def main():
    """Main function to run the CLI."""
    parser = argparse.ArgumentParser(
        description="SEO Automation Toolkit CLI",
        formatter_class=argparse.RawTextHelpFormatter
    )
    subparsers = parser.add_subparsers(dest='command', required=True, help='Available commands')

    # --- Submit Command ---
    parser_submit = subparsers.add_parser(
        'submit', 
        help='Submit a single URL for indexing and sitemap update.',
        description='Takes a single URL, submits it to indexing services, and updates the relevant sitemap.'
    )
    parser_submit.add_argument('url', type=str, help='The full URL to process.')
    parser_submit.set_defaults(func=handle_submit)

    # --- Submit-Bulk Command ---
    parser_bulk = subparsers.add_parser(
        'submit-bulk', 
        help='Submit multiple URLs from a file.',
        description='Reads a text file containing one URL per line and processes each of them.'
    )
    parser_bulk.add_argument('file', type=str, help='The path to the text file containing URLs.')
    parser_bulk.set_defaults(func=handle_submit_bulk)

    if len(sys.argv) == 1:
        parser.print_help(sys.stderr)
        sys.exit(1)

    args = parser.parse_args()
    args.func(args)

if __name__ == '__main__':
    main()
