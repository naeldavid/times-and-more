"use strict";

const now = new Date();
const today = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');

// Default location fallback
const defaultLocation = {
    city: 'Manama',
    country: 'Bahrain',
    latitude: 26.2285,
    longitude: 50.5860,
    timezone: 'Asia/Bahrain'
};

let notificationPermissionGranted = false;

async function getPublicLocation() {
    return new Promise((resolve) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || defaultLocation.timezone;
                    let city = defaultLocation.city;
                    let country = defaultLocation.country;

                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
                        const data = await response.json();
                        city = data.address.city || data.address.town || data.address.village || defaultLocation.city;
                        country = data.address.country || defaultLocation.country;
                    } catch (e) {
                        console.warn("Reverse geocoding failed:", e);
                    }

                    resolve({
                        city,
                        country,
                        latitude,
                        longitude,
                        timezone
                    });
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    resolve(defaultLocation);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
            );
        } else {
            console.warn("Geolocation not supported");
            resolve(defaultLocation);
        }
    });
}

async function getPrayerTimes(latitude, longitude, timezone) {
    try {
        // Use current date in YYYY-MM-DD format
        const dateStr = now.getFullYear() + '-' + 
                       (now.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                       now.getDate().toString().padStart(2, '0');
        
        const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=4&timezonestring=${timezone}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.code === 200 && data.status === "OK") {
            return data.data.timings;
        } else {
            throw new Error(data.data.error || 'Unknown API error');
        }
    } catch (error) {
        console.error('Error getting prayer times:', error);
        
        // Fallback prayer times for Bahrain
        return {
            Fajr: "05:00",
            Sunrise: "06:00",
            Dhuhr: "12:00",
            Asr: "15:00",
            Maghrib: "18:00",
            Isha: "19:30",
        };
    }
}

function calculateMoonPhase() {
    const date = new Date();
    const lunarCycle = 29.53058867;
    const knownNewMoon = new Date('2000-01-06T18:14:00Z');
    
    const daysSinceNewMoon = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
    let moonAge = daysSinceNewMoon % lunarCycle;
    if (moonAge < 0) moonAge += lunarCycle;
    
    // Calculate illumination percentage (0-100)
    let illumination = Math.round(50 * (1 - Math.cos(2 * Math.PI * moonAge / lunarCycle)));
    
    // Determine moon phase
    let phase;
    if (moonAge < 1) {
        phase = "New Moon";
        illumination = 0;
    } else if (moonAge < 7.38) {
        phase = "Waxing Crescent";
    } else if (moonAge < 8.38) {
        phase = "First Quarter";
        illumination = 50;
    } else if (moonAge < 14.77) {
        phase = "Waxing Gibbous";
    } else if (moonAge < 15.77) {
        phase = "Full Moon";
        illumination = 100;
    } else if (moonAge < 22.15) {
        phase = "Waning Gibbous";
    } else if (moonAge < 23.15) {
        phase = "Last Quarter";
        illumination = 50;
    } else {
        phase = "Waning Crescent";
    }
    
    return [phase, illumination];
}
function gregorianToHijri(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    let jd = Math.floor((1461 * (year + 4800 + Math.floor((month - 14)/12))/4) + 
             Math.floor((367 * (month - 2 - 12 * Math.floor((month - 14)/12)))/12) - 
             Math.floor((3 * Math.floor((year + 4900 + Math.floor((month - 14)/12))/100))/4) + 
             day - 32075);
    
    jd -= 1948440;
    const hijriYear = Math.floor((30 * jd + 10646) / 10631);
    const remainingDays = jd - Math.floor((10631 * hijriYear - 10617) / 30);
    let hijriMonth = Math.floor((remainingDays + 0.5) / 29.5) + 1;
    const hijriDay = Math.floor(remainingDays - 29.5 * (hijriMonth - 1)) + 1;
    
    if (hijriMonth > 12) hijriMonth -= 12;
    
    const hijriMonthNames = [
        "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
        "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Shaban",
        "Ramadan", "Shawwal", "Dhu al-Qadah", "Dhu al-Hijjah"
    ];
    
    return `${hijriDay} ${hijriMonthNames[hijriMonth - 1]} ${hijriYear} AH`;
}

function calculateQibla(latitude, longitude) {
    const lat = latitude * Math.PI / 180;
    const long = longitude * Math.PI / 180;
    const kaabaLat = 21.4225 * Math.PI / 180;
    const kaabaLong = 39.8262 * Math.PI / 180;
    
    const y = Math.sin(kaabaLong - long);
    const x = Math.cos(lat) * Math.tan(kaabaLat) - Math.sin(lat) * Math.cos(kaabaLong - long);
    
    let qibla = Math.atan2(y, x) * 180 / Math.PI;
    return ((qibla + 360) % 360).toFixed(2);
}

