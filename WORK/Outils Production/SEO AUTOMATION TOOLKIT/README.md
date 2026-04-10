# SEO Automation Toolkit

This is a comprehensive automation tool for technical SEO, designed to maximize visibility and eliminate manual indexing delays.

## Features

- **Automatic Indexing:** Instantly submits new URLs to Google (via Indexing API) and Bing/Seznam (via IndexNow protocol).
- **Dynamic Sitemaps:** Generates and updates XML sitemaps automatically, with support for image tags and category separation.
- **Structured Data:** Automatically creates JSON-LD for Schema.org types like `Organization`, `Article`, and `LocalBusiness`.
- **Social Graph:** Generates Open Graph (Facebook) and Twitter Card meta tags for optimal social sharing.
- **Content Discovery:** Pings content aggregators to notify them of new updates.
- **Modular & Configurable:** Built with a modular structure and uses environment variables for easy configuration.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```

2.  **Install dependencies:**
    Make sure you have Python 3.8+ installed. Then, install the required packages using `pip`.
    ```bash
    pip install -r requirements.txt
    ```

## Configuration

This tool uses a `.env` file to manage API keys and other settings.

1.  **Create a `.env` file:**
    Copy the example file:
    ```bash
    cp .env.example .env
    ```

2.  **Edit the `.env` file:**
    Open the `.env` file and fill in your details:

    -   `SITE_URL`: Your full website URL (e.g., `https://www.example.com`).
    -   `INDEXNOW_API_KEY`: Your API key for the IndexNow protocol.
    -   `GOOGLE_APPLICATION_CREDENTIALS`: The absolute path to your Google Cloud service account JSON file (this is required for the Google Indexing API).

## Usage

The main entry point for the tool is the `core/orchestrator.py` script. It demonstrates how to use all the modules together to process a new URL.

To run the example:

1.  **Make sure your `.env` file is configured correctly.**
2.  **Run the orchestrator script as a module from the root directory:**
    ```bash
    python3 -m core.orchestrator
    ```

The script will then:
-   Generate the necessary metadata (JSON-LD, social tags).
-   Submit the URL to the indexing services.
-   Update the sitemap.
-   Ping external services.

You can adapt this script to integrate it into your own content management system or publishing workflow.
