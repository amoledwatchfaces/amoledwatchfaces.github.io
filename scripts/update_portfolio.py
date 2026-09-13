#!/usr/bin/env python3
"""
scripts/update_portfolio.py

Fetches Google Play Store metadata for all active packages in data/portfolio.json:
- Syncs latest 'lastUpdated' date.
- Detects active sales / promotions.
- Computes rounded 'discount' (0.1 - 1.0, where 1.0 = 100% off).
- Extracts 'saleText' (e.g., 'Sale ends in 3 days').
- Extracts 'saleEndTime' (Unix timestamp in seconds).
- Only writes to data/portfolio.json if changes are detected.
"""

import concurrent.futures
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

PORTFOLIO_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'portfolio.json')
USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'


def fetch_play_store_data(package_name):
    """
    Fetches the Google Play page for a package and extracts:
    - last_updated: string (e.g. 'Sep 2, 2026')
    - on_sale: bool
    - discount: float or None (0.1 - 1.0)
    - sale_text: string or None
    - sale_end_time: int or None (Unix epoch seconds)
    """
    url = f'https://play.google.com/store/apps/details?id={package_name}&hl=en&gl=US'
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})

    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            html = resp.read().decode('utf-8', errors='replace')
    except urllib.error.HTTPError as e:
        return {'status': 'http_error', 'code': e.code, 'package': package_name}
    except Exception as e:
        return {'status': 'error', 'error': str(e), 'package': package_name}

    # Safety: check for consent page, bot detection, or captcha
    if 'consent.google.com' in html or 'sorry/index' in html:
        return {'status': 'blocked', 'package': package_name, 'reason': 'consent_or_captcha'}

    # Safety: verify standard Google Play app page markers exist
    is_play_page = (
        'play-lh.googleusercontent.com' in html
        or 'itemprop="name"' in html
        or 'data-docid' in html
        or 'Google Play' in html
    )
    if not is_play_page:
        return {'status': 'invalid_markup', 'package': package_name, 'reason': 'missing_play_markers'}

    # 1. Extract 'lastUpdated' date
    m_up = re.search(r'Updated on</div><div[^>]*>([^<]+)</div>', html)
    last_updated = m_up.group(1).strip() if m_up else None

    # 2. Extract Sale Status
    # Anchor to the primary purchase button for this specific package to prevent
    # matching "Similar Apps" or "More by developer" sales on the page.
    on_sale = False
    discount = None
    sale_text = None
    sale_end_time = None

    btn_pattern = rf'<button[^>]*aria-label=[\"\\\']([^\"\\\']+)[\"\\\'][^>]*>(?:(?!</button>).)*?id={re.escape(package_name)}(?:(?!</button>).)*?</button>'
    m_btn = re.search(btn_pattern, html, re.DOTALL)
    btn_matched = bool(m_btn)
    btn_label = m_btn.group(1) if m_btn else ''

    if 'was' in btn_label.lower():
        m_discount = re.search(
            r'Was\s+[\$\€\£\¥]?([0-9\.]+).*?(?:now\s+reduced\s+to|now|reduced\s+to)\s+([\$\€\£\¥]?([0-9\.]+)|Install)',
            btn_label,
            re.I
        )
        if m_discount:
            on_sale = True
            orig_price = float(m_discount.group(1))
            sale_str = m_discount.group(2)
            if 'install' in sale_str.lower() or sale_str == '0':
                discount = 1.0  # 100% free promotion
            else:
                sale_price = float(re.sub(r'[^\d\.]', '', sale_str))
                raw = (orig_price - sale_price) / orig_price
                discount = round(raw, 1)
                discount = max(0.1, min(0.9, discount))

            # Look for the primary countdown banner and Unix timestamp
            m_banner = re.search(r'\[\[(\d{10})\],\"(Sale ends[^\"]+)\"', html)
            if m_banner:
                sale_end_time = int(m_banner.group(1))
                sale_text = m_banner.group(2).strip().replace('\u202f', ' ').replace('\\u003d', '=')
            else:
                m_banner = re.search(r'\"(Sale ends[^\"]+)\"', html)
                if m_banner:
                    sale_text = m_banner.group(1).strip().replace('\u202f', ' ').replace('\\u003d', '=')
                else:
                    sale_text = 'On sale'

    return {
        'status': 'ok',
        'package': package_name,
        'btn_matched': btn_matched,
        'last_updated': last_updated,
        'on_sale': on_sale,
        'discount': discount,
        'sale_text': sale_text,
        'sale_end_time': sale_end_time,
    }


