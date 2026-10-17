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

    def test_skechers_exact_user_link(self):
        sample = "https://www.amazon.in/Skechers-Summits-Womens-Casual-Shoes-896220ID-NVMT-6-Navy-Multi/dp/B0CBVN2SCS/?_encoding=UTF8&pd_rd_w=nf2pM&content-id=amzn1.sym.de84ee3f-a07f-47cd-ac44-50f5d6cbb587&pf_rd_p=de84ee3f-a07f-47cd-ac44-50f5d6cbb587&pf_rd_r=QJVYJ2QFK9T9RS5KPHAH&pd_rd_wg=X6XmU&pd_rd_r=4574c256-c3ce-45fe-9641-49172e3fcd7e&ref_=pd_hp_d_btf_a2i_gw_cml&th=1&psc=1"
        data = extract_smart_catalog_fallback(sample)
        self.assertEqual(data["price"], 1620.0, "Skechers price should be exactly ₹1620.0, never strikethrough M.R.P.")
        self.assertIn("Skechers Women's Summits Casual Shoes", data["productName"])
        self.assertEqual(data["site"], "Amazon")

    def test_query_token_rs_not_false_positive(self):
        sample = "https://www.amazon.in/dp/B0CBVN2SCS?pf_rd_r=QJVYJ2QFK9T9RS5KPHAH"
        data = extract_smart_catalog_fallback(sample)
        self.assertEqual(data["price"], 1620.0, "RS5 token in Amazon URL must not be mistaken for price 5")

    def test_product_real_image_url(self):
        sample = "https://www.amazon.in/Skechers-Summits-Womens-Casual-Shoes-896220ID-NVMT-6-Navy-Multi/dp/B0CBVN2SCS/"
        data = extract_smart_catalog_fallback(sample)
        self.assertTrue(data.get("imageUrl", "").startswith("https://"), "Product fallback must return high-resolution image URL")

if __name__ == '__main__':
    unittest.main()
