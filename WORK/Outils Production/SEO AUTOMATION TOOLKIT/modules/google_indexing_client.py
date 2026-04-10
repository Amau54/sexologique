import os
import logging
from dotenv import load_dotenv
from google.oauth2 import service_account
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

def setup_logging():
    """Ensure log directory exists and configure logging."""
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(os.path.join(log_dir, "google_indexing.log")),
            logging.StreamHandler()
        ]
    )

setup_logging()

class GoogleIndexingClient:
    """
    A client to interact with the Google Indexing API.
    """
    def __init__(self, credentials_path: str = None):
        """
        Initializes the GoogleIndexingClient.

        Args:
            credentials_path (str, optional): Path to the Google service account JSON file.
                                              Defaults to env variable GOOGLE_APPLICATION_CREDENTIALS.
        """
        load_dotenv()
        self.credentials_path = credentials_path or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

        if not self.credentials_path:
            raise ValueError("Google application credentials path must be provided or set as an environment variable.")

        self.credentials = self._get_credentials()
        self.service = self._build_service()

    def _get_credentials(self):
        """Loads credentials from the service account file."""
        try:
            creds = service_account.Credentials.from_service_account_file(
                self.credentials_path,
                scopes=['https://www.googleapis.com/auth/indexing']
            )
            creds.refresh(Request())
            return creds
        except FileNotFoundError:
            logging.error(f"Credentials file not found at: {self.credentials_path}")
            raise
        except Exception as e:
            logging.error(f"Error loading credentials: {e}")
            raise

    def _build_service(self):
        """Builds the indexing service object."""
        try:
            return build('indexing', 'v3', credentials=self.credentials, cache_discovery=False)
        except Exception as e:
            logging.error(f"Failed to build Google API service: {e}")
            raise

    def submit_url(self, url: str, submission_type: str = 'URL_UPDATED') -> bool:
        """
        Submits a URL to the Google Indexing API.

        Args:
            url (str): The URL to submit.
            submission_type (str): The type of submission. Can be 'URL_UPDATED' or 'URL_DELETED'.

        Returns:
            bool: True if the submission was successful, False otherwise.
        """
        if submission_type not in ['URL_UPDATED', 'URL_DELETED']:
            logging.error(f"Invalid submission type: {submission_type}")
            return False

        content = {
            'url': url,
            'type': submission_type
        }

        try:
            response = self.service.urlNotifications().publish(body=content).execute()
            logging.info(f"Successfully submitted URL '{url}' to Google. Type: {submission_type}. Response: {response}")
            return True
        except HttpError as e:
            logging.error(f"Failed to submit URL '{url}' to Google. Error: {e.reason}")
            logging.error(f"Response Content: {e.content}")
            return False
        except Exception as e:
            logging.error(f"An unexpected error occurred while submitting URL '{url}': {e}")
            return False

if __name__ == '__main__':
    print("Running GoogleIndexingClient example...")
    load_dotenv()
    credentials_file = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

    if not credentials_file:
        print("\nPlease set GOOGLE_APPLICATION_CREDENTIALS in a .env file to run this example.")
        # Create a dummy credentials file for the example if it doesn't exist
        if not os.path.exists('google-credentials.json.example'):
            with open('google-credentials.json.example', 'w') as f:
                f.write('{\n')
                f.write('  "type": "service_account",\n')
                f.write('  "project_id": "your-gcp-project-id",\n')
                f.write('  "private_key_id": "...",\n')
                f.write('  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",\n')
                f.write('  "client_email": "your-service-account-email@your-project-id.iam.gserviceaccount.com",\n')
                f.write('  "client_id": "...",\n')
                f.write('  "auth_uri": "https://accounts.google.com/o/oauth2/auth",\n')
                f.write('  "token_uri": "https://oauth2.googleapis.com/token",\n')
                f.write('  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",\n')
                f.write('  "client_x509_cert_url": "..."\n')
                f.write('}\n')
        print("A 'google-credentials.json.example' file has been created. Please replace it with your actual credentials and rename it.")
    else:
        try:
            site_url = os.getenv("SITE_URL", "https://your-website.com")
            client = GoogleIndexingClient(credentials_path=credentials_file)
            
            # Example submission
            test_url = f"{site_url}/a-newly-published-page"
            print(f"\nAttempting to submit URL: {test_url}")
            success = client.submit_url(test_url, 'URL_UPDATED')

            if success:
                print("\nSubmission successful!")
            else:
                print("\nSubmission failed. Check logs/google_indexing.log for details.")
        except Exception as e:
            print(f"\nAn error occurred during the example run: {e}")
            print("This is expected if your credentials file is not valid or does not have permissions.")