def update_portfolio(dry_run=False):
    normalized_path = os.path.abspath(PORTFOLIO_PATH)
    if not os.path.exists(normalized_path):
        print(f'Error: portfolio.json not found at {normalized_path}')
        sys.exit(1)

    with open(normalized_path, 'r', encoding='utf-8') as f:
        items = json.load(f)

    # Filter available items with package names
    checkable_items = [
        item for item in items
        if item.get('packageName') and item.get('isAvailable') is not False
    ]

    print(f'Checking {len(checkable_items)} active packages from portfolio.json...')

    results = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_pkg = {
            executor.submit(fetch_play_store_data, item['packageName']): item['packageName']
            for item in checkable_items
        }
        for future in concurrent.futures.as_completed(future_to_pkg):
            pkg = future_to_pkg[future]
            try:
                data = future.result()
                results[pkg] = data
            except Exception as e:
                results[pkg] = {'status': 'error', 'error': str(e), 'package': pkg}

    # Safety Circuit Breakers
    total_checkable = len(checkable_items)
    ok_results = [r for r in results.values() if r.get('status') == 'ok']
    success_rate = len(ok_results) / total_checkable if total_checkable > 0 else 0

    if success_rate < 0.70:
        print(f"SAFETY ABORT: Only {len(ok_results)}/{total_checkable} ({success_rate*100:.1f}%) packages returned valid Play Store pages.")
        print("Google Play may be blocking requests or page layout changed. portfolio.json was NOT modified!")
        return False

    matched_buttons = sum(1 for r in ok_results if r.get('btn_matched'))
    button_match_rate = matched_buttons / len(ok_results) if ok_results else 0

    if button_match_rate < 0.50:
        print(f"SAFETY ABORT: Button markup found on only {matched_buttons}/{len(ok_results)} ({button_match_rate*100:.1f}%) pages.")
        print("Google Play button HTML layout has likely changed. Aborting to protect active sale data in portfolio.json!")
        return False

    print(f'Validation passed: {len(ok_results)}/{total_checkable} pages OK, {matched_buttons} button anchors confirmed.')

    updated_count = 0
    sales_count = 0
    changes_detected = False

    for item in items:
        pkg = item.get('packageName')
        if not pkg or pkg not in results:
            continue

        res = results[pkg]
        if res.get('status') != 'ok':
            continue

        app_name = item.get('appName', pkg)

        # 1. Check lastUpdated
        new_updated = res.get('last_updated')
        if new_updated and new_updated != item.get('lastUpdated'):
            print(f"[{app_name}] Updated date changed: '{item.get('lastUpdated')}' -> '{new_updated}'")
            item['lastUpdated'] = new_updated
            changes_detected = True
            updated_count += 1

        # 2. Check onSale status
        is_on_sale = res.get('on_sale', False)
        prev_on_sale = item.get('onSale', False)

        if is_on_sale:
            new_discount = res.get('discount')
            new_sale_text = res.get('sale_text')
            new_sale_end_time = res.get('sale_end_time')

            if (
                item.get('onSale') is not True
                or item.get('discount') != new_discount
                or item.get('saleText') != new_sale_text
                or item.get('saleEndTime') != new_sale_end_time
            ):
                print(f"[{app_name}] ON SALE! Discount: {new_discount}, Text: '{new_sale_text}', EndTime: {new_sale_end_time}")
                item['onSale'] = True
                item['discount'] = new_discount
                if new_sale_text:
                    item['saleText'] = new_sale_text
                elif 'saleText' in item:
                    del item['saleText']
                if new_sale_end_time:
                    item['saleEndTime'] = new_sale_end_time
                elif 'saleEndTime' in item:
                    del item['saleEndTime']
                changes_detected = True
                sales_count += 1
            else:
                sales_count += 1
        else:
            # Not on sale: clean up any stale sale fields
            if prev_on_sale is True or 'discount' in item or 'saleText' in item or 'saleEndTime' in item:
                print(f"[{app_name}] Sale ended. Reverting to standard price.")
                item['onSale'] = False
                item.pop('discount', None)
                item.pop('saleText', None)
                item.pop('saleEndTime', None)
                changes_detected = True
            else:
                if 'onSale' in item and item['onSale'] is not False:
                    item['onSale'] = False
                    changes_detected = True

    print('=' * 50)
    print(f'Summary: {sales_count} app(s) on active sale | {updated_count} date(s) updated.')

    if changes_detected:
        if dry_run:
            print('[DRY-RUN] Changes detected, but file was not written.')
        else:
            with open(normalized_path, 'w', encoding='utf-8', newline='\n') as f:
                json.dump(items, f, indent=4, ensure_ascii=False)
                f.write('\n')
            print(f'Successfully updated {normalized_path}!')
        return True
    else:
        print('portfolio.json is already up to date. No changes needed.')
        return False


if __name__ == '__main__':
    dry = '--dry-run' in sys.argv
    changed = update_portfolio(dry_run=dry)
    # Return exit code 0 regardless so workflows don't fail when no changes occur
    sys.exit(0)
