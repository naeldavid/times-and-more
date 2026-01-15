"use strict";

const translations = {
    en: {
        'title': 'Prayer Times & More',
        'auto-detect': 'Auto-detect',
        'loading': 'Loading...',
        'qibla-direction': 'Qibla Direction from North',
        'loading-gregorian': 'Loading Gregorian date...',
        'loading-hijri': 'Loading Hijri date...',
        'fajr': 'Fajr',
        'dhuhr': 'Dhuhr',
        'asr': 'Asr',
        'maghrib': 'Maghrib',
        'isha': 'Isha',
        'time-until': 'Time until next prayer',
        'gregorian': 'Gregorian',
        'hijri': 'Hijri',
        'illuminated': 'illuminated',
        'new-moon': 'New Moon',
        'waxing-crescent': 'Waxing Crescent',
        'first-quarter': 'First Quarter',
        'waxing-gibbous': 'Waxing Gibbous',
        'full-moon': 'Full Moon',
        'waning-gibbous': 'Waning Gibbous',
        'last-quarter': 'Last Quarter',
        'waning-crescent': 'Waning Crescent',
        'error-location': 'Unable to get your location. Using default location (Manama, Bahrain).',
        'error-prayer-times': 'Unable to load prayer times. Please check your internet connection.',
        'error-general': 'An error occurred. Please refresh the page.',
        'using-fallback': 'Using default prayer times for your location.',
        'muharram': 'Muharram',
        'safar': 'Safar',
        'rabi-al-awwal': 'Rabi al-Awwal',
        'rabi-al-thani': 'Rabi al-Thani',
        'jumada-al-awwal': 'Jumada al-Awwal',
        'jumada-al-thani': 'Jumada al-Thani',
        'rajab': 'Rajab',
        'shaban': 'Shaban',
        'ramadan': 'Ramadan',
        'shawwal': 'Shawwal',
        'dhu-al-qadah': 'Dhu al-Qadah',
        'dhu-al-hijjah': 'Dhu al-Hijjah'
    },
    ar: {
        'title': 'مواقيت الصلاة والمزيد',
        'auto-detect': 'كشف تلقائي',
        'loading': 'جاري التحميل...',
        'qibla-direction': 'اتجاه القبلة من الشمال',
        'loading-gregorian': 'جاري تحميل التاريخ الميلادي...',
        'loading-hijri': 'جاري تحميل التاريخ الهجري...',
        'fajr': 'الفجر',
        'dhuhr': 'الظهر',
        'asr': 'العصر',
        'maghrib': 'المغرب',
        'isha': 'العشاء',
        'time-until': 'الوقت المتبقي للصلاة التالية',
        'gregorian': 'ميلادي',
        'hijri': 'هجري',
        'illuminated': 'مضاء',
        'new-moon': 'محاق',
        'waxing-crescent': 'هلال متزايد',
        'first-quarter': 'تربيع أول',
        'waxing-gibbous': 'أحدب متزايد',
        'full-moon': 'بدر',
        'waning-gibbous': 'أحدب متناقص',
        'last-quarter': 'تربيع أخير',
        'waning-crescent': 'هلال متناقص',
        'error-location': 'تعذر تحديد موقعك. استخدام الموقع الافتراضي (المنامة، البحرين).',
        'error-prayer-times': 'تعذر تحميل أوقات الصلاة. يرجى التحقق من اتصال الإنترنت.',
        'error-general': 'حدث خطأ. يرجى تحديث الصفحة.',
        'using-fallback': 'استخدام أوقات الصلاة الافتراضية لموقعك.',
        'muharram': 'محرم',
        'safar': 'صفر',
        'rabi-al-awwal': 'ربيع الأول',
        'rabi-al-thani': 'ربيع الآخر',
        'jumada-al-awwal': 'جمادى الأولى',
        'jumada-al-thani': 'جمادى الآخرة',
        'rajab': 'رجب',
        'shaban': 'شعبان',
        'ramadan': 'رمضان',
        'shawwal': 'شوال',
        'dhu-al-qadah': 'ذو القعدة',
        'dhu-al-hijjah': 'ذو الحجة'
    },
    fr: {
        'title': 'Heures de Prière et Plus',
        'auto-detect': 'Détection automatique',
        'loading': 'Chargement...',
        'qibla-direction': 'Direction de la Qibla depuis le Nord',
        'loading-gregorian': 'Chargement de la date grégorienne...',
        'loading-hijri': 'Chargement de la date hijri...',
        'fajr': 'Fajr',
        'dhuhr': 'Dhuhr',
        'asr': 'Asr',
        'maghrib': 'Maghrib',
        'isha': 'Isha',
        'time-until': 'Temps jusqu\'à la prochaine prière',
        'gregorian': 'Grégorien',
        'hijri': 'Hijri',
        'illuminated': 'illuminé',
        'new-moon': 'Nouvelle Lune',
        'waxing-crescent': 'Premier Croissant',
        'first-quarter': 'Premier Quartier',
        'waxing-gibbous': 'Lune Gibbeuse Croissante',
        'full-moon': 'Pleine Lune',
        'waning-gibbous': 'Lune Gibbeuse Décroissante',
        'last-quarter': 'Dernier Quartier',
        'waning-crescent': 'Dernier Croissant',
        'error-location': 'Impossible d\'obtenir votre position. Utilisation de l\'emplacement par défaut (Manama, Bahreïn).',
        'error-prayer-times': 'Impossible de charger les heures de prière. Veuillez vérifier votre connexion Internet.',
        'error-general': 'Une erreur s\'est produite. Veuillez actualiser la page.',
        'using-fallback': 'Utilisation des horaires de prière par défaut pour votre emplacement.',
        'muharram': 'Muharram',
        'safar': 'Safar',
        'rabi-al-awwal': 'Rabi al-Awwal',
        'rabi-al-thani': 'Rabi al-Thani',
        'jumada-al-awwal': 'Joumada al-Oula',
        'jumada-al-thani': 'Joumada ath-Thania',
        'rajab': 'Rajab',
        'shaban': 'Chaabane',
        'ramadan': 'Ramadan',
        'shawwal': 'Chawwal',
        'dhu-al-qadah': 'Dhou al-Qaada',
        'dhu-al-hijjah': 'Dhou al-Hijja'
    }
};

