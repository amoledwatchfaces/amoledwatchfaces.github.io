"""
scripts/apply_clean_descriptions.py
Validates and applies refined, human-quality localized descriptions to locales/descriptions/{lang}.json
"""

import json
from pathlib import Path

import os
import sys
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))
PORTFOLIO_PATH = ROOT_DIR / "data" / "portfolio.json"
DESCRIPTIONS_DIR = ROOT_DIR / "locales" / "descriptions"

from scripts.descriptions_fr import DESCRIPTIONS_FR
from scripts.descriptions_it import DESCRIPTIONS_IT
from scripts.descriptions_ko import DESCRIPTIONS_KO
from scripts.descriptions_pt import DESCRIPTIONS_PT

MODULES = {
    "fr": DESCRIPTIONS_FR,
    "it": DESCRIPTIONS_IT,
    "ko": DESCRIPTIONS_KO,
    "pt": DESCRIPTIONS_PT
}

def main():
    with open(PORTFOLIO_PATH, "r", encoding="utf-8") as f:
        portfolio = json.load(f)

    portfolio_ids = [item["id"] for item in portfolio if item.get("id")]
    print(f"Total items in portfolio: {len(portfolio_ids)}")

    for lang, desc_dict in MODULES.items():
        missing = [pid for pid in portfolio_ids if pid not in desc_dict]
        extra = [k for k in desc_dict if k not in portfolio_ids]

        if missing:
            print(f"ERROR: {lang} is missing {len(missing)} IDs: {missing[:5]}")
            return
        if extra:
            print(f"WARNING: {lang} has {len(extra)} extra IDs: {extra[:5]}")

        # Preserve portfolio order
        ordered_data = {pid: desc_dict[pid] for pid in portfolio_ids}

        out_path = DESCRIPTIONS_DIR / f"{lang}.json"
        with open(out_path, "w", encoding="utf-8", newline="\n") as f:
            json.dump(ordered_data, f, ensure_ascii=False, indent=4)
            f.write("\n")

        print(f"[{lang}] Successfully wrote {len(ordered_data)} polished descriptions to {out_path.name}")

    print("\nAll 4 languages successfully updated with high quality, human-crafted descriptions!")

if __name__ == "__main__":
    main()
