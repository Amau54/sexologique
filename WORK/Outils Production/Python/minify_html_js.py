
import sys
import re

def minify_js(js_code):
    # Remove single-line comments
    js_code = re.sub(r'//.*', '', js_code)
    # Remove multi-line comments
    js_code = re.sub(r'/\*.*?\*/', '', js_code, flags=re.DOTALL)
    # Remove unnecessary whitespace and newlines
    js_code = js_code.replace('\n', ' ').replace('\r', '').replace('\t', ' ')
    # Remove whitespace around operators and special characters
    js_code = re.sub(r'\s*([=;:{}\(\),])\s*', r'\1', js_code)
    # Replace multiple spaces with a single space
    js_code = re.sub(r'\s+', ' ', js_code).strip()
    return js_code

def process_html_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            html_content = f.read()

        script_pattern = re.compile(r'(<script>)(.*)(</script>)', re.DOTALL)
        match = script_pattern.search(html_content)

        if match:
            original_js = match.group(2)
            minified_js = minify_js(original_js)
            # Replace the old JS with the minified version
            updated_html = html_content.replace(original_js, minified_js)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(updated_html)
            
            print(f"Successfully minified inline JavaScript in {filepath}")
        else:
            print(f"No inline script found in {filepath} matching the expected pattern.")

    except FileNotFoundError:
        print(f"Error: File not found at {filepath}", file=sys.stderr)
    except Exception as e:
        print(f"An error occurred: {e}", file=sys.stderr)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        filepath = sys.argv[1]
        process_html_file(filepath)
    else:
        print("Usage: python3 minify_html_js.py <path_to_html_file>", file=sys.stderr)
