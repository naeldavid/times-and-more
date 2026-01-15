"use strict";

// Default location fallback
const defaultLocation = {
    city: 'Manama',
    country: 'Bahrain',
    latitude: 26.2285,
    longitude: 50.5860,
    timezone: 'Asia/Bahrain'
};

// Calculation method mapping by region
const calculationMethodsByRegion = {
    'North America': '2',  // ISNA
    'Europe': '3',         // MWL
    'Middle East': '4',    // Umm al-Qura
    'Asia': '1',           // Karachi
    'Africa': '5'          // Egyptian
};

let notificationPermissionGranted = false;
let currentCalculationMethod = 'auto';
let currentTheme = 'dark';
let notificationsEnabled = false;
let notificationSoundEnabled = false;
let advanceNotificationMinutes = 0;
let asrSchool = '0';
let timeAdjustmentMinutes = 0;
// High contrast removed (dark theme only)
let highContrastEnabled = false;
let isLoading = false;
let lastUpdated = null;

// Simple client-side error log (kept small)
const errorLog = [];

function logError(message, context = {}) {
    try {
        const entry = {
            at: new Date().toISOString(),
            message: String(message),
            context
        };
        errorLog.unshift(entry);
        errorLog.splice(20);
        localStorage.setItem('errorLog', JSON.stringify(errorLog));
    } catch (_) {
        // ignore
    }
}

// DOM element cache
const DOMCache = {};

/**
 * Initialize and cache DOM elements
 */
function initDOMCache() {
    DOMCache.loadingOverlay = document.getElementById('loading-overlay');
    DOMCache.locationDisplay = document.getElementById('location-display');
    DOMCache.timezoneDisplay = document.getElementById('timezone-display');
    DOMCache.gregorianDate = document.getElementById('gregorian-date');
    DOMCache.hijriDate = document.getElementById('hijri-date');
    DOMCache.moonPhase = document.getElementById('moon-phase');
    DOMCache.moonPhaseText = document.getElementById('moon-phase-text');
    DOMCache.qiblaDirection = document.getElementById('qibla-direction');
    DOMCache.qiblaArrow = document.getElementById('qibla-arrow');
    DOMCache.nextPrayerName = document.getElementById('next-prayer-name');
    DOMCache.countdownTimer = document.getElementById('countdown-timer');
    DOMCache.refreshBtn = document.getElementById('refresh-btn');
    DOMCache.statusIndicator = document.getElementById('status-indicator');
    DOMCache.statusText = document.getElementById('status-text');
    DOMCache.lastUpdatedEl = document.getElementById('last-updated');
    DOMCache.prayerElements = {
        fajr: document.getElementById('fajr'),
        dhuhr: document.getElementById('dhuhr'),
        asr: document.getElementById('asr'),
        maghrib: document.getElementById('maghrib'),
        isha: document.getElementById('isha')
    };
}

/**
 * Update status indicator
 * @param {string} message - Status message
 * @param {boolean} isOffline - Whether app is offline
 */
function formatLastUpdated(date) {
    if (!date) return '';
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin === 1) return '1 min ago';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr === 1) return '1 hour ago';
    return `${diffHr} hours ago`;
}

function updateStatusIndicator(message, isOffline = false) {
    if (DOMCache.statusIndicator && DOMCache.statusText) {
        DOMCache.statusText.textContent = message;
        if (DOMCache.lastUpdatedEl) {
            DOMCache.lastUpdatedEl.textContent = lastUpdated ? formatLastUpdated(lastUpdated) : '';
        }
        if (isOffline) {
            DOMCache.statusIndicator.classList.add('offline');
        } else {
            DOMCache.statusIndicator.classList.remove('offline');
        }
        DOMCache.statusIndicator.removeAttribute('hidden');
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
            if (DOMCache.statusIndicator) {
                DOMCache.statusIndicator.setAttribute('hidden', '');
            }
        }, 4000);
    }
}

/**
 * Setup refresh button
 */
