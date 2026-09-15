#!/usr/bin/env python3
"""
scripts/build_i18n.py
Automated static multilingual subdirectories generator for amoledwatchfaces.com.

Generates pre-rendered HTML files for all supported languages in /de/, /es/, /pl/, /sk/
and updates root English pages with SEO hreflang and metadata tags.
"""

import os
import re
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
LOCALES_DIR = BASE_DIR / "locales"

LANGUAGES = ["en", "de", "es", "pl", "sk"]
TARGET_LANGUAGES = ["de", "es", "pl", "sk"]

PAGES = [
    {"file": "index.html", "slug": ""},
    {"file": "apps.html", "slug": "apps"},
    {"file": "bogo.html", "slug": "bogo"},
    {"file": "giveaways.html", "slug": "giveaways"},
    {"file": "guide.html", "slug": "guide"},
    {"file": "contact.html", "slug": "contact"},
    {"file": "privacy.html", "slug": "privacy"},
    {"file": "404.html", "slug": "404.html"},
]

PAGE_METADATA = {
    "index.html": {
        "en": {
            "title": "amoledwatchfaces™ | Watch Faces for Wear OS",
            "desc": "Discover high-resolution, battery-friendly Wear OS watch faces. Built in Android Studio using Watch Face Format with customizable complications.",
            "og_title": "amoledwatchfaces™ | Watch Faces for Wear OS",
            "og_desc": "Discover high-resolution, battery-friendly Wear OS watch faces. Built in Android Studio using Watch Face Format with customizable complications."
        },
        "de": {
            "title": "amoledwatchfaces™ | Zifferblätter für Wear OS",
            "desc": "Hochauflösende, akkuschonende Wear OS Zifferblätter. Entwickelt in Android Studio mit dem Watch Face Format mit anpassbaren Komplikationen.",
            "og_title": "amoledwatchfaces™ | Zifferblätter für Wear OS",
            "og_desc": "Hochauflösende, akkuschonende Wear OS Zifferblätter. Entwickelt in Android Studio mit dem Watch Face Format mit anpassbaren Komplikationen."
        },
        "es": {
            "title": "amoledwatchfaces™ | Esferas de reloj para Wear OS",
            "desc": "Esferas de reloj de alta resolución y bajo consumo de batería para Wear OS. Creadas en Android Studio usando el Watch Face Format con complicaciones personalizables.",
            "og_title": "amoledwatchfaces™ | Esferas de reloj para Wear OS",
            "og_desc": "Esferas de reloj de alta resolución y bajo consumo de batería para Wear OS. Creadas en Android Studio usando el Watch Face Format con complicaciones personalizables."
        },
        "pl": {
            "title": "amoledwatchfaces™ | Tarcze zegarka dla Wear OS",
            "desc": "Tarcze zegarka Wear OS o wysokiej rozdzielczości i niskim zużyciu baterii. Zbudowane w Android Studio z użyciem Watch Face Format z konfigurowalnymi komplikacjami.",
            "og_title": "amoledwatchfaces™ | Tarcze zegarka dla Wear OS",
            "og_desc": "Tarcze zegarka Wear OS o wysokiej rozdzielczości i niskim zużyciu baterii. Zbudowane w Android Studio z użyciem Watch Face Format z konfigurowalnymi komplikacjami."
        },
        "sk": {
            "title": "amoledwatchfaces™ | Ciferníky pre Wear OS",
            "desc": "Ciferníky pre Wear OS s vysokým rozlíšením a šetrnosťou k batérii. Vytvorené v Android Studio s použitím Watch Face Format s prispôsobiteľnými komplikáciami.",
            "og_title": "amoledwatchfaces™ | Ciferníky pre Wear OS",
            "og_desc": "Ciferníky pre Wear OS s vysokým rozlíšením a šetrnosťou k batérii. Vytvorené v Android Studio s použitím Watch Face Format s prispôsobiteľnými komplikáciami."
        }
    },
    "apps.html": {
        "en": {
            "title": "Wear OS Apps — amoledwatchfaces",
            "desc": "Wear OS apps and complications by amoledwatchfaces™.",
            "og_title": "Wear OS Applications — amoledwatchfaces™",
            "og_desc": "Explore Wear OS complications and helper apps by amoledwatchfaces™."
        },
        "de": {
            "title": "Wear OS Apps — amoledwatchfaces",
            "desc": "Wear OS Apps und Komplikationen von amoledwatchfaces™.",
            "og_title": "Wear OS Anwendungen — amoledwatchfaces™",
            "og_desc": "Entdecke Wear OS Komplikationen und Begleit-Apps von amoledwatchfaces™."
        },
        "es": {
            "title": "Aplicaciones Wear OS — amoledwatchfaces",
            "desc": "Aplicaciones y complicaciones de Wear OS creadas por amoledwatchfaces™.",
            "og_title": "Aplicaciones Wear OS — amoledwatchfaces™",
            "og_desc": "Descubre complicaciones y aplicaciones complementarias para Wear OS de amoledwatchfaces™."
        },
        "pl": {
            "title": "Aplikacje Wear OS — amoledwatchfaces",
            "desc": "Aplikacje i komplikacje Wear OS stworzone przez amoledwatchfaces™.",
            "og_title": "Aplikacje Wear OS — amoledwatchfaces™",
            "og_desc": "Odkryj komplikacje i aplikacje pomocnicze Wear OS od amoledwatchfaces™."
        },
        "sk": {
            "title": "Aplikácie Wear OS — amoledwatchfaces",
            "desc": "Aplikácie a komplikácie pre Wear OS od amoledwatchfaces™.",
            "og_title": "Aplikácie Wear OS — amoledwatchfaces™",
            "og_desc": "Objavte komplikácie a pomocné aplikácie pre Wear OS od amoledwatchfaces™."
        }
    },
    "bogo.html": {
        "en": {
            "title": "BOGO — amoledwatchfaces",
            "desc": "Buy a watch face or app from our portfolio and receive another watch face of your choice for free.",
            "og_title": "BOGO (Buy One, Get One) — amoledwatchfaces™",
            "og_desc": "Buy a watch face or app from our portfolio and receive another watch face of your choice for free."
        },
        "de": {
            "title": "BOGO — amoledwatchfaces",
            "desc": "Kaufe ein Zifferblatt oder eine App aus unserem Portfolio und erhalte ein weiteres Zifferblatt deiner Wahl kostenlos.",
            "og_title": "BOGO (1 Kaufen, 1 Gratis) — amoledwatchfaces™",
            "og_desc": "Kaufe ein Zifferblatt oder eine App aus unserem Portfolio und erhalte ein weiteres Zifferblatt deiner Wahl kostenlos."
        },
        "es": {
            "title": "BOGO — amoledwatchfaces",
            "desc": "Compra una esfera de reloj o aplicación de nuestro catálogo y recibe otra esfera gratis a tu elección.",
            "og_title": "BOGO (Compra Uno, Llévate Otro) — amoledwatchfaces™",
            "og_desc": "Compra una esfera de reloj o aplicación de nuestro catálogo y recibe otra esfera gratis a tu elección."
        },
        "pl": {
            "title": "BOGO — amoledwatchfaces",
            "desc": "Kup tarczę zegarka lub aplikację z naszego portfolio i odbierz drugą wybraną tarczę za darmo.",
            "og_title": "BOGO (Kup jedną, drugą odbierz gratis) — amoledwatchfaces™",
            "og_desc": "Kup tarczę zegarka lub aplikację z naszego portfolio i odbierz drugą wybraną tarczę za darmo."
        },
        "sk": {
            "title": "BOGO — amoledwatchfaces",
            "desc": "Kúp si ciferník alebo aplikáciu z nášho portfólia a získaj ďalší ciferník podľa vlastného výberu zadarmo.",
            "og_title": "BOGO (Kúp jeden, druhý máš zadarmo) — amoledwatchfaces™",
            "og_desc": "Kúp si ciferník alebo aplikáciu z nášho portfólia a získaj ďalší ciferník podľa vlastného výberu zadarmo."
        }
    },
    "giveaways.html": {
        "en": {
            "title": "Giveaways — amoledwatchfaces",
            "desc": "Claim free 100% OFF Google Play promo codes for premium Wear OS watch faces.",
            "og_title": "Watch Face Giveaways — amoledwatchfaces™",
            "og_desc": "Claim free 100% OFF Google Play promo codes for premium Wear OS watch faces."
        },
        "de": {
            "title": "Gewinnspiele — amoledwatchfaces",
            "desc": "Sichere dir kostenlose 100% Rabatt Google Play Gutscheincodes für Premium Wear OS Zifferblätter.",
            "og_title": "Zifferblatt-Gewinnspiele — amoledwatchfaces™",
            "og_desc": "Sichere dir kostenlose 100% Rabatt Google Play Gutscheincodes für Premium Wear OS Zifferblätter."
        },
        "es": {
            "title": "Sorteos — amoledwatchfaces",
            "desc": "Consigue códigos promocionales gratuitos del 100% para esferas de reloj premium de Wear OS en Google Play.",
            "og_title": "Sorteos de esferas de reloj — amoledwatchfaces™",
            "og_desc": "Consigue códigos promocionales gratuitos del 100% para esferas de reloj premium de Wear OS en Google Play."
        },
        "pl": {
            "title": "Rozdania kodów — amoledwatchfaces",
            "desc": "Odbierz darmowe kody promocyjne 100% zniżki w Google Play na tarcze zegarka Wear OS.",
            "og_title": "Rozdania tarcz zegarka — amoledwatchfaces™",
            "og_desc": "Odbierz darmowe kody promocyjne 100% zniżki w Google Play na tarcze zegarka Wear OS."
        },
        "sk": {
            "title": "Rozdávanie kupónov — amoledwatchfaces",
            "desc": "Získaj bezplatné 100% zľavové promo kódy na Google Play pre prémiové ciferníky Wear OS.",
            "og_title": "Rozdávanie kupónov na ciferníky — amoledwatchfaces™",
            "og_desc": "Získaj bezplatné 100% zľavové promo kódy na Google Play pre prémiové ciferníky Wear OS."
        }
    },
    "guide.html": {
        "en": {
            "title": "Installation Guide — amoledwatchfaces",
            "desc": "Official installation guide for Wear OS watch faces. Step-by-step instructions for Google Play on your watch and phone.",
            "og_title": "How to Install Wear OS Watch Faces — amoledwatchfaces™",
            "og_desc": "Official installation guide for Wear OS watch faces. Step-by-step instructions for Google Play on your watch and phone."
        },
        "de": {
            "title": "Installationsanleitung — amoledwatchfaces",
            "desc": "Offizielle Installationsanleitung für Wear OS Zifferblätter. Schritt-für-Schritt-Anleitung für Google Play auf deiner Uhr und deinem Telefon.",
            "og_title": "Wear OS Zifferblätter installieren — amoledwatchfaces™",
            "og_desc": "Offizielle Installationsanleitung für Wear OS Zifferblätter. Schritt-für-Schritt-Anleitung für Google Play auf deiner Uhr und deinem Telefon."
        },
        "es": {
            "title": "Guía de instalación — amoledwatchfaces",
            "desc": "Guía oficial de instalación para esferas de reloj Wear OS. Instrucciones paso a paso para Google Play en tu reloj y teléfono.",
            "og_title": "Cómo instalar esferas de reloj Wear OS — amoledwatchfaces™",
            "og_desc": "Guía oficial de instalación para esferas de reloj Wear OS. Instrucciones paso a paso para Google Play en tu reloj y teléfono."
        },
        "pl": {
            "title": "Instrukcja instalacji — amoledwatchfaces",
            "desc": "Oficjalna instrukcja instalacji tarcz zegarka Wear OS. Wskazówki krok po kroku dla Google Play na zegarku i telefonie.",
            "og_title": "Jak zainstalować tarcze zegarka Wear OS — amoledwatchfaces™",
            "og_desc": "Oficjalna instrukcja instalacji tarcz zegarka Wear OS. Wskazówki krok po kroku dla Google Play na zegarku i telefonie."
        },
        "sk": {
            "title": "Návod na inštaláciu — amoledwatchfaces",
            "desc": "Oficiálny návod na inštaláciu ciferníkov Wear OS. Podrobný postup pre Google Play na hodinkách a telefóne.",
            "og_title": "Ako nainštalovať ciferníky Wear OS — amoledwatchfaces™",
            "og_desc": "Oficiálny návod na inštaláciu ciferníkov Wear OS. Podrobný postup pre Google Play na hodinkách a telefóne."
        }
    },
    "contact.html": {
        "en": {
            "title": "Contact — amoledwatchfaces",
            "desc": "Contact amoledwatchfaces™ support. Send us your feedback, inquiries, or bug reports.",
            "og_title": "Contact Support — amoledwatchfaces™",
            "og_desc": "Contact amoledwatchfaces™ support. Send us your feedback, inquiries, or bug reports."
        },
        "de": {
            "title": "Kontakt — amoledwatchfaces",
            "desc": "Kontaktiere den Support von amoledwatchfaces™. Sende uns dein Feedback, Fragen oder Fehlerberichte.",
            "og_title": "Kontakt & Support — amoledwatchfaces™",
            "og_desc": "Kontaktiere den Support von amoledwatchfaces™. Sende uns dein Feedback, Fragen oder Fehlerberichte."
        },
        "es": {
            "title": "Contacto — amoledwatchfaces",
            "desc": "Contacta con el soporte de amoledwatchfaces™. Envíanos tus comentarios, consultas o informes de errores.",
            "og_title": "Contacto y soporte — amoledwatchfaces™",
            "og_desc": "Contacta con el soporte de amoledwatchfaces™. Envíanos tus comentarios, consultas o informes de errores."
        },
        "pl": {
            "title": "Kontakt — amoledwatchfaces",
            "desc": "Skontaktuj się ze wsparciem amoledwatchfaces™. Prześlij nam swoją opinię, pytania lub zgłoszenia błędów.",
            "og_title": "Kontakt ze wsparciem — amoledwatchfaces™",
            "og_desc": "Skontaktuj się ze wsparciem amoledwatchfaces™. Prześlij nam swoją opinię, pytania lub zgłoszenia błędów."
        },
        "sk": {
            "title": "Kontakt — amoledwatchfaces",
            "desc": "Kontaktujte podporu amoledwatchfaces™. Pošlite nám spätnú väzbu, otázky alebo hlásenia chýb.",
            "og_title": "Kontakt a podpora — amoledwatchfaces™",
            "og_desc": "Kontaktujte podporu amoledwatchfaces™. Pošlite nám spätnú väzbu, otázky alebo hlásenia chýb."
        }
    },
    "privacy.html": {
        "en": {
            "title": "Privacy Policy — amoledwatchfaces",
            "desc": "Privacy policy for amoledwatchfaces™ Wear OS apps and website.",
            "og_title": "Privacy Policy — amoledwatchfaces™",
            "og_desc": "Privacy policy for amoledwatchfaces™ Wear OS apps and website."
        },
        "de": {
            "title": "Datenschutzerklärung — amoledwatchfaces",
            "desc": "Datenschutzerklärung für Wear OS Apps und die Website von amoledwatchfaces™.",
            "og_title": "Datenschutzerklärung — amoledwatchfaces™",
            "og_desc": "Datenschutzerklärung für Wear OS Apps und die Website von amoledwatchfaces™."
        },
        "es": {
            "title": "Política de privacidad — amoledwatchfaces",
            "desc": "Política de privacidad de las aplicaciones Wear OS y el sitio web de amoledwatchfaces™.",
            "og_title": "Política de privacidad — amoledwatchfaces™",
            "og_desc": "Política de privacidad de las aplicaciones Wear OS y el sitio web de amoledwatchfaces™."
        },
        "pl": {
            "title": "Polityka prywatności — amoledwatchfaces",
            "desc": "Polityka prywatności dla aplikacji Wear OS oraz strony internetowej amoledwatchfaces™.",
            "og_title": "Polityka prywatności — amoledwatchfaces™",
            "og_desc": "Polityka prywatności dla aplikacji Wear OS oraz strony internetowej amoledwatchfaces™."
        },
        "sk": {
            "title": "Zásady ochrany osobných údajov — amoledwatchfaces",
            "desc": "Zásady ochrany osobných údajov pre Wear OS aplikácie a web amoledwatchfaces™.",
            "og_title": "Zásady ochrany osobných údajov — amoledwatchfaces™",
            "og_desc": "Zásady ochrany osobných údajov pre Wear OS aplikácie a web amoledwatchfaces™."
        }
    },
    "404.html": {
        "en": {
            "title": "404 - Page Not Found — amoledwatchfaces",
            "desc": "The page you are looking for does not exist or has been moved.",
            "og_title": "404 - Page Not Found — amoledwatchfaces",
            "og_desc": "The page you are looking for does not exist or has been moved."
        },
        "de": {
            "title": "404 - Seite nicht gefunden — amoledwatchfaces",
            "desc": "Die gesuchte Seite existiert nicht oder wurde verschoben.",
            "og_title": "404 - Seite nicht gefunden — amoledwatchfaces",
            "og_desc": "Die gesuchte Seite existiert nicht oder wurde verschoben."
        },
        "es": {
            "title": "404 - Página no encontrada — amoledwatchfaces",
            "desc": "La página que buscas no existe o ha sido movida.",
            "og_title": "404 - Página no encontrada — amoledwatchfaces",
            "og_desc": "La página que buscas no existe o ha sido movida."
        },
        "pl": {
            "title": "404 - Nie znaleziono strony — amoledwatchfaces",
            "desc": "Strona, której szukasz, nie istnieje lub została przeniesiona.",
            "og_title": "404 - Nie znaleziono strony — amoledwatchfaces",
            "og_desc": "Strona, której szukasz, nie istnieje lub została przeniesiona."
        },
        "sk": {
            "title": "404 - Stránka nenájdená — amoledwatchfaces",
            "desc": "Stránka, ktorú hľadáte, neexistuje alebo bola presunutá.",
            "og_title": "404 - Stránka nenájdená — amoledwatchfaces",
            "og_desc": "Stránka, ktorú hľadáte, neexistuje alebo bola presunutá."
        }
    }
}

