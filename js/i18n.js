// amoledwatchfaces i18n - v1.0
(function () {
  'use strict';

  const TRANSLATIONS = {
    "en": {
      "nav": {
        "home": "Home",
        "apps": "Apps",
        "bogo": "BOGO",
        "giveaways": "Giveaways",
        "guide": "Guide",
        "contact": "Contact",
        "switch_theme": "Switch theme",
        "switch_language": "Switch language",
        "select_language": "Select language",
        "notifications": "Enable notifications",
        "snow_animation": "Toggle snow animation"
      },
      "hero": {
        "tagline": "Privacy-respecting watch faces and apps for Wear OS."
      },
      "watchfaces": {
        "heading": "Watch Faces",
        "desc": "High-resolution, battery-friendly Wear OS watch faces. Built in Android Studio using Watch Face Format.",
        "catalog_title": "Watch Face Catalog",
        "catalog_desc": "All AMOLED Watch Faces in one place. Preview and find your perfect watch face.",
        "developer_profile": "Developer profile",
        "privacy_policy": "Privacy Policy"
      },
      "latest_release": {
        "heading": "Latest Release",
        "badge": "NEW RELEASE",
        "released": "Released"
      },
      "featured_deals": {
        "heading": "Featured Deals",
        "shortcut_label": "Shortcut: #deals",
        "offer_ends": "Offer ends",
        "sale_ends_in": "Sale ends in",
        "badge_sale": "Sale",
        "badge_free": "100% OFF"
      },
      "collection": {
        "heading": "Collection",
        "count_suffix": "watch faces",
        "count_few": "watch faces",
        "count_single": "watch face",
        "search_placeholder": "Search watch faces...",
        "clear_search": "Clear search",
        "filter_all": "All",
        "filter_free": "Free",
        "filter_analog": "Analog",
        "filter_digital": "Digital",
        "filter_weather": "Weather",
        "filter_sale": "Sale",
        "sort_label": "Sort by:",
        "sort_release": "Release Date",
        "sort_updated": "Last Updated",
        "sort_alphabetical": "Alphabetical",
        "load_more": "Load More",
        "show_all": "Show All",
        "empty_title": "No watch faces found",
        "empty_subtitle": "Try adjusting your search or filter",
        "clear_filters": "Clear filters",
        "badge_bogo": "BOGO",
        "badge_weather": "Weather",
        "badge_trial": "Trial",
        "badge_analog": "Analog",
        "free_tag": "FREE",
        "coming_soon": "Available soon..."
      },
      "support": {
        "heading": "Support the Project",
        "desc": "amoledwatchfaces is built and maintained by Tomáš Marcinčin, a solo independent developer with a strong focus on privacy. If you enjoy my watch faces and apps, please consider supporting my work!",
        "sponsor": "Sponsor"
      },
      "footer": {
        "built_with": "Built with privacy in mind for the Wear OS community.",
        "privacy_policy": "Privacy Policy"
      },
      "common": {
        "get_it_on_google_play": "Get it on Google Play",
        "privacy_policy": "Privacy Policy"
      },
      "apps_page": {
        "title": "Wear OS Apps",
        "subtitle": "Enhance your watch (faces). I created these apps to give you more options for customizing watch faces. Since app development takes time, not all wearable apps are free.",
        "badge_paid": "Paid",
        "badge_free": "Free",
        "badge_opensource": "Open Source",
        "weather_title": "Weather Complications",
        "weather_desc": "Standalone Weather & Astro Data for Wear OS. Everything runs directly on your device — no accounts, no tracking, and direct access to trusted forecast providers.",
        "phonebatt_title": "Phone Battery Complication",
        "phonebatt_desc": "Sync and display your phone's battery percentage and charging state directly on your watch face. Everything communicates locally and directly between your devices — no accounts, no tracking, and no cloud servers involved.",
        "health_title": "Health Services Plugin",
        "health_desc": "Unlock real-time Distance, Floors Climbed, and Calories complications on modern Wear OS watch faces without relying on battery-draining background services.",
        "complications_title": "Complications Suite",
        "complications_desc": "A comprehensive collection of useful Wear OS complications. Includes week numbers, countdowns, world clocks, custom text, and more.",
        "favoriteapps_title": "Favorite Apps Tile",
        "favoriteapps_desc": "Launch your most frequently used apps directly from your wrist with a fast, customizable Wear OS Tile.",
        "photo_title": "Photo Complication",
        "photo_desc": "Display your favorite pictures, memories, and photos directly inside any standard Wear OS complication slot."
      },
      "bogo": {
        "title": "Buy One, Get One (BOGO)",
        "tagline": "Buy a watch face or app from our portfolio and receive another watch face of your choice for free.",
        "how_it_works": "How It Works",
        "step1_title": "Buy a Watch Face or App",
        "step1_desc": "Buy a watch face or an app from our Google Play Store portfolio.",
        "step2_title": "Choose Your Free Watch Face",
        "step2_desc": "Pick a watch face of equal or lesser price from our portfolio.",
        "step3_title": "Email Your Receipt",
        "step3_desc": "Email the purchase receipt and the chosen watch face name to support@amoledwatchfaces.com.",
        "delivery_note": "And that's it! You'll receive a promo code for the selected watch face within three days.",
        "terms_title": "Promotion Terms & Disclaimer",
        "terms_desc": "Only purchase receipts not older than 10 days are valid. The most recent watch face release is not eligible to be received as part of the BOGO promotion.",
        "thanks_title": "Thanks for your support!",
        "thanks_desc": "Your support makes it possible to continue developing privacy-respecting, high-performance Wear OS watch faces and utilities.",
        "developer_profile": "Developer profile",
        "send_email": "Send Email"
      },
      "giveaways": {
        "title": "Watch Face Giveaways",
        "tagline": "Claim your free Google Play promotion codes for our featured Wear OS watch faces below. Limited codes available!",
        "loading": "Loading Giveaways...",
        "codes_left": "Codes Left:",
        "claim_btn": "Claim Free Promo Code",
        "claimed_btn": "Claimed",
        "redeem_title": "How to Redeem Your Promo Code",
        "step1_title": "Claim Your Code",
        "step1_desc": "Click \"Claim Free Promo Code\" on any active watch face above to reveal your single-use Google Play code.",
        "step2_title": "Redeem on Google Play",
        "step2_desc": "Tap \"Redeem on Google Play\" or open the Google Play Store app → Tap your profile avatar → Payments & subscriptions → Redeem code.",
        "step3_title": "Install on Your Watch",
        "step3_desc": "Once redeemed, the watch face is permanently tied to your Google account. Select your Wear OS watch device during install to download it directly to your smartwatch."
      },
      "guide": {
        "title": "How to Install Wear OS Watch Faces",
        "tagline": "There are three convenient ways to install and activate watch faces on your Wear OS smartwatch.",
        "recommended": "Recommended",
        "companion_app": "Companion App",
        "web_browser": "Web Browser",
        "method1_header": "1st Way (Preferred): Google Play App",
        "step_select_device_title": "Select target device:",
        "step_select_device_desc": "In the Google Play Store app on your phone, tap the drop-down arrow next to the Install button, select your watch as the target device, and tap Install.",
        "step_check_watch_title": "Check your watch:",
        "step_check_watch_desc": "Check your smartwatch device — a download status notification or icon should appear.",
        "step_activate_title": "Activate the watch face:",
        "step_activate_desc": "Once installation is complete, activate the watch face to set it as your current watch face. There are two ways:",
        "step_direct_watch_title": "Directly on watch:",
        "step_direct_watch_desc": "Touch and hold (long-press) your current watch face, swipe all the way to the left, tap + (Add watch face), and tap on the newly installed watch face.",
        "step_wearable_app_title": "From your wearable app:",
        "step_wearable_app_desc": "Open your smartwatch companion app on your phone (Google Pixel Watch, Galaxy Wearable, etc.), navigate to the Watch Faces / Downloaded section, and select your new watch face.",
        "tip_verification_title": "Verification Tip:",
        "tip_verification_desc": "You can verify that the watch face is installed on your watch by opening the Google Play Store app on your watch > My Apps section.",
        "method2_header": "2nd Way: Phone Companion App",
        "step_open_companion_title": "Open companion app:",
        "step_open_companion_desc": "Open the watch face companion app downloaded to your phone. Ensure your watch is actively connected to your phone via Bluetooth.",
        "step_tap_install_title": "Tap Install:",
        "step_tap_install_desc": "Tap on the Install / Install on Watch button inside the companion app.",
        "step_complete_watch_title": "Complete install on watch:",
        "step_complete_watch_desc": "On your smartwatch, the Google Play Store listing will open automatically. Tap Install.",
        "step_activate_companion_title": "Activate:",
        "step_activate_companion_desc": "After installation completes, activate the watch face using either method described in the 1st Way (long-press on watch face or via your phone's wearable companion app).",
        "tip_troubleshooting_title": "Payment Loop / Sync Troubleshooting:",
        "tip_troubleshooting_desc1": "If the Google Play Store on your watch asks you to pay again, it is a temporary synchronization delay between your watch and Google's servers.",
        "tip_troubleshooting_desc2": "To fix this quickly: toggle Airplane Mode on your watch on and off after a few seconds, or temporarily disconnect and reconnect Bluetooth to force a synchronization.",
        "tip_troubleshooting_desc3": "Google only charges once per Google Account for purchased content; any duplicated payment attempt is automatically cancelled or prevented.",
        "method3_header": "3rd Way: Play Store Website (PC / Mac)",
        "step_open_browser_title": "Open link in browser:",
        "step_open_browser_desc": "Open the watch face link in any desktop web browser (Chrome, Safari, Edge, Firefox) on your PC or Mac. You can search for the watch face on Google Play or share the link from your Play Store app.",
        "step_install_more_title": "Install on more devices:",
        "step_install_more_desc": "Click the Install on more devices button and select your smartwatch from the device list. (Ensure you are logged in with the same Google Account on both your web browser and your watch).",
        "step_wait_install_title": "Wait for automatic install:",
        "step_wait_install_desc": "Within a few minutes, the watch face installation will start automatically on your smartwatch (make sure your watch has an active Wi-Fi or Bluetooth connection).",
        "step_activate_web_title": "Activate:",
        "step_activate_web_desc": "Once installation completes, activate the watch face on your watch or through your phone's wearable companion app."
      },
      "contact": {
        "title": "Contact Support",
        "tagline": "Have a question, feedback, or need help with a watch face? Send us a message and we'll be happy to assist you!",
        "heading": "Send a Message",
        "desc": "Fill out the form below and we'll reply directly to your email address.",
        "label_name": "Your Name",
        "placeholder_name": "e.g. John Doe",
        "label_email": "Email Address",
        "placeholder_email": "e.g. john@example.com",
        "label_topic": "Topic",
        "topic_general": "General Inquiry",
        "topic_watchface": "Watch Face Issue / Support",
        "topic_app": "App Issue / Support",
        "topic_bogo": "BOGO Promotion Claim",
        "topic_feedback": "Feature Request / Feedback",
        "topic_other": "Other",
        "label_watch_model": "Watch Model (Optional)",
        "placeholder_watch_model": "e.g. Galaxy Watch 6, Pixel Watch 2",
        "label_watch_face": "Watch Face / App (Optional)",
        "select_watch_face": "Select a watch face or app (optional)...",
        "label_message": "Message",
        "placeholder_message": "Please describe your question or issue in detail...",
        "btn_send": "Send Message",
        "btn_sending": "Sending...",
        "success_msg": "Thank you! Your message has been sent successfully.",
        "quick_info_heading": "Quick Info",
        "quick_info_desc": "Frequently checked resources and response times.",
        "direct_email": "Direct Email",
        "response_time": "Response Time",
        "response_time_val": "Usually within 24–48 hours",
        "developer_location": "Developer Location",
        "developer_location_val": "Slovakia, European Union",
        "faq_note": "Need help installing a watch face? Check out our installation guide first for quick step-by-step instructions!",
        "read_guide": "Read Installation Guide"
      },
      "not_found": {
        "title": "Page Not Found",
        "desc": "The page you're looking for might have been moved, renamed, or is temporarily unavailable.",
        "btn_home": "Back to Home",
        "btn_apps": "Explore Apps"
      },
      "privacy": {
        "title": "Privacy Policy",
        "last_updated": "Last updated:",
        "intro": "At amoledwatchfaces, privacy is not an afterthought — it is a core design principle. We build watch faces and mobile tools that function locally on your device without tracking, profiling, or unnecessary data collection.",
        "sec1_title": "1. Wear OS Watch Faces & Applications",
        "sec2_title": "2. Website Privacy Policy (amoledwatchfaces.com)",
        "sec3_title": "3. Your Rights Under GDPR",
        "sec4_title": "4. Contact Information"
      }
    },
    "sk": {
      "nav": {
        "home": "Domov",
        "apps": "Aplikácie",
        "bogo": "BOGO",
        "giveaways": "Súťaže",
        "guide": "Návod",
        "contact": "Kontakt",
        "switch_theme": "Prepnúť motív",
        "switch_language": "Prepnúť jazyk",
        "select_language": "Vybrať jazyk",
        "notifications": "Povoliť upozornenia",
        "snow_animation": "Prepnúť efekt sneženia"
      },
      "hero": {
        "tagline": "Ciferníky a aplikácie pre Wear OS rešpektujúce súkromie."
      },
      "watchfaces": {
        "heading": "Ciferníky",
        "desc": "Ciferníky pre Wear OS s vysokým rozlíšením a šetrné k batérii. Vytvorené v Android Studio pomocou Watch Face Format.",
        "catalog_title": "Watch Face Catalog",
        "catalog_desc": "Všetky AMOLED ciferníky na jednom mieste. Prehliadajte a nájdite svoj dokonalý ciferník.",
        "developer_profile": "Profil vývojára",
        "privacy_policy": "Zásady ochrany osobných údajov"
      },
      "latest_release": {
        "heading": "Najnovšie vydanie",
        "badge": "NOVINKA",
        "released": "Vydané"
      },
      "featured_deals": {
        "heading": "Vybrané zľavy",
        "shortcut_label": "Skratka: #deals",
        "offer_ends": "Ponuka končí",
        "sale_ends_in": "Zľava končí o",
        "badge_sale": "Zľava",
        "badge_free": "100% ZĽAVA"
      },
      "collection": {
        "heading": "Kolekcia",
        "count_suffix": "ciferníkov",
        "count_few": "ciferníky",
        "count_single": "ciferník",
        "search_placeholder": "Hľadať ciferníky...",
        "clear_search": "Vymazať vyhľadávanie",
        "filter_all": "Všetky",
        "filter_free": "Zadarmo",
        "filter_analog": "Analógové",
        "filter_digital": "Digitálne",
        "filter_weather": "Počasie",
        "filter_sale": "Zľava",
        "sort_label": "Zoradiť podľa:",
        "sort_release": "Dátum vydania",
        "sort_updated": "Posledná aktualizácia",
        "sort_alphabetical": "Abecedne",
        "load_more": "Načítať ďalšie",
        "show_all": "Zobraziť všetky",
        "empty_title": "Nenašli sa žiadne ciferníky",
        "empty_subtitle": "Skúste upraviť vyhľadávanie alebo filter",
        "clear_filters": "Vymazať filtre",
        "badge_bogo": "BOGO",
        "badge_weather": "Počasie",
        "badge_trial": "Skúšobná verzia",
        "badge_analog": "Analógové",
        "free_tag": "ZADARMO",
        "coming_soon": "Čoskoro k dispozícii..."
      },
      "support": {
        "heading": "Podporte projekt",
        "desc": "amoledwatchfaces vyvíja a spravuje Tomáš Marcinčin, nezávislý sólo vývojár so silným dôrazom na súkromie. Ak sa vám moje ciferníky a aplikácie páčia, zvážte podporu mojej práce!",
        "sponsor": "Sponzorovať"
      },
      "footer": {
        "built_with": "Vytvorené s dôrazom na súkromie pre komunitu Wear OS.",
        "privacy_policy": "Zásady ochrany osobných údajov"
      },
      "common": {
        "get_it_on_google_play": "Získať v službe Google Play",
        "privacy_policy": "Zásady ochrany osobných údajov"
      },
      "apps_page": {
        "title": "Aplikácie pre Wear OS",
        "subtitle": "Vylepšite svoje hodinky (a ciferníky). Tieto aplikácie som vytvoril, aby ste mali viac možností na prispôsobenie ciferníkov. Keďže vývoj aplikácií si vyžaduje čas, nie všetky aplikácie pre nositeľné zariadenia sú zadarmo.",
        "badge_paid": "Platené",
        "badge_free": "Zadarmo",
        "badge_opensource": "Open Source",
        "weather_title": "Weather Complications",
        "weather_desc": "Samostatné údaje o počasí a astronómii pre Wear OS. Všetko beží priamo vo vašom zariadení — žiadne účty, žiadne sledovanie a priamy prístup k dôveryhodným poskytovateľom predpovedí.",
        "phonebatt_title": "Phone Battery Complication",
        "phonebatt_desc": "Synchronizujte a zobrazujte percentá batérie a stav nabíjania telefónu priamo na ciferníku. Všetko komunikuje lokálne a priamo medzi vašimi zariadeniami — bez účtov, sledovania a cloudových serverov.",
        "health_title": "Health Services Plugin",
        "health_desc": "Odomknite komplikácie pre vzdialenosť, zdolané poschodia a kalórie v reálnom čase na moderných ciferníkoch Wear OS bez vybíjania batérie službami na pozadí.",
        "complications_title": "Complications Suite",
        "complications_desc": "Ucelená zbierka užitočných komplikácií pre Wear OS. Zahŕňa čísla týždňov, odpočítavanie, svetový čas, vlastný text a mnoho ďalšieho.",
        "favoriteapps_title": "Favorite Apps Tile",
        "favoriteapps_desc": "Spúšťajte najčastejšie používané aplikácie priamo zo zápästia pomocou rýchlej a prispôsobiteľnej dlaždice pre Wear OS.",
        "photo_title": "Photo Complication",
        "photo_desc": "Zobrazujte svoje obľúbené obrázky, spomienky a fotografie priamo v ľubovoľnom štandardnom slote pre komplikácie na Wear OS."
      },
      "bogo": {
        "title": "Kúpte jeden, získajte druhý (BOGO)",
        "tagline": "Kúpte si ciferník alebo aplikáciu z nášho portfólia a získajte ďalší ciferník podľa vlastného výberu zadarmo.",
        "how_it_works": "Ako to funguje",
        "step1_title": "Kúpte si ciferník alebo aplikáciu",
        "step1_desc": "Kúpte si ciferník alebo aplikáciu z nášho portfólia v obchode Google Play.",
        "step2_title": "Vyberte si bezplatný ciferník",
        "step2_desc": "Vyberte si ciferník rovnakej alebo nižšej ceny z nášho portfólia.",
        "step3_title": "Pošlite potvrdenie e-mailom",
        "step3_desc": "Pošlite potvrdenie o nákupe a názov vybraného ciferníka na support@amoledwatchfaces.com.",
        "delivery_note": "A to je všetko! Promo kód pre vybraný ciferník dostanete do troch dní.",
        "terms_title": "Podmienky akcie a upozornenie",
        "terms_desc": "Platia iba doklady o nákupe nie staršie ako 10 dní. Najnovšie vydanie ciferníka nie je možné získať v rámci akcie BOGO.",
        "thanks_title": "Ďakujeme za vašu podporu!",
        "thanks_desc": "Vaša podpora umožňuje pokračovať vo vývoji vysoko výkonných ciferníkov a nástrojov pre Wear OS, ktoré rešpektujú súkromie.",
        "developer_profile": "Profil vývojára",
        "send_email": "Poslať e-mail"
      },
      "giveaways": {
        "title": "Súťaže o ciferníky",
        "tagline": "Získajte bezplatné promo kódy Google Play pre vybrané Wear OS ciferníky nižšie. Počet kódov je obmedzený!",
        "loading": "Načítavanie súťaží...",
        "codes_left": "Zostáva kódov:",
        "claim_btn": "Získať bezplatný promo kód",
        "claimed_btn": "Uplatnené",
        "redeem_title": "Ako uplatniť promo kód",
        "step1_title": "Získajte svoj kód",
        "step1_desc": "Kliknite na „Získať bezplatný promo kód“ pri ktoromkoľvek aktívnom ciferníku vyššie a zobrazte svoj jednorazový kód Google Play.",
        "step2_title": "Uplatnite v službe Google Play",
        "step2_desc": "Ťuknite na „Uplatniť v službe Google Play“ alebo otvorte aplikáciu Obchod Google Play → Ťuknite na profilovú ikonu → Platby a odbery → Uplatniť kód.",
        "step3_title": "Nainštalujte na hodinky",
        "step3_desc": "Po uplatnení je ciferník natrvalo prepojený s vaším účtom Google. Počas inštalácie vyberte hodinky s Wear OS, aby sa stiahol priamo do vašich smart hodiniek."
      },
      "guide": {
        "title": "Ako nainštalovať ciferníky pre Wear OS",
        "tagline": "Existujú tri pohodlné spôsoby, ako nainštalovať a aktivovať ciferníky na vašich smart hodinkách Wear OS.",
        "recommended": "Odporúčané",
        "companion_app": "Sprievodná aplikácia",
        "web_browser": "Webový prehliadač",
        "method1_header": "1. spôsob (odporúčaný): Aplikácia Google Play",
        "step_select_device_title": "Vyberte cieľové zariadenie:",
        "step_select_device_desc": "V aplikácii Obchod Google Play v telefóne ťuknite na šípku rozbalenia vedľa tlačidla Inštalovať, vyberte hodinky ako cieľové zariadenie a ťuknite na Inštalovať.",
        "step_check_watch_title": "Skontrolujte hodinky:",
        "step_check_watch_desc": "Skontrolujte svoje smart hodinky — malo by sa zobraziť upozornenie alebo ikona stavu sťahovania.",
        "step_activate_title": "Aktivujte ciferník:",
        "step_activate_desc": "Po dokončení inštalácie aktivujte ciferník a nastavte ho ako aktuálny. Máte dve možnosti:",
        "step_direct_watch_title": "Priamo na hodinkách:",
        "step_direct_watch_desc": "Stlačte a podržte aktuálny ciferník, potiahnite úplne doľava, ťuknite na + (Pridať ciferník) a ťuknite na novo nainštalovaný ciferník.",
        "step_wearable_app_title": "Z aplikácie hodiniek v telefóne:",
        "step_wearable_app_desc": "Otvorte sprievodnú aplikáciu hodiniek v telefóne (Google Pixel Watch, Galaxy Wearable atď.), prejdite do sekcie Ciferníky / Stiahnuté a vyberte nový ciferník.",
        "tip_verification_title": "Tip na overenie:",
        "tip_verification_desc": "Inštaláciu ciferníka na hodinkách môžete overiť otvorením aplikácie Obchod Google Play na hodinkách > sekcia Moje aplikácie.",
        "method2_header": "2. spôsob: Sprievodná aplikácia v telefóne",
        "step_open_companion_title": "Otvorte sprievodnú aplikáciu:",
        "step_open_companion_desc": "Otvorte sprievodnú aplikáciu ciferníka stiahnutú do telefónu. Uistite sa, že hodinky sú pripojené k telefónu cez Bluetooth.",
        "step_tap_install_title": "Ťuknite na Inštalovať:",
        "step_tap_install_desc": "Ťuknite na tlačidlo Inštalovať / Inštalovať do hodiniek v sprievodnej aplikácii.",
        "step_complete_watch_title": "Dokončite inštaláciu na hodinkách:",
        "step_complete_watch_desc": "Na smart hodinkách sa automaticky otvorí stránka Obchodu Google Play. Ťuknite na Inštalovať.",
        "step_activate_companion_title": "Aktivujte:",
        "step_activate_companion_desc": "Po dokončení inštalácie aktivujte ciferník jedným zo spôsobov popísaných v 1. spôsobe (dlhé stlačenie na ciferníku alebo cez aplikáciu v telefóne).",
        "tip_troubleshooting_title": "Riešenie problémov so synchronizáciou a platbami:",
        "tip_troubleshooting_desc1": "Ak vás Obchod Google Play na hodinkách žiada o opätovné zaplatenie, ide o dočasné oneskorenie synchronizácie medzi hodinkami a servermi Google.",
        "tip_troubleshooting_desc2": "Ak to chcete rýchlo vyriešiť: zapnite a po niekoľkých sekundách vypnite režim V lietadle na hodinkách, alebo dočasne odpojte a znova pripojte Bluetooth, aby ste vynútili synchronizáciu.",
        "tip_troubleshooting_desc3": "Google účtuje zakúpený obsah iba raz za účet Google; akýkoľvek pokus o duplicitnú platbu je automaticky zrušený.",
        "method3_header": "3. spôsob: Web Obchodu Google Play (PC / Mac)",
        "step_open_browser_title": "Otvorte odkaz v prehliadači:",
        "step_open_browser_desc": "Otvorte odkaz na ciferník v ľubovoľnom prehliadači v počítači (Chrome, Safari, Edge, Firefox). Môžete vyhľadať ciferník v službe Google Play alebo zdieľať odkaz z aplikácie Obchod Play.",
        "step_install_more_title": "Inštalovať v ďalších zariadeniach:",
        "step_install_more_desc": "Kliknite na tlačidlo Inštalovať v ďalších zariadeniach a zo zoznamu vyberte svoje smart hodinky. (Uistite sa, že ste prihlásení s rovnakým účtom Google v prehliadači aj na hodinkách).",
        "step_wait_install_title": "Počkajte na automatickú inštaláciu:",
        "step_wait_install_desc": "V priebehu niekoľkých minút sa inštalácia ciferníka spustí na smart hodinkách automaticky (uistite sa, že hodinky majú aktívne pripojenie Wi-Fi alebo Bluetooth).",
        "step_activate_web_title": "Aktivujte:",
        "step_activate_web_desc": "Po dokončení inštalácie aktivujte ciferník na hodinkách alebo cez aplikáciu v telefóne."
      },
      "contact": {
        "title": "Kontaktujte podporu",
        "tagline": "Máte otázku, spätnú väzbu alebo potrebujete pomoc s ciferníkom? Napíšte nám a radi vám pomôžeme!",
        "heading": "Pošlite nám správu",
        "desc": "Vyplňte formulár nižšie a odpovieme priamo na vašu e-mailovú adresu.",
        "label_name": "Vaše meno",
        "placeholder_name": "napr. Ján Novák",
        "label_email": "E-mailová adresa",
        "placeholder_email": "napr. jan@priklad.sk",
        "label_topic": "Téma",
        "topic_general": "Všeobecná otázka",
        "topic_watchface": "Problém s ciferníkom / Podpora",
        "topic_app": "Problém s aplikáciou / Podpora",
        "topic_bogo": "Uplatnenie akcie BOGO",
        "topic_feedback": "Návrh funkcie / Spätná väzba",
        "topic_other": "Iné",
        "label_watch_model": "Model hodiniek (voliteľné)",
        "placeholder_watch_model": "napr. Galaxy Watch 6, Pixel Watch 2",
        "label_watch_face": "Ciferník / Aplikácia (voliteľné)",
        "select_watch_face": "Vyberte ciferník alebo aplikáciu (voliteľné)...",
        "label_message": "Správa",
        "placeholder_message": "Podrobne popíšte svoju otázku alebo problém...",
        "btn_send": "Odoslať správu",
        "btn_sending": "Odosielanie...",
        "success_msg": "Ďakujeme! Vaša správa bola úspešne odoslaná.",
        "quick_info_heading": "Rýchle informácie",
        "quick_info_desc": "Často hľadané zdroje a čas odozvy.",
        "direct_email": "Priamy e-mail",
        "response_time": "Čas odpovede",
        "response_time_val": "Zvyčajne do 24–48 hodín",
        "developer_location": "Lokalita vývojára",
        "developer_location_val": "Slovensko, Európska únia",
        "faq_note": "Potrebujete pomoc s inštaláciou ciferníka? Pozrite si náš návod na inštaláciu s podrobnými pokynmi!",
        "read_guide": "Prečítať návod na inštaláciu"
      },
      "not_found": {
        "title": "Stránka sa nenašla",
        "desc": "Stránka, ktorú hľadáte, mohla byť presunutá, premenovaná alebo je dočasne nedostupná.",
        "btn_home": "Späť na domovskú stránku",
        "btn_apps": "Preskúmať aplikácie"
      },
      "privacy": {
        "title": "Zásady ochrany osobných údajov",
        "last_updated": "Posledná aktualizácia:",
        "intro": "V amoledwatchfaces nie je súkromie vedľajšou myšlienkou — je to základný princíp návrhu. Vytvárame ciferníky a mobilné nástroje, ktoré fungujú lokálne vo vašom zariadení bez sledovania, profilovania alebo zbytočného zhromažďovania údajov.",
        "sec1_title": "1. Wear OS ciferníky a aplikácie",
        "sec2_title": "2. Zásady ochrany osobných údajov webu (amoledwatchfaces.com)",
        "sec3_title": "3. Vaše práva podľa GDPR",
        "sec4_title": "4. Kontaktné informácie"
      }
    }
  };

  const SUPPORTED_LANGS = ['en', 'sk'];
  const DEFAULT_LANG = 'en';

  function resolveInitialLanguage() {
    const saved = localStorage.getItem('lang');
    if (saved && SUPPORTED_LANGS.includes(saved)) {
      return saved;
    }
    const navLang = (navigator.language || '').toLowerCase();
    if (navLang.startsWith('sk') || navLang.startsWith('cs')) {
      return 'sk';
    }
    return DEFAULT_LANG;
  }

  let currentLang = resolveInitialLanguage();

  function getLanguage() {
    return currentLang;
  }

  function t(path, fallback = '') {
    const keys = path.split('.');
    let cur = TRANSLATIONS[currentLang];
    for (const k of keys) {
      if (cur && typeof cur === 'object' && k in cur) {
        cur = cur[k];
      } else {
        cur = null;
        break;
      }
    }
    if (cur !== null && cur !== undefined) {
      return cur;
    }

    // Fallback to English dictionary if not found in current language
    let def = TRANSLATIONS[DEFAULT_LANG];
    for (const k of keys) {
      if (def && typeof def === 'object' && k in def) {
        def = def[k];
      } else {
        def = null;
        break;
      }
    }
    return def !== null && def !== undefined ? def : fallback;
  }

  function applyTranslations() {
    document.documentElement.setAttribute('lang', currentLang);

    // Text content
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (val) {
        el.textContent = val;
      }
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = t(key);
      if (val) {
        el.setAttribute('placeholder', val);
      }
    });

    // Title attributes
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      const val = t(key);
      if (val) {
        el.setAttribute('title', val);
      }
    });

    // Aria labels
    document.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria-label');
      const val = t(key);
      if (val) {
        el.setAttribute('aria-label', val);
      }
    });

    updateLangPickerUI();
  }

  function updateLangPickerUI() {
    const btn = document.getElementById('lang-toggle');
    if (btn) {
      const labelSpan = btn.querySelector('.lang-label');
      if (labelSpan) {
        labelSpan.textContent = currentLang.toUpperCase();
      }
      const labelText = t('nav.select_language') || (currentLang === 'en' ? 'Select language' : 'Vybrať jazyk');
      btn.setAttribute('aria-label', labelText);
      btn.setAttribute('title', labelText);
    }

    const menu = document.getElementById('lang-menu');
    if (menu) {
      menu.querySelectorAll('.lang-item').forEach((item) => {
        const lang = item.getAttribute('data-lang');
        const isActive = lang === currentLang;
        item.classList.toggle('active', isActive);
        item.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    }
  }

  function toggleLangMenu(open) {
    const btn = document.getElementById('lang-toggle');
    const menu = document.getElementById('lang-menu');
    if (!btn || !menu) return;

    const isOpen = open !== undefined ? open : !menu.classList.contains('open');
    menu.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

    if (isOpen) {
      const activeItem = menu.querySelector('.lang-item.active') || menu.querySelector('.lang-item');
      if (activeItem) {
        activeItem.focus();
      }
    }
  }

  function setLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang) || lang === currentLang) return;
    currentLang = lang;
    localStorage.setItem('lang', currentLang);
    applyTranslations();
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: currentLang } }));
  }

  function initLangPicker() {
    const btn = document.getElementById('lang-toggle');
    const menu = document.getElementById('lang-menu');
    if (!btn || !menu) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLangMenu();
    });

    menu.querySelectorAll('.lang-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedLang = item.getAttribute('data-lang');
        if (selectedLang) {
          setLanguage(selectedLang);
        }
        toggleLangMenu(false);
        btn.focus();
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !menu.contains(e.target)) {
        toggleLangMenu(false);
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!menu.classList.contains('open')) return;

      if (e.key === 'Escape') {
        toggleLangMenu(false);
        btn.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const items = Array.from(menu.querySelectorAll('.lang-item'));
        const idx = items.indexOf(document.activeElement);
        const nextIdx = (idx + 1) % items.length;
        items[nextIdx].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const items = Array.from(menu.querySelectorAll('.lang-item'));
        const idx = items.indexOf(document.activeElement);
        const prevIdx = (idx - 1 + items.length) % items.length;
        items[prevIdx].focus();
      }
    });

    updateLangPickerUI();
  }

  function init() {
    applyTranslations();
    initLangPicker();
  }

  // Expose i18n globally
  window.i18n = {
    getLanguage,
    setLanguage,
    t,
    applyTranslations
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
