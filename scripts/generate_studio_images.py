import asyncio
import os
import re
import base64
import xml.etree.ElementTree as ET
import argparse
from urllib.parse import urlparse
import requests
from playwright.async_api import async_playwright

# Load environment variables from .env.local manually
def load_env_local():
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env.local")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                key, value = line.split("=", 1)
                os.environ[key] = value.strip('"').strip("'")

load_env_local()

# Configuration
# Force use of localhost for image generation script, ignoring NEXT_PUBLIC_BASE_URL from .env.local
BASE_URL = os.getenv("STUDIO_APP_URL", "http://localhost:3000")
SITEMAP_URL = f"{BASE_URL}/sitemap.xml"

# Matches ROUTES.STUDIO in lib/routes.ts
STUDIO_PATH = "/studio"
STUDIO_BASE_URL = f"{BASE_URL}{STUDIO_PATH}"

DEFAULT_OUTPUT_DIR = "studio_images"
CONCURRENCY = 3  # Number of concurrent browser contexts

# Authentication (Matches .env.local)
ADMIN_USER = os.getenv("ADMIN_USER", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "speakmango1234")

def get_auth_header():
    """Generates the Basic Auth header."""
    auth_str = f"{ADMIN_USER}:{ADMIN_PASSWORD}"
    encoded_auth = base64.b64encode(auth_str.encode("ascii")).decode("ascii")
    return {"Authorization": f"Basic {encoded_auth}"}

async def fetch_sitemap_urls(sitemap_url):
    """Fetches and parses the sitemap to get expression IDs."""
    print(f"Fetching sitemap from {sitemap_url}...")
    try:
        response = requests.get(sitemap_url)
        if response.status_code == 404:
            print(f"Error: Sitemap not found (404) at {sitemap_url}")
            return []
        response.raise_for_status()
        
        # Parse XML (removing namespace for easier parsing)
        xml_content = re.sub(r' xmlns="[^"]+"', '', response.text, count=1)
        root = ET.fromstring(xml_content)
        
        expression_ids = []
        for url in root.findall("url"):
            loc = url.find("loc").text
            # Extract ID from /expressions/[id]
            match = re.search(r'/expressions/([^/]+)$', loc)
            if match:
                expression_ids.append(match.group(1))
        
        print(f"Found {len(expression_ids)} expressions in sitemap.")
        return expression_ids
    except Exception as e:
        print(f"Error fetching sitemap: {e}")
        return []

async def capture_studio_image(context, expression_id, output_dir, lang=None):
    """Navigates to the studio page and captures the preview area."""
    page = await context.new_page()
    url = f"{STUDIO_BASE_URL}/{expression_id}"
    
    # Append lang query param if specified
    if lang:
        url += f"?lang={lang}"
    
    output_path = os.path.join(output_dir, f"{expression_id}.png")
    
    # Check if image already exists
    if os.path.exists(output_path):
        print(f"Skipping {expression_id} (already exists)")
        await page.close()
        return

    print(f"Processing {expression_id} ({lang if lang else 'default'})...")
    try:
        # Basic Auth is handled by context extra_http_headers
        response = await page.goto(url)
        if response and response.status == 404:
            print(f"Error: 404 Not Found for {url}")
            await page.close()
            return
        
        # Wait for the capture area to be visible
        capture_selector = "#studio-capture-area"
        await page.wait_for_selector(capture_selector, state="visible", timeout=10000)
        
        # Wait a bit for fonts and images to settle
        await page.wait_for_timeout(1000)
        
        # Locate the element and take a screenshot
        element = page.locator(capture_selector)
        await element.screenshot(path=output_path, type="png")
        print(f"Saved {output_path}")
        
    except Exception as e:
        print(f"Failed to capture {expression_id}: {e}")
    finally:
        await page.close()

async def main(lang=None):
    # Determine output directory
    output_dir = os.path.join(DEFAULT_OUTPUT_DIR, lang) if lang else DEFAULT_OUTPUT_DIR

    # Ensure output directory exists
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created output directory: {output_dir}")
    else:
        print(f"Using output directory: {output_dir}")

    # Get IDs
    expression_ids = await fetch_sitemap_urls(SITEMAP_URL)
    if not expression_ids:
        print("No expressions found. Exiting.")
        return

    # Run Playwright
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # Set Basic Auth in extra_http_headers for all pages in this context
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=2,
            extra_http_headers=get_auth_header()
        )
        
        # Process in batches (semaphore pattern)
        semaphore = asyncio.Semaphore(CONCURRENCY)
        
        async def sem_capture(id):
            async with semaphore:
                await capture_studio_image(context, id, output_dir, lang)

        tasks = [sem_capture(eid) for eid in expression_ids]
        await asyncio.gather(*tasks)
        
        await browser.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate marketing images for expressions.")
    parser.add_argument("--lang", type=str, help="Target language code (e.g., ko, ja). If not specified, uses default.")
    args = parser.parse_args()

    # Instructions
    print("----------------------------------------------------------------")
    print("Prerequisites:")
    print("1. Ensure Next.js dev server is running on localhost:3000")
    print("2. Install dependencies: pip install requests playwright")
    print("3. Install browsers: playwright install chromium")
    if args.lang:
        print(f"4. Target Language: {args.lang}")
    print("----------------------------------------------------------------")
    
    asyncio.run(main(args.lang))