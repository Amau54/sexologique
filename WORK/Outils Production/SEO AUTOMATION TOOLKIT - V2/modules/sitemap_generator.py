import os
import logging
from lxml import etree
from datetime import datetime

def setup_logging():
    """Ensure log directory exists and configure logging."""
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(os.path.join(log_dir, "sitemap_generator.log")),
            logging.StreamHandler()
        ]
    )

setup_logging()

class SitemapGenerator:
    """
    A class to generate dynamic XML sitemaps and sitemap indexes.
    """
    def __init__(self, output_dir: str = 'sitemaps'):
        """
        Initializes the SitemapGenerator.

        Args:
            output_dir (str): The directory where sitemap files will be saved.
        """
        self.output_dir = output_dir
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
        
        # XML Namespace URIs
        self.NSMAP = {
            None: "http://www.sitemaps.org/schemas/sitemap/0.9",
            "image": "http://www.google.com/schemas/sitemap-image/1.1"
        }

    def _create_url_element(self, url_data: dict) -> etree._Element:
        """Creates a <url> element from a dictionary of data."""
        url_element = etree.Element("url")

        # Required fields
        loc = etree.SubElement(url_element, "loc")
        loc.text = url_data.get("loc", "")

        # Optional fields
        if "lastmod" in url_data:
            lastmod = etree.SubElement(url_element, "lastmod")
            lastmod.text = url_data["lastmod"]
        
        if "changefreq" in url_data:
            changefreq = etree.SubElement(url_element, "changefreq")
            changefreq.text = url_data["changefreq"]
        
        if "priority" in url_data:
            priority = etree.SubElement(url_element, "priority")
            priority.text = str(url_data["priority"])

        # Image extension
        if "images" in url_data and isinstance(url_data["images"], list):
            for image_data in url_data["images"]:
                image_element = etree.SubElement(url_element, etree.QName(self.NSMAP["image"], "image"))
                
                image_loc = etree.SubElement(image_element, etree.QName(self.NSMAP["image"], "loc"))
                image_loc.text = image_data.get("loc")

                if "caption" in image_data:
                    image_caption = etree.SubElement(image_element, etree.QName(self.NSMAP["image"], "caption"))
                    image_caption.text = image_data["caption"]
                
                if "title" in image_data:
                    image_title = etree.SubElement(image_element, etree.QName(self.NSMAP["image"], "title"))
                    image_title.text = image_data["title"]

        return url_element

    def generate_sitemap(self, urls: list, filename: str):
        """
        Generates a single sitemap file from a list of URLs.

        Args:
            urls (list): A list of dictionaries, where each dictionary represents a URL.
            filename (str): The name of the sitemap file to be created (e.g., 'pages_sitemap.xml').
        """
        urlset = etree.Element("urlset", nsmap=self.NSMAP)

        for url_data in urls:
            url_element = self._create_url_element(url_data)
            urlset.append(url_element)

        filepath = os.path.join(self.output_dir, filename)
        try:
            tree = etree.ElementTree(urlset)
            tree.write(filepath, pretty_print=True, xml_declaration=True, encoding='UTF-8')
            logging.info(f"Successfully generated sitemap: {filepath}")
        except Exception as e:
            logging.error(f"Failed to write sitemap file {filepath}: {e}")

    def read_sitemap(self, filename: str) -> list:
        """
        Reads a sitemap file and returns a list of URL data dictionaries.
        
        Args:
            filename (str): The name of the sitemap file to read.
        Returns:
            list: A list of URL dictionaries. Returns an empty list if the file doesn't exist or is invalid.
        """
        filepath = os.path.join(self.output_dir, filename)
        urls = []
        if not os.path.exists(filepath):
            return urls

        try:
            tree = etree.parse(filepath)
            root = tree.getroot()
            ns = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
            for url_element in root.findall('ns:url', ns):
                url_data = {}
                # Extract data from each element
                loc = url_element.find('ns:loc', ns)
                if loc is not None: url_data['loc'] = loc.text
                
                lastmod = url_element.find('ns:lastmod', ns)
                if lastmod is not None: url_data['lastmod'] = lastmod.text

                changefreq = url_element.find('ns:changefreq', ns)
                if changefreq is not None: url_data['changefreq'] = changefreq.text
                
                priority = url_element.find('ns:priority', ns)
                if priority is not None: url_data['priority'] = float(priority.text)
                
                # Note: Reading images is not implemented here for simplicity,
                # as the orchestrator will supply the full image data on update.
                urls.append(url_data)
        except etree.XMLSyntaxError as e:
            logging.error(f"Error parsing sitemap file {filepath}: {e}")
        
        return urls

    def update_sitemap(self, new_url_data: dict, filename: str):
        """
        Updates a sitemap file with a new URL entry. If the URL already exists, it's updated.

        Args:
            new_url_data (dict): The dictionary for the new URL to add or update.
            filename (str): The name of the sitemap file.
        """
        existing_urls = self.read_sitemap(filename)
        
        url_found = False
        for i, url in enumerate(existing_urls):
            if url.get("loc") == new_url_data.get("loc"):
                existing_urls[i] = new_url_data
                url_found = True
                logging.info(f"Updating existing URL in sitemap: {new_url_data.get('loc')}")
                break
        
        if not url_found:
            existing_urls.append(new_url_data)
            logging.info(f"Adding new URL to sitemap: {new_url_data.get('loc')}")

        self.generate_sitemap(existing_urls, filename)

    def generate_sitemap_index(self, sitemap_files: list, filename: str = 'sitemap.xml'):
        """
        Generates a sitemap index file.

        Args:
            sitemap_files (list): A list of sitemap file URLs.
            filename (str): The name of the index file. Defaults to 'sitemap.xml'.
        """
        sitemapindex = etree.Element("sitemapindex", nsmap={None: self.NSMAP[None]})
        
        for sitemap_url in sitemap_files:
            sitemap_element = etree.SubElement(sitemapindex, "sitemap")
            loc = etree.SubElement(sitemap_element, "loc")
            loc.text = sitemap_url
            # Optional: add lastmod for the sitemap file itself
            lastmod = etree.SubElement(sitemap_element, "lastmod")
            lastmod.text = datetime.now().strftime('%Y-%m-%dT%H:%M:%S+00:00')

        filepath = os.path.join(self.output_dir, filename)
        try:
            tree = etree.ElementTree(sitemapindex)
            tree.write(filepath, pretty_print=True, xml_declaration=True, encoding='UTF-8')
            logging.info(f"Successfully generated sitemap index: {filepath}")
        except Exception as e:
            logging.error(f"Failed to write sitemap index file {filepath}: {e}")

