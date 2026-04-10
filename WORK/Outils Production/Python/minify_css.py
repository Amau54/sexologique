
import sys
import re

def minify_css(css_code):
    # Remove comments
    css_code = re.sub(r'/\*.*?\*/', '', css_code, flags=re.DOTALL)
    # Remove newlines and tabs
    css_code = css_code.replace('\n', '').replace('\r', '').replace('\t', '')
    # Remove extra whitespace around special characters
    css_code = re.sub(r'\s*([,;:{}>])\s*', r'\1', css_code)
    # Remove extra whitespace between rules
    css_code = re.sub(r'}\s+', '}', css_code).strip()
    # Remove leading space in rules
    css_code = re.sub(r'{\s+', '{', css_code)
    # Remove space before !important
    css_code = css_code.replace(' !important', '!important')
    # Replace multiple spaces with a single space
    css_code = re.sub(r'\s+', ' ', css_code)
    return css_code

if __name__ == "__main__":
    if len(sys.argv) > 1:
        filepath = sys.argv[1]
        try:
            with open(filepath, 'r') as f:
                original_css = f.read()
            
            minified_css = minify_css(original_css)
            
            with open(filepath, 'w') as f:
                f.write(minified_css)
            
            print(f"Successfully minified {filepath}")
        except FileNotFoundError:
            print(f"Error: File not found at {filepath}", file=sys.stderr)
        except Exception as e:
            print(f"An error occurred: {e}", file=sys.stderr)
    else:
        print("Usage: python3 minify_css.py <path_to_css_file>", file=sys.stderr)
