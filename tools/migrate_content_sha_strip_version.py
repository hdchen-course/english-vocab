#!/usr/bin/env python3
"""One-time migration: re-key page_converge_ledger from the OLD content_sha algorithm
(which hashed raw HTML bytes incl. the `?v=XXXX` asset-version query string) to the NEW
algorithm (which strips `?v=` before hashing, so asset version bumps no longer invalidate a
page's teaching 5-clean streak).

SAFETY: a page is re-keyed ONLY IF its OLD-algo content_sha == the ledger's stored frozen_sha
(i.e. the page's current content is byte-identical to what was frozen). Then the stored
frozen_sha and every round whose content_sha == old frozen_sha are rewritten to the NEW-algo
sha, and a `_version_bump_rekey` trace is appended. Pages that do NOT match (content changed
since freeze, or empty rounds mid-de-converge) are REPORTED and left untouched.

Run:  .venv/bin/python -I tools/migrate_content_sha_strip_version.py [--apply]
Without --apply = dry-run (report only).
"""
import json, os, re, sys, hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
import per_page_5clean_gate as g  # NEW algo = g.content_sha

LEDGER = os.path.join(ROOT, "authoring", "page_converge_ledger.json")


def old_algo_sha(path):
    """Replicate the PRE-migration content_sha: raw html bytes (incl ?v=) + \\x00 + teaching."""
    with open(path, "rb") as f:
        html_bytes = f.read()
    sidecar_bytes = b""
    try:
        m = re.search(rb'data-units\s*=\s*"([^"]+)"', html_bytes)
        if m:
            side = os.path.join(os.path.dirname(path), m.group(1).decode("utf-8"))
            if os.path.exists(side):
                with open(side, "rb") as sf:
                    sidecar_bytes = sf.read()
    except Exception:
        sidecar_bytes = b""
    teaching = g._canonical_teaching_bytes(sidecar_bytes) if sidecar_bytes else b""
    h = hashlib.sha256()
    h.update(html_bytes)
    h.update(b"\x00")
    h.update(teaching)
    return h.hexdigest()[:16]


def main():
    apply = "--apply" in sys.argv
    d = json.load(open(LEDGER, encoding="utf-8"))
    pages = d.get("pages", {})
    rekeyed, skipped_missing, skipped_mismatch, already_new, empty = [], [], [], [], []
    for page, e in pages.items():
        path = os.path.join(ROOT, page)
        if not os.path.exists(path):
            skipped_missing.append(page); continue
        frozen = e.get("frozen_sha")
        new_sha = g.content_sha(path)
        old_sha = old_algo_sha(path)
        rounds = e.get("rounds")
        if not rounds:
            empty.append(page)
            if apply and frozen and frozen != new_sha:
                e["frozen_sha"] = new_sha  # harmless: no streak to preserve
            continue
        # The gate anchors convergence on rounds[].content_sha == content_sha(page); frozen_sha is
        # optional bookkeeping (sci pages have it, eng pages don't). "stored" = the sha the streak
        # was recorded against = frozen_sha if present else the last round's content_sha.
        stored = frozen if frozen else rounds[-1].get("content_sha")
        if stored == new_sha:
            already_new.append(page); continue  # already under new algo
        if old_sha == stored:
            # page content byte-identical to frozen (modulo ?v=) → safe re-key, preserve streak
            if apply:
                trace = e.get("_version_bump_rekey")
                if not isinstance(trace, list):
                    trace = [] if trace is None else [trace]
                    e["_version_bump_rekey"] = trace
                trace.append({
                    "at": "2026-11-18T12:10:00+08:00",
                    "old_sha": old_sha, "new_sha": new_sha,
                    "reason": "content_sha 改為剝除 ?v= 版本字串（版本 bump 不作廢 streak）；舊算法 sha==既存 streak sha 證明內容未變，rekey 保留 5-clean。",
                })
                e["frozen_sha"] = new_sha
                for r in rounds:
                    if r.get("content_sha") == old_sha:
                        r["content_sha"] = new_sha
            rekeyed.append(page)
        else:
            skipped_mismatch.append((page, stored, old_sha, new_sha))
    if apply:
        json.dump(d, open(LEDGER, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{'APPLIED' if apply else 'DRY-RUN'}: rekeyed={len(rekeyed)} already_new={len(already_new)} "
          f"empty_rounds={len(empty)} missing_file={len(skipped_missing)} MISMATCH={len(skipped_mismatch)}")
    for page, fr, o, n in skipped_mismatch[:40]:
        print(f"  MISMATCH {page}: frozen={fr} old_algo={o} new_algo={n}")
    if skipped_missing:
        print("  missing files:", skipped_missing[:20])
    return 0 if not skipped_mismatch else 3


if __name__ == "__main__":
    sys.exit(main())