def load_translations():
    translations = {}
    for lang in LANGUAGES:
        loc_file = LOCALES_DIR / f"{lang}.json"
        if loc_file.exists():
            with open(loc_file, "r", encoding="utf-8") as f:
                translations[lang] = json.load(f)
        else:
            translations[lang] = {}
    return translations

def get_trans(lang_dict, key_path, fallback=""):
    keys = key_path.split(".")
    curr = lang_dict
    for k in keys:
        if isinstance(curr, dict) and k in curr:
            curr = curr[k]
        else:
            return fallback
    return curr if curr is not None else fallback

def generate_hreflang_tags(slug):
    lines = []
    x_def = f"https://amoledwatchfaces.com/{slug}" if slug else "https://amoledwatchfaces.com/"
    lines.append(f'  <link rel="alternate" hreflang="x-default" href="{x_def}" />')
    for l in LANGUAGES:
        if l == "en":
            u = f"https://amoledwatchfaces.com/{slug}" if slug else "https://amoledwatchfaces.com/"
        else:
            u = f"https://amoledwatchfaces.com/{l}/{slug}" if slug else f"https://amoledwatchfaces.com/{l}/"
        lines.append(f'  <link rel="alternate" hreflang="{l}" href="{u}" />')
    return "\n".join(lines)

