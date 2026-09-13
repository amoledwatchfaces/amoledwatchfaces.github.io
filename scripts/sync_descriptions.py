#!/usr/bin/env python3
"""
scripts/sync_descriptions.py

Scrapes localized short descriptions from Google Play Store for all watch faces
and apps in data/portfolio.json, and saves them to locales/descriptions/{lang}.json.

Usage:
    python scripts/sync_descriptions.py --lang sk
    python scripts/sync_descriptions.py --lang sk --force
"""

import argparse
import concurrent.futures
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

# Ensure UTF-8 output on Windows
if sys.stdout and hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORTFOLIO_PATH = os.path.join(ROOT_DIR, 'data', 'portfolio.json')
DESCRIPTIONS_DIR = os.path.join(ROOT_DIR, 'locales', 'descriptions')

USER_AGENT = (
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
)

# Known regional defaults for Google Play `gl` parameter
GL_MAP = {
    'sk': 'SK',
    'cs': 'CZ',
    'de': 'DE',
    'es': 'ES',
    'fr': 'FR',
    'it': 'IT',
    'pl': 'PL',
    'en': 'US',
}

COMING_SOON_MAP = {
    'sk': 'Dostupné čoskoro...',
    'cs': 'Již brzy...',
    'de': 'Demnächst verfügbar...',
    'es': 'Próximamente...',
    'fr': 'Bientôt disponible...',
    'en': 'Available soon...',
}


def fetch_description(item, lang, gl):
    pkg = item.get('packageName')
    item_id = item.get('id')
    is_avail = item.get('isAvailable', True)
    en_desc = item.get('shortDescription', '')

    if not pkg:
        return item_id, None, 'no_package'

    if not is_avail or 'available soon' in en_desc.lower():
        fallback_soon = COMING_SOON_MAP.get(lang, COMING_SOON_MAP['en'])
        return item_id, fallback_soon, 'coming_soon'

    url = f'https://play.google.com/store/apps/details?id={pkg}&hl={lang}&gl={gl}'
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})

    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            content = resp.read().decode('utf-8', errors='replace')

        # Check for Google consent/captcha
        if 'consent.google.com' in content or 'sorry/index' in content:
            return item_id, None, 'blocked'

        # Extract description from meta tags
        patterns = [
            r'<meta\s+itemprop=["\']description["\']\s+content=["\']([^"\']+)["\']',
            r'<meta\s+property=["\']og:description["\']\s+content=["\']([^"\']+)["\']',
            r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']+)["\']',
        ]

        desc = None
        for pattern in patterns:
            m = re.search(pattern, content)
            if m:
                desc = html.unescape(m.group(1)).strip()
                break

        if desc:
            return item_id, desc, 'ok'
        return item_id, None, 'not_found'

    except urllib.error.HTTPError as e:
        return item_id, None, f'http_{e.code}'
    except Exception as e:
        return item_id, None, f'error_{e}'


def main():
    parser = argparse.ArgumentParser(description='Sync localized short descriptions from Google Play Store.')
    parser.add_argument('--lang', default='sk', help='Language code (e.g. sk, cs, de). Default: sk')
    parser.add_argument('--workers', type=int, default=6, help='Number of concurrent workers. Default: 6')
    parser.add_argument('--force', action='store_true', help='Re-fetch existing descriptions')
    parser.add_argument('--dry-run', action='store_true', help='Preview without writing to disk')
    args = parser.parse_args()

    lang = args.lang.lower()
    gl = GL_MAP.get(lang, lang.upper())

    os.makedirs(DESCRIPTIONS_DIR, exist_ok=True)
    out_file = os.path.join(DESCRIPTIONS_DIR, f'{lang}.json')

    # Load existing translations if available
    existing = {}
    if os.path.exists(out_file) and not args.force:
        try:
            with open(out_file, 'r', encoding='utf-8') as f:
                existing = json.load(f)
            print(f'Loaded {len(existing)} existing descriptions from {out_file}')
        except Exception as e:
            print(f'Notice: Could not read existing {out_file}: {e}')

    # Load portfolio
    if not os.path.exists(PORTFOLIO_PATH):
        print(f'Error: portfolio file not found at {PORTFOLIO_PATH}')
        sys.exit(1)

    with open(PORTFOLIO_PATH, 'r', encoding='utf-8') as f:
        portfolio = json.load(f)

    print(f'Found {len(portfolio)} items in portfolio. Target language: {lang} (gl={gl})')

    to_fetch = []
    for item in portfolio:
        item_id = item.get('id')
        if not item_id:
            continue
        if item_id in existing and not args.force:
            continue
        to_fetch.append(item)

    print(f'Items to fetch: {len(to_fetch)}')

    results = dict(existing)
    stats = {'ok': 0, 'coming_soon': 0, 'skipped': len(existing), 'failed': 0}

    if to_fetch:
        start_time = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
            futures = {executor.submit(fetch_description, item, lang, gl): item for item in to_fetch}
            for future in concurrent.futures.as_completed(futures):
                item = futures[future]
                item_id, desc, status = future.result()

                if desc:
                    results[item_id] = desc
                    if status == 'coming_soon':
                        stats['coming_soon'] += 1
                    else:
                        stats['ok'] += 1
                    print(f'  [+] {item_id}: {desc[:55]}...')
                else:
                    stats['failed'] += 1
                    # Keep English fallback if available
                    en_desc = item.get('shortDescription', '')
                    if en_desc:
                        results[item_id] = en_desc
                    print(f'  [-] {item_id} ({status}): fallback to EN')

        elapsed = time.time() - start_time
        print(f'\nFinished in {elapsed:.1f}s')

    print(f'Summary: {stats["ok"]} scraped, {stats["coming_soon"]} coming-soon, {stats["skipped"]} cached, {stats["failed"]} failed')

    # Sort dictionary by key order matching portfolio.json
    ordered_results = {}
    for item in portfolio:
        item_id = item.get('id')
        if item_id in results:
            ordered_results[item_id] = results[item_id]

    if not args.dry_run:
        # Write with UTF-8 and strict LF
        content = json.dumps(ordered_results, ensure_ascii=False, indent=4) + '\n'
        with open(out_file, 'wb') as f:
            f.write(content.encode('utf-8'))
        print(f'Saved {len(ordered_results)} localized descriptions to {out_file}')
    else:
        print('Dry run - no file written.')


if __name__ == '__main__':
    main()
