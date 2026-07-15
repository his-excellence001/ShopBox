import requests
from bs4 import BeautifulSoup
from sentence_transformers import SentenceTransformer, util
import torch
import json

# 1. Load the Semantic Model (Lightweight for matching)
model = SentenceTransformer('all-MiniLM-L6-v2')

# 2. Mock Internal Inventory (In production, fetch from PostgreSQL)
internal_inventory = [
    {"id": "prod_001", "name": "10kg long grain white rice", "sku": "RICE10KG"},
    {"id": "prod_002", "name": "5ltr cooking oil", "sku": "OIL5LTR"},
    {"id": "prod_003", "name": "1kg iodized salt", "sku": "SALT1KG"}
]

# 3. The Scraping Function (MVP)
def scrape_supplier_product(url):
    # Simulating a request (In production, use Playwright for JS pages)
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Example CSS selectors (adjust based on the supplier's site)
    title = soup.select_one('h1.product-title').text.strip()
    price_text = soup.select_one('.current-price').text.strip()
    
    # Clean price: "$12.50" -> 12.50
    price = float(price_text.replace('$', '').strip())
    return {"title": title, "price": price}

# 4. Vector Similarity Matching Logic
def match_product_to_inventory(scraped_product_title, inventory):
    # Embed the scraped title
    scraped_embedding = model.encode(scraped_product_title, convert_to_tensor=True)
    best_match = None
    highest_score = 0.0
    
    for local_item in inventory:
        # Embed local item name
        local_embedding = model.encode(local_item["name"], convert_to_tensor=True)
        # Calculate Cosine Similarity
        score = util.pytorch_cos_sim(scraped_embedding, local_embedding).item()
        if score > highest_score:
            highest_score = score
            best_match = local_item
            
    return best_match, highest_score

# 5. Execute the MVP
if __name__ == "__main__":
    # Simulate a URL to a wholesaler (In production, this comes from a task queue)
    sample_url = "https://mock-wholesaler.local/product/rice-10kg"
    try:
        print("🌐 Scraping supplier product...")
        scraped = scrape_supplier_product(sample_url)
        print(f"Found: {scraped['title']} @ ${scraped['price']}")
        
        print("🔍 Running semantic vector match against local inventory...")
        matched_item, confidence = match_product_to_inventory(scraped['title'], internal_inventory)
        
        if confidence > 0.75:  # Threshold for good match
            print(f"✅ Match Found: {matched_item['name']} (Confidence: {confidence:.2f})")
            print(f"🤖 Intelligence Output: Supplier price for '{matched_item['name']}' is ${scraped['price']}.")
            print("   Insert into price_history table with alert status: 'PRICE_UPDATE'.")
        else:
            print(f"⚠️ Low confidence match ({confidence:.2f}). Flag for manual review.")
    except Exception as e:
        print(f"❌ Error during scraping: {e}")