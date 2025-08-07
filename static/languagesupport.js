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
                'time-format': 'hours : minutes'
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
                'time-format': 'ساعات : دقائق'
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
                'time-format': 'heures : minutes'
            },
        };
        let currentLanguage = 'en';
        
        // Detect user's language
        function detectLanguage() {
            const browserLang = navigator.language || navigator.userLanguage;
            const langCode = browserLang.split('-')[0];
            
            // Check if we have translations for this language
            if (translations[langCode]) {
                return langCode;
            }
            
            // Default to English
            return 'en';
        }

        // Apply translations
        function applyTranslations(lang) {
            const elementsToTranslate = document.querySelectorAll('[data-translate]');
            
            elementsToTranslate.forEach(element => {
                const key = element.getAttribute('data-translate');
                if (translations[lang] && translations[lang][key]) {
                    element.textContent = translations[lang][key];
                }
            });
            
            // Update HTML lang attribute
            document.documentElement.lang = lang;
            
            // Update direction for RTL languages
            if (lang === 'ar' || lang === 'ur') {
                document.documentElement.dir = 'rtl';
                document.body.style.fontFamily = 'Tahoma, Arial, sans-serif';
            } else {
                document.documentElement.dir = 'ltr';
                document.body.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
            }
        }

        // Initialize language
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

        // Language selector event
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