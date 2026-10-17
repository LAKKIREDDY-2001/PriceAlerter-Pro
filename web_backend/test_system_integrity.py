import unittest
import re
import json
import os
import sys

# Add current directory to path
sys.path.insert(0, os.path.abspath("web_backend"))
from app import extract_smart_catalog_fallback

class TestPriceSystemIntegrity(unittest.TestCase):
    def test_pasted_price_extraction_with_inr(self):
        sample = "https://www.amazon.in/dp/B0CHX1W1XY?ref=deal price ₹1,620"
        data = extract_smart_catalog_fallback(sample)
        self.assertEqual(data["price"], 1620.0, "Should extract exact ₹1,620 from pasted text")

    def test_pasted_price_extraction_with_rs(self):
        sample = "Check out this deal: https://flipkart.com/item/p/itm123 Rs. 1620 hurry!"
        data = extract_smart_catalog_fallback(sample)
        self.assertEqual(data["price"], 1620.0, "Should extract Rs. 1620 from text")

    def test_clean_slug_extraction(self):
        sample = "https://www.amazon.in/Sony-WH-1000XM5-Wireless-Noise-Cancelling-Headphones/dp/B09XS7JWHH"
        data = extract_smart_catalog_fallback(sample)
        self.assertIn("Sony WH-1000XM5", data["productName"])
        self.assertEqual(data["site"], "Amazon")

    def test_laptop_slug_extraction(self):
        sample = "https://www.flipkart.com/apple-macbook-air-m2/p/itm456"
        data = extract_smart_catalog_fallback(sample)
        self.assertIn("MacBook Air", data["productName"])
        self.assertEqual(data["site"], "Flipkart")

if __name__ == '__main__':
    unittest.main()
