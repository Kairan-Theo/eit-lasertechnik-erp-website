import requests
from bs4 import BeautifulSoup
import re

def scrape_title_status(url):
    """
    Fetches the URL and checks the title/meta for status keywords.
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9,th;q=0.8'
        }
        r = requests.get(url, headers=headers, timeout=5)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, 'html.parser')
            text = (soup.title.string if soup.title else "") + " " + (soup.find("meta", property="og:description")["content"] if soup.find("meta", property="og:description") else "")
            text = text.lower()
            
            if "delivered" in text or "successful" in text or "signed" in text or "จัดส่งสำเร็จ" in text:
                return "Delivered"
            if "out for delivery" in text or "preparing" in text or "กำลังนำจ่าย" in text:
                return "Out for Delivery"
            if "transit" in text or "shipping" in text or "ระหว่างขนส่ง" in text:
                return "In Transit"
            if "return" in text or "fail" in text or "ตีกลับ" in text:
                return "Exception"
            
            return None
    except:
        return None
    return None

def fetch_tracking_status(courier, number):
    """
    Attempts to fetch the tracking status for a given courier and tracking number.
    Returns a string status (e.g. "Delivered", "In Transit") or None if failed.
    """
    try:
        status = None
        
        # DEMO LOGIC for Test Numbers
        if number.startswith("TEST-DEL"): return "Delivered"
        if number.startswith("TEST-TRA"): return "In Transit"
        if number.startswith("TEST-PEN"): return "Pending"
        if number.startswith("TEST-EXP"): return "Exception"

        if courier == "Kerry":
            # Kerry Express
            url = f"https://th.kerryexpress.com/th/track/?track={number}"
            status = scrape_title_status(url)

        elif courier == "Flash":
            # Flash Express
            url = f"https://www.flashexpress.co.th/tracking/?se={number}"
            status = scrape_title_status(url)
            
        elif courier == "ThaiPost":
            # Thailand Post
            url = f"https://track.thailandpost.co.th/?trackNumber={number}"
            status = scrape_title_status(url)

        elif courier == "J&T":
            url = f"https://www.jtexpress.co.th/tracking?billcode={number}"
            status = scrape_title_status(url)

        if status:
            return status

        # If scraping fails, return "Manual Check Needed"
        # This triggers the frontend to show the orange status but doesn't overwrite if it was already set manually?
        # Actually frontend overwrites. 
        # But "Manual Check Needed" is better than "Unknown".
        
        return "Manual Check Needed"

    except Exception as e:
        print(f"Tracking Error: {e}")
        return "Error"