function getGMTOffset(timezone, latitude, longitude) {
    try {
        const now = new Date();
        let offsetMinutes;
        
        if (timezone && timezone.includes('/')) {
            try {
                const formatter = new Intl.DateTimeFormat('en', {
                    timeZone: timezone,
                    timeZoneName: 'longOffset'
                });
                const parts = formatter.formatToParts(now);
                const offsetPart = parts.find(part => part.type === 'timeZoneName');
                if (offsetPart && offsetPart.value.includes('GMT')) {
                    return offsetPart.value.replace('GMT', 'GMT');
                }
            } catch (e) {
                console.log('Method 1 failed');
            }
        }
        
        if (latitude && longitude && timezone) {
            try {
                const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
                const localDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
                offsetMinutes = (localDate.getTime() - utcDate.getTime()) / (1000 * 60);
            } catch (e) {
                console.log('Method 2 failed');
            }
        }
        
        if (offsetMinutes !== undefined) {
            const hours = Math.floor(Math.abs(offsetMinutes) / 60);
            const minutes = Math.abs(offsetMinutes) % 60;
            const sign = offsetMinutes >= 0 ? '+' : '-';
            
            if (minutes === 0) {
                return `GMT${sign}${hours.toString().padStart(2, '0')}`;
            } else {
                return `GMT${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            }
        }
        
        return 'GMT+03'; // Default for Bahrain
    } catch (error) {
        console.error('Error getting GMT offset:', error);
        return 'GMT+03';
    }
}

function updateUI(data) {
    const { city, country, timezone, prayerTimes, hijriDate, gregorianDate, currentPhase, illumination, qiblaDirection } = data;
    
    document.getElementById('location-display').textContent = `${city}, ${country}`;
    document.getElementById('timezone-display').textContent = getGMTOffset(timezone, data.latitude, data.longitude);
    document.getElementById('gregorian-date').textContent = `Gregorian: ${gregorianDate}`;
    document.getElementById('hijri-date').textContent = `Hijri: ${hijriDate}`;
    
	// Update moon phase
	const moonPhase = document.getElementById('moon-phase');
	const moonPhaseText = document.getElementById('moon-phase-text');
	
	if (moonPhase && moonPhaseText) {
		moonPhase.setAttribute('phase', currentPhase);
		moonPhase.style.setProperty('--illumination', `${illumination}%`);
		moonPhaseText.innerHTML = `${currentPhase}<br>${illumination}% illuminated`;
		console.log('Moon phase CSS variable set:', `--illumination: ${illumination}%`);
		console.log("Updated moon phase:", currentPhase, illumination);
	} else {
		console.error('Moon phase elements not found');
	}
    
    document.getElementById('qibla-direction').textContent = `${qiblaDirection}°`;
    document.getElementById('qibla-arrow').style.transform = `rotate(${qiblaDirection}deg)`;
    
    document.querySelector('#fajr .time').textContent = prayerTimes['Fajr'];
    document.querySelector('#dhuhr .time').textContent = prayerTimes['Dhuhr'];
    document.querySelector('#asr .time').textContent = prayerTimes['Asr'];
    document.querySelector('#maghrib .time').textContent = prayerTimes['Maghrib'];
    document.querySelector('#isha .time').textContent = prayerTimes['Isha'];
    
    updateNextPrayer();
	
}

function updateNextPrayer() {
    const now = new Date();
    const prayerElements = {
        'Fajr': document.getElementById('fajr'),
        'Dhuhr': document.getElementById('dhuhr'),
        'Asr': document.getElementById('asr'),
        'Maghrib': document.getElementById('maghrib'),
        'Isha': document.getElementById('isha')
    };
    
    Object.values(prayerElements).forEach(el => el.classList.remove('next'));
    
    let nextPrayer = null;
    let minDiff = Infinity;
    
    for (const [name, element] of Object.entries(prayerElements)) {
        const timeText = element.querySelector('.time').textContent;
        const [hours, minutes] = timeText.split(':').map(Number);
        const prayerTime = new Date();
        prayerTime.setHours(hours, minutes, 0, 0);
        
        if (prayerTime < now) prayerTime.setDate(prayerTime.getDate() + 1);
        
        const diff = prayerTime - now;
        if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            nextPrayer = name;
        }
    }
    
    if (nextPrayer) {
        prayerElements[nextPrayer].classList.add('next');
        document.getElementById('next-prayer-name').textContent = nextPrayer;
        
        const hours = Math.floor(minDiff / (1000 * 60 * 60));
        const minutes = Math.floor((minDiff % (1000 * 60 * 60)) / (1000 * 60));
        document.getElementById('countdown-timer').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
}

async function fetchData(city, country, latitude, longitude, timezone) {
    try {
        const prayerTimes = await getPrayerTimes(latitude, longitude, timezone);
        if (!prayerTimes) throw new Error('Could not retrieve prayer times');
        
        const [currentPhase, illumination] = calculateMoonPhase();
        const hijriDate = gregorianToHijri(now);
        const gregorianDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const qiblaDirection = calculateQibla(latitude, longitude);
        
        updateUI({
            city,
            country,
            timezone,
            prayerTimes,
            hijriDate,
            gregorianDate,
            currentPhase,
            illumination,
            qiblaDirection,
            latitude,
            longitude
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        const errorDiv = document.createElement('div');
        errorDiv.style.backgroundColor = '#ffdddd';
        errorDiv.style.color = '#d00';
        errorDiv.style.padding = '10px';
        errorDiv.style.margin = '10px 0';
        errorDiv.style.borderRadius = '8px';
        errorDiv.textContent = `Error: ${error.message}. Using default prayer times for Bahrain.`;
        
        const header = document.querySelector('.header');
        if (header) {
            header.parentNode.insertBefore(errorDiv, header.nextSibling);
        }
        
        // Fallback to default location
        await fetchData(
            defaultLocation.city,
            defaultLocation.country,
            defaultLocation.latitude,
            defaultLocation.longitude,
            defaultLocation.timezone
        );
    }
}

async function requestNotificationPermission() {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;

    try {
        const permission = await Notification.requestPermission();
        notificationPermissionGranted = permission === "granted";
        return notificationPermissionGranted;
    } catch (error) {
        console.error("Error requesting notification permission:", error);
        return false;
    }
}

function sendPrayerNotification(prayerName) {
    if (!notificationPermissionGranted) return;

    try {
        new Notification("Prayer Time 🕌", {
            body: `It's time for ${prayerName} prayer!`,
            icon: '/static/sujud.svg',
            tag: 'prayer-notification'
        });
    } catch (error) {
        console.error("Failed to show notification:", error);
    }
}