def make_lang_items(active_lang, slug):
    items = []
    lang_names = {
        "en": "English",
        "de": "Deutsch",
        "es": "Español",
        "pl": "Polski",
        "sk": "Slovenčina"
    }
    for l in LANGUAGES:
        if l == "en":
            url = f"/{slug}" if slug else "/"
        else:
            url = f"/{l}/{slug}" if slug else f"/{l}/"
        active_class = " active" if l == active_lang else ""
        aria_selected = "true" if l == active_lang else "false"
        items.append(f'''            <a href="{url}" class="lang-item{active_class}" role="option" data-lang="{l}" aria-selected="{aria_selected}">
              <span class="lang-name">{lang_names[l]}</span>
              <svg class="lang-check" xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
                <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
              </svg>
            </a>''')
    return "\n".join(items)

def translate_html(content, lang, page_name, slug, translations):
    d = translations[lang]
    en_d = translations["en"]

    # 1. Update <html lang="...">
    content = re.sub(r'<html\b([^>]*)\blang="[^"]*"', rf'<html\1lang="{lang}"', content)

    # 2. Update canonical URL
    if slug:
        canon_url = f"https://amoledwatchfaces.com/{lang}/{slug}" if lang != "en" else f"https://amoledwatchfaces.com/{slug}"
    else:
        canon_url = f"https://amoledwatchfaces.com/{lang}/" if lang != "en" else "https://amoledwatchfaces.com/"
    content = re.sub(r'<link\s+rel="canonical"\s+href="[^"]*"\s*/?>', f'<link rel="canonical" href="{canon_url}" />', content)

    # 3. Update og:url and twitter:url
    content = re.sub(r'<meta\s+property="og:url"\s+content="[^"]*"\s*/?>', f'<meta property="og:url" content="{canon_url}" />', content)
    content = re.sub(r'<meta\s+name="twitter:url"\s+content="[^"]*"\s*/?>', f'<meta name="twitter:url" content="{canon_url}" />', content)

    # 4. Inject / replace hreflang tags
    hreflang_block = generate_hreflang_tags(slug)
    # Remove existing hreflang tags if any
    content = re.sub(r'[ \t]*<link\s+rel="alternate"\s+hreflang="[^"]*"\s+href="[^"]*"\s*/?>\n?', '', content)
    # Insert hreflang after canonical tag
    content = re.sub(
        r'(<link\s+rel="canonical"\s+href="[^"]*"\s*/?>)',
        rf'\1\n{hreflang_block}',
        content
    )

    # 5. Localized Page Metadata (Title, Meta Description, OG tags)
    page_meta = PAGE_METADATA.get(page_name, {}).get(lang)
    if page_meta:
        # Title
        content = re.sub(r'<title>[^<]*</title>', f'<title>{page_meta["title"]}</title>', content)
        # Description
        content = re.sub(r'<meta\s+name="description"\s+content="[^"]*"\s*/?>', f'<meta name="description" content="{page_meta["desc"]}" />', content)
        # OG Title & Desc
        content = re.sub(r'<meta\s+property="og:title"\s+content="[^"]*"\s*/?>', f'<meta property="og:title" content="{page_meta["og_title"]}" />', content)
        content = re.sub(r'<meta\s+property="og:description"\s+content="[^"]*"\s*/?>', f'<meta property="og:description" content="{page_meta["og_desc"]}" />', content)

    # 6. Translate text inside data-i18n
    def replace_data_i18n(match):
        open_tag = match.group(1)
        key = match.group(3)
        close_tag = match.group(5)
        val = get_trans(d, key, get_trans(en_d, key, match.group(4)))
        return f"{open_tag}>{val}{close_tag}"

    content = re.sub(
        r'(<([a-zA-Z0-9]+)\b[^>]*\bdata-i18n="([^"]+)"[^>]*)>([\s\S]*?)(</\2>)',
        replace_data_i18n,
        content
    )

    # 7. Translate attributes: data-i18n-placeholder
    def replace_placeholder(match):
        before = match.group(1)
        key = match.group(2)
        val = get_trans(d, key, get_trans(en_d, key, ""))
        return f'{before}placeholder="{val}"'
    content = re.sub(r'(\bdata-i18n-placeholder="([^"]+)"[^>]*?)\bplaceholder="[^"]*"', replace_placeholder, content)

    # 8. Translate attributes: data-i18n-title
    def replace_title(match):
        before = match.group(1)
        key = match.group(2)
        val = get_trans(d, key, get_trans(en_d, key, ""))
        return f'{before}title="{val}"'
    content = re.sub(r'(\bdata-i18n-title="([^"]+)"[^>]*?)\btitle="[^"]*"', replace_title, content)

    # 9. Translate attributes: data-i18n-aria-label
    def replace_aria(match):
        before = match.group(1)
        key = match.group(2)
        val = get_trans(d, key, get_trans(en_d, key, ""))
        return f'{before}aria-label="{val}"'
    content = re.sub(r'(\bdata-i18n-aria-label="([^"]+)"[^>]*?)\baria-label="[^"]*"', replace_aria, content)

    # 10. Localize internal page and navigation links for target language
    if lang != "en":
        # Brand link & Home
        content = re.sub(r'<a\s+class="brand"\s+href="[^"]*"', f'<a class="brand" href="/{lang}/"', content)
        content = re.sub(r'\bhref="(?:\./|/)"', f'href="/{lang}/"', content)
        # Main nav & page links
        for p in ["apps", "bogo", "giveaways", "guide", "contact", "privacy"]:
            content = re.sub(rf'\bhref="(?:/?){p}"', f'href="/{lang}/{p}"', content)

    # 11. Language picker menu
    content = re.sub(r'<span class="lang-label">[^<]*</span>', f'<span class="lang-label">{lang.upper()}</span>', content)

    sel_lang_title = get_trans(d, "nav.select_language", get_trans(en_d, "nav.select_language", "Select language"))
    content = re.sub(r'(\bid="lang-toggle"[^>]*?)\baria-label="[^"]*"', rf'\1aria-label="{sel_lang_title}"', content)
    content = re.sub(r'(\bid="lang-toggle"[^>]*?)\btitle="[^"]*"', rf'\1title="{sel_lang_title}"', content)

    # Replace lang menu items with direct links
    content = re.sub(
        r'<div id="lang-menu" class="lang-menu"[^>]*>[\s\S]*?</div>',
        f'<div id="lang-menu" class="lang-menu" role="listbox" aria-label="Language selection" tabindex="-1">\n{make_lang_items(lang, slug)}\n          </div>',
        content
    )

    # 11. Root-relative assets (styles, scripts, images, favicons)
    # Styles
    content = re.sub(r'\bhref="style\.css([^"]*)"', r'href="/style.css\1"', content)
    # Scripts
    content = re.sub(r'\bjs/i18n\.js\?v=1\.0\b', 'js/i18n.js?v=1.1', content)
    content = re.sub(r'\bsrc="theme\.js([^"]*)"', r'src="/theme.js\1"', content)
    content = re.sub(r'\bsrc="js/([^"]*)"', r'src="/js/\1"', content)
    # Images & Preloads
    content = re.sub(r'\bhref="assets/([^"]*)"', r'href="/assets/\1"', content)
    content = re.sub(r'\bsrc="assets/([^"]*)"', r'src="/assets/\1"', content)
    # Manifest
    content = re.sub(r'\bhref="site\.webmanifest"', r'href="/site.webmanifest"', content)
    content = re.sub(r'\bhref="manifest\.json"', r'href="/manifest.json"', content)

    return content

