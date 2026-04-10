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

This tool is operated via a Command-Line Interface (CLI).

### Submitting a Single URL

To process a single URL, use the `submit` command:

```bash
python3 main.py submit <your_full_url>
```
**Example:**
```bash
python3 main.py submit https://www.example.com/blog/my-new-post
```

### Submitting Multiple URLs in Bulk

To process multiple URLs from a text file (one URL per line), use the `submit-bulk` command:

```bash
python3 main.py submit-bulk <path_to_your_file>
```
**Example:**
```bash
python3 main.py submit-bulk urls_to_submit.txt
```

### Sitemap Configuration

The tool uses a `config.json` file to determine which sitemap to update for a given URL.

1.  **Create a `config.json` file:**
    Copy the example file:
    ```bash
    cp config.json.example config.json
    ```

2.  **Edit the `config.json` file:**
    Define your sitemap categories based on URL path segments. The tool will match the most specific path first. For example, a URL containing `/blog/` will match before a rule for `/`.

    ```json
    {
        "sitemap_categories": [
            {
                "name": "articles",
                "path_contains": "/blog/",
                "sitemap_file": "articles_sitemap.xml",
                "changefreq": "weekly",
                "priority": 0.9
            },
            {
                "name": "pages",
                "path_contains": "/",
                "sitemap_file": "pages_sitemap.xml",
                "changefreq": "monthly",
                "priority": 0.8
            }
        ]
    }
    ```

This allows you to easily adapt the tool to your website's structure.
