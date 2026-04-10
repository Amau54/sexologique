import json
from textwrap import indent

class MetadataGenerator:
    """
    A class to generate structured data (JSON-LD) and social meta tags.
    """

    def generate_json_ld(self, schema_type: str, data: dict) -> str:
        """
        Generates a JSON-LD script tag for a given schema type and data.

        Args:
            schema_type (str): The type of schema (e.g., 'Organization', 'Article').
            data (dict): The data for the schema.

        Returns:
            str: The HTML <script> tag containing the JSON-LD.
        """
        schema = {
            "@context": "https://schema.org",
            "@type": schema_type,
            **data
        }
        
        json_ld = json.dumps(schema, indent=4)
        script_tag = f'<script type="application/ld+json">\n{json_ld}\n</script>'
        return script_tag

    def generate_meta_tags(self, data: list) -> str:
        """
        Generates a string of HTML meta tags from a list of dictionaries.

        Args:
            data (list): A list of dictionaries, each with 'name'/'property' and 'content'.

        Returns:
            str: A string of HTML <meta> tags.
        """
        tags = []
        for tag_data in data:
            if 'property' in tag_data:
                tags.append(f'<meta property="{tag_data["property"]}" content="{tag_data["content"]}">')
            elif 'name' in tag_data:
                tags.append(f'<meta name="{tag_data["name"]}" content="{tag_data["content"]}">')
        return "\n".join(tags)

    def generate_open_graph(self, data: dict) -> str:
        """
        Generates Open Graph meta tags.

        Args:
            data (dict): A dictionary containing OG data (e.g., title, type, url, image).

        Returns:
            str: A string of Open Graph <meta> tags.
        """
        og_tags_data = [
            {"property": "og:title", "content": data.get("title", "")},
            {"property": "og:type", "content": data.get("type", "website")},
            {"property": "og:url", "content": data.get("url", "")},
            {"property": "og:image", "content": data.get("image", "")},
            {"property": "og:description", "content": data.get("description", "")},
            {"property": "og:site_name", "content": data.get("site_name", "")}
        ]
        # Filter out empty tags
        og_tags_data = [tag for tag in og_tags_data if tag["content"]]
        return self.generate_meta_tags(og_tags_data)

    def generate_twitter_card(self, data: dict) -> str:
        """
        Generates Twitter Card meta tags.

        Args:
            data (dict): A dictionary containing Twitter card data (e.g., card, site, title).

        Returns:
            str: A string of Twitter Card <meta> tags.
        """
        twitter_tags_data = [
            {"name": "twitter:card", "content": data.get("card", "summary_large_image")},
            {"name": "twitter:site", "content": data.get("site", "")},
            {"name": "twitter:creator", "content": data.get("creator", "")},
            {"name": "twitter:title", "content": data.get("title", "")},
            {"name": "twitter:description", "content": data.get("description", "")},
            {"name": "twitter:image", "content": data.get("image", "")}
        ]
        # Filter out empty tags
        twitter_tags_data = [tag for tag in twitter_tags_data if tag["content"]]
        return self.generate_meta_tags(twitter_tags_data)

if __name__ == '__main__':
    print("Running MetadataGenerator example...")

    generator = MetadataGenerator()
    base_url = "https://www.example.com"

    # --- 1. JSON-LD Generation ---
    print("\n" + "="*20)
    print("JSON-LD Examples")
    print("="*20)

    # Organization Schema
    org_data = {
        "name": "My Awesome Company",
        "url": base_url,
        "logo": f"{base_url}/logo.png",
        "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+1-123-456-7890",
            "contactType": "customer service"
        }
    }
    org_json_ld = generator.generate_json_ld("Organization", org_data)
    print("\n--- Organization Schema ---")
    print(org_json_ld)

    # Article Schema
    article_data = {
        "headline": "My First Amazing Article",
        "author": {"@type": "Person", "name": "John Doe"},
        "datePublished": "2024-03-25",
        "image": f"{base_url}/images/article1.jpg"
    }
    article_json_ld = generator.generate_json_ld("Article", article_data)
    print("\n--- Article Schema ---")
    print(article_json_ld)

    # --- 2. Social Meta Tags Generation ---
    print("\n" + "="*20)
    print("Social Meta Tag Examples")
    print("="*20)

    # Open Graph
    og_data = {
        "title": "My First Amazing Article",
        "type": "article",
        "url": f"{base_url}/blog/my-first-article",
        "image": f"{base_url}/images/article1.jpg",
        "description": "This article explains some amazing concepts.",
        "site_name": "My Awesome Company Blog"
    }
    og_tags = generator.generate_open_graph(og_data)
    print("\n--- Open Graph Tags ---")
    print(og_tags)

    # Twitter Card
    twitter_data = {
        "card": "summary_large_image",
        "site": "@MyAwesomeHandle",
        "creator": "@JohnDoeHandle",
        "title": "My First Amazing Article",
        "description": "This article explains some amazing concepts.",
        "image": f"{base_url}/images/article1.jpg"
    }
    twitter_tags = generator.generate_twitter_card(twitter_data)
    print("\n--- Twitter Card Tags ---")
    print(twitter_tags)