function setupRefreshButton() {
    if (DOMCache.refreshBtn) {
        DOMCache.refreshBtn.addEventListener('click', async () => {
            if (isLoading || !locationData) return;
            
            DOMCache.refreshBtn.classList.add('spinning');
            updateStatusIndicator('Refreshing...');
            
            await fetchData(
                locationData.city,
                locationData.country,
                locationData.latitude,
                locationData.longitude,
                locationData.timezone,
                true
            );
            
            DOMCache.refreshBtn.classList.remove('spinning');
            updateStatusIndicator('Updated successfully');
        });
    }
}

/**
 * Show loading overlay
 */
function setPrayerSkeletonLoading(isActive) {
    if (!DOMCache.prayerElements) return;
    Object.values(DOMCache.prayerElements).forEach((el) => {
        if (!el) return;
        if (isActive) {
            el.classList.add('loading');
        } else {
            el.classList.remove('loading');
        }
    });
}

function showLoading() {
    if (DOMCache.loadingOverlay) {
        DOMCache.loadingOverlay.removeAttribute('hidden');
    }
    setPrayerSkeletonLoading(true);
    isLoading = true;
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    if (DOMCache.loadingOverlay) {
        DOMCache.loadingOverlay.setAttribute('hidden', '');
    }
    setPrayerSkeletonLoading(false);
    isLoading = false;
}

function applyTheme() {
    // Dark theme only
    document.documentElement.setAttribute('data-theme', 'dark');

    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', '#000000');
}

function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.user-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `user-notification ${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    notification.textContent = message;
    
    const header = document.querySelector('.header');
    if (header) {
        header.parentNode.insertBefore(notification, header.nextSibling);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
}

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
                        // Silently fail for geocoding - not critical
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
                    const errorMsg = window.getTranslation ? window.getTranslation('error-location') : 'Unable to get your location. Using default location.';
                    showNotification(errorMsg, 'warning');
                    resolve(defaultLocation);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
            );
        } else {
            const errorMsg = window.getTranslation ? window.getTranslation('error-location') : 'Unable to get your location. Using default location.';
            showNotification(errorMsg, 'warning');
            resolve(defaultLocation);
        }
    });
}

function getCalculationMethodForLocation(latitude, longitude) {
    // Simple region detection based on coordinates
    if (latitude >= 24 && latitude <= 71 && longitude >= -168 && longitude <= -52) {
        return '2'; // North America - ISNA
    } else if (latitude >= 35 && latitude <= 71 && longitude >= -10 && longitude <= 40) {
        return '3'; // Europe - MWL
    } else if (latitude >= 12 && latitude <= 42 && longitude >= 34 && longitude <= 63) {
        return '4'; // Middle East - Umm al-Qura
    } else if (latitude >= -35 && latitude <= 37 && longitude >= -18 && longitude <= 52) {
        return '5'; // Africa - Egyptian
    } else if (latitude >= -10 && latitude <= 55 && longitude >= 60 && longitude <= 150) {
        return '1'; // Asia - Karachi
    }
    return '4'; // Default to Umm al-Qura
}

/**
 * Fetch with retry and timeout
 */
async function fetchWithRetry(url, { retries = 2, timeoutMs = 10000 } = {}) {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(t);
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }
            return res;
        } catch (e) {
            clearTimeout(t);
            lastErr = e;
            if (attempt < retries) {
                await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
            }
        }
    }
    throw lastErr;
}

function isValidTimingsObject(timings) {
    if (!timings || typeof timings !== 'object') return false;
    const required = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    return required.every(k => typeof timings[k] === 'string' && /^\d{2}:\d{2}/.test(timings[k]));
}

function addMinutesToTimeString(timeStr, minutesToAdd) {
    const match = /^\s*(\d{1,2}):(\d{2})/.exec(timeStr);
    if (!match) return timeStr;
    let h = Number(match[1]);
    let m = Number(match[2]);
    let total = h * 60 + m + minutesToAdd;
    total = (total % (24 * 60) + (24 * 60)) % (24 * 60);
    const hh = Math.floor(total / 60).toString().padStart(2, '0');
    const mm = (total % 60).toString().padStart(2, '0');
    return `${hh}:${mm}`;
}

function applyLocalAdjustments(timings) {
    if (!isValidTimingsObject(timings)) return timings;
    if (!timeAdjustmentMinutes) return timings;
    const adjusted = { ...timings };
    ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach((k) => {
        adjusted[k] = addMinutesToTimeString(adjusted[k], timeAdjustmentMinutes);
    });
    return adjusted;
}

async function getPrayerTimes(latitude, longitude, timezone) {
    try {
        // Use current date in YYYY-MM-DD format
        const now = new Date();
        const dateStr = now.getFullYear() + '-' + 
                       (now.getMonth() + 1).toString().padStart(2, '0') + '-' + 
                       now.getDate().toString().padStart(2, '0');
        
        // Determine calculation method
        let method = currentCalculationMethod;
        if (method === 'auto') {
            method = getCalculationMethodForLocation(latitude, longitude);
        }

        const params = new URLSearchParams({
            latitude: String(latitude),
            longitude: String(longitude),
            method: String(method),
            timezonestring: String(timezone),
            school: String(asrSchool)
        });

        const url = `https://api.aladhan.com/v1/timings/${dateStr}?${params.toString()}`;
        const response = await fetchWithRetry(url, { retries: 2, timeoutMs: 12000 });
        const data = await response.json();

        // Basic API response validation
        if (!data || data.code !== 200 || data.status !== 'OK' || !data.data || !data.data.timings) {
            throw new Error('Invalid API response');
        }

        const timings = data.data.timings;
        if (!isValidTimingsObject(timings)) {
            throw new Error('Invalid timings data');
        }

        return applyLocalAdjustments(timings);
    } catch (error) {
        logError('getPrayerTimes failed', { error: String(error) });
        const errorMsg = window.getTranslation ? window.getTranslation('error-prayer-times') : 'Unable to load prayer times.';
        showNotification(errorMsg, 'error');

        return applyLocalAdjustments({
            Fajr: "05:00",
            Sunrise: "06:00",
            Dhuhr: "12:00",
            Asr: "15:00",
            Maghrib: "18:00",
            Isha: "19:30",
        });
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
    
    const hijriMonthKeys = [
        'muharram','safar','rabi-al-awwal','rabi-al-thani',
        'jumada-al-awwal','jumada-al-thani','rajab','shaban',
        'ramadan','shawwal','dhu-al-qadah','dhu-al-hijjah'
    ];

    const key = hijriMonthKeys[hijriMonth - 1];
    const monthName = window.getTranslation ? window.getTranslation(key) : key;

    return `${hijriDay} ${monthName} ${hijriYear} AH`;
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
                // Fallback to method 2
            }
        }
        
        if (latitude && longitude && timezone) {
            try {
                const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
                const localDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
                offsetMinutes = (localDate.getTime() - utcDate.getTime()) / (1000 * 60);
            } catch (e) {
                // Use default
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
        return 'GMT+03';
    }
}

