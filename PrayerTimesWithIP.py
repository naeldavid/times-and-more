import requests 
import sys
import json
from urllib.request import urlopen
from datetime import datetime

def get_public_ip():
    
    try:
        response = requests.get('https://api.ipify.org?format=json')
        return response.json()['ip']
    except Exception as e:
        print(f"Error getting public IP: {e}")
        sys.exit(1)

def get_prayer_times(latitude, longitude, city, country, timezone):
    
    try:
        today = datetime.now()
        url = f"http://api.aladhan.com/v1/timings/{today}?latitude={latitude}&longitude={longitude}&timezone={timezone}method=4"
        response = requests.get(url)
        data = response.json()
        
        if data['status'] == 'OK':
            timings = data['data']['timings']
            print(f"\nPrayer Times for {city}, {country}: {timings['Fajr']}, {timings['Sunrise']}, {timings['Dhuhr']}, {timings['Asr']}, {timings['Maghrib']}, {timings['Isha']}")
    except Exception as e:
        print(f"Error fetching prayer times: {e}")

def get_moon_phase():
    try:
        today = datetime.now()
        url = f"https://svs.gsfc.nasa.gov/api/dialamoon/{today}"
        response = requests.get(url)
        data = response.json()
        
        if response.status_code == 200:
            phase = data.get('phase', 'Unknown')
            print(f"Moon Phase: {phase}%")
    except Exception as e:
        print(f"Error fetching moon phase: {e}")


ip = get_public_ip()
response = urlopen('http://ipwho.is/' + ip)
ipwhois = json.loads(response.read())

country = ipwhois['country']
city = ipwhois['city']
longitude = ipwhois['longitude']
latitude = ipwhois['latitude']
timezone = ipwhois['timezone']['abbr']

print(f"Location: {city}, {country} ({timezone})")
print(f"Coordinates: {latitude}, {longitude}")

get_prayer_times(latitude, longitude, city, country, timezone)
get_moon_phase()