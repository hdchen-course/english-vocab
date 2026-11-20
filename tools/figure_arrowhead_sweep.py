#!/usr/bin/env python3
"""Sharpen blunt ("方頭") arrowhead polygons in a unit figure SVG, IN PLACE,
with a proof-guard that ONLY arrowhead polygon coordinates changed.

HD 2026-11-20: the hand-placed `<polygon>` arrowheads across ~75 sci figures are
short/blunt wedges (base width ≈ length), not crisp pointed triangles. This
rewrites each AXIS-ALIGNED arrowhead polygon into a crisp pointed triangle — tip
kept exactly on the associated line's endpoint (so it stays attached and points
the right way), base lengthened back along the arrow axis and narrowed.

LINE-AWARE (fixed 2026-11-20 after a diagonal 光能 arrowhead was mis-rewritten):
the TIP of a correct arrowhead sits on one endpoint of its line. We therefore
find, for each 3-point polygon, the polygon vertex closest to any `<line>`
endpoint — that vertex is the true tip, and the line's OTHER endpoint gives the
true arrow direction. We ONLY sharpen when that matched line is axis-aligned
(horizontal or vertical). A DIAGONAL arrow is left untouched (hand/marker job) —
even if two of its vertices happen to share an x or y coordinate (the old bug:
a diagonal head whose base vertex was level with the tip was misread as a
vertical arrow and rebuilt pointing the wrong way). If no line endpoint is near
any vertex (TIP_TOL), the polygon is left untouched (we cannot trust it).

SAFETY: after transforming, it PROVES the only bytes that changed in the SVG are
inside `points='...'` attributes. If anything else changed, it ABORTS without
writing. A figure change still de-converges the page and must re-run the full
5-clean + visual signoff — this tool does NOT touch the ledger.

Usage:
    python3 -I tools/figure_arrowhead_sweep.py <page>.units.json [--check]
      (default) apply in place if proof passes; --check = dry-run, report only.
    python3 -I tools/figure_arrowhead_sweep.py <page>.units.json --audit
      detect arrowhead polygons whose tip is NOT on any line endpoint
      (possible mis-sharpen / detached head); report only, exit=suspect count.
"""
import json
import re
import sys

TIP_TOL = 2.0     # a true tip sits within this many px of a line endpoint
AXIS_TOL = 0.6    # |dx| or |dy| below this => the line is axis-aligned


def _lines(svg):
    out = []
    for m in re.finditer(r"<line\b[^>]*?x1='([-\d.]+)'[^>]*?y1='([-\d.]+)'[^>]*?x2='([-\d.]+)'[^>]*?y2='([-\d.]+)'", svg):
        x1, y1, x2, y2 = (float(g) for g in m.groups())
        out.append(((x1, y1), (x2, y2)))
    return out


def _match_tip(P, lines):
    """Return (tip_pt_exact_on_line, other_end) for the polygon vertex nearest a
    line endpoint, or None if nothing is within TIP_TOL."""
    best = None
    for (a, b) in lines:
        for e, o in ((a, b), (b, a)):
            for v in P:
                d = ((v[0] - e[0]) ** 2 + (v[1] - e[1]) ** 2) ** 0.5
                if best is None or d < best[0]:
                    best = (d, v, e, o)
    if best is None or best[0] > TIP_TOL:
        return None
    return best[2], best[3]   # exact line endpoint (tip), other end (tail)


def _parse_poly(points):
    nums = re.findall(r'-?\d+\.?\d*', points)
    if len(nums) != 6:
        return None
    p = [float(x) for x in nums]
    return [(p[0], p[1]), (p[2], p[3]), (p[4], p[5])]


def sharpen_svg(svg):
    lines = _lines(svg)

    def repl(m):
        P = _parse_poly(m.group(1))
        if P is None:
            return m.group(0)
        tip = _match_tip(P, lines)
        if tip is None:
            return m.group(0)          # tip not on any line end -> don't touch
        (tx, ty), (ox, oy) = tip
        dx, dy = tx - ox, ty - oy      # arrow direction (tail -> tip)
        if abs(dy) < AXIS_TOL and abs(dx) >= AXIS_TOL:
            # horizontal arrow
            sign = 1 if dx > 0 else -1
            L = max(abs(dx), 9.0) * 1.25
            half = L * 0.34
            nbx = tx - sign * L
            return "points='%g,%g %.1f,%.1f %.1f,%.1f'" % (tx, ty, nbx, ty - half, nbx, ty + half)
        if abs(dx) < AXIS_TOL and abs(dy) >= AXIS_TOL:
            # vertical arrow
            sign = 1 if dy > 0 else -1
            L = max(abs(dy), 9.0) * 1.25
            half = L * 0.34
            nby = ty - sign * L
            return "points='%.1f,%g %.1f,%g %g,%g'" % (tx - half, nby, tx + half, nby, tx, ty)
        return m.group(0)              # diagonal arrow -> leave for manual/marker
    return re.sub(r"points='([-\d., ]+)'", repl, svg)


def audit_svg(svg):
    """Report arrowhead polygons whose nearest line endpoint is > TIP_TOL away
    (detached head / possible mis-sharpen). Returns list of (points, dist)."""
    lines = _lines(svg)
    suspects = []
    for m in re.finditer(r"points='([-\d., ]+)'", svg):
        P = _parse_poly(m.group(1))
        if P is None:
            continue
        best = None
        for (a, b) in lines:
            for e in (a, b):
                for v in P:
                    d = ((v[0] - e[0]) ** 2 + (v[1] - e[1]) ** 2) ** 0.5
                    if best is None or d < best:
                        best = d
        if best is not None and best > TIP_TOL:
            suspects.append((m.group(1), round(best, 2)))
    return suspects


def prove_only_points_changed(old, new):
    norm = lambda s: re.sub(r"points='[-\d., ]+'", "points='@'", s)
    return norm(old) == norm(new)


def main():
    if len(sys.argv) < 2:
        print("usage: figure_arrowhead_sweep.py <page>.units.json [--check|--audit]")
        sys.exit(2)
    path = sys.argv[1]
    check = "--check" in sys.argv[2:]
    audit = "--audit" in sys.argv[2:]
    d = json.load(open(path, encoding="utf-8"))

    if audit:
        total = 0
        for u in d.get("units", []):
            for t in u.get("teach", []):
                fig = t.get("figure")
                if not fig or not fig.get("svg"):
                    continue
                for pts, dist in audit_svg(fig["svg"]):
                    print(f"SUSPECT {path}: polygon points='{pts}' nearest line-end {dist}px (> {TIP_TOL})")
                    total += 1
        if total == 0:
            print(f"{path}: audit clean (every arrowhead tip sits on a line endpoint)")
        sys.exit(total)

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
