import os
import logging
import json
from urllib.parse import urlparse
from dotenv import load_dotenv
from modules.indexnow_client import IndexNowClient
from modules.google_indexing_client import GoogleIndexingClient
from modules.sitemap_generator import SitemapGenerator
from modules.metadata_generator import MetadataGenerator
import requests

def setup_logging():
    """Ensure log directory exists and configure logging for the orchestrator."""
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - ORCHESTRATOR - %(message)s',
        handlers=[
            logging.FileHandler(os.path.join(log_dir, "orchestrator.log")),
            logging.StreamHandler()
        ]
    )

setup_logging()

class SeoOrchestrator:
    def __init__(self, config_path='config.json'):
        load_dotenv()
        self.site_url = os.getenv("SITE_URL")
        if not self.site_url:
            logging.error("SITE_URL is not set in the .env file.")
            raise ValueError("SITE_URL must be set.")
        
        self.config = self._load_config(config_path)
        
        # Initialize clients
        try:
            self.indexnow_client = IndexNowClient()
            self.google_client = None
            if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
                self.google_client = GoogleIndexingClient()
            else:
                logging.warning("GOOGLE_APPLICATION_CREDENTIALS not set. Google Indexing will be skipped.")

            self.sitemap_generator = SitemapGenerator(output_dir='sitemaps')
            self.metadata_generator = MetadataGenerator()
        except Exception as e:
            logging.error(f"Failed to initialize clients: {e}")
            raise

    def _load_config(self, config_path):
        """Loads the JSON configuration file."""
        if not os.path.exists(config_path):
            logging.warning(f"Config file not found at '{config_path}'. Using default settings.")
            return {"sitemap_categories": []}
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            logging.error(f"Error decoding JSON from {config_path}: {e}")
            raise ValueError(f"Invalid JSON in config file: {config_path}")

    def _get_sitemap_category(self, url):
        """Determines the correct sitemap category for a given URL based on config."""
        path = urlparse(url).path
        # Iterate in reverse to match more specific paths first (e.g., /blog/ before /)
        for category in sorted(self.config.get('sitemap_categories', []), key=lambda x: x['path_contains'], reverse=True):
            if category['path_contains'] in path:
                return category
        return None # No matching category found

    def ping_services(self, services: list):
        """Pings a list of services to notify them of an update."""
        for service_url in services:
            try:
                response = requests.get(service_url, timeout=5)
                response.raise_for_status()
                logging.info(f"Successfully pinged {service_url}. Status: {response.status_code}")
            except requests.RequestException as e:
                logging.warning(f"Failed to ping {service_url}: {e}")

    def process_new_url(self, url_data: dict, article_data: dict, ping_services_list: list = None):
        """
        Orchestrates the full SEO process for a new URL.

        Args:
            url_data (dict): Data for the sitemap and submission (loc, lastmod, etc.).
            article_data (dict): Data for metadata generation (headline, author, etc.).
            ping_services_list (list, optional): A list of ping service URLs.
        """
        new_url = url_data.get("loc")
        if not new_url:
            logging.error("URL 'loc' is missing from url_data.")
            return

        logging.info(f"--- Starting SEO processing for new URL: {new_url} ---")

        # 1. Generate Metadata
        logging.info("Step 1: Generating metadata...")
        article_json_ld = self.metadata_generator.generate_json_ld("Article", article_data)
        og_tags = self.metadata_generator.generate_open_graph(article_data)
        twitter_tags = self.metadata_generator.generate_twitter_card(article_data)
        
        print("\n--- Generated JSON-LD ---")
        print(article_json_ld)
        print("\n--- Generated Open Graph Tags ---")
        print(og_tags)
        print("\n--- Generated Twitter Tags ---")
        print(twitter_tags)

        # 2. Submit to Indexing Services
        logging.info("\nStep 2: Submitting to indexing services...")
        self.indexnow_client.submit_url(new_url)
        
        if self.google_client:
            self.google_client.submit_url(new_url, 'URL_UPDATED')
        else:
            logging.info("Skipping Google submission as the client is not configured.")

        # 3. Update Sitemap
        logging.info("\nStep 3: Updating sitemap...")
        category = self._get_sitemap_category(new_url)
        if category:
            sitemap_file = category['sitemap_file']
            # Enhance url_data with category-specific info
            url_data.setdefault('changefreq', category.get('changefreq', 'monthly'))
            url_data.setdefault('priority', category.get('priority', 0.8))
            self.sitemap_generator.update_sitemap(url_data, sitemap_file)
            logging.info(f"URL added/updated in '{sitemap_file}'.")
        else:
            logging.warning(f"No sitemap category found for URL: {new_url}. Skipping sitemap update.")
        
        # 4. Ping Services
        if ping_services_list:
            logging.info("\nStep 4: Pinging external services...")
            self.ping_services(ping_services_list)

        logging.info(f"--- Finished SEO processing for {new_url} ---")


if __name__ == '__main__':
    print("Running SEO Orchestrator example...")
    load_dotenv() # Load variables before checking them
    
    # This requires a .env file with SITE_URL and INDEXNOW_API_KEY
    # GOOGLE_APPLICATION_CREDENTIALS is optional
    if not os.path.exists('.env') or not os.getenv('SITE_URL') or not os.getenv('INDEXNOW_API_KEY'):
        print("\nPlease create a .env file with SITE_URL and INDEXNOW_API_KEY to run this example.")
        # Create a dummy .env if needed
        if not os.path.exists('.env'):
             with open('.env', 'w') as f:
                f.write('SITE_URL="https://your-website.com"\n')
                f.write('INDEXNOW_API_KEY="YOUR_API_KEY"\n')
                f.write('# GOOGLE_APPLICATION_CREDENTIALS="path/to/your/credentials.json"\n')
    else:
        try:
            orchestrator = SeoOrchestrator()

            # --- Process a Blog Post ---
            print("\n" + "="*30)
            print("--- PROCESSING BLOG POST ---")
            print("="*30)
            
            sitemap_entry_1 = {
                "loc": f"{orchestrator.site_url}/blog/my-awesome-post",
                "lastmod": "2024-05-20"
            }
            metadata_1 = {"headline": "Awesome Post Title"}
            orchestrator.process_new_url(sitemap_entry_1, metadata_1)

            # --- Process a Static Page ---
            print("\n" + "="*30)
            print("--- PROCESSING STATIC PAGE ---")
            print("="*30)
            
            sitemap_entry_2 = {
                "loc": f"{orchestrator.site_url}/about-us",
                "lastmod": "2024-01-01"
            }
            metadata_2 = {"headline": "About Our Company"}
            orchestrator.process_new_url(sitemap_entry_2, metadata_2)
            
            print(f"\n" + "="*30)
            print(f"--- VERIFICATION ---")
            print(f"Check the 'sitemaps/' directory.")
            print(f"'articles_sitemap.xml' should contain the blog post.")
            print(f"'pages_sitemap.xml' should contain the about-us page.")
            print(f"="*30)

        except ValueError as e:
            print(f"\nError during orchestration: {e}")
        except Exception as e:
            print(f"\nAn unexpected error occurred: {e}")
            print("This can happen if API keys are invalid or services are unreachable.")
