#!/usr/bin/env python3
"""Precompute, for each wordmaster card example sentence, the exact surface form
to blank (handles irregular inflections became/began/blew…, spelling-change
regulars carried/buried/enemies/rubbed…, contractions don't, and prefix fallback).

Writes an additive parallel field `exb` (list, same length as `ex`; each entry is
the exact substring to blank, or null if the headword does not appear in that
sentence). ONLY adds/updates `exb`; never touches any other field.

Client (word_master.html) blanks `exb[i]` exactly when present, else falls back
to its regex. Run with --dry-run to report coverage without writing.

Usage:
  .venv/bin/python -I tools/wordmaster_blank_forms.py --dry-run
  .venv/bin/python -I tools/wordmaster_blank_forms.py --apply
"""
import json, glob, os, re, sys, argparse
import lemminflect

WORD_RE = re.compile(r"[A-Za-z]+(?:'[A-Za-z]+)?")
UPOS = ('VERB', 'NOUN', 'ADJ', 'ADV', 'PROPN')


def lemmas_of(tok):
    out = set()
    for up in UPOS:
        try:
            for l in lemminflect.getLemma(tok, upos=up):
                out.add(l.lower())
        except Exception:
            pass
    try:
        for up, forms in lemminflect.getAllLemmas(tok).items():
            for l in forms:
                out.add(l.lower())
    except Exception:
        pass
    return out


def lcp(a, b):
    n = 0
    for x, y in zip(a, b):
        if x == y:
            n += 1
        else:
            break
    return n


def find_blank(sentence, hw):
    """Return the exact surface substring in `sentence` to blank, or None."""
    hwl = hw.lower().strip()
    # multiword headword: blank the phrase substring directly
    if ' ' in hwl:
        m = re.search(re.escape(hw), sentence, flags=re.I)
        return m.group(0) if m else None
    toks = list(WORD_RE.finditer(sentence))
    # tier 1: exact (case-insensitive) whole-token match
    for m in toks:
        if m.group(0).lower() == hwl:
            return m.group(0)
    # tier 2: lemma match (inflection of hw) — covers became/began/carried/enemies
    for m in toks:
        t = m.group(0)
        core = t.split("'")[0]  # strip contraction tail for lemma lookup
        if hwl in lemmas_of(t) or hwl in lemmas_of(core):
            # blank the inflected core (not the 's/'t tail) when contraction present
            return core if "'" in t and core else t
    # tier 3: contraction base equals hw (e.g. hw=do, token=don't -> "do")
    for m in toks:
        t = m.group(0)
        if "'" in t:
            core = t.split("'")[0]
            if core.lower() == hwl:
                return core
            # n't contraction: don't -> do, doesn't -> does(->do), didn't -> did(->do)
            if t.lower().endswith("n't"):
                base = t[:-3]
                if base.lower() == hwl or hwl in lemmas_of(base):
                    return base
    # tier 4: longest-common-prefix fallback (rare/prefix irregulars chugged, overspent)
    best = None
    for m in toks:
        t = m.group(0)
        if lcp(t.lower(), hwl) >= max(4, len(hwl) - 2):
            best = best or t
    return best


def process(apply):
    files = sorted(glob.glob('assets/wordmaster/cards/*.json'))
    # compute once per sk to keep consistent across shards
    cache = {}
    tot = cov = null = 0
    null_samples = []
    changed_files = 0
    for f in files:
        d = json.load(open(f))
        cards = d if isinstance(d, list) else d.get('cards') or d.get('items') or []
        if not isinstance(cards, list):
            continue
        dirty = False
        for c in cards:
            if not isinstance(c, dict) or 'ex' not in c or not c.get('hw'):
                continue
            sk = c.get('sk') or (c['hw'] + '|' + (c['ex'][0] if c['ex'] else ''))
            hw = c['hw']
            exb = cache.get(sk)
            if exb is None:
                exb = []
                for s in c['ex']:
                    b = find_blank(s, hw)
                    exb.append(b)
                    tot += 1
                    if b:
                        cov += 1
                    else:
                        null += 1
                        if len(null_samples) < 25:
                            null_samples.append((hw, s))
                cache[sk] = exb
            if c.get('exb') != exb:
                c['exb'] = exb
                dirty = True
        if dirty and apply:
            json.dump(d, open(f, 'w'), ensure_ascii=False, separators=(',', ':'))
            changed_files += 1
    print(f"examples total={tot} blanked={cov} null={null} ({cov*100//max(tot,1)}% covered)")
    if null_samples:
        print("--- sample NULL (headword not found in sentence) ---")
        for hw, s in null_samples:
            print(f"  [{hw}] {s}")
    if apply:
        print(f"applied: {changed_files} files updated with exb")
    else:
        print("(dry-run; no files written)")


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true')
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    process(apply=a.apply)
