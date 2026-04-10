import os
import logging
import requests
from dotenv import load_dotenv
from urllib.parse import urlparse

def setup_logging():
    """Ensure log directory exists and configure logging."""
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(os.path.join(log_dir, "indexnow.log")),
            logging.StreamHandler()
        ]
    )

setup_logging()

class IndexNowClient:
    """
    A client to interact with the IndexNow API for instant content indexing.
    """
    def __init__(self, api_key: str = None, site_url: str = None):
        """
        Initializes the IndexNowClient.

        Args:
            api_key (str, optional): The IndexNow API key. Defaults to env variable.
            site_url (str, optional): The base URL of the site. Defaults to env variable.
        """
        load_dotenv()
        self.api_key = api_key or os.getenv("INDEXNOW_API_KEY")
        self.site_url = site_url or os.getenv("SITE_URL")
        self.host = self._get_host(self.site_url)
        self.api_url = "https://api.indexnow.org/indexnow"

        if not self.api_key or not self.site_url:
            raise ValueError("API key and site URL must be provided or set as environment variables.")

    def _get_host(self, url: str) -> str:
        """Extracts the host from a URL."""
        if not url:
            return ""
        return urlparse(url).netloc

    def submit_urls(self, urls: list) -> bool:
        """
        Submits a list of URLs to the IndexNow API.

        Args:
            urls (list): A list of URL strings to submit.

        Returns:
            bool: True if the submission was successful, False otherwise.
        """
        if not urls:
            logging.warning("No URLs provided for submission.")
            return False

        payload = {
            "host": self.host,
            "key": self.api_key,
            "keyLocation": f"{self.site_url}/{self.api_key}.txt", # As per IndexNow best practices
            "urlList": urls
        }

        try:
            response = requests.post(self.api_url, json=payload, timeout=10)
            response.raise_for_status()  # Raises HTTPError for bad responses (4xx or 5xx)

            logging.info(f"Successfully submitted {len(urls)} URLs to IndexNow. Response: {response.status_code}")
            return True

        except requests.exceptions.RequestException as e:
            logging.error(f"Failed to submit URLs to IndexNow: {e}")
            if e.response:
                logging.error(f"Response Body: {e.response.text}")
            return False

    def submit_url(self, url: str) -> bool:
        """
        Submits a single URL to the IndexNow API.

        Args:
            url (str): The URL to submit.

        Returns:
            bool: True if the submission was successful, False otherwise.
        """
        return self.submit_urls([url])

if __name__ == '__main__':
    # This is an example of how to use the client.
    # Make sure to create a .env file with your credentials.
    print("Running IndexNowClient example...")

    # Load environment variables from a .env file
    load_dotenv()

    # Get credentials from environment
    api_key = os.getenv("INDEXNOW_API_KEY")
    site_url = os.getenv("SITE_URL")

    if not api_key or not site_url:
        print("\nPlease set INDEXNOW_API_KEY and SITE_URL in a .env file to run this example.")
        # Create a dummy .env if it doesn't exist for the example
        if not os.path.exists('.env'):
            with open('.env', 'w') as f:
                f.write('INDEXNOW_API_KEY="YOUR_API_KEY_HERE"\n')
                f.write('SITE_URL="https://your-website.com"\n')
    else:
        # Initialize the client
        client = IndexNowClient(api_key=api_key, site_url=site_url)

        # Example URLs to submit
        urls_to_submit = [
            f"{site_url}/",
            f"{site_url}/new-article-1",
            f"{site_url}/updated-product-page"
        ]

        # Submit the URLs
        success = client.submit_urls(urls_to_submit)

        if success:
            print("\nSubmission successful!")
        else:
            print("\nSubmission failed. Check logs/indexnow.log for details.")
