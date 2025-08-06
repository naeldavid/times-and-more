// Current date and time
const now = new Date();
const today = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0');

async function getPublicIp() {
    try {
        // Get IP and location data in a single request
        const response = await fetch('https://ip.guide');
        const data = await response.json();
        console.log("IP and location data:", data);
        
        // Check if we got valid data
        if (!data) {
            throw new Error('Could not get location data');
        }
        
        // Extract location data with fallbacks to default values
        return {
            city: data.location.city || defaultLocation.city,
            country: data.location.country || defaultLocation.country,
            latitude: parseFloat(data.location.latitude || defaultLocation.latitude),
            longitude: parseFloat(data.location.longitude || defaultLocation.longitude),
            timezone: data.location.timezone || defaultLocation.timezone
        };
    } catch (error) {
        console.error('Error getting location data:', error);
        // Return default location if there's an error
        return {
            city: defaultLocation.city,
            country: defaultLocation.country,
            latitude: defaultLocation.latitude,
            longitude: defaultLocation.longitude,
            timezone: defaultLocation.timezone
        };
    }
}

// Get prayer times
async function getPrayerTimes(latitude, longitude, timezone) {
    try {
        const url = `https://api.aladhan.com/v1/timings/${today}?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&method=4`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK') {
            return data.data.timings;
        }
        return null;
    } catch (error) {
        console.error('Error getting prayer times:', error);
        return null;
    }
}

// Calculate moon phase
function calculateMoonPhase() {
    // Calculate days since new moon on Jan 6, 2000
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Julian date calculation
    let jd = 367 * year - Math.floor(7 * (year + Math.floor((month + 9) / 12)) / 4) - 
            Math.floor(3 * (Math.floor((year + (month - 9) / 7) / 100) + 1) / 4) + 
            Math.floor(275 * month / 9) + day + 1721028.5;
    
    // Reference date: Jan 6, 2000
    let refJd = 2451549.5; 
    
    // Lunar cycle is 29.53 days
    let moonAge = (jd - refJd) % 29.53;
    
    let illumination = Math.round(moonAge / 29.53 * 100);
    
    // Determine moon phase based on age
    let phase;
    if (moonAge < 1.84566) {
        phase = "New Moon";
    } else if (moonAge < 5.53699) {
        phase = "Waxing Crescent";
    } else if (moonAge < 9.22831) {
        phase = "First Quarter";
    } else if (moonAge < 12.91963) {
        phase = "Waxing Gibbous";
    } else if (moonAge < 16.61096) {
        phase = "Full Moon";
    } else if (moonAge < 20.30228) {
        phase = "Waning Gibbous";
    } else if (moonAge < 23.99361) {
        phase = "Last Quarter";
    } else if (moonAge < 27.68493) {
        phase = "Waning Crescent";
    } else {
        phase = "New Moon";
    }
    
    return [phase, illumination];
}

// Convert Gregorian to Hijri date (fixed calculation)
function gregorianToHijri(date) {
    // Using the Umm al-Qura algorithm
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    // Correct Julian day calculation
    let jd = Math.floor((1461 * (year + 4800 + Math.floor((month - 14)/12))/4) + 
             Math.floor((367 * (month - 2 - 12 * Math.floor((month - 14)/12)))/12) - 
             Math.floor((3 * Math.floor((year + 4900 + Math.floor((month - 14)/12))/100))/4) + 
             day - 32075);
    
    // Adjust for Hijri calendar
    jd -= 1948440; // Julian day of 16 July 622 (Hijri epoch)
    
    // Calculate Hijri year
    const hijriYear = Math.floor((30 * jd + 10646) / 10631);
    
    // Calculate remaining days
    const remainingDays = jd - Math.floor((10631 * hijriYear - 10617) / 30);
    
    // Calculate Hijri month and day
    let hijriMonth = Math.floor((remainingDays + 0.5) / 29.5) + 1;
    const hijriDay = Math.floor(remainingDays - 29.5 * (hijriMonth - 1)) + 1;
    
    // Handle month overflow
    if (hijriMonth > 12) {
        hijriMonth -= 12;
    }
    
    const hijriMonthNames = [
        "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
        "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Shaban",
        "Ramadan", "Shawwal", "Dhu al-Qadah", "Dhu al-Hijjah"
    ];
    
    return `${hijriDay} ${hijriMonthNames[hijriMonth - 1]} ${hijriYear} AH`;
}

