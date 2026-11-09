#!/usr/bin/env python3
# =====================================================================
# build_source_tree.py — 從 data/units_index.json（已建單元的權威清單，
# 同 per_page_5clean_gate 的分母）交叉比對 convergence ledger 與檔案系統，
# 產出「所有應存在的教學 HTML 頁」的 source tree ＋ 每頁狀態清單，當作
# 跨 session 的單一檢查清單（含已收斂與未收斂、含缺檔）。
#
# 用法：
#   /Volumes/workplace/EnglishTraining/.venv/bin/python -I tools/build_source_tree.py
#     → 寫 authoring/SOURCE_TREE.md（人看）＋ authoring/source_tree.json（機器讀）
#   加 --check 只印摘要、不寫檔（exit 0 一致 / 1 有缺檔或 sidecar 不符）
#
# 狀態欄：
#   html   : 該 page 的 .html 是否存在
#   side   : 對應的 *.units.json sidecar 是否存在
#   conv   : 是否 5-clean 收斂（ledger 末 N 輪同 sha 且 clean/l3==0）
#   rounds : ledger 目前連續 clean 數（0=未開始）
# =====================================================================
import json
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UNITS_INDEX = os.path.join(REPO, "data", "units_index.json")
LEDGER = os.path.join(REPO, "authoring", "page_converge_ledger.json")
OUT_MD = os.path.join(REPO, "authoring", "SOURCE_TREE.md")
OUT_JSON = os.path.join(REPO, "authoring", "source_tree.json")


def _consecutive_clean_tail(rounds, need):
    """末端連續 clean 且 l3==0、同一 content_sha 的數目（上限 need）。"""
    good = [r for r in rounds if r.get("clean") and r.get("l3_exit") == 0]
    if not good:
        return 0
    # 從尾端往前數同 sha 連續段
    tail_sha = good[-1].get("content_sha")
    n = 0
    for r in reversed(good):
        if r.get("content_sha") == tail_sha:
            n += 1
        else:
            break
    return n


def main():
    check_only = "--check" in sys.argv[1:]
    idx = json.load(open(UNITS_INDEX, encoding="utf-8"))
    units = idx.get("units", [])
    ledger = json.load(open(LEDGER, encoding="utf-8"))
    need = ledger.get("required_clean", 5)
    lpages = ledger.get("pages", {})

    # 去重保序的 page 清單（一頁可能有多單元）
    seen, pages = set(), []
    for u in units:
        p = u.get("page")
        if p and p not in seen:
            seen.add(p)
            pages.append(p)

    # tree: subject -> strand -> [rows]；每頁取其第一個單元的 subject/strand/track 當分類
    page_meta = {}
    for u in units:
        p = u.get("page")
        if p and p not in page_meta:
            page_meta[p] = (u.get("subject", "?"), u.get("strand", "?"), u.get("track", "?"))

    rows = []
    tree = {}
    missing_html = 0
    missing_side = 0
    converged = 0
    for p in pages:
        subject, strand, track = page_meta.get(p, ("?", "?", "?"))
        html_path = os.path.join(REPO, p)
        side_rel = p[:-5] + ".units.json" if p.endswith(".html") else p + ".units.json"
        side_path = os.path.join(REPO, side_rel)
        html_ok = os.path.isfile(html_path)
        side_ok = os.path.isfile(side_path)
        rounds = lpages.get(p, {}).get("rounds", [])
        nclean = _consecutive_clean_tail(rounds, need)
        is_conv = nclean >= need
        if not html_ok:
            missing_html += 1
        if not side_ok:
            missing_side += 1
        if is_conv:
            converged += 1
        row = {
            "page": p, "subject": subject, "strand": strand, "track": track,
            "html": html_ok, "sidecar": side_ok,
            "converged": is_conv, "clean_streak": nclean, "required": need,
        }
        rows.append(row)
        tree.setdefault(subject, {}).setdefault(strand, []).append(row)

    total = len(pages)
    summary = {
        "total_pages": total, "converged": converged,
        "not_converged": total - converged,
        "missing_html": missing_html, "missing_sidecar": missing_side,
        "pct_converged": round(100.0 * converged / total, 1) if total else 0.0,
    }

    if not check_only:
        with open(OUT_JSON, "w", encoding="utf-8") as f:
            json.dump({"_doc": "從 units_index.json × ledger × fs 自動產生，勿手改；跑 tools/build_source_tree.py 重生",
                       "summary": summary, "pages": rows}, f, ensure_ascii=False, indent=1)
        lines = []
        lines.append("# 教學 HTML Source Tree（自動產生，勿手改）\n")
        lines.append("> 由 `tools/build_source_tree.py` 從 `data/units_index.json`（權威清單，")
        lines.append("> 同 per_page_5clean_gate 分母）× `page_converge_ledger.json` × 檔案系統產生。\n")
        lines.append(f"**總計 {total} 頁｜已收斂 {converged}（{summary['pct_converged']}%）｜"
                     f"未收斂 {total - converged}｜缺 html {missing_html}｜缺 sidecar {missing_side}**\n")
        lines.append("狀態符號：✅ 5-clean 收斂　▫️ 已建未收斂（n/5）　⛔ 缺檔\n")
        for subject in sorted(tree):
            subj_rows = [r for strand in tree[subject].values() for r in strand]
            c = sum(1 for r in subj_rows if r["converged"])
            lines.append(f"\n## {subject}（{c}/{len(subj_rows)} 收斂）\n")
            for strand in sorted(tree[subject]):
                srows = tree[subject][strand]
                sc = sum(1 for r in srows if r["converged"])
                lines.append(f"\n### strand=`{strand}`（{sc}/{len(srows)}）\n")
                for r in sorted(srows, key=lambda x: x["page"]):
                    if not (r["html"] and r["sidecar"]):
                        sym = "⛔"
                        miss = []
                        if not r["html"]:
                            miss.append("html")
                        if not r["sidecar"]:
                            miss.append("sidecar")
                        note = f" 缺 {'+'.join(miss)}"
                    elif r["converged"]:
                        sym, note = "✅", ""
                    else:
                        sym, note = "▫️", f" {r['clean_streak']}/{r['required']}"
                    lines.append(f"- {sym} `{r['page']}`{note}")
        with open(OUT_MD, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
        print(f"wrote {OUT_MD}\nwrote {OUT_JSON}")

    print(f"=== source tree：{total} 頁｜收斂 {converged}（{summary['pct_converged']}%）"
          f"｜未收斂 {total - converged}｜缺 html {missing_html}｜缺 sidecar {missing_side} ===")
    return 1 if (missing_html or missing_side) else 0


if __name__ == "__main__":
    raise SystemExit(main())
