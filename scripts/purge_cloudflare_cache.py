#!/usr/bin/env python3
"""
scripts/purge_cloudflare_cache.py
Selectively purges Cloudflare CDN cache for modified files and pages.
"""

import os
import sys
import re
import json
import subprocess
import urllib.request


def main():
    zone_id = os.environ.get('CF_ZONE_ID')
    token = os.environ.get('CF_API_TOKEN')
    domain = 'https://amoledwatchfaces.com'
    before = os.environ.get('COMMIT_BEFORE', '').strip()
    after = os.environ.get('COMMIT_AFTER', '').strip()

    if not zone_id or not token:
        print("Missing CF_ZONE_ID or CF_API_TOKEN environment variable. Skipping purge.")
        return

    # Determine commit range for the push
    if before and not set(before) == {'0'}:
        cmd = ['git', 'diff', '--name-only', before, after or 'HEAD']
    else:
        cmd = ['git', 'diff', '--name-only', 'HEAD^', 'HEAD']

    try:
        output = subprocess.check_output(cmd, text=True)
        changed_files = [f.strip() for f in output.strip().split('\n') if f.strip()]
    except Exception as e:
        print(f"Error getting git diff with {cmd}: {e}")
        try:
            output = subprocess.check_output(['git', 'show', '--name-only', '--format=', 'HEAD'], text=True)
            changed_files = [f.strip() for f in output.strip().split('\n') if f.strip()]
        except Exception:
            changed_files = []

    print("Commit range checked:", cmd)
    print("Changed files in push:", changed_files)

    ignored_prefixes = ('.github/', '.git', 'README.md', '.gitignore', '.gitattributes', '_config.yml')
    urls = set()
    target_langs = ['de', 'es', 'fr', 'it', 'ko', 'pl', 'pt', 'sk']

    # Scan all HTML and JS files in repo to detect query-string versioned references (e.g. style.css?v=2.5)
    scanned_files = []
    for root, _, files in os.walk('.'):
        if any(root.startswith(p) for p in ('.git', '.github')):
            continue
        for name in files:
            if name.endswith('.html') or name.endswith('.js'):
                scanned_files.append(os.path.join(root, name))

    scanned_contents = []
    for sf in scanned_files:
        try:
            with open(sf, 'r', encoding='utf-8') as fp:
                scanned_contents.append(fp.read())
        except Exception:
            pass

    for f in changed_files:
        if f.startswith(ignored_prefixes):
            continue
        if f == 'CNAME':
            continue

        if f == 'index.html':
            urls.add(f'{domain}/')
            urls.add(f'{domain}/index.html')
            for l in target_langs:
                urls.add(f'{domain}/{l}/')
                urls.add(f'{domain}/{l}')
                urls.add(f'{domain}/{l}/index.html')
        elif f.endswith('.html'):
            base = f[:-5]
            urls.add(f'{domain}/{base}')
            urls.add(f'{domain}/{base}/')
            urls.add(f'{domain}/{f}')
            if f.endswith('/index.html'):
                parent_dir = f[:-11]
                urls.add(f'{domain}/{parent_dir}')
                urls.add(f'{domain}/{parent_dir}/')
            for l in target_langs:
                urls.add(f'{domain}/{l}/{base}')
                urls.add(f'{domain}/{l}/{f}')
        else:
            urls.add(f'{domain}/{f}')
            # Find any query string references across HTML and JS pages (e.g., style.css?v=2.5)
            basename = f.split('/')[-1]
            pattern = re.compile(r'["\'](?:[^"\']*/)?(' + re.escape(basename) + r'\?[^"\']*)["\']')
            for content in scanned_contents:
                for match in pattern.findall(content):
                    clean_match = re.sub(r'^\.+/', '', match)
                    if '/' in f:
                        parent_dir = '/'.join(f.split('/')[:-1])
                        urls.add(f'{domain}/{parent_dir}/{clean_match}')
                    else:
                        urls.add(f'{domain}/{clean_match}')

    # Also explicitly handle description and locale versioning
    collection_js_path = 'js/collection.js'
    desc_qs = ''
    if os.path.exists(collection_js_path):
        try:
            with open(collection_js_path, 'r', encoding='utf-8') as cfp:
                ccontent = cfp.read()
                m = re.search(r'/locales/descriptions/[^"\']*?\?([^"\'\s]+)', ccontent)
                if m:
                    desc_qs = f"?{m.group(1)}"
        except Exception:
            pass

    event_name = os.environ.get('EVENT_NAME', '').strip()
    is_dispatch = (event_name == 'workflow_dispatch')

    descriptions_affected = is_dispatch or any(
        f.startswith('locales/descriptions/') or f == 'js/collection.js' for f in changed_files
    )

    # If global assets, locales, portfolio data, or build workflow changed, purge all pages and language subdirectories
    i18n_affected = is_dispatch or any(
        f in changed_files for f in [
            'style.css', 'theme.js', 'scripts/build_i18n.py', '.github/workflows/deploy-pages.yml',
            'data/portfolio.json', 'index.html', 'js/collection.js', 'scripts/purge_cloudflare_cache.py'
        ]
    ) or any(f.startswith('locales/') or f.startswith('js/i18n') for f in changed_files)

    if descriptions_affected or i18n_affected:
        for l in target_langs:
            urls.add(f'{domain}/locales/descriptions/{l}.json')
            if desc_qs:
                urls.add(f'{domain}/locales/descriptions/{l}.json{desc_qs}')

    if i18n_affected:
        all_pages = ['', 'apps', 'bogo', 'giveaways', 'guide', 'contact', 'privacy', '404.html']
        for p in all_pages:
            if p == '':
                urls.add(f'{domain}/')
                urls.add(f'{domain}/index.html')
                for l in target_langs:
                    urls.add(f'{domain}/{l}/')
                    urls.add(f'{domain}/{l}')
                    urls.add(f'{domain}/{l}/index.html')
            else:
                urls.add(f'{domain}/{p}')
                urls.add(f'{domain}/{p}.html')
                for l in target_langs:
                    urls.add(f'{domain}/{l}/{p}')
                    urls.add(f'{domain}/{l}/{p}.html')

    url_list = list(urls)
    print("URLs to purge:", url_list)

    if not url_list:
        print("No web assets modified. Skipping purge.")
        return

    chunk_size = 30
    for i in range(0, len(url_list), chunk_size):
        chunk = url_list[i:i + chunk_size]
        payload = json.dumps({'files': chunk}).encode('utf-8')
        req = urllib.request.Request(
            f'https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache',
            data=payload,
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            },
            method='POST'
        )
        try:
            with urllib.request.urlopen(req) as resp:
                res = json.loads(resp.read().decode('utf-8'))
                print(f"Batch purge result: {res.get('success')}")
                if not res.get('success'):
                    print("Purge errors:", res.get('errors'))
                    sys.exit(1)
        except Exception as err:
            print(f"Purge request failed: {err}")
            sys.exit(1)

    print("Selective Cloudflare cache purge completed successfully!")


if __name__ == '__main__':
    main()