// Calculate Qibla direction
function calculateQibla(latitude, longitude) {
    // Convert to radians
    const lat = latitude * Math.PI / 180;
    const long = longitude * Math.PI / 180;
    
    // Kaaba coordinates in radians
    const kaabaLat = 21.4225 * Math.PI / 180;
    const kaabaLong = 39.8262 * Math.PI / 180;
    
    // Calculate qibla direction
    const y = Math.sin(kaabaLong - long);
    const x = Math.cos(lat) * Math.tan(kaabaLat) - Math.sin(lat) * Math.cos(kaabaLong - long);
    
    let qibla = Math.atan2(y, x) * 180 / Math.PI;
    qibla = (qibla + 360) % 360; // Normalize to 0-360
    
    return qibla.toFixed(2);
}

// Function to convert timezone to GMT offset format
function getGMTOffset(timezone, latitude, longitude) {
    try {
        // Create a date object for the current time
        const now = new Date();
        
        // Method 1: Try using the timezone string directly with Intl.DateTimeFormat
        let offsetMinutes;
        
        if (timezone && timezone.includes('/')) {
            // Handle timezone names like "Asia/Bahrain" or "Asia/Kuwait"
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
                console.log('Method 1 failed, trying alternative methods');
            }
        }
        
        // Method 2: Use coordinates to determine timezone
        if (latitude && longitude) {
            if (timezone) {
                try {
                    // Create dates in UTC and local timezone
                    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
                    const localDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
                    
                    offsetMinutes = (localDate.getTime() - utcDate.getTime()) / (1000 * 60);
                } catch (e) {
                    console.log('Method 2 failed, using fallback');
                }
            }
        }
        
        // Method 3: Parse common timezone abbreviations
        if (timezone) {
            const timezoneMap = {
                'AST': '+03',
                'GST': '+04',
                'PKT': '+05',
                'IST': '+05:30',
                'BST': '+06',
                'ICT': '+07',
                'CST': '+08',
                'JST': '+09',
                'AEST': '+10',
                'EST': '-05',
                'CST': '-06',
                'MST': '-07',
                'PST': '-08'
            };
            
            if (timezoneMap[timezone]) {
                return `GMT${timezoneMap[timezone]}`;
            }
        }
        
        // Method 4: Calculate offset from minutes
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
        
        
    } catch (error) {
        console.error('Error getting GMT offset:', error);
        return 'Error getting offset'; // Default for Bahrain
    }
}

// Update UI with data
function updateUI(data) {
    console.log("Updating UI with fetched data:", data);
    const { city, country, timezone, prayerTimes, hijriDate, gregorianDate, currentPhase, illumination, qiblaDirection, latitude, longitude } = data;
    
    // Update location info
    document.getElementById('location-display').textContent = `${city}, ${country}`;
    
    // Get GMT offset format
    const gmtOffset = getGMTOffset(timezone, latitude, longitude);
    document.getElementById('timezone-display').textContent = gmtOffset;
    console.log("Updated location display:", city, country, gmtOffset);
    
    // Update dates
    document.getElementById('gregorian-date').textContent = `Gregorian: ${gregorianDate}`;
    document.getElementById('hijri-date').textContent = `Hijri: ${hijriDate}`;
    console.log("Updated date displays:", gregorianDate, hijriDate);
    
    // Update moon phase
    const moonPhase = document.getElementById('moon-phase');
    moonPhase.setAttribute('phase', currentPhase);
    moonPhase.setAttribute('illumination', illumination);
    moonPhase.style.setProperty('--_w', `${100 - illumination}%`);
    document.getElementById('moon-phase-text').innerHTML = `${currentPhase}<br>${illumination}% illuminated`;
    console.log("Updated moon phase:", currentPhase, illumination);
    
    // Update qibla direction
    document.getElementById('qibla-direction').textContent = `${qiblaDirection}°`;
    document.getElementById('qibla-arrow').style.transform = `rotate(${qiblaDirection}deg)`;
    console.log("Updated qibla direction:", qiblaDirection);
    
    // Update prayer times
    document.querySelector('#fajr .time').textContent = prayerTimes['Fajr'];
    document.querySelector('#dhuhr .time').textContent = prayerTimes['Dhuhr'];
    document.querySelector('#asr .time').textContent = prayerTimes['Asr'];
    document.querySelector('#maghrib .time').textContent = prayerTimes['Maghrib'];
    document.querySelector('#isha .time').textContent = prayerTimes['Isha'];
    console.log("Updated prayer times:", prayerTimes);
    
    // Update next prayer calculation
    updateNextPrayer();
    console.log("UI update complete");
}