function updateUI(data) {
    const { city, country, timezone, prayerTimes, hijriDate, gregorianDate, currentPhase, illumination, qiblaDirection } = data;
    
    document.getElementById('location-display').textContent = `${city}, ${country}`;
    document.getElementById('timezone-display').textContent = getGMTOffset(timezone, data.latitude, data.longitude);
    document.getElementById('gregorian-date').textContent = `Gregorian: ${gregorianDate}`;
    document.getElementById('hijri-date').textContent = `Hijri: ${hijriDate}`;
    
    const moonPhase = document.getElementById('moon-phase');
    const moonPhaseText = document.getElementById('moon-phase-text');
    
    if (moonPhase && moonPhaseText) {
        moonPhase.setAttribute('phase', currentPhase);
        moonPhase.style.setProperty('--illumination', `${illumination}%`);
        moonPhaseText.innerHTML = `${currentPhase}<br>${illumination}% illuminated`;
    }
    
    document.getElementById('qibla-direction').textContent = `${qiblaDirection}°`;
    document.getElementById('qibla-arrow').style.transform = `rotate(${qiblaDirection}deg)`;
    
    document.querySelector('#fajr .time').textContent = prayerTimes['Fajr'];
    document.querySelector('#dhuhr .time').textContent = prayerTimes['Dhuhr'];
    document.querySelector('#asr .time').textContent = prayerTimes['Asr'];
    document.querySelector('#maghrib .time').textContent = prayerTimes['Maghrib'];
    document.querySelector('#isha .time').textContent = prayerTimes['Isha'];
    
    updateNextPrayer();
    
    // Trigger translation update after content is loaded
    setTimeout(() => {
        if (window.updateDynamicTranslations) {
            window.updateDynamicTranslations();
        }
    }, 100);
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

/**
 * Fetch and display prayer times and related data
 * @param {string} city - City name
 * @param {string} country - Country name
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {string} timezone - Timezone string
 * @param {boolean} showLoader - Whether to show loading overlay
 */
async function fetchData(city, country, latitude, longitude, timezone, showLoader = true) {
    try {
        if (showLoader) showLoading();
        
        const prayerTimes = await getPrayerTimes(latitude, longitude, timezone);
        if (!prayerTimes) throw new Error('Could not retrieve prayer times');
        
        const now = new Date();
        const [currentPhase, illumination] = calculateMoonPhase();
        const hijriDate = gregorianToHijri(now);
        const gregorianDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const qiblaDirection = calculateQibla(latitude, longitude);
        
        lastUpdated = new Date();
        updateStatusIndicator('Updated', !navigator.onLine);
        
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
        
        if (showLoader) hideLoading();
    } catch (error) {
        if (showLoader) hideLoading();
        
        const errorMsg = window.getTranslation ? window.getTranslation('error-general') : 'An error occurred. Please refresh the page.';
        showNotification(errorMsg, 'error');
        
        // Fallback to default location (avoid infinite loop)
        if (latitude !== defaultLocation.latitude || longitude !== defaultLocation.longitude) {
            await fetchData(
                defaultLocation.city,
                defaultLocation.country,
                defaultLocation.latitude,
                defaultLocation.longitude,
                defaultLocation.timezone,
                false
            );
        }
    }
}

function syncNotificationPermissionState() {
    if (!('Notification' in window)) {
        notificationPermissionGranted = false;
        return false;
    }
    notificationPermissionGranted = (Notification.permission === 'granted');
    return notificationPermissionGranted;
}

async function requestNotificationPermission() {
    if (!('Notification' in window)) return false;

    // Keep internal flag in sync
    syncNotificationPermissionState();

    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    try {
        const permission = await Notification.requestPermission();
        notificationPermissionGranted = (permission === 'granted');
        return notificationPermissionGranted;
    } catch (error) {
        logError('requestNotificationPermission failed', { error: String(error) });
        notificationPermissionGranted = false;
        return false;
    }
}

function playNotificationSound() {
    if (!notificationSoundEnabled) return;
    
    // Create a simple beep sound using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        // Audio not supported or blocked
    }
}

