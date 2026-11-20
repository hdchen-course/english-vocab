#!/usr/bin/env python3
"""Figure VISUAL audit harness — render every unit's teach-example SVG figure to
a PNG so a VISION reviewer can actually LOOK at it.

Why this exists (HD, 2026-11-20): content_audit reads the units.json as TEXT
(claims/teach/practice/alt and the SVG as a source string). It never RENDERS the
SVG to pixels and looks, so geometric/compositional defects are a structural blind
spot: blunt "square" arrowheads (方頭), a label sitting on a line, an arrow mis-
rotated by orient=auto, content clustered to one side with empty gutter, clipping.
Those only appear once pixels exist. This harness renders them; a vision agent (or
the model itself via Read) then judges each PNG against the viz-qa checklist. It is
meant to run as a per-unit DONE-GATE step and as a whole-corpus sweep.

Usage:
    python3 -I tools/figure_visual_audit.py <glob-or-file...>   # e.g. 'sci_phys_*.units.json'
    python3 -I tools/figure_visual_audit.py --all               # every *.units.json
Outputs PNGs to /tmp/figaudit/<page>.png and prints a manifest (page -> png, has-arrows).
Requires rsvg-convert (present on this machine). Does NOT judge — that is the vision step.
"""
import json
import glob
import os
import subprocess
import sys

OUT = "/tmp/figaudit"


def render(units_path):
    try:
        d = json.load(open(units_path, encoding="utf-8"))
    except Exception:
        return None
    svg = None
    for u in d.get("units", []):
        for t in u.get("teach", []):
            if t.get("kind") == "example" and t.get("figure", {}).get("svg"):
                svg = t["figure"]["svg"]
                break
        if svg:
            break
    if not svg:
        return None
    base = os.path.basename(units_path).replace(".units.json", "")
    os.makedirs(OUT, exist_ok=True)
    svg2 = svg.replace("<svg ", "<svg width='760' height='430' ", 1)
    spath = f"{OUT}/{base}.svg"
    ppath = f"{OUT}/{base}.png"
    open(spath, "w", encoding="utf-8").write(svg2)
    r = subprocess.run(["rsvg-convert", "-w", "760", "-o", ppath, spath],
                        capture_output=True)
    if r.returncode != 0:
        return None
    has_arrows = ("polygon" in svg) or ("marker" in svg) or ("marker-end" in svg)
    return {"page": base, "png": ppath, "arrows": has_arrows}


def main():
    args = sys.argv[1:]
    if not args:
        print("usage: figure_visual_audit.py <glob|file...> | --all")
        sys.exit(0)
    files = []
    if args == ["--all"]:
        files = sorted(glob.glob("*.units.json"))
    else:
        for a in args:
            files += sorted(glob.glob(a)) if ("*" in a or "?" in a) else [a]
    man = []
    for f in files:
        if not os.path.exists(f):
            continue
        r = render(f)
        if r:
            man.append(r)
    for m in man:
        print(f"{m['page']}\t{m['png']}\t{'arrows' if m['arrows'] else 'no-arrows'}")
    print(f"# rendered {len(man)} figures -> {OUT}", file=sys.stderr)


if __name__ == "__main__":
    main()