// Calculate next prayer and countdown
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

// Fetch and update data
async function fetchData(city, country, latitude, longitude, timezone) {
    try {
        console.log("Fetching prayer time data for:", city, country, latitude, longitude, timezone);
        
        // Get prayer times from API
        const prayerTimes = await getPrayerTimes(latitude, longitude, timezone);
        if (!prayerTimes) {
            throw new Error('Could not retrieve prayer times');
        }
        console.log("Prayer times received:", prayerTimes);
        
        // Calculate other data
        console.log("Calculating additional data...");
        const [currentPhase, illumination] = calculateMoonPhase();
        console.log("Moon phase calculated:", currentPhase, illumination);
        
        const hijriDate = gregorianToHijri(now);
        console.log("Hijri date calculated:", hijriDate);
        
        const gregorianDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        console.log("Gregorian date formatted:", gregorianDate);
        
        const qiblaDirection = calculateQibla(latitude, longitude);
        console.log("Qibla direction calculated:", qiblaDirection);
        
        // Update UI with all data (including latitude/longitude)
        const data = {
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
        };
        
        console.log("Data prepared, updating UI");
        updateUI(data);
        console.log("Data fetch and UI update complete");
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        const errorMessage = `Error: ${error.message}. Please check your connection and try again.`;
        console.error(errorMessage);
        
        // Display error in UI instead of alert
        const container = document.querySelector('.container');
        const errorDiv = document.createElement('div');
        errorDiv.style.backgroundColor = '#ffdddd';
        errorDiv.style.color = '#d00';
        errorDiv.style.padding = '10px';
        errorDiv.style.margin = '10px 0';
        errorDiv.style.borderRadius = '8px';
        errorDiv.textContent = errorMessage;
        
        // Insert after header
        const header = document.querySelector('.header');
        if (header && container) {
            container.insertBefore(errorDiv, header.nextSibling);
        }
    }
}

// Notification functionality
async function requestNotificationPermission() {

  if (!("Notification" in window)) {
    console.log("This browser doesn't support notifications.");
    return false;
  }


  if (Notification.permission === "granted") {
    return true;
  }


  const permission = await Notification.requestPermission();
  return permission === "granted";
}

async function sendPrayerNotification(prayerName) {

  const hasPermission = await requestNotificationPermission();
  
  if (hasPermission) {
    try {
      new Notification("Prayer Time", {
        body: `It's time for ${prayerName}!`,
        icon: 'sujud.svg'
      });
    } catch (error) {
      console.error("Failed to show notification:", error);
    }
  } else {
    console.log("Cannot show notification - permission not granted");
  }
}

document.getElementById('notify-btn').addEventListener('click', () => {
  sendPrayerNotification("this works !");
});

function checkPrayerTime() {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const prayers = {
        'Fajr': document.querySelector('#fajr .time').textContent,
        'Dhuhr': document.querySelector('#dhuhr .time').textContent,
        'Asr': document.querySelector('#asr .time').textContent,
        'Maghrib': document.querySelector('#maghrib .time').textContent,
        'Isha': document.querySelector('#isha .time').textContent
    };

    for (const [name, time] of Object.entries(prayers)) {
        if (currentTime === time) {
            sendPrayerNotification(name);
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async function() {
    console.log("DOM loaded, initializing application...");
    
    try {
        // Get location data from IP
        console.log("Fetching location data from IP address...");
        const locationData = await getPublicIp();
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
        
        // Set up timers
        console.log("Setting up timers for prayer updates");
        setInterval(updateNextPrayer, 60000); // Update countdown every minute
        setInterval(checkPrayerTime, 60000); // Check for prayer times every minute
        
        // Request notification permission
        console.log("Requesting notification permission");
        await requestNotificationPermission();
        
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
});