let lastNotificationKey = null;

async function sendPrayerNotification(prayerName) {
    if (!notificationsEnabled) return;
    if (!syncNotificationPermissionState()) return;

    // De-dupe within the same minute to avoid repeats
    const now = new Date();
    const key = `${now.toDateString()}-${now.getHours()}:${now.getMinutes()}-${prayerName}`;
    if (lastNotificationKey === key) return;
    lastNotificationKey = key;

    const title = 'Prayer Time';
    const options = {
        body: `It's time for ${prayerName} prayer!`,
        icon: '/static/sujud.svg',
        tag: 'prayer-notification',
        requireInteraction: false
    };

    try {
        // Prefer SW notifications when available (more reliable for installed PWAs)
        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            if (reg && 'showNotification' in reg) {
                await reg.showNotification(title, options);
                playNotificationSound();
                return;
            }
        }

        // Fallback
        new Notification(title, options);
        playNotificationSound();
    } catch (error) {
        logError('Notification failed', { error: String(error) });
    }
}

async function checkPrayerTime() {
    if (!notificationsEnabled) return;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const fajrEl = DOMCache.prayerElements?.fajr?.querySelector('.time');
    if (!fajrEl || !fajrEl.textContent) return;

    const prayers = {
        'Fajr': DOMCache.prayerElements?.fajr?.querySelector('.time')?.textContent,
        'Dhuhr': DOMCache.prayerElements?.dhuhr?.querySelector('.time')?.textContent,
        'Asr': DOMCache.prayerElements?.asr?.querySelector('.time')?.textContent,
        'Maghrib': DOMCache.prayerElements?.maghrib?.querySelector('.time')?.textContent,
        'Isha': DOMCache.prayerElements?.isha?.querySelector('.time')?.textContent
    };

    for (const [name, time] of Object.entries(prayers)) {
        if (!time) continue;
        const notifyTime = advanceNotificationMinutes ? addMinutesToTimeString(time, -advanceNotificationMinutes) : time;
        if (currentTime === notifyTime) {
            const label = advanceNotificationMinutes ? `${name} in ${advanceNotificationMinutes} min` : name;
            await sendPrayerNotification(label);
        }
    }
}

