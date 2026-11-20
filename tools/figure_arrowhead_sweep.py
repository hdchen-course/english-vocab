#!/usr/bin/env python3
"""Sharpen blunt ("方頭") arrowhead polygons in a unit figure SVG, IN PLACE,
with a proof-guard that ONLY arrowhead polygon coordinates changed.

HD 2026-11-20: the hand-placed `<polygon>` arrowheads across ~75 sci figures are
short/blunt wedges (base width ≈ length), not crisp pointed triangles. This
rewrites each AXIS-ALIGNED 3-point arrowhead polygon into a crisp pointed
triangle — tip kept exactly where it was (so it stays attached to the line),
base lengthened back along the arrow axis and narrowed — so the arrow reads as a
sharp arrowhead. Diagonal/odd polygons are left untouched (needs manual/marker).

SAFETY: after transforming, it PROVES the only bytes that changed in the SVG are
inside `points='...'` attributes (everything else — text nodes, labels, lines,
markers, geometry of non-arrowhead shapes — byte-identical). If anything else
changed, it ABORTS without writing. This bounds the blast radius; the VISION
signoff (render + look) is the second backstop that the new triangles look right
and still point correctly. A figure change still de-converges the page and must
re-run the full 5-clean + visual signoff — this tool does NOT touch the ledger.

Usage:
    python3 -I tools/figure_arrowhead_sweep.py <page>.units.json [--check]
      (default) apply in place if proof passes; --check = dry-run, report only.
"""
import json
import re
import sys


def sharpen_svg(svg):
    def repl(m):
        nums = re.findall(r'-?\d+\.?\d*', m.group(1))
        if len(nums) != 6:
            return m.group(0)
        p = [float(x) for x in nums]
        P = [(p[0], p[1]), (p[2], p[3]), (p[4], p[5])]
        base = tip = None
        for i, j in [(0, 1), (0, 2), (1, 2)]:
            k = 3 - i - j
            if abs(P[i][0] - P[j][0]) < 0.6:      # shared x -> horizontal arrow
                base = ('x', P[i], P[j]); tip = P[k]; break
            if abs(P[i][1] - P[j][1]) < 0.6:      # shared y -> vertical arrow
                base = ('y', P[i], P[j]); tip = P[k]; break
        if not base:
            return m.group(0)                      # diagonal: leave for manual/marker
        axis, b1, b2 = base
        if axis == 'x':
            bx = b1[0]; my = (b1[1] + b2[1]) / 2.0; tx, ty = tip
            if abs(tx - bx) < 0.6:
                return m.group(0)
            sign = 1 if tx > bx else -1
            L = max(abs(tx - bx), 9.0) * 1.25      # lengthen
            half = L * 0.34                         # narrow -> pointed (len:width ~1.5:1)
            nbx = tx - sign * L
            return "points='%g,%g %.1f,%.1f %.1f,%.1f'" % (tx, ty, nbx, my - half, nbx, my + half)
        else:
            by = b1[1]; mx = (b1[0] + b2[0]) / 2.0; tx, ty = tip
            if abs(ty - by) < 0.6:
                return m.group(0)
            sign = 1 if ty > by else -1
            L = max(abs(ty - by), 9.0) * 1.25
            half = L * 0.34
            nby = ty - sign * L
            return "points='%.1f,%g %.1f,%g %g,%g'" % (mx - half, nby, mx + half, nby, tx, ty)
    return re.sub(r"points='([-\d., ]+)'", repl, svg)


def prove_only_points_changed(old, new):
    """True iff old and new differ ONLY inside points='...' attributes."""
    norm = lambda s: re.sub(r"points='[-\d., ]+'", "points='@'", s)
    return norm(old) == norm(new)


def main():
    if len(sys.argv) < 2:
        print("usage: figure_arrowhead_sweep.py <page>.units.json [--check]")
        sys.exit(2)
    path = sys.argv[1]
    check = "--check" in sys.argv[2:]
    d = json.load(open(path, encoding="utf-8"))
    changed = 0
    for u in d.get("units", []):
        for t in u.get("teach", []):
            fig = t.get("figure")
            if not fig or not fig.get("svg"):
                continue
            old = fig["svg"]
            new = sharpen_svg(old)
            if new == old:
                continue
            if not prove_only_points_changed(old, new):
                print(f"ABORT {path}: diff touched non-points bytes — not writing")
                sys.exit(3)
            fig["svg"] = new
            changed += 1
    if changed == 0:
        print(f"{path}: no axis-aligned arrowhead polygons to sharpen (0 changed)")
        sys.exit(0)
    if check:
        print(f"{path}: would sharpen {changed} figure(s) [proof OK, dry-run]")
        sys.exit(0)
    json.dump(d, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{path}: sharpened {changed} figure(s) [proof OK, written]")
    sys.exit(0)


if __name__ == "__main__":
    main()