if __name__ == '__main__':
    print("Running SitemapGenerator example...")
    
    # Base URL for the website
    base_url = "https://www.example.com"

    # Create a SitemapGenerator instance
    generator = SitemapGenerator(output_dir='sitemaps')

    # --- 1. Generate a sitemap for pages ---
    pages_urls = [
        {
            "loc": f"{base_url}/",
            "lastmod": "2024-01-01",
            "changefreq": "monthly",
            "priority": 1.0
        },
        {
            "loc": f"{base_url}/about-us",
            "lastmod": "2024-01-10",
            "changefreq": "yearly",
            "priority": 0.8
        }
    ]
    generator.generate_sitemap(pages_urls, 'pages_sitemap.xml')

    # --- 2. Generate a sitemap for articles with images ---
    articles_urls = [
        {
            "loc": f"{base_url}/blog/my-first-article",
            "lastmod": "2024-03-15",
            "changefreq": "weekly",
            "priority": 0.9,
            "images": [
                {
                    "loc": f"{base_url}/images/article1.jpg",
                    "caption": "A view of the mountains",
                    "title": "Mountain Landscape"
                },
                {
                    "loc": f"{base_url}/images/article1_detail.jpg"
                }
            ]
        },
        {
            "loc": f"{base_url}/blog/exploring-the-coast",
            "lastmod": "2024-03-20",
            "priority": 0.9
        }
    ]
    generator.generate_sitemap(articles_urls, 'articles_sitemap.xml')

    # --- 3. Generate the sitemap index ---
    sitemap_index_list = [
        f"{base_url}/sitemaps/pages_sitemap.xml",
        f"{base_url}/sitemaps/articles_sitemap.xml"
    ]
    generator.generate_sitemap_index(sitemap_index_list, 'sitemap_index.xml')

    print(f"\nSitemaps have been generated in the '{generator.output_dir}' directory.")
    print("Please check the XML files for correctness.")