function debounce(fn, delayMs = 250) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), delayMs);
    };
}

function coerceNumberInRange(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
}

function applyContrastSetting() {
    // High contrast option removed; ensure attribute is not set.
    document.documentElement.removeAttribute('data-contrast');
}

function setupSettings() {
    // Load saved settings
    notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
    notificationSoundEnabled = localStorage.getItem('notificationSound') === 'true';
    syncNotificationPermissionState();
    advanceNotificationMinutes = coerceNumberInRange(localStorage.getItem('advanceNotificationMinutes') ?? '0', 0, 15, 0);
    asrSchool = (localStorage.getItem('asrSchool') === '1') ? '1' : '0';
    timeAdjustmentMinutes = coerceNumberInRange(localStorage.getItem('timeAdjustmentMinutes') ?? '0', -10, 10, 0);
    // High contrast removed
    highContrastEnabled = false;
    localStorage.removeItem('highContrast');

    applyContrastSetting();

    const notifCheckbox = document.getElementById('enable-notifications');
    const soundCheckbox = document.getElementById('notification-sound');
    const advanceSelect = document.getElementById('advance-notif');
    const asrSelect = document.getElementById('asr-school');
    const adjustSelect = document.getElementById('time-adjust');
    // High contrast option removed
    const contrastCheckbox = null;

    if (notifCheckbox) notifCheckbox.checked = notificationsEnabled;
    if (soundCheckbox) soundCheckbox.checked = notificationSoundEnabled;
    if (advanceSelect) advanceSelect.value = String(advanceNotificationMinutes);
    if (asrSelect) asrSelect.value = String(asrSchool);
    if (adjustSelect) adjustSelect.value = String(timeAdjustmentMinutes);
    // high contrast removed

    // Settings toggle
    const settingsToggle = document.getElementById('settings-toggle');
    const settingsPanel = document.getElementById('settings-panel');

    if (settingsToggle && settingsPanel) {
        settingsToggle.addEventListener('click', () => {
            const isHidden = settingsPanel.hasAttribute('hidden');
            if (isHidden) {
                settingsPanel.removeAttribute('hidden');
                settingsToggle.setAttribute('aria-expanded', 'true');
            } else {
                settingsPanel.setAttribute('hidden', '');
                settingsToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    const persist = debounce(() => {
        localStorage.setItem('notificationsEnabled', String(notificationsEnabled));
        localStorage.setItem('notificationSound', String(notificationSoundEnabled));
        localStorage.setItem('advanceNotificationMinutes', String(advanceNotificationMinutes));
        localStorage.setItem('asrSchool', String(asrSchool));
        localStorage.setItem('timeAdjustmentMinutes', String(timeAdjustmentMinutes));
        // highContrast removed
    }, 200);

    // Notification toggle
    if (notifCheckbox) {
        notifCheckbox.addEventListener('change', async (e) => {
            notificationsEnabled = Boolean(e.target.checked);
            persist();

            // Ensure we have permission if user enabled notifications
            if (notificationsEnabled && !syncNotificationPermissionState()) {
                const granted = await requestNotificationPermission();
                syncNotificationPermissionState();
                if (!granted) {
                    notifCheckbox.checked = false;
                    notificationsEnabled = false;
                    persist();
                    showNotification('Notification permission denied', 'warning');
                }
            }
        });
    }

    // Sound toggle
    if (soundCheckbox) {
        soundCheckbox.addEventListener('change', (e) => {
            notificationSoundEnabled = Boolean(e.target.checked);
            persist();
        });
    }

    if (advanceSelect) {
        advanceSelect.addEventListener('change', (e) => {
            advanceNotificationMinutes = coerceNumberInRange(e.target.value, 0, 15, 0);
            persist();
        });
    }

    if (asrSelect) {
        asrSelect.addEventListener('change', async (e) => {
            asrSchool = (e.target.value === '1') ? '1' : '0';
            persist();
            if (locationData) {
                await fetchData(locationData.city, locationData.country, locationData.latitude, locationData.longitude, locationData.timezone, true);
            }
        });
    }

    if (adjustSelect) {
        adjustSelect.addEventListener('change', async (e) => {
            timeAdjustmentMinutes = coerceNumberInRange(e.target.value, -10, 10, 0);
            persist();
            if (locationData) {
                await fetchData(locationData.city, locationData.country, locationData.latitude, locationData.longitude, locationData.timezone, true);
            }
        });
    }

    // Test notification button
    const testBtn = document.getElementById('test-notification-btn');
    if (testBtn) {
        testBtn.addEventListener('click', async () => {
            if (!notificationPermissionGranted) {
                await requestNotificationPermission();
            }
            if (notificationsEnabled) {
                sendPrayerNotification("Test");
            } else {
                showNotification('Enable notifications first', 'info');
            }
        });
    }

    // Share button
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            try {
                const text = buildShareText();
                if (navigator.share) {
                    await navigator.share({ title: 'Times & More', text });
                } else {
                    await navigator.clipboard.writeText(text);
                    showNotification('Copied to clipboard', 'success');
                }
            } catch (e) {
                showNotification('Unable to share', 'warning');
            }
        });
    }

    // Export iCal
    const exportBtn = document.getElementById('export-ics-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            try {
                const ics = buildIcsCalendar();
                const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'prayer-times.ics';
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            } catch (e) {
                showNotification('Unable to export', 'warning');
            }
        });
    }
}