def build():
    translations = load_translations()
    print(f"Loaded translations for: {', '.join(LANGUAGES)}")

    for page_info in PAGES:
        file_name = page_info["file"]
        slug = page_info["slug"]
        src_path = BASE_DIR / file_name

        if not src_path.exists():
            print(f"Warning: {file_name} not found, skipping.")
            continue

        with open(src_path, "r", encoding="utf-8") as f:
            raw_html = f.read()

        # 1. Update English root page (inject hreflang, root-relative assets, lang-picker links)
        updated_en_html = translate_html(raw_html, "en", file_name, slug, translations)
        with open(src_path, "w", encoding="utf-8", newline="\n") as f:
            f.write(updated_en_html)
        print(f"  [en] Updated {file_name}")

        # 2. Build translated pages for each target language
        for lang in TARGET_LANGUAGES:
            target_dir = BASE_DIR / lang
            target_dir.mkdir(exist_ok=True)

            translated_html = translate_html(raw_html, lang, file_name, slug, translations)
            out_file = target_dir / file_name
            with open(out_file, "w", encoding="utf-8", newline="\n") as f:
                f.write(translated_html)
            print(f"  [{lang}] Generated {lang}/{file_name}")

    print("\nMultilingual build complete! All pages generated successfully with LF line endings.")

if __name__ == "__main__":
    build()
