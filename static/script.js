// Current date and time
const now = new Date();
const today = now.getFullYear().toString() +
	(now.getMonth() + 1).toString().padStart(2, '0') +
	now.getDate().toString().padStart(2, '0') +
	now.getHours().toString().padStart(2, '0') +
	now.getMinutes().toString().padStart(2, '0');

// Default location (Bahrain)
const defaultLocation = {
	city: "Manama",
	country: "Bahrain",
	latitude: 26.2235,
	longitude: 50.5876,
	timezone: "AST"
};

// Get public IP
async function getPublicIp() {
	try {
		const response = await fetch('https://api.ipify.org?format=json');
		const data = await response.json();
		return data.ip;
	} catch (error) {
		console.error('Error getting public IP:', error);
		return null;
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

// Convert Gregorian to Hijri date
function gregorianToHijri(date) {
	const day = date.getDate();
	const month = date.getMonth() + 1;
	const year = date.getFullYear();
	
	let jd = Math.floor((11 * year + 3) / 30) + 
			Math.floor(354 * year) + 
			Math.floor(30 * month - 30 * 0.5) + day - 385;
	
	let hijriYear = Math.floor(jd / 354.367);
	let remainingDays = jd - Math.floor(hijriYear * 354.367);
	
	// Adjust for accuracy
	if (remainingDays < 0) {
		hijriYear--;
		remainingDays = jd - Math.floor(hijriYear * 354.367);
	}
	
	// Determine month and day
	const hijriMonthNames = [
		"Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
		"Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Shaban",
		"Ramadan", "Shawwal", "Dhu al-Qadah", "Dhu al-Hijjah"
	];
	
	let hijriMonth = 1;
	let tempDays = remainingDays;
	const monthLengths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
	
	while (tempDays > monthLengths[hijriMonth - 1]) {
		tempDays -= monthLengths[hijriMonth - 1];
		hijriMonth++;
		
		if (hijriMonth > 12) {
			hijriYear++;
			hijriMonth = 1;
		}
	}
	
	const hijriDay = Math.floor(tempDays);
	
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

// Update UI with data
function updateUI(data) {
	console.log("Updating UI with fetched data:", data);
	const { city, country, timezone, prayerTimes, hijriDate, gregorianDate, currentPhase, illumination, qiblaDirection } = data;
	
	// Update location info
	document.getElementById('location-display').textContent = `${city}, ${country}`;
	document.getElementById('timezone-display').textContent = timezone;
	console.log("Updated location display:", city, country, timezone);
	
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
		
		// Update UI with all data
		const data = {
			city,
			country,
			timezone,
			prayerTimes,
			hijriDate,
			gregorianDate,
			currentPhase,
			illumination,
			qiblaDirection
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
let notificationPermission = false;

async function requestNotificationPermission() {
	if (!("Notification" in window)) {
		console.log("This browser does not support notifications");
		return;
	}

	const permission = await Notification.requestPermission();
	notificationPermission = permission === "granted";
}

function sendPrayerNotification(prayerName) {
	if (notificationPermission) {
		new Notification("Prayer Time", {
			body: `It's time for ${prayerName} prayer`
		});
	}
}

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
		// Get public IP for logging purposes
		const ip = await getPublicIp();
		console.log("IP address obtained:", ip);
		
		// Initial data load using default location
		console.log("Loading data for default location:", defaultLocation);
		await fetchData(
			defaultLocation.city,
			defaultLocation.country,
			defaultLocation.latitude,
			defaultLocation.longitude,
			defaultLocation.timezone
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
		document.getElementById('loading').innerHTML = `<div class="error">Error loading data: ${error.message}</div>`;
	}
});