let currentDate = new Date().toDateString();
let locationData = null;

function checkMidnight() {
    const now = new Date();
    const today = now.toDateString();
    
    if (today !== currentDate) {
        currentDate = today;
        
        // Refresh prayer times with stored location data
        if (locationData) {
            fetchData(
                locationData.city,
                locationData.country,
                locationData.latitude,
                locationData.longitude,
                locationData.timezone
            );
        }
    }
}

let tickIntervalId = null;

function startTicker() {
    if (tickIntervalId) clearInterval(tickIntervalId);
    tickIntervalId = setInterval(() => {
        updateNextPrayer();
        checkPrayerTime();
        checkMidnight();
    }, 60000);
}

let autoRefreshIntervalId = null;

function startAutoRefresh() {
    if (autoRefreshIntervalId) clearInterval(autoRefreshIntervalId);

    // Every 30 minutes, refresh data (same effect as pressing Refresh)
    const intervalMs = 30 * 60 * 1000;
    autoRefreshIntervalId = setInterval(async () => {
        try {
            // Skip if tab is not visible; we'll refresh on visibilitychange.
            if (document.visibilityState !== 'visible') return;
            if (isLoading || !locationData) return;
            await fetchData(
                locationData.city,
                locationData.country,
                locationData.latitude,
                locationData.longitude,
                locationData.timezone,
                false
            );
        } catch (e) {
            logError('Auto refresh failed', { error: String(e) });
        }
    }, intervalMs);

    // Also refresh when returning to the tab after a while
    document.addEventListener('visibilitychange', async () => {
        try {
            if (document.visibilityState !== 'visible') return;
            if (isLoading || !locationData) return;
            // If last update is older than 30 minutes, refresh now.
            if (lastUpdated && (Date.now() - lastUpdated.getTime()) < intervalMs) return;
            await fetchData(
                locationData.city,
                locationData.country,
                locationData.latitude,
                locationData.longitude,
                locationData.timezone,
                false
            );
        } catch (e) {
            logError('Visibility refresh failed', { error: String(e) });
        }
    }, { passive: true });
}

let deferredPromptEvent = null;