let currentLanguage = 'en';

function detectLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.split('-')[0];
    return translations[langCode] ? langCode : 'en';
}

function applyTranslations(lang) {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(el => {
        const key = el.getAttribute('data-translate');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
    
    // Update prayer names
    const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    prayers.forEach(prayer => {
        const element = document.querySelector(`#${prayer} .prayer-name`);
        if (element && translations[lang] && translations[lang][prayer]) {
            element.textContent = translations[lang][prayer];
        }
    });
    
    // Update countdown label
    const countdownLabel = document.querySelector('.countdown-label');
    if (countdownLabel && translations[lang] && translations[lang]['time-until']) {
        countdownLabel.innerHTML = `${translations[lang]['time-until']}: <span id="next-prayer-name"></span>`;
    }
    
    document.documentElement.lang = lang;
    if (lang === 'ar') {
        document.documentElement.dir = 'rtl';
        document.body.style.fontFamily = 'Tahoma, Arial, sans-serif';
    } else {
        document.documentElement.dir = 'ltr';
        document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    }
}

function getTranslation(key) {
    return translations[currentLanguage] && translations[currentLanguage][key] ? translations[currentLanguage][key] : key;
}

function translateMoonPhase(phase) {
    const phaseKey = phase.toLowerCase().replace(/\s+/g, '-');
    return getTranslation(phaseKey);
}

function initializeLanguage() {
    const savedLang = localStorage.getItem('preferredLanguage');
    const languageSelect = document.getElementById('language-select');
    
    if (savedLang && savedLang !== 'auto') {
        currentLanguage = savedLang;
        languageSelect.value = savedLang;
    } else {
        currentLanguage = detectLanguage();
        languageSelect.value = 'auto';
    }
    
    applyTranslations(currentLanguage);
}

document.addEventListener('DOMContentLoaded', function() {
    initializeLanguage();
    
    document.getElementById('language-select').addEventListener('change', function(e) {
        const selectedLang = e.target.value;
        
        if (selectedLang === 'auto') {
            currentLanguage = detectLanguage();
            localStorage.removeItem('preferredLanguage');
        } else {
            currentLanguage = selectedLang;
            localStorage.setItem('preferredLanguage', selectedLang);
        }
        
        applyTranslations(currentLanguage);
        
        // Re-translate dynamic content if it exists
        if (window.updateDynamicTranslations) {
            window.updateDynamicTranslations();
        }
    });
});

window.updateDynamicTranslations = () => {
    // Update dates
    const gregorianEl = document.getElementById('gregorian-date');
    const hijriEl = document.getElementById('hijri-date');
    
    if (gregorianEl && gregorianEl.textContent.includes(':')) {
        const date = gregorianEl.textContent.split(': ')[1];
        gregorianEl.textContent = `${getTranslation('gregorian')}: ${date}`;
    }
    
    if (hijriEl && hijriEl.textContent.includes(':')) {
        const date = hijriEl.textContent.split(': ')[1];
        hijriEl.textContent = `${getTranslation('hijri')}: ${date}`;
    }
    
    // Update moon phase
    const moonPhaseTextEl = document.getElementById('moon-phase-text');
    if (moonPhaseTextEl && moonPhaseTextEl.innerHTML.includes('<br>')) {
        const parts = moonPhaseTextEl.innerHTML.split('<br>');
        const illuminationMatch = parts[1].match(/(\d+)%/);
        if (illuminationMatch) {
            const illumination = parseInt(illuminationMatch[1]);
            let originalPhase = parts[0];
            
            // Find original English phase name by checking all languages
            const phaseKeys = ['new-moon', 'waxing-crescent', 'first-quarter', 'waxing-gibbous', 'full-moon', 'waning-gibbous', 'last-quarter', 'waning-crescent'];
            let englishPhase = originalPhase;
            
            // Check if current phase matches any translation
            for (const key of phaseKeys) {
                if (translations.en[key] === originalPhase || 
                    translations.ar[key] === originalPhase || 
                    translations.fr[key] === originalPhase) {
                    englishPhase = translations.en[key];
                    break;
                }
            }
            
            const translatedPhase = translateMoonPhase(englishPhase);
            const translatedIlluminated = getTranslation('illuminated');
            moonPhaseTextEl.innerHTML = `${translatedPhase}<br>${illumination}% ${translatedIlluminated}`;
        }
    }
    
    // Update qibla direction text
    const qiblaText = document.querySelector('.qibla-container small');
    if (qiblaText) {
        const directionSpan = qiblaText.querySelector('#qibla-direction');
        if (directionSpan) {
            const direction = directionSpan.textContent;
            qiblaText.innerHTML = `${getTranslation('qibla-direction')}: <span id="qibla-direction">${direction}</span>`;
        }
    }
    
    // Update next prayer name in countdown
    const nextPrayerEl = document.getElementById('next-prayer-name');
    if (nextPrayerEl && nextPrayerEl.textContent) {
        const prayerName = nextPrayerEl.textContent.toLowerCase();
        const translatedName = getTranslation(prayerName);
        nextPrayerEl.textContent = translatedName;
    }
};

window.getTranslation = getTranslation;
window.translateMoonPhase = translateMoonPhase;
window.getCurrentLanguage = () => currentLanguage;