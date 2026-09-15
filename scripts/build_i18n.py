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
import html
import urllib.parse
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
LOCALES_DIR = BASE_DIR / "locales"

LANGUAGES = ["en", "de", "es", "fr", "it", "ko", "pl", "pt", "sk"]
TARGET_LANGUAGES = ["de", "es", "fr", "it", "ko", "pl", "pt", "sk"]

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
        "fr": {
            "title": "amoledwatchfaces™ | Cadrans de montre pour Wear OS",
            "desc": "Découvrez des cadrans de montre Wear OS haute résolution et économes en batterie. Créés dans Android Studio avec le Watch Face Format et des complications personnalisables.",
            "og_title": "amoledwatchfaces™ | Cadrans de montre pour Wear OS",
            "og_desc": "Découvrez des cadrans de montre Wear OS haute résolution et économes en batterie. Créés dans Android Studio avec le Watch Face Format et des complications personnalisables."
        },
        "it": {
            "title": "amoledwatchfaces™ | Quadranti per Wear OS",
            "desc": "Scopri quadranti Wear OS ad alta risoluzione e a basso consumo di batteria. Creati in Android Studio usando Watch Face Format con complicazioni personalizzabili.",
            "og_title": "amoledwatchfaces™ | Quadranti per Wear OS",
            "og_desc": "Scopri quadranti Wear OS ad alta risoluzione e a basso consumo di batteria. Creati in Android Studio usando Watch Face Format con complicazioni personalizzabili."
        },
        "ko": {
            "title": "amoledwatchfaces™ | Wear OS 워치 페이스",
            "desc": "고해상도 및 배터리 친화적인 Wear OS 워치 페이스를 만나보세요. 맞춤형 컴플리케이션과 함께 Watch Face Format을 사용하여 Android Studio에서 제작되었습니다.",
            "og_title": "amoledwatchfaces™ | Wear OS 워치 페이스",
            "og_desc": "고해상도 및 배터리 친화적인 Wear OS 워치 페이스를 만나보세요. 맞춤형 컴플리케이션과 함께 Watch Face Format을 사용하여 Android Studio에서 제작되었습니다."
        },
        "pl": {
            "title": "amoledwatchfaces™ | Tarcze zegarka dla Wear OS",
            "desc": "Tarcze zegarka Wear OS o wysokiej rozdzielczości i niskim zużyciu baterii. Zbudowane w Android Studio z użyciem Watch Face Format z konfigurowalnymi komplikacjami.",
            "og_title": "amoledwatchfaces™ | Tarcze zegarka dla Wear OS",
            "og_desc": "Tarcze zegarka Wear OS o wysokiej rozdzielczości i niskim zużyciu baterii. Zbudowane w Android Studio z użyciem Watch Face Format z konfigurowalnymi komplikacjami."
        },
        "pt": {
            "title": "amoledwatchfaces™ | Mostradores de relógio para Wear OS",
            "desc": "Descubra mostradores de relógio para Wear OS em alta resolução e com economia de bateria. Criados no Android Studio com o Watch Face Format e complicações personalizáveis.",
            "og_title": "amoledwatchfaces™ | Mostradores de relógio para Wear OS",
            "og_desc": "Descubra mostradores de relógio para Wear OS em alta resolução e com economia de bateria. Criados no Android Studio com o Watch Face Format e complicações personalizáveis."
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
        "fr": {
            "title": "Applications Wear OS — amoledwatchfaces",
            "desc": "Applications et complications Wear OS créées par amoledwatchfaces™.",
            "og_title": "Applications Wear OS — amoledwatchfaces™",
            "og_desc": "Découvrez les complications et applications compagnons Wear OS d'amoledwatchfaces™."
        },
        "it": {
            "title": "App Wear OS — amoledwatchfaces",
            "desc": "App e complicazioni Wear OS create da amoledwatchfaces™.",
            "og_title": "Applicazioni Wear OS — amoledwatchfaces™",
            "og_desc": "Esplora le complicazioni e le app complementari per Wear OS di amoledwatchfaces™."
        },
        "ko": {
            "title": "Wear OS 앱 — amoledwatchfaces",
            "desc": "amoledwatchfaces™에서 제작한 Wear OS 앱 및 컴플리케이션.",
            "og_title": "Wear OS 애플리케이션 — amoledwatchfaces™",
            "og_desc": "amoledwatchfaces™의 Wear OS 컴플리케이션 및 도우미 앱을 만나보세요."
        },
        "pl": {
            "title": "Aplikacje Wear OS — amoledwatchfaces",
            "desc": "Aplikacje i komplikacje Wear OS stworzone przez amoledwatchfaces™.",
            "og_title": "Aplikacje Wear OS — amoledwatchfaces™",
            "og_desc": "Odkryj komplikacje i aplikacje pomocnicze Wear OS od amoledwatchfaces™."
        },
        "pt": {
            "title": "Aplicativos Wear OS — amoledwatchfaces",
            "desc": "Aplicativos e complicações para Wear OS criados por amoledwatchfaces™.",
            "og_title": "Aplicações Wear OS — amoledwatchfaces™",
            "og_desc": "Explore complicações e aplicativos complementares para Wear OS da amoledwatchfaces™."
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
        "fr": {
            "title": "BOGO — amoledwatchfaces",
            "desc": "Achetez un cadran ou une application de notre catalogue et recevez gratuitement un autre cadran de votre choix.",
            "og_title": "BOGO (Un acheté, un offert) — amoledwatchfaces™",
            "og_desc": "Achetez un cadran ou une application de notre catalogue et recevez gratuitement un autre cadran de votre choix."
        },
        "it": {
            "title": "BOGO — amoledwatchfaces",
            "desc": "Acquista un quadrante o un'app dal nostro catalogo e ricevi gratuitamente un altro quadrante a tua scelta.",
            "og_title": "BOGO (Prendi due, paghi uno) — amoledwatchfaces™",
            "og_desc": "Acquista un quadrante o un'app dal nostro catalogo e ricevi gratuitamente un altro quadrante a tua scelta."
        },
        "ko": {
            "title": "BOGO — amoledwatchfaces",
            "desc": "포트폴리오에서 워치 페이스 또는 앱을 구매하고 원하는 워치 페이스 하나를 무료로 받아보세요.",
            "og_title": "BOGO (1+1 이벤트) — amoledwatchfaces™",
            "og_desc": "포트폴리오에서 워치 페이스 또는 앱을 구매하고 원하는 워치 페이스 하나를 무료로 받아보세요."
        },
        "pl": {
            "title": "BOGO — amoledwatchfaces",
            "desc": "Kup tarczę zegarka lub aplikację z naszego portfolio i odbierz drugą wybraną tarczę za darmo.",
            "og_title": "BOGO (Kup jedną, drugą odbierz gratis) — amoledwatchfaces™",
            "og_desc": "Kup tarczę zegarka lub aplikację z naszego portfolio i odbierz drugą wybraną tarczę za darmo."
        },
        "pt": {
            "title": "BOGO — amoledwatchfaces",
            "desc": "Compre um mostrador de relógio ou aplicativo do nosso catálogo e ganhe outro mostrador à sua escolha gratuitamente.",
            "og_title": "BOGO (Compre Um, Leve Outro) — amoledwatchfaces™",
            "og_desc": "Compre um mostrador de relógio ou aplicativo do nosso catálogo e ganhe outro mostrador à sua escolha gratuitamente."
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
        "fr": {
            "title": "Cadeaux & Codes promos — amoledwatchfaces",
            "desc": "Obtenez des codes promotionnels Google Play 100% gratuits pour des cadrans Wear OS premium.",
            "og_title": "Codes promos pour cadrans — amoledwatchfaces™",
            "og_desc": "Obtenez des codes promotionnels Google Play 100% gratuits pour des cadrans Wear OS premium."
        },
        "it": {
            "title": "Giveaway — amoledwatchfaces",
            "desc": "Richiedi codici promozionali gratuiti al 100% su Google Play per quadranti Wear OS premium.",
            "og_title": "Giveaway di quadranti — amoledwatchfaces™",
            "og_desc": "Richiedi codici promozionali gratuiti al 100% su Google Play per quadranti Wear OS premium."
        },
        "ko": {
            "title": "무료 배포 — amoledwatchfaces",
            "desc": "프리미엄 Wear OS 워치 페이스용 100% 할인 Google Play 프로모션 코드를 받아보세요.",
            "og_title": "워치 페이스 무료 배포 — amoledwatchfaces™",
            "og_desc": "프리미엄 Wear OS 워치 페이스용 100% 할인 Google Play 프로모션 코드를 받아보세요."
        },
        "pl": {
            "title": "Rozdania kodów — amoledwatchfaces",
            "desc": "Odbierz darmowe kody promocyjne 100% zniżki w Google Play na tarcze zegarka Wear OS.",
            "og_title": "Rozdania tarcz zegarka — amoledwatchfaces™",
            "og_desc": "Odbierz darmowe kody promocyjne 100% zniżki w Google Play na tarcze zegarka Wear OS."
        },
        "pt": {
            "title": "Sorteios — amoledwatchfaces",
            "desc": "Resgate códigos promocionais gratuitos com 100% de desconto no Google Play para mostradores Wear OS premium.",
            "og_title": "Sorteios de mostradores — amoledwatchfaces™",
            "og_desc": "Resgate códigos promocionais gratuitos com 100% de desconto no Google Play para mostradores Wear OS premium."
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
        "fr": {
            "title": "Guide d'installation — amoledwatchfaces",
            "desc": "Guide officiel d'installation pour les cadrans Wear OS. Instructions détaillées pour Google Play sur montre et téléphone.",
            "og_title": "Comment installer des cadrans Wear OS — amoledwatchfaces™",
            "og_desc": "Guide officiel d'installation pour les cadrans Wear OS. Instructions détaillées pour Google Play sur montre et téléphone."
        },
        "it": {
            "title": "Guida all'installazione — amoledwatchfaces",
            "desc": "Guida ufficiale all'installazione dei quadranti Wear OS. Istruzioni dettagliate per Google Play su orologio e telefono.",
            "og_title": "Come installare i quadranti Wear OS — amoledwatchfaces™",
            "og_desc": "Guida ufficiale all'installazione dei quadranti Wear OS. Istruzioni dettagliate per Google Play su orologio e telefono."
        },
        "ko": {
            "title": "설치 가이드 — amoledwatchfaces",
            "desc": "Wear OS 워치 페이스 공식 설치 가이드. 시계 및 스마트폰의 Google Play 단계별 지침 안내.",
            "og_title": "Wear OS 워치 페이스 설치 방법 — amoledwatchfaces™",
            "og_desc": "Wear OS 워치 페이스 공식 설치 가이드. 시계 및 스마트폰의 Google Play 단계별 지침 안내."
        },
        "pl": {
            "title": "Instrukcja instalacji — amoledwatchfaces",
            "desc": "Oficjalna instrukcja instalacji tarcz zegarka Wear OS. Wskazówki krok po kroku dla Google Play na zegarku i telefonie.",
            "og_title": "Jak zainstalować tarcze zegarka Wear OS — amoledwatchfaces™",
            "og_desc": "Oficjalna instrukcja instalacji tarcz zegarka Wear OS. Wskazówki krok po kroku dla Google Play na zegarku i telefonie."
        },
        "pt": {
            "title": "Guia de instalação — amoledwatchfaces",
            "desc": "Guia oficial de instalação para mostradores Wear OS. Instruções passo a passo para a Google Play no relógio e no celular.",
            "og_title": "Como instalar mostradores Wear OS — amoledwatchfaces™",
            "og_desc": "Guia oficial de instalação para mostradores Wear OS. Instruções passo a passo para a Google Play no relógio e no celular."
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
        "fr": {
            "title": "Contact — amoledwatchfaces",
            "desc": "Contactez l'assistance d'amoledwatchfaces™. Envoyez-nous vos retours, questions ou signalements de bugs.",
            "og_title": "Contact et support — amoledwatchfaces™",
            "og_desc": "Contactez l'assistance d'amoledwatchfaces™. Envoyez-nous vos retours, questions ou signalements de bugs."
        },
        "it": {
            "title": "Contatti — amoledwatchfaces",
            "desc": "Contatta il supporto di amoledwatchfaces™. Inviaci feedback, domande o segnalazioni di bug.",
            "og_title": "Contatto e supporto — amoledwatchfaces™",
            "og_desc": "Contatta il supporto di amoledwatchfaces™. Inviaci feedback, domande o segnalazioni di bug."
        },
        "ko": {
            "title": "문의하기 — amoledwatchfaces",
            "desc": "amoledwatchfaces™ 고객 지원에 문의하세요. 의견, 문의 사항 또는 버그 신고를 보내주세요.",
            "og_title": "고객 지원 문의 — amoledwatchfaces™",
            "og_desc": "amoledwatchfaces™ 고객 지원에 문의하세요. 의견, 문의 사항 또는 버그 신고를 보내주세요."
        },
        "pl": {
            "title": "Kontakt — amoledwatchfaces",
            "desc": "Skontaktuj się ze wsparciem amoledwatchfaces™. Prześlij nam swoją opinię, pytania lub zgłoszenia błędów.",
            "og_title": "Kontakt ze wsparciem — amoledwatchfaces™",
            "og_desc": "Skontaktuj się ze wsparciem amoledwatchfaces™. Prześlij nam swoją opinię, pytania lub zgłoszenia błędów."
        },
        "pt": {
            "title": "Contato — amoledwatchfaces",
            "desc": "Entre em contato com o suporte da amoledwatchfaces™. Envie seu feedback, dúvidas ou relatórios de bugs.",
            "og_title": "Contato e suporte — amoledwatchfaces™",
            "og_desc": "Entre em contato com o suporte da amoledwatchfaces™. Envie seu feedback, dúvidas ou relatórios de bugs."
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
        "fr": {
            "title": "Politique de confidentialité — amoledwatchfaces",
            "desc": "Politique de confidentialité pour les applications Wear OS et le site amoledwatchfaces™.",
            "og_title": "Politique de confidentialité — amoledwatchfaces™",
            "og_desc": "Politique de confidentialité pour les applications Wear OS et le site amoledwatchfaces™."
        },
        "it": {
            "title": "Informativa sulla privacy — amoledwatchfaces",
            "desc": "Informativa sulla privacy per le applicazioni Wear OS e il sito web amoledwatchfaces™.",
            "og_title": "Informativa sulla privacy — amoledwatchfaces™",
            "og_desc": "Informativa sulla privacy per le applicazioni Wear OS e il sito web amoledwatchfaces™."
        },
        "ko": {
            "title": "개인정보처리방침 — amoledwatchfaces",
            "desc": "amoledwatchfaces™ Wear OS 앱 및 웹사이트 개인정보처리방침.",
            "og_title": "개인정보처리방침 — amoledwatchfaces™",
            "og_desc": "amoledwatchfaces™ Wear OS 앱 및 웹사이트 개인정보처리방침."
        },
        "pl": {
            "title": "Polityka prywatności — amoledwatchfaces",
            "desc": "Polityka prywatności dla aplikacji Wear OS oraz strony internetowej amoledwatchfaces™.",
            "og_title": "Polityka prywatności — amoledwatchfaces™",
            "og_desc": "Polityka prywatności dla aplikacji Wear OS oraz strony internetowej amoledwatchfaces™."
        },
        "pt": {
            "title": "Política de privacidade — amoledwatchfaces",
            "desc": "Política de privacidade para aplicativos Wear OS e site amoledwatchfaces™.",
            "og_title": "Política de privacidade — amoledwatchfaces™",
            "og_desc": "Política de privacidade para aplicativos Wear OS e site amoledwatchfaces™."
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
        "fr": {
            "title": "404 - Page non trouvée — amoledwatchfaces",
            "desc": "La page que vous recherchez n'existe pas ou a été déplacée.",
            "og_title": "404 - Page non trouvée — amoledwatchfaces",
            "og_desc": "La page que vous recherchez n'existe pas ou a été déplacée."
        },
        "it": {
            "title": "404 - Pagina non trovata — amoledwatchfaces",
            "desc": "La pagina che stai cercando non esiste o è stata spostata.",
            "og_title": "404 - Pagina non trovata — amoledwatchfaces",
            "og_desc": "La pagina che stai cercando non esiste o è stata spostata."
        },
        "ko": {
            "title": "404 - 페이지를 찾을 수 없습니다 — amoledwatchfaces",
            "desc": "찾으시는 페이지가 존재하지 않거나 이동되었습니다.",
            "og_title": "404 - 페이지를 찾을 수 없습니다 — amoledwatchfaces",
            "og_desc": "찾으시는 페이지가 존재하지 않거나 이동되었습니다."
        },
        "pl": {
            "title": "404 - Nie znaleziono strony — amoledwatchfaces",
            "desc": "Strona, której szukasz, nie istnieje lub została przeniesiona.",
            "og_title": "404 - Nie znaleziono strony — amoledwatchfaces",
            "og_desc": "Strona, której szukasz, nie istnieje lub została przeniesiona."
        },
        "pt": {
            "title": "404 - Página não encontrada — amoledwatchfaces",
            "desc": "A página que você está procurando não existe ou foi movida.",
            "og_title": "404 - Página não encontrada — amoledwatchfaces",
            "og_desc": "A página que você está procurando não existe ou foi movida."
        },
        "sk": {
            "title": "404 - Stránka nenájdená — amoledwatchfaces",
            "desc": "Stránka, ktorú hľadáte, neexistuje alebo bola presunutá.",
            "og_title": "404 - Stránka nenájdená — amoledwatchfaces",
            "og_desc": "Stránka, ktorú hľadáte, neexistuje alebo bola presunutá."
        }
    }
}

OG_LOCALES = {
    "en": "en_US",
    "de": "de_DE",
    "es": "es_ES",
    "fr": "fr_FR",
    "it": "it_IT",
    "ko": "ko_KR",
    "pl": "pl_PL",
    "pt": "pt_BR",
    "sk": "sk_SK",
}

PAGE_KEYWORDS = {
    "index.html": {
        "en": "watch face, watchface, wear os, amoled watch faces, pixel watch, galaxy watch",
        "de": "zifferblatt, watchface, wear os, amoled zifferblätter, pixel watch, galaxy watch",
        "es": "esfera de reloj, watchface, wear os, esferas amoled, pixel watch, galaxy watch",
        "fr": "cadran de montre, watchface, wear os, cadrans amoled, pixel watch, galaxy watch",
        "it": "quadrante, watchface, wear os, quadranti amoled, pixel watch, galaxy watch",
        "ko": "워치 페이스, 워치페이스, wear os, amoled 워치페이스, 픽셀 워치, 갤럭시 워치",
        "pl": "tarcza zegarka, watchface, wear os, tarcze amoled, pixel watch, galaxy watch",
        "pt": "mostrador de relógio, watchface, wear os, mostradores amoled, pixel watch, galaxy watch",
        "sk": "ciferník, watchface, wear os, amoled ciferníky, pixel watch, galaxy watch",
    },
    "apps.html": {
        "en": "wear os apps, wear os complications, watch face complications, weather complications, phone battery complication, favorite apps tile",
        "de": "wear os apps, wear os komplikationen, zifferblatt komplikationen, wetter komplikationen, handy akku komplikation, lieblings apps kachel",
        "es": "aplicaciones wear os, complicaciones wear os, complicaciones de esferas, complicaciones del tiempo, batería del teléfono, mosaico de aplicaciones",
        "fr": "applications wear os, complications wear os, complications cadran, complications météo, batterie du téléphone, tuile applications favorites",
        "it": "app wear os, complicazioni wear os, complicazioni quadrante, complicazioni meteo, batteria telefono, riquadro app preferite",
        "ko": "wear os 앱, wear os 컴플리케이션, 워치 페이스 컴플리케이션, 날씨 컴플리케이션, 스마트폰 배터리 컴플리케이션, 즐겨찾기 앱 타일",
        "pl": "aplikacje wear os, komplikacje wear os, komplikacje tarczy zegarka, komplikacje pogodowe, bateria telefonu, kafelek ulubionych aplikacji",
        "pt": "aplicativos wear os, complicações wear os, complicações de mostradores, complicações de clima, bateria do celular, bloco de aplicativos favoritos",
        "sk": "aplikácie wear os, komplikácie wear os, komplikácie ciferníka, meteorologické komplikácie, batéria telefónu, dlaždica obľúbených aplikácií",
    },
    "bogo.html": {
        "en": "bogo, buy one get one, wear os promotion, free watch face, amoledwatchfaces bogo",
        "de": "bogo, 1 kaufen 1 gratis, wear os aktion, kostenloses zifferblatt, amoledwatchfaces bogo",
        "es": "bogo, compra uno llévate otro, promoción wear os, esfera gratis, amoledwatchfaces bogo",
        "fr": "bogo, un acheté un offert, promotion wear os, cadran gratuit, amoledwatchfaces bogo",
        "it": "bogo, prendi due paghi uno, promozione wear os, quadrante gratis, amoledwatchfaces bogo",
        "ko": "bogo, 1+1 이벤트, wear os 프로모션, 무료 워치 페이스, amoledwatchfaces bogo",
        "pl": "bogo, kup jedną drugą odbierz gratis, promocja wear os, darmowa tarcza, amoledwatchfaces bogo",
        "pt": "bogo, compre um leve outro, promoção wear os, mostrador grátis, amoledwatchfaces bogo",
        "sk": "bogo, kúp jeden druhý máš zadarmo, akcia wear os, ciferník zadarmo, amoledwatchfaces bogo",
    },
    "giveaways.html": {
        "en": "wear os promo codes, watch face coupons, google play promo codes, free wear os watch faces",
        "de": "wear os gutscheincodes, zifferblatt coupons, google play promo codes, kostenlose wear os zifferblätter",
        "es": "códigos promocionales wear os, cupones para esferas, códigos google play, esferas wear os gratis",
        "fr": "codes promo wear os, coupons pour cadrans, codes promo google play, cadrans wear os gratuits",
        "it": "codici promozionali wear os, coupon per quadranti, codici promo google play, quadranti wear os gratis",
        "ko": "wear os 프로모션 코드, 워치 페이스 쿠폰, 구글 플레이 프로모션 코드, 무료 wear os 워치 페이스",
        "pl": "kody promocyjne wear os, kupony na tarcze zegarka, kody google play, darmowe tarcze wear os",
        "pt": "códigos promocionais wear os, cupons de mostradores, códigos google play, mostradores wear os grátis",
        "sk": "promo kódy wear os, kupóny na ciferníky, google play promo kódy, bezplatné ciferníky wear os",
    },
    "guide.html": {
        "en": "how to install wear os watch face, wear os installation guide, install watch face galaxy watch, pixel watch setup",
        "de": "wear os zifferblatt installieren anleitung, zifferblatt installationsanleitung, galaxy watch zifferblatt, pixel watch einrichten",
        "es": "cómo instalar esfera wear os, guía de instalación wear os, instalar esfera galaxy watch, configurar pixel watch",
        "fr": "comment installer un cadran wear os, guide installation wear os, installer cadran galaxy watch, configuration pixel watch",
        "it": "come installare quadrante wear os, guida installazione wear os, installare quadrante galaxy watch, configurazione pixel watch",
        "ko": "wear os 워치 페이스 설치 방법, wear os 설치 가이드, 갤럭시 워치 워치페이스 설치, 픽셀 워치 설정",
        "pl": "jak zainstalować tarczę wear os, instrukcja instalacji wear os, instalacja tarczy galaxy watch, konfiguracja pixel watch",
        "pt": "como instalar mostrador wear os, guia de instalação wear os, instalar mostrador galaxy watch, configuração pixel watch",
        "sk": "ako nainštalovať ciferník wear os, návod na inštaláciu wear os, inštalácia ciferníka galaxy watch, nastavenie pixel watch",
    },
    "contact.html": {
        "en": "contact amoledwatchfaces, wear os support, watch face developer contact",
        "de": "kontakt amoledwatchfaces, wear os support, zifferblatt entwickler kontakt",
        "es": "contacto amoledwatchfaces, soporte wear os, contacto desarrollador esferas",
        "fr": "contact amoledwatchfaces, support wear os, contact développeur cadrans",
        "it": "contatto amoledwatchfaces, supporto wear os, contatto sviluppatore quadranti",
        "ko": "amoledwatchfaces 문의, wear os 고객 지원, 워치 페이스 개발자 연락처",
        "pl": "kontakt amoledwatchfaces, wsparcie wear os, kontakt z twórcą tarcz",
        "pt": "contato amoledwatchfaces, suporte wear os, contato desenvolvedor mostradores",
        "sk": "kontakt amoledwatchfaces, podpora wear os, kontakt na vývojára ciferníkov",
    },
    "privacy.html": {
        "en": "privacy policy, amoledwatchfaces privacy, wear os privacy policy",
        "de": "datenschutzerklärung, amoledwatchfaces datenschutz, wear os datenschutz",
        "es": "política de privacidad, privacidad amoledwatchfaces, política de privacidad wear os",
        "fr": "politique de confidentialité, confidentialité amoledwatchfaces, politique de confidentialité wear os",
        "it": "informativa sulla privacy, privacy amoledwatchfaces, informativa privacy wear os",
        "ko": "개인정보처리방침, amoledwatchfaces 개인정보, wear os 개인정보처리방침",
        "pl": "polityka prywatności, prywatność amoledwatchfaces, polityka prywatności wear os",
        "pt": "política de privacidade, privacidade amoledwatchfaces, política de privacidade wear os",
        "sk": "zásady ochrany osobných údajov, súkromie amoledwatchfaces, ochrana osobných údajov wear os",
    },
    "404.html": {
        "en": "404, page not found, amoledwatchfaces",
        "de": "404, seite nicht gefunden, amoledwatchfaces",
        "es": "404, página no encontrada, amoledwatchfaces",
        "fr": "404, page non trouvée, amoledwatchfaces",
        "it": "404, pagina non trovata, amoledwatchfaces",
        "ko": "404, 페이지를 찾을 수 없습니다, amoledwatchfaces",
        "pl": "404, nie znaleziono strony, amoledwatchfaces",
        "pt": "404, página não encontrada, amoledwatchfaces",
        "sk": "404, stránka nenájdená, amoledwatchfaces",
    }
}


FAQ_ITEMS = {
    "en": [
        {
            "q": "How to install Wear OS watch faces from Google Play Store on your watch?",
            "a": "In the Google Play Store app on your smartphone, tap the drop-down arrow next to the Install button, select your smartwatch as the target device, and tap Install. Once installed, touch and hold your current watch face on your smartwatch, swipe to Add watch face, and select your new watch face."
        },
        {
            "q": "How to install Wear OS watch faces using the phone companion app?",
            "a": "Open the companion app installed on your smartphone, ensure your watch is connected via Bluetooth, and tap 'Install on Watch'. On your watch, the Google Play Store listing will open automatically. Tap Install to complete."
        },
        {
            "q": "How to install Wear OS watch faces from the Google Play Store website on PC or Mac?",
            "a": "Open the watch face link in any desktop web browser while logged into the same Google account as your smartwatch. Click the 'Install on more devices' button, select your watch model from the device dropdown list, and click Install."
        }
    ],
    "de": [
        {
            "q": "Wie installiere ich Wear OS Zifferblätter über den Google Play Store auf der Uhr?",
            "a": "Tippe in der Google Play Store App auf deinem Smartphone auf den Dropdown-Pfeil neben der Schaltfläche Installieren, wähle deine Smartwatch aus und tippe auf Installieren. Halte nach Abschluss der Installation dein aktuelles Zifferblatt auf der Uhr gedrückt, wische zu Zifferblatt hinzufügen und wähle dein neues Zifferblatt aus."
        },
        {
            "q": "Wie installiere ich Wear OS Zifferblätter über die Smartphone-Begleit-App?",
            "a": "Öffne die auf deinem Telefon installierte Begleit-App, stelle sicher, dass deine Uhr über Bluetooth verbunden ist, und tippe auf 'Auf Uhr installieren'. Auf deiner Smartwatch öffnet sich der Play Store-Eintrag automatisch zum Installieren."
        },
        {
            "q": "Wie installiere ich Wear OS Zifferblätter über die Play Store Website am PC oder Mac?",
            "a": "Öffne den Link zum Zifferblatt in einem Desktop-Webbrowser, während du mit demselben Google-Konto wie auf der Uhr angemeldet bist. Klicke auf 'Auf weiteren Geräten installieren', wähle deine Smartwatch aus und klicke auf Installieren."
        }
    ],
    "es": [
        {
            "q": "¿Cómo instalar esferas de reloj Wear OS desde Google Play Store en el reloj?",
            "a": "En la aplicación Google Play Store de tu teléfono, toca la flecha desplegable junto al botón Instalar, selecciona tu smartwatch como dispositivo de destino y pulsa Instalar. Una vez instalada, mantén pulsada la pantalla de tu reloj, desliza para añadir esfera y selecciona tu nueva esfera."
        },
        {
            "q": "¿Cómo instalar esferas de reloj mediante la aplicación complementaria del teléfono?",
            "a": "Abre la aplicación complementaria descargada en tu teléfono, asegúrate de que el reloj esté conectado por Bluetooth y toca 'Instalar en el reloj'. En tu smartwatch se abrirá automáticamente Google Play Store para completar la instalación."
        },
        {
            "q": "¿Cómo instalar esferas de reloj desde el sitio web de Google Play Store en PC o Mac?",
            "a": "Abre el enlace de la esfera en cualquier navegador web de ordenador con la misma cuenta de Google que tu reloj. Haz clic en 'Instalar en más dispositivos', selecciona tu smartwatch y confirma la instalación."
        }
    ],
    "fr": [
        {
            "q": "Comment installer des cadrans Wear OS depuis le Google Play Store sur votre montre ?",
            "a": "Dans l'application Google Play Store de votre smartphone, appuyez sur la flèche déroulante à côté du bouton Installer, sélectionnez votre montre connectée et appuyez sur Installer. Une fois l'installation terminée, maintenez votre cadran actuel enfoncé, balayez pour ajouter un cadran et sélectionnez votre nouveau cadran."
        },
        {
            "q": "Comment installer un cadran Wear OS via l'application compagnon pour smartphone ?",
            "a": "Ouvrez l'application compagnon téléchargée sur votre téléphone, vérifiez que votre montre est connectée en Bluetooth, puis appuyez sur 'Installer sur la montre'. La fiche Google Play s'ouvrira automatiquement sur votre montre."
        },
        {
            "q": "Comment installer des cadrans Wear OS depuis le site Google Play Store sur PC ou Mac ?",
            "a": "Ouvrez le lien du cadran dans un navigateur Web sur votre ordinateur en étant connecté au même compte Google que votre montre. Cliquez sur 'Installer sur plus d'appareils', choisissez votre montre dans la liste et cliquez sur Installer."
        }
    ],
    "it": [
        {
            "q": "Come installare quadranti Wear OS da Google Play Store sull'orologio?",
            "a": "Nell'app Google Play Store sullo smartphone, tocca la freccia a discesa accanto a Installa, seleziona il tuo smartwatch e tocca Installa. Al termine, tieni premuto il quadrante corrente sull'orologio, scorri per aggiungere un nuovo quadrante e selezionalo."
        },
        {
            "q": "Come installare quadranti Wear OS tramite l'app complementare del telefono?",
            "a": "Apri l'app complementare scaricata sul tuo telefono, assicurati che l'orologio sia connesso tramite Bluetooth e tocca 'Installa sull'orologio'. L'elenco del Google Play Store si aprirà automaticamente sullo smartwatch."
        },
        {
            "q": "Come installare quadranti Wear OS dal sito web Google Play Store su PC o Mac?",
            "a": "Apri il link del quadrante in qualsiasi browser web per computer con lo stesso account Google dell'orologio. Fai clic su 'Installa su più dispositivi', seleziona il tuo smartwatch e procedi con l'installazione."
        }
    ],
    "ko": [
        {
            "q": "스마트워치의 Google Play 스토어에서 Wear OS 워치 페이스를 설치하는 방법은 무엇인가요?",
            "a": "스마트폰의 Google Play 스토어 앱에서 설치 버튼 옆의 드롭다운 화살표를 탭하고 스마트워치를 대상 기기로 선택한 다음 설치를 누릅니다. 설치가 완료되면 워치 화면을 길게 누르고 워치 페이스 추가로 스와이프하여 새 워치 페이스를 선택합니다."
        },
        {
            "q": "스마트폰 컴패니언 앱을 통해 워치 페이스를 설치하는 방법은 무엇인가요?",
            "a": "스마트폰에 다운로드된 컴패니언 앱을 열고 블루투스로 워치가 연결되어 있는지 확인한 후 '시계에 설치' 버튼을 누릅니다. 스마트워치에서 Google Play 스토어가 자동으로 열리면 설치를 완료합니다."
        },
        {
            "q": "PC 또는 Mac의 Google Play 스토어 웹사이트에서 워치 페이스를 설치하는 방법은 무엇인가요?",
            "a": "워치와 동일한 Google 계정으로 로그인한 컴퓨터 웹 브라우저에서 워치 페이스 링크를 엽니다. '다른 기기에 설치' 버튼을 클릭하고 기기 목록에서 스마트워치를 선택한 후 설치를 클릭합니다."
        }
    ],
    "pl": [
        {
            "q": "Jak zainstalować tarcze Wear OS ze sklepu Google Play na zegarku?",
            "a": "W aplikacji Google Play Store na smartfonie dotknij strzałki obok przycisku Zainstaluj, wybierz smartwatch jako urządzenie docelowe i dotknij Zainstaluj. Po zakończeniu instalacji przytrzymaj palec na tarczy zegarka, przesuń, aby dodać tarczę, i wybierz nowo zainstalowaną tarczę."
        },
        {
            "q": "Jak zainstalować tarcze za pomocą aplikacji towarzyszącej na telefonie?",
            "a": "Otwórz aplikację towarzyszącą pobraną na telefon, upewnij się, że zegarek jest połączony przez Bluetooth, i dotknij 'Zainstaluj na zegarku'. Na smartwatchu automatycznie otworzy się sklep Google Play, aby dokończyć instalację."
        },
        {
            "q": "Jak zainstalować tarcze Wear OS ze strony sklepu Google Play na komputerze PC lub Mac?",
            "a": "Otwórz stronę tarczy w przeglądarce internetowej na komputerze, będąc zalogowanym na to samo konto Google co na zegarku. Kliknij 'Zainstaluj na dodatkowych urządzeniach', wybierz swój smartwatch i kliknij Zainstaluj."
        }
    ],
    "pt": [
        {
            "q": "Como instalar mostradores Wear OS a partir da Google Play Store no relógio?",
            "a": "Na aplicação Google Play Store no smartphone, toque na seta ao lado do botão Instalar, selecione o seu smartwatch e toque em Instalar. Após a instalação, mantenha premido o mostrador atual no relógio, deslize para adicionar mostrador e escolha o seu novo mostrador."
        },
        {
            "q": "Como instalar mostradores através da aplicação complementar no telemóvel?",
            "a": "Abra a aplicação complementar no seu telemóvel, confirme a ligação Bluetooth ao relógio e toque em 'Instalar no relógio'. No smartwatch, a listagem do Google Play Store abrirá automaticamente para concluir a instalação."
        },
        {
            "q": "Como instalar mostradores a partir do site da Google Play Store no computador PC ou Mac?",
            "a": "Abra a ligação do mostrador num navegador de computador com a mesma conta Google do relógio. Clique em 'Instalar em mais dispositivos', selecione o seu smartwatch e clique em Instalar."
        }
    ],
    "sk": [
        {
            "q": "Ako nainštalovať Wear OS ciferníky z obchodu Google Play priamo do hodiniek?",
            "a": "V aplikácii Obchod Google Play vo vašom telefóne klepnite na rozbaľovaciu šípku vedľa tlačidla Inštalovať, vyberte svoje smart hodinky ako cieľové zariadenie a klepnite na Inštalovať. Po dokončení inštalácie podržte prst na aktuálnom ciferníku na hodinkách, potiahnite pre pridanie ciferníka a vyberte nový ciferník."
        },
        {
            "q": "Ako nainštalovať ciferník prostredníctvom sprievodnej aplikácie v telefóne?",
            "a": "Otvorte sprievodnú aplikáciu nainštalovanú v telefóne, uistite sa, že sú hodinky pripojené cez Bluetooth a klepnite na 'Inštalovať na hodinkách'. Na smart hodinkách sa automaticky otvorí Obchod Google Play pre dokončenie inštalácie."
        },
        {
            "q": "Ako nainštalovať Wear OS ciferníky z webovej stránky Google Play na počítači (PC / Mac)?",
            "a": "Otvorte odkaz na ciferník v ľubovoľnom webovom prehliadači na počítači prihlásení do rovnakého Google účtu ako na hodinkách. Kliknite na 'Inštalovať do viacerých zariadení', zvoľte svoje smart hodinky a potvrďte inštaláciu."
        }
    ]
}

BREADCRUMB_NAMES = {
    "apps": {
        "en": "Apps", "de": "Apps", "es": "Aplicaciones", "fr": "Applications",
        "it": "Applicazioni", "ko": "애플리케이션", "pl": "Aplikacje", "pt": "Aplicações", "sk": "Aplikácie"
    },
    "bogo": {
        "en": "BOGO Promotion", "de": "BOGO-Aktion", "es": "Promoción BOGO", "fr": "Promotion BOGO",
        "it": "Promozione BOGO", "ko": "BOGO 프로모션", "pl": "Promocja BOGO", "pt": "Promoção BOGO", "sk": "BOGO akcia"
    },
    "giveaways": {
        "en": "Giveaways", "de": "Giveaways", "es": "Sorteos", "fr": "Concours",
        "it": "Giveaway", "ko": "무료 나눔", "pl": "Rozdania", "pt": "Passatempos", "sk": "Súťaže a kupóny"
    },
    "guide": {
        "en": "Installation Guide", "de": "Installationsanleitung", "es": "Guía de instalación", "fr": "Guide d'installation",
        "it": "Guida all'installazione", "ko": "설치 가이드", "pl": "Instrukcja instalacji", "pt": "Guia de instalação", "sk": "Inštalačný návod"
    },
    "contact": {
        "en": "Contact Support", "de": "Support kontaktieren", "es": "Contacto y soporte", "fr": "Contacter le support",
        "it": "Contatta l'assistenza", "ko": "고객 지원 문의", "pl": "Kontakt z pomocą", "pt": "Contactar suporte", "sk": "Kontakt a podpora"
    },
    "privacy": {
        "en": "Privacy Policy", "de": "Datenschutzerklärung", "es": "Política de privacidad", "fr": "Politique de confidentialité",
        "it": "Informativa sulla privacy", "ko": "개인정보 처리방침", "pl": "Polityka prywatności", "pt": "Política de privacidade", "sk": "Zásady ochrany osobných údajov"
    }
}

def generate_jsonld(slug, lang):
    domain = "https://amoledwatchfaces.com"
    base_url = f"{domain}/{lang}" if lang != "en" else domain
    curr_url = f"{base_url}/{slug}" if slug else (f"{domain}/{lang}/" if lang != "en" else f"{domain}/")
    home_url = f"{domain}/{lang}/" if lang != "en" else f"{domain}/"

    graph = []

    if slug == "":
        graph.append({
            "@type": "WebSite",
            "@id": f"{domain}/#website",
            "url": home_url,
            "name": "amoledwatchfaces",
            "inLanguage": lang,
            "description": PAGE_METADATA.get("index.html", {}).get(lang, {}).get("desc", "Privacy-respecting watch faces and apps for Wear OS.")
        })
        graph.append({
            "@type": "Organization",
            "@id": f"{domain}/#organization",
            "name": "amoledwatchfaces",
            "url": domain,
            "logo": f"{domain}/assets/favicon/favicon-96x96.png",
            "sameAs": [
                "https://play.google.com/store/apps/dev?id=5591589606735981545",
                "https://twitter.com/amoledwatchface",
                "https://www.instagram.com/amoledwatchfaces/",
                "https://www.facebook.com/amoledwatchfaces",
                "https://www.reddit.com/r/amoledwatchfaces/",
                "https://github.com/amoledwatchfaces"
            ]
        })
    else:
        page_title = BREADCRUMB_NAMES.get(slug, {}).get(lang, slug.capitalize())
        home_title = "Home" if lang == "en" else ("Domov" if lang == "sk" else ("Startseite" if lang == "de" else "Home"))
        graph.append({
            "@type": "BreadcrumbList",
            "@id": f"{curr_url}#breadcrumb",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": home_title,
                    "item": home_url
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": page_title,
                    "item": curr_url
                }
            ]
        })

    if slug == "guide":
        faqs = FAQ_ITEMS.get(lang, FAQ_ITEMS["en"])
        faq_entities = []
        for item in faqs:
            faq_entities.append({
                "@type": "Question",
                "name": item["q"],
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": item["a"]
                }
            })
        graph.append({
            "@type": "FAQPage",
            "@id": f"{curr_url}#faq",
            "mainEntity": faq_entities
        })
    elif slug == "apps":
        apps_items = [
            {
                "@type": "ListItem",
                "position": 1,
                "item": {
                    "@type": "SoftwareApplication",
                    "name": "Weather Complications",
                    "operatingSystem": "Wear OS",
                    "applicationCategory": "UtilityApplication",
                    "url": "https://play.google.com/store/apps/details?id=com.weartools.weathercomplications&utm_source=website&utm_medium=apps_page&utm_campaign=weathercomplications"
                }
            },
            {
                "@type": "ListItem",
                "position": 2,
                "item": {
                    "@type": "SoftwareApplication",
                    "name": "Phone Battery Complication",
                    "operatingSystem": "Wear OS",
                    "applicationCategory": "UtilityApplication",
                    "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
                    "url": "https://play.google.com/store/apps/details?id=com.weartools.phonebattcomp&utm_source=website&utm_medium=apps_page&utm_campaign=phonebattcomp"
                }
            },
            {
                "@type": "ListItem",
                "position": 3,
                "item": {
                    "@type": "SoftwareApplication",
                    "name": "Complications Suite",
                    "operatingSystem": "Wear OS",
                    "applicationCategory": "UtilityApplication",
                    "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
                    "url": "https://play.google.com/store/apps/details?id=com.weartools.weekdayutccomp&utm_source=website&utm_medium=apps_page&utm_campaign=weekdayutccomp"
                }
            },
            {
                "@type": "ListItem",
                "position": 4,
                "item": {
                    "@type": "SoftwareApplication",
                    "name": "Favorite Apps Tile",
                    "operatingSystem": "Wear OS",
                    "applicationCategory": "UtilityApplication",
                    "url": "https://play.google.com/store/apps/details?id=com.weartools.favoriteappstile&utm_source=website&utm_medium=apps_page&utm_campaign=favoriteappstile"
                }
            },
            {
                "@type": "ListItem",
                "position": 5,
                "item": {
                    "@type": "SoftwareApplication",
                    "name": "Health Services Plugin",
                    "operatingSystem": "Wear OS",
                    "applicationCategory": "UtilityApplication",
                    "url": "https://play.google.com/store/apps/details?id=com.weartools.hscomplications&utm_source=website&utm_medium=apps_page&utm_campaign=hscomplications"
                }
            },
            {
                "@type": "ListItem",
                "position": 6,
                "item": {
                    "@type": "SoftwareApplication",
                    "name": "Photo Complication",
                    "operatingSystem": "Wear OS",
                    "applicationCategory": "UtilityApplication",
                    "url": "https://play.google.com/store/apps/details?id=com.weartools.photocomplication&utm_source=website&utm_medium=apps_page&utm_campaign=photocomplication"
                }
            }
        ]
        graph.append({
            "@type": "ItemList",
            "@id": f"{curr_url}#itemlist",
            "name": "Wear OS Companion Apps & Complications",
            "itemListElement": apps_items
        })
    elif slug == "contact":
        graph.append({
            "@type": "ContactPage",
            "@id": f"{curr_url}#contact",
            "url": curr_url,
            "name": "Contact Support — amoledwatchfaces"
        })

    if not graph:
        return ""

    schema_data = {
        "@context": "https://schema.org",
        "@graph": graph
    }
    json_text = json.dumps(schema_data, ensure_ascii=False, indent=2)
    return '  <script type="application/ld+json">\n' + json_text + '\n  </script>'

def generate_prerendered_catalog(lang, translations):
    portfolio_path = BASE_DIR / "data" / "portfolio.json"
    if not portfolio_path.exists():
        return ""
    with open(portfolio_path, "r", encoding="utf-8") as f:
        portfolio = json.load(f)

    loc_desc = {}
    desc_path = BASE_DIR / "locales" / "descriptions" / f"{lang}.json"
    if desc_path.exists():
        try:
            with open(desc_path, "r", encoding="utf-8") as f:
                loc_desc = json.load(f)
        except Exception:
            pass

    badge_free = translations.get(lang, {}).get("apps_page", {}).get("badge_free", "Free")
    badge_paid = translations.get(lang, {}).get("apps_page", {}).get("badge_paid", "Paid")

    items = portfolio[:6]
    cards_html = []

    for item in items:
        app_name = html.escape(item.get("appName", ""))
        pkg = urllib.parse.quote(item.get("packageName", ""))
        item_id = item.get("id", "")
        desc = loc_desc.get(item_id, item.get("shortDescription", ""))
        desc_escaped = html.escape(desc)
        is_free = item.get("isFree", False)
        badge_text = badge_free if is_free else badge_paid
        badge_class = "badge-pill" if is_free else "badge-pill badge-paid"

        play_url = f"https://play.google.com/store/apps/details?id={pkg}&amp;utm_source=website&amp;utm_medium=catalog&amp;utm_campaign=collection"

        has_alt = item.get("hasAltImages", False)
        if has_alt:
            icons = (
                '<div class="watch-icons-wrapper dual-icons">\n'
                f'        <img src="/assets/icons/{item_id}.webp" alt="{app_name} Wear OS Watch Face" class="watch-icon-preview primary-icon" width="140" height="140" loading="lazy" decoding="async" />\n'
                f'        <img src="/assets/icons/{item_id}_1.webp" alt="{app_name} variation" class="watch-icon-preview secondary-icon" width="140" height="140" loading="lazy" decoding="async" />\n'
                '      </div>'
            )
        else:
            icons = (
                '<div class="watch-icons-wrapper single-icon">\n'
                f'        <img src="/assets/icons/{item_id}.webp" alt="{app_name} Wear OS Watch Face" class="watch-icon-preview" width="140" height="140" loading="lazy" decoding="async" />\n'
                '      </div>'
            )

        card = (
            '      <div class="card collection-card">\n'
            f'        <a href="{play_url}" target="_blank" rel="noopener" class="watch-preview-link" aria-label="{app_name} on Google Play">\n'
            f'          {icons}\n'
            '        </a>\n'
            '        <div class="collection-info">\n'
            '          <div class="collection-header">\n'
            '            <h3>\n'
            f'              <a href="{play_url}" target="_blank" rel="noopener" class="collection-title-link">\n'
            f'                {app_name}\n'
            '              </a>\n'
            '            </h3>\n'
            f'            <span class="{badge_class}">{badge_text}</span>\n'
            '          </div>\n'
            f'          <p class="collection-desc">{desc_escaped}</p>\n'
            '          <div class="links" style="margin-top: auto; padding-top: 14px;">\n'
            f'            <a href="{play_url}" target="_blank" rel="noopener" class="play-store-badge">\n'
            '              <img src="/assets/google-play-badge.svg" alt="Get it on Google Play" width="135" height="40" loading="lazy" decoding="async" />\n'
            '            </a>\n'
            '          </div>\n'
            '        </div>\n'
            '      </div>'
        )
        cards_html.append(card)

    cards_joined = "\n".join(cards_html)

    noscript_links = []
    for item in portfolio[:30]:
        name = html.escape(item.get("appName", ""))
        pkg = urllib.parse.quote(item.get("packageName", ""))
        item_desc = html.escape(loc_desc.get(item.get("id", ""), item.get("shortDescription", "")))
        p_url = f"https://play.google.com/store/apps/details?id={pkg}&amp;utm_source=website&amp;utm_medium=catalog&amp;utm_campaign=noscript"
        noscript_links.append(f'          <li><a href="{p_url}" target="_blank" rel="noopener"><strong>{name}</strong></a> — {item_desc}</li>')

    noscript_joined = "\n".join(noscript_links)
    noscript_block = (
        '      <noscript>\n'
        '        <div class="collection-noscript card" style="margin-top: 24px; padding: 20px;">\n'
        '          <h3 style="margin-top:0;">Complete AMOLED Watch Faces Portfolio for Wear OS</h3>\n'
        '          <ul style="line-height: 1.8; margin: 0; padding-left: 20px;">\n'
        f'{noscript_joined}\n'
        '          </ul>\n'
        '        </div>\n'
        '      </noscript>'
    )

    return (
        '      <div id="collection-grid" class="collection-grid">\n'
        f'{cards_joined}\n'
        f'{noscript_block}\n'
        '      </div>'
    )

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
        "fr": "Français",
        "it": "Italiano",
        "ko": "한국어",
        "pl": "Polski",
        "pt": "Português",
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

    # 5. Localized Page Metadata (Title, Meta Description, OG tags, Twitter tags)
    page_meta = PAGE_METADATA.get(page_name, {}).get(lang)
    if page_meta:
        # Title
        content = re.sub(r'<title>[^<]*</title>', f'<title>{page_meta["title"]}</title>', content)
        # Description
        content = re.sub(r'<meta\s+name="description"\s+content="[^"]*"\s*/?>', f'<meta name="description" content="{page_meta["desc"]}" />', content)
        # OG Title & Desc
        content = re.sub(r'<meta\s+property="og:title"\s+content="[^"]*"\s*/?>', f'<meta property="og:title" content="{page_meta["og_title"]}" />', content)
        content = re.sub(r'<meta\s+property="og:description"\s+content="[^"]*"\s*/?>', f'<meta property="og:description" content="{page_meta["og_desc"]}" />', content)
        # Twitter Title & Desc
        content = re.sub(r'<meta\s+name="twitter:title"\s+content="[^"]*"\s*/?>', f'<meta name="twitter:title" content="{page_meta["og_title"]}" />', content)
        content = re.sub(r'<meta\s+name="twitter:description"\s+content="[^"]*"\s*/?>', f'<meta name="twitter:description" content="{page_meta["og_desc"]}" />', content)

    # 5b. Localized Meta Keywords
    kw = PAGE_KEYWORDS.get(page_name, {}).get(lang)
    if kw:
        if '<meta name="keywords"' in content:
            content = re.sub(r'<meta\s+name="keywords"\s+content="[^"]*"\s*/?>', f'<meta name="keywords" content="{kw}" />', content)
        elif '<meta name="description"' in content:
            content = re.sub(r'(<meta\s+name="description"\s+content="[^"]*"\s*/?>)', rf'\1\n  <meta name="keywords" content="{kw}" />', content)

    # 5c. Open Graph Locale & Alternates
    content = re.sub(r'[ \t]*<meta\s+property="og:locale(?::alternate)?"\s+content="[^"]*"\s*/?>\n?', '', content)
    curr_loc = OG_LOCALES.get(lang, "en_US")
    loc_lines = [f'  <meta property="og:locale" content="{curr_loc}" />']
    for l in LANGUAGES:
        if l != lang:
            alt_loc = OG_LOCALES.get(l)
            if alt_loc:
                loc_lines.append(f'  <meta property="og:locale:alternate" content="{alt_loc}" />')
    loc_block = "\n".join(loc_lines)
    if 'property="og:site_name"' in content:
        content = re.sub(r'(<meta\s+property="og:site_name"\s+content="[^"]*"\s*/?>)', rf'\1\n{loc_block}', content)
    elif 'property="og:url"' in content:
        content = re.sub(r'(<meta\s+property="og:url"\s+content="[^"]*"\s*/?>)', rf'\1\n{loc_block}', content)
    elif 'property="og:type"' in content:
        content = re.sub(r'(<meta\s+property="og:type"\s+content="[^"]*"\s*/?>)', rf'\1\n{loc_block}', content)

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
        # Remove lang override from inline theme script on translated pages
        content = re.sub(
            r'[ \t]*const savedLang = localStorage\.getItem\([\'"]lang[\'"]\);[\s\S]*?}\s*}\n?',
            '',
            content
        )
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
    content = re.sub(r'\bsrcset="assets/([^"]*)"', r'srcset="/assets/\1"', content)
    # Manifest
    content = re.sub(r'\bhref="site\.webmanifest"', r'href="/site.webmanifest"', content)
    content = re.sub(r'\bhref="manifest\.json"', r'href="/manifest.json"', content)


    # Pre-render watch face collection grid on index.html
    if slug == "":
        catalog_html = generate_prerendered_catalog(lang, translations)
        if catalog_html:
            marker_pattern = r'<!--\s*COLLECTION_GRID_START\s*-->[\s\S]*?<!--\s*COLLECTION_GRID_END\s*-->'
            replacement_block = f'<!-- COLLECTION_GRID_START -->\n{catalog_html}\n      <!-- COLLECTION_GRID_END -->'
            content = re.sub(marker_pattern, lambda m: replacement_block, content)

    # Schema.org JSON-LD structured data
    content = re.sub(r'[ \t]*<script\s+type="application/ld\+json">[\s\S]*?</script>\n?', '', content)
    jsonld_script = generate_jsonld(slug, lang)
    if jsonld_script:
        content = content.replace("</head>", f"{jsonld_script}\n</head>")

    return content

def build_sitemap():
    sitemap_path = BASE_DIR / "sitemap.xml"

    core_pages = [
        {"slug": "", "changefreq": "daily", "priority_en": "1.0", "priority_i18n": "0.9"},
        {"slug": "apps", "changefreq": "weekly", "priority_en": "0.9", "priority_i18n": "0.8"},
        {"slug": "bogo", "changefreq": "weekly", "priority_en": "0.8", "priority_i18n": "0.7"},
        {"slug": "giveaways", "changefreq": "daily", "priority_en": "0.9", "priority_i18n": "0.8"},
        {"slug": "guide", "changefreq": "monthly", "priority_en": "0.7", "priority_i18n": "0.6"},
        {"slug": "contact", "changefreq": "monthly", "priority_en": "0.7", "priority_i18n": "0.6"},
        {"slug": "privacy", "changefreq": "monthly", "priority_en": "0.5", "priority_i18n": "0.4"},
    ]

    app_privacy_pages = [
        "catalogapp",
        "complicationssuite",
        "favoriteappstile",
        "healthplugin",
        "phonebatterycomplication",
        "photocomplication",
        "weathercomplications",
    ]

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '        xmlns:xhtml="http://www.w3.org/1999/xhtml">'
    ]

    for p in core_pages:
        slug = p["slug"]
        cf = p["changefreq"]
        p_en = p["priority_en"]
        p_i18n = p["priority_i18n"]

        # 1. English (root) entry
        en_loc = f"https://amoledwatchfaces.com/{slug}" if slug else "https://amoledwatchfaces.com/"
        x_def = en_loc
        lines.append('  <url>')
        lines.append(f'    <loc>{en_loc}</loc>')
        lines.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{x_def}" />')
        lines.append(f'    <xhtml:link rel="alternate" hreflang="en" href="{en_loc}" />')
        for l in TARGET_LANGUAGES:
            l_href = f"https://amoledwatchfaces.com/{l}/{slug}" if slug else f"https://amoledwatchfaces.com/{l}/"
            lines.append(f'    <xhtml:link rel="alternate" hreflang="{l}" href="{l_href}" />')
        lines.append(f'    <changefreq>{cf}</changefreq>')
        lines.append(f'    <priority>{p_en}</priority>')
        lines.append('  </url>')

        # 2. Localized entries
        for lang in TARGET_LANGUAGES:
            loc = f"https://amoledwatchfaces.com/{lang}/{slug}" if slug else f"https://amoledwatchfaces.com/{lang}/"
            lines.append('  <url>')
            lines.append(f'    <loc>{loc}</loc>')
            lines.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{x_def}" />')
            lines.append(f'    <xhtml:link rel="alternate" hreflang="en" href="{en_loc}" />')
            for l in TARGET_LANGUAGES:
                l_href = f"https://amoledwatchfaces.com/{l}/{slug}" if slug else f"https://amoledwatchfaces.com/{l}/"
                lines.append(f'    <xhtml:link rel="alternate" hreflang="{l}" href="{l_href}" />')
            lines.append(f'    <changefreq>{cf}</changefreq>')
            lines.append(f'    <priority>{p_i18n}</priority>')
            lines.append('  </url>')

    # Standalone App Privacy Pages
    for app in app_privacy_pages:
        lines.append('  <url>')
        lines.append(f'    <loc>https://amoledwatchfaces.com/apps/privacy/{app}</loc>')
        lines.append('    <changefreq>monthly</changefreq>')
        lines.append('    <priority>0.4</priority>')
        lines.append('  </url>')

    lines.append('</urlset>')
    lines.append('')

    content = "\n".join(lines)
    with open(sitemap_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    print("  [sitemap] Updated sitemap.xml with all multilingual entries and hreflang annotations")

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

    # 3. Update sitemap.xml
    build_sitemap()

    print("\nMultilingual build complete! All pages generated successfully with LF line endings.")

if __name__ == "__main__":
    build()