function setupPwaInstallPrompt() {
    const installBtn = document.getElementById('install-btn');
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPromptEvent = e;
        if (installBtn) {
            installBtn.removeAttribute('hidden');
        }
    });

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPromptEvent) return;
            deferredPromptEvent.prompt();
            await deferredPromptEvent.userChoice;
            deferredPromptEvent = null;
            installBtn.setAttribute('hidden', '');
        });
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    try {
        initDOMCache();
        setupRefreshButton();
        setupPwaInstallPrompt();

        // Offline/online indicator
        window.addEventListener('offline', () => updateStatusIndicator('Offline mode', true));
        window.addEventListener('online', () => updateStatusIndicator('Back online', false));
        // Dark theme only
        currentTheme = 'dark';
        localStorage.setItem('theme', 'dark');
        applyTheme();
        
        // Load saved calculation method preference
        const savedMethod = localStorage.getItem('calculationMethod');
        if (savedMethod) {
            currentCalculationMethod = savedMethod;
            document.getElementById('calculation-select').value = savedMethod;
        }
        
        showLoading();
        locationData = await getPublicLocation();
        await fetchData(
            locationData.city,
            locationData.country,
            locationData.latitude,
            locationData.longitude,
            locationData.timezone,
            false
        );
        hideLoading();
        
        // Setup calculation method selector
        document.getElementById('calculation-select').addEventListener('change', async function(e) {
            currentCalculationMethod = e.target.value;
            localStorage.setItem('calculationMethod', currentCalculationMethod);
            
            // Refresh prayer times with new method
            if (locationData) {
                await fetchData(
                    locationData.city,
                    locationData.country,
                    locationData.latitude,
                    locationData.longitude,
                    locationData.timezone
                );
            }
        });
        
        // Do not auto-prompt for notification permission on load.
        // Just sync the internal permission state.
        syncNotificationPermissionState();

        setupSettings();
        startTicker();
        startAutoRefresh();
    } catch (error) {
        logError('Initialization failed', { error: String(error) });
        const errorMsg = window.getTranslation ? window.getTranslation('error-general') : 'Initialization failed. Please refresh.';
        showNotification(errorMsg, 'error');
    }
});

function buildShareText() {
    const city = DOMCache.locationDisplay?.textContent || '';
    const times = {
        Fajr: DOMCache.prayerElements?.fajr?.querySelector('.time')?.textContent,
        Dhuhr: DOMCache.prayerElements?.dhuhr?.querySelector('.time')?.textContent,
        Asr: DOMCache.prayerElements?.asr?.querySelector('.time')?.textContent,
        Maghrib: DOMCache.prayerElements?.maghrib?.querySelector('.time')?.textContent,
        Isha: DOMCache.prayerElements?.isha?.querySelector('.time')?.textContent
    };
    const lines = [
        `Prayer times - ${city}`,
        ...Object.entries(times).map(([k,v]) => `${k}: ${v || '--:--'}`),
        `Generated by Times & More`
    ];
    return lines.join('\n');
}

function formatDateAsIcs(dt) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth()+1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}${pad(dt.getUTCSeconds())}Z`;
}

function buildIcsCalendar() {
    // Simple daily events for today only (export) using displayed times
    const now = new Date();
    const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0));
    const city = DOMCache.locationDisplay?.textContent || 'Location';
    const times = [
        ['Fajr', DOMCache.prayerElements?.fajr?.querySelector('.time')?.textContent],
        ['Dhuhr', DOMCache.prayerElements?.dhuhr?.querySelector('.time')?.textContent],
        ['Asr', DOMCache.prayerElements?.asr?.querySelector('.time')?.textContent],
        ['Maghrib', DOMCache.prayerElements?.maghrib?.querySelector('.time')?.textContent],
        ['Isha', DOMCache.prayerElements?.isha?.querySelector('.time')?.textContent]
    ];

    const events = times
        .filter(([,t]) => t && /^\d{2}:\d{2}/.test(t))
        .map(([name, t], idx) => {
            const [hh, mm] = t.split(':').map(Number);
            const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0));
            const end = new Date(start.getTime() + 20 * 60000);
            const uid = `${now.getTime()}-${idx}@times-and-more`;
            return [
                'BEGIN:VEVENT',
                `UID:${uid}`,
                `DTSTAMP:${formatDateAsIcs(new Date())}`,
                `DTSTART:${formatDateAsIcs(start)}`,
                `DTEND:${formatDateAsIcs(end)}`,
                `SUMMARY:${name} Prayer`,
                `LOCATION:${city}`,
                'END:VEVENT'
            ].join('\r\n');
        });

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Times & More//EN',
        'CALSCALE:GREGORIAN',
        ...events,
        'END:VCALENDAR',
        ''
    ].join('\r\n');
}