function checkPrayerTime() {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const fajrEl = document.querySelector('#fajr .time');
    if (!fajrEl || !fajrEl.textContent) return;

    const prayers = {
        'Fajr': fajrEl.textContent,
        'Dhuhr': document.querySelector('#dhuhr .time')?.textContent,
        'Asr': document.querySelector('#asr .time')?.textContent,
        'Maghrib': document.querySelector('#maghrib .time')?.textContent,
        'Isha': document.querySelector('#isha .time')?.textContent
    };

    for (const [name, time] of Object.entries(prayers)) {
        if (time && currentTime === time) {
            sendPrayerNotification(name);
        }
    }
}

function setupTestButton() {
    const notifyBtn = document.getElementById('notify-btn');
    if (notifyBtn) {
        notifyBtn.addEventListener('click', async () => {
            if (!notificationPermissionGranted) {
                await requestNotificationPermission();
            }
            sendPrayerNotification("Test");
        });
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    console.log("Initializing app...");
    
    try {
        const locationData = await getPublicLocation();
        await fetchData(
            locationData.city,
            locationData.country,
            locationData.latitude,
            locationData.longitude,
            locationData.timezone
        );
        
        await requestNotificationPermission();
        setInterval(updateNextPrayer, 60000);
        setInterval(checkPrayerTime, 60000);
        setupTestButton();
    } catch (error) {
        console.error("Initialization error:", error);
    }
	console.log("App initialized successfully.");
	console.log("DOM loaded, initializing application...");
	
	try {
		// Get location data from IP
		console.log("Fetching location data from IP address...");
		const locationData = await getPublicLocation();
		console.log("Location data obtained:", locationData);
		
		// Load data with location information
		console.log("Loading data for location:", locationData);
		await fetchData(
			locationData.city,
			locationData.country,
			locationData.latitude,
			locationData.longitude,
			locationData.timezone
		);
		
		// Request notification permission
		console.log("Requesting notification permission");
		await requestNotificationPermission();
		
		// Set up timers
		console.log("Setting up timers for prayer updates");
		setInterval(updateNextPrayer, 60000); // Update countdown every minute
		setInterval(checkPrayerTime, 60000); // Check for prayer times every minute
		
		// Setup test button
		setupTestButton();
		
		console.log("Application initialization complete");
	} catch (error) {
		console.error("Error during initialization:", error);
		
		// Create and display error message in UI
		const container = document.querySelector('.container');
		const errorDiv = document.createElement('div');
		errorDiv.style.backgroundColor = '#ffdddd';
		errorDiv.style.color = '#d00';
		errorDiv.style.padding = '10px';
		errorDiv.style.margin = '10px 0';
		errorDiv.style.borderRadius = '8px';
		errorDiv.textContent = `Error initializing application: ${error.message}`;
		
		// Insert after header
		const header = document.querySelector('.header');
		if (header && container) {
			container.insertBefore(errorDiv, header.nextSibling);
		}
	}

	(async () => {
		console.log("Initializing prayer times app with geolocation...");
	
		const locationData = await getPublicLocation();
		console.log("Location data:", locationData);
	
		await fetchData(
			locationData.city,
			locationData.country,
			locationData.latitude,
			locationData.longitude,
			locationData.timezone
		);
	
		await requestNotificationPermission();
		setInterval(updateNextPrayer, 60000);
		setInterval(checkPrayerTime, 60000);
		setupTestButton();
	
		console.log("App fully initialized.");
	})();
});