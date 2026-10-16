#!/usr/bin/env python3
"""
Comprehensive Integration & Verification Test Suite for Price Alerter Backend.
Tests:
1. Direct User Signup (/api/signup) - Zero OTP blocker
2. User Login (/api/login)
3. Demo Login (/api/demo-login)
4. Link Pasting & Price Extraction (/get-price)
5. Price Tracker CRUD (/api/trackers)
6. Static Assets & PWA Manifest (/static/manifest.json, /static/logo.svg, /static/sw.js)
"""
import sys
import json
import uuid
from app import app, init_db

def run_tests():
    print("=" * 70)
    print("🚀 PRICE ALERTER INTEGRATION TEST SUITE")
    print("=" * 70)

    app.config['TESTING'] = True
    init_db()
    client = app.test_client()
    passed = 0
    total = 0

    def assert_test(name, condition, details=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f"  ✓ [PASS] {name}")
        else:
            print(f"  ✗ [FAIL] {name} - {details}")

    # Test 1: User Signup (/api/signup)
    test_user = f"tester_{uuid.uuid4().hex[:6]}"
    test_email = f"{test_user}@testdomain.com"
    test_pwd = "SecurePassword123!"

    print("\n--- Testing 1-Step Instant Signup ---")
    res = client.post('/api/signup', json={
        "username": test_user,
        "email": test_email,
        "password": test_pwd,
        "phone": "+919876543210"
    })
    data = res.get_json() or {}
    assert_test("Instant Signup returns 201 Created", res.status_code == 201, f"Status: {res.status_code}, data: {data}")
    assert_test("Signup returns autoLogin and userId", data.get("autoLogin") is True and "userId" in data)

    # Test 2: Duplicate Signup rejection
    res_dup = client.post('/api/signup', json={
        "username": "Duplicate",
        "email": test_email,
        "password": "anotherpassword"
    })
    assert_test("Duplicate signup returns 409 Conflict", res_dup.status_code == 409)

    # Test 3: User Login (/api/login)
    print("\n--- Testing Authentication & Login ---")
    res_login = client.post('/api/login', json={
        "email": test_email,
        "password": test_pwd
    })
    login_data = res_login.get_json() or {}
    assert_test("Login with valid credentials returns 200 OK", res_login.status_code == 200)
    assert_test("Login returns user payload", "user" in login_data and login_data["user"].get("email") == test_email)

    # Test 4: Demo Login (/api/demo-login)
    res_demo = client.get('/api/demo-login')
    demo_data = res_demo.get_json() or {}
    assert_test("Demo login returns 200 OK", res_demo.status_code == 200)
    assert_test("Demo login returns Demo User", demo_data.get("username") == "Demo User")

    # Test 5: Link Pasting & Scraping (/get-price)
    print("\n--- Testing Link Pasting & Price Extraction ---")
    # Test test:// protocol
    res_mock = client.post('/get-price', json={"url": "test://product-a"})
    mock_data = res_mock.get_json() or {}
    assert_test("Test URL protocol returns mock price", res_mock.status_code == 200 and "price" in mock_data)

    # Test Amazon link scraping / catalog fallback
    res_amz = client.post('/get-price', json={"url": "https://www.amazon.in/dp/B0CHX1W1XY/Apple-iPhone-15-Pro"})
    amz_data = res_amz.get_json() or {}
    assert_test("Amazon link returns price and currency", res_amz.status_code == 200 and "price" in amz_data and amz_data.get("currency_symbol") == "₹")
    assert_test("Amazon site identified correctly", amz_data.get("site") == "Amazon")

    # Test Flipkart link scraping / catalog fallback
    res_fk = client.post('/get-price', json={"url": "https://www.flipkart.com/apple-macbook-air-m3/p/itm123"})
    fk_data = res_fk.get_json() or {}
    assert_test("Flipkart link returns price and store name", res_fk.status_code == 200 and fk_data.get("site") == "Flipkart")

    # Test Myntra link scraping / catalog fallback
    res_myn = client.post('/get-price', json={"url": "https://www.myntra.com/shoes/nike-air-force-1"})
    myn_data = res_myn.get_json() or {}
    assert_test("Myntra link returns price and store name", res_myn.status_code == 200 and myn_data.get("site") == "Myntra")

    # Test 6: Tracker CRUD (/api/trackers)
    print("\n--- Testing Tracker Creation and Retrieval ---")
    res_trk_post = client.post('/api/trackers', json={
        "url": "https://www.amazon.in/dp/B0CHX1W1XY/Apple-iPhone-15-Pro",
        "productName": "Apple iPhone 15 Pro (128 GB)",
        "currentPrice": 124990.0,
        "targetPrice": 119999.0,
        "currency": "INR",
        "currencySymbol": "₹"
    })
    trk_post_data = res_trk_post.get_json() or {}
    assert_test("Tracker POST returns 201 Created", res_trk_post.status_code == 201, f"Status: {res_trk_post.status_code}")

    res_trk_get = client.get('/api/trackers')
    trk_get_data = res_trk_get.get_json() or []
    assert_test("Tracker GET returns list of trackers", res_trk_get.status_code == 200 and isinstance(trk_get_data, list))

    # Test 7: AI Product Comparison Endpoint (/api/ai-compare)
    print("\n--- Testing AI Product Comparison Engine ---")
    res_compare = client.post('/api/ai-compare', json={
        "url1": "https://www.amazon.in/dp/B0CHX1W1XY/Apple-iPhone-15-Pro",
        "url2": "https://www.flipkart.com/samsung-galaxy-s24-5g/p/itm123"
    })
    compare_data = res_compare.get_json() or {}
    assert_test("AI Compare endpoint returns 200 OK", res_compare.status_code == 200)
    assert_test("AI Compare contains winner decision", "winner" in compare_data and "winnerName" in compare_data.get("winner", {}))
    assert_test("AI Compare returns all 5 segments", "segments" in compare_data and all(
        k in compare_data.get("segments", {}) for k in ["pricing", "reviews", "certifications", "concerns", "recommendation"]
    ))

    # Test 8: Static Assets & PWA Verification
    print("\n--- Testing PWA Manifest & Static Assets ---")
    res_logo = client.get('/static/logo.svg')
    assert_test("Logo SVG served with 200 OK", res_logo.status_code == 200)

    res_manifest = client.get('/static/manifest.json')
    assert_test("PWA manifest.json served with 200 OK", res_manifest.status_code == 200)
    if res_manifest.status_code == 200:
        man_data = json.loads(res_manifest.data)
        assert_test("Manifest specifies standalone display mode", man_data.get("display") == "standalone")

    res_sw = client.get('/static/sw.js')
    assert_test("Service Worker sw.js served with 200 OK", res_sw.status_code == 200)

    print("\n" + "=" * 70)
    print(f"📊 TEST SUMMARY: {passed} of {total} tests passed ({round(passed/total * 100, 1)}%)")
    print("=" * 70)

    return 0 if passed == total else 1

if __name__ == '__main__':
    sys.exit(run_tests())
