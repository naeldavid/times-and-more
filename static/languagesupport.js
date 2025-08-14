"use strict";

const translations = {
    en: {
        'title': 'Times & More',
        'auto-detect': 'Auto-detect',
        'loading': 'Loading...',
        'test-notification': 'Test Notifications',
        'qibla-direction': 'Qibla Direction from North',
        'loading-gregorian': 'Loading Gregorian date...',
        'loading-hijri': 'Loading Hijri date...',
        'fajr': 'Fajr',
        'dhuhr': 'Dhuhr',
        'asr': 'Asr',
        'maghrib': 'Maghrib',
        'isha': 'Isha',
        'time-until': 'Time until next prayer'
    },
    ar: {
        'title': 'الأوقات والمزيد',
        'auto-detect': 'كشف تلقائي',
        'loading': 'جاري التحميل...',
        'test-notification': 'اختبار الإشعارات',
        'qibla-direction': 'اتجاه القبلة من الشمال',
        'loading-gregorian': 'جاري تحميل التاريخ الميلادي...',
        'loading-hijri': 'جاري تحميل التاريخ الهجري...',
        'fajr': 'الفجر',
        'dhuhr': 'الظهر',
        'asr': 'العصر',
        'maghrib': 'المغرب',
        'isha': 'العشاء',
        'time-until': 'الوقت المتبقي للصلاة التالية'
    },
    fr: {
        'title': 'Temps et Plus',
        'auto-detect': 'Détection automatique',
        'loading': 'Chargement...',
        'test-notification': 'Tester les Notifications',
        'qibla-direction': 'Direction de la Qibla depuis le Nord',
        'loading-gregorian': 'Chargement de la date grégorienne...',
        'loading-hijri': 'Chargement de la date hijri...',
        'fajr': 'Fajr',
        'dhuhr': 'Dhuhr',
        'asr': 'Asr',
        'maghrib': 'Maghrib',
        'isha': 'Isha',
        'time-until': 'Temps jusqu\'à la prochaine prière'
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
    });
});
