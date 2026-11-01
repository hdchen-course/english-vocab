#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
label_coverage_gate.py — LEARNING_PATH_REBUILD_SPEC.md §6.7／§11.A AC-SCHEMA 的
顯示層 label 參照存在性 gate（Phase 1 建置工具；確定性、報缺、擋關）。

本 gate 驗兩個衍生顯示檔的「鍵集合」，而非只比筆數（spec §6.7 明文警告：
「鍵集合等式（非只比筆數）」；只比筆數＝T3-03 fail-open：一個過時/typo 鍵換掉
一個真配對，筆數不變卻讓真配對落回 raw slug 顯示）：

  1. authoring/strand_labels.json
     鍵＝`(domain, strand)` 配對（以 US 分隔字元 \\x1f 連接：`domain\\x1fstrand`）。
     鍵集合 MUST 精確等於 manifest（authoring/knowledge_points.json）＋任何
     `*.units.json` 單元宣告 實際出現的所有 (domain, strand) 配對集合。
     ── 每配對恰一 label 條目；零缺（缺＝該配對 render 成裸 slug）、零多餘/過時鍵。
     ── 鍵是「配對」而非裸 slug：裸 slug 會跨域相撞（stats 於 math/life、
        inquiry 於 sci/soc-civ、skill 於 soc-geo/soc-hist 等），覆蓋成錯名。

  2. authoring/subject_labels.json
     鍵＝`domain`／`life-category`。鍵集合 MUST 涵蓋 manifest（＋任何單元）
     實際出現的所有 domain／life-category；每個恰一條目、零缺、旗標多餘/過時鍵。

退出碼＝違規總數（strand 缺＋strand 多餘＋subject 缺＋subject 多餘），上限夾在
254（真實違規幾乎不可能超過 配對數＋domain 數）。
「什麼都沒驗到」哨兵＝ 255（manifest 推不出任何 (domain,strand) 配對，或載入失敗）
──此時絕不回 0（回 0＝假裝 clean pass＝spec 警告的 fail-open）。
退出碼請「不經 pipe」直接讀（pipe 會蓋掉 $?）。
"""

import argparse
import glob
import json
import os
import sys

# US（Unit Separator, 0x1f）＝ strand_labels.json 鍵內 domain 與 strand 的分隔字元
US = "\x1f"

# 退出碼哨兵：什麼都沒驗到（manifest 空／載入失敗）——與「0 違規 clean」明確區分
SENTINEL_EXAMINED_NOTHING = 255
# 真實違規數的退出碼上限（避免溢出 0..255；超出時夾住並於文字輸出報實數）
EXIT_CAP = 254


def _load_json(path):
    """載入 JSON；失敗回傳 (None, 錯誤字串)。"""
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f), None
    except FileNotFoundError:
        return None, "檔案不存在：%s" % path
    except json.JSONDecodeError as e:
        return None, "JSON 解析失敗：%s（%s）" % (path, e)
    except OSError as e:
        return None, "讀取失敗：%s（%s）" % (path, e)


def _manifest_items(manifest):
    """由 manifest 取出 items 陣列（容錯：頂層 dict 的 items，或頂層就是 list）。"""
    if isinstance(manifest, dict):
        items = manifest.get("items")
        if isinstance(items, list):
            return items
        return []
    if isinstance(manifest, list):
        return manifest
    return []


def _units_from_file(data):
    """由單一 *.units.json 取出 units 陣列（dict 含 units，或頂層就是 list）。"""
    if isinstance(data, dict):
        units = data.get("units")
        if isinstance(units, list):
            return units
        return []
    if isinstance(data, list):
        return data
    return []


def derive_universe(manifest, unit_files):
    """
    推導「真實」宇集（只讀資料、不臆測 schema）：
      pairs_universe ＝ manifest items 的 (domain, strand) ∪ 單元宣告的 (subject|domain, strand)
      domain_universe ＝ 上述所有 domain／life-category 值
    單元物件以 `subject` 作為 domain 欄（units_index/units 檔實測欄位），退而求 `domain`。
    回傳 (pairs_universe:set, domain_universe:set, n_items_examined:int)
    """
    pairs = set()
    domains = set()
    items = _manifest_items(manifest)
    for it in items:
        if not isinstance(it, dict):
            continue
        dom = it.get("domain")
        st = it.get("strand")
        if dom:
            domains.add(dom)
        if dom and st:
            pairs.add((dom, st))

    for data in unit_files:
        for u in _units_from_file(data):
            if not isinstance(u, dict):
                continue
            dom = u.get("subject") or u.get("domain")
            st = u.get("strand")
            if dom:
                domains.add(dom)
            if dom and st:
                pairs.add((dom, st))

    return pairs, domains, len(items)


def parse_strand_label_keys(strand_labels):
    """
    解析 strand_labels.json 的鍵成 (domain, strand) 配對集合。
    合法鍵 MUST 恰含一個 US 分隔字元（domain\\x1fstrand）。
    回傳 (pairs:set[(domain,strand)], malformed:list[原始鍵])。
    格式錯誤鍵（非恰兩段）另列、計為違規（過時/亂鍵）。
    """
    pairs = set()
    malformed = []
    if not isinstance(strand_labels, dict):
        return pairs, malformed
    for k in strand_labels.keys():
        parts = k.split(US)
        if len(parts) == 2 and parts[0] and parts[1]:
            pairs.add((parts[0], parts[1]))
        else:
            malformed.append(k)
    return pairs, malformed


def _fmt_pair(p):
    return "%s/%s" % (p[0], p[1])


def run(manifest_path, strand_labels_path, subject_labels_path, units_glob, root):
    report = {
        "examined_nothing": False,
        "errors": [],
        "n_items_examined": 0,
        "strand": {"missing": [], "stale": [], "malformed": []},
        "subject": {"missing": [], "stale": []},
        "universe": {"pairs": 0, "domains": 0},
    }

    manifest, err = _load_json(manifest_path)
    if err:
        report["errors"].append(err)
    strand_labels, err = _load_json(strand_labels_path)
    if err:
        report["errors"].append(err)
    subject_labels, err = _load_json(subject_labels_path)
    if err:
        report["errors"].append(err)

    # 載入失敗＝什麼都沒驗到（fail-closed 哨兵，絕不回 0）
    if report["errors"]:
        report["examined_nothing"] = True
        return report, SENTINEL_EXAMINED_NOTHING

    # 掃 *.units.json（相對 root）；缺檔不是錯（可能尚未有單元）
    unit_files = []
    pattern = os.path.join(root, units_glob)
    for fn in sorted(glob.glob(pattern)):
        data, uerr = _load_json(fn)
        if uerr:
            report["errors"].append(uerr)
            report["examined_nothing"] = True
            return report, SENTINEL_EXAMINED_NOTHING
        unit_files.append(data)

    pairs_universe, domain_universe, n_items = derive_universe(manifest, unit_files)
    report["n_items_examined"] = n_items
    report["universe"]["pairs"] = len(pairs_universe)
    report["universe"]["domains"] = len(domain_universe)

    # 哨兵：manifest 推不出任何 (domain,strand) 配對＝什麼都沒驗到
    if not pairs_universe:
        report["examined_nothing"] = True
        return report, SENTINEL_EXAMINED_NOTHING

    # ── strand_labels：鍵集合「等式」（缺＋多餘＋格式錯）──
    label_pairs, malformed = parse_strand_label_keys(strand_labels)
    report["strand"]["malformed"] = malformed
    missing_strand = sorted(pairs_universe - label_pairs)      # 宇集有、label 缺（render 裸 slug）
    stale_strand = sorted(label_pairs - pairs_universe)        # label 有、宇集無（過時/typo）
    report["strand"]["missing"] = [_fmt_pair(p) for p in missing_strand]
    report["strand"]["stale"] = [_fmt_pair(p) for p in stale_strand]

    # ── subject_labels：鍵集合涵蓋 domain／life-category，且旗標多餘/過時 ──
    sub_keys = set(subject_labels.keys()) if isinstance(subject_labels, dict) else set()
    missing_subject = sorted(domain_universe - sub_keys)       # 宇集有、label 缺
    stale_subject = sorted(sub_keys - domain_universe)         # label 有、宇集無
    report["subject"]["missing"] = sorted(missing_subject)
    report["subject"]["stale"] = sorted(stale_subject)

    total = (
        len(missing_strand)
        + len(stale_strand)
        + len(malformed)
        + len(missing_subject)
        + len(stale_subject)
    )
    report["total_violations"] = total
    exit_code = total if total <= EXIT_CAP else EXIT_CAP
    return report, exit_code


def _print_human(report, exit_code):
    def section(title, missing, stale, extra_label=None, extra=None):
        print("── %s ──" % title)
        if missing:
            print("  缺（宇集有、label 無 → 會 render 裸 slug）：%d" % len(missing))
            for m in missing:
                print("     - %s" % m)
        else:
            print("  缺：0")
        if stale:
            print("  多餘/過時（label 有、宇集無）：%d" % len(stale))
            for s in stale:
                print("     - %s" % s)
        else:
            print("  多餘/過時：0")
        if extra_label is not None:
            if extra:
                print("  %s：%d" % (extra_label, len(extra)))
                for e in extra:
                    print("     - %r" % e)
            else:
                print("  %s：0" % extra_label)

    print("=" * 60)
    print("label_coverage_gate — §6.7／AC-SCHEMA 鍵集合驗證")
    print("=" * 60)
    if report["errors"]:
        print("載入錯誤：")
        for e in report["errors"]:
            print("  ! %s" % e)
    if report["examined_nothing"]:
        print("哨兵：什麼都沒驗到（manifest 空／載入失敗）→ 退出碼 %d" % exit_code)
        print("  （絕不回 0；回 0 會假裝 clean pass＝fail-open）")
        return
    print("manifest items 檢視：%d" % report["n_items_examined"])
    print("宇集：(domain,strand) 配對＝%d；domain/life-category＝%d"
          % (report["universe"]["pairs"], report["universe"]["domains"]))
    print()
    section("strand_labels.json（鍵集合等式）",
            report["strand"]["missing"], report["strand"]["stale"],
            "格式錯誤鍵（非 domain\\x1fstrand）", report["strand"]["malformed"])
    print()
    section("subject_labels.json（鍵集合涵蓋）",
            report["subject"]["missing"], report["subject"]["stale"])
    print()
    print("違規總數＝%d → 退出碼 %d%s"
          % (report.get("total_violations", 0), exit_code,
             "（已夾至上限 %d）" % EXIT_CAP if report.get("total_violations", 0) > EXIT_CAP else ""))
    if exit_code == 0:
        print("結果：PASS（兩檔鍵集合皆精確覆蓋，零缺零多餘）")
    else:
        print("結果：FAIL（擋關；請改來源後重生衍生檔，不得以 slug 當顯示名）")


def main(argv=None):
    # 預設 root＝本腳本所在的 tools/ 之上一層（repo 根），使任意 cwd 皆可執行
    default_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ap = argparse.ArgumentParser(
        description="§6.7 label 覆蓋 gate（鍵集合等式/涵蓋，非只比筆數）")
    ap.add_argument("--root", default=default_root,
                    help="repo 根（預設＝腳本上層）；*.units.json 以此為基準 glob")
    ap.add_argument("--manifest", default=None,
                    help="knowledge_points.json 路徑（預設 <root>/authoring/knowledge_points.json）")
    ap.add_argument("--strand-labels", default=None,
                    help="strand_labels.json 路徑（預設 <root>/authoring/strand_labels.json）")
    ap.add_argument("--subject-labels", default=None,
                    help="subject_labels.json 路徑（預設 <root>/authoring/subject_labels.json）")
    ap.add_argument("--units-glob", default="*.units.json",
                    help="單元宣告檔 glob（相對 root；預設 '*.units.json'）")
    ap.add_argument("--json", action="store_true", help="以 JSON 輸出報告")
    args = ap.parse_args(argv)

    root = args.root
    manifest_path = args.manifest or os.path.join(root, "authoring", "knowledge_points.json")
    strand_path = args.strand_labels or os.path.join(root, "authoring", "strand_labels.json")
    subject_path = args.subject_labels or os.path.join(root, "authoring", "subject_labels.json")

    report, exit_code = run(manifest_path, strand_path, subject_path, args.units_glob, root)

    if args.json:
        report["exit_code"] = exit_code
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        _print_human(report, exit_code)

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
