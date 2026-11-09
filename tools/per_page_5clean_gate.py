#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
per_page_5clean_gate.py — AC-UNIT-2 的驗收 gate：證明每個已建學習路徑單元「頁」
已達 content_audit 連續 5 clean（同 sha、L3 exit 0），有不可手造的機器證據。

為什麼存在（§11.A AC-UNIT-2，line 915）
  AC-UNIT-2＝「每個**檔案（頁）** content_audit 連續 **5 clean**（同 sha、L3 exit 0；
  content_audit 粒度＝檔案，單元層面走 AC-UNIT-1）」，證據產物＝convergence ledger。
  本 gate **不自己跑 content_audit**（那是 /static-doc-audit 的工作）——它是**確定性**地
  讀 ledger，斷言每頁的 5-clean 紀錄存在、且**綁當前頁內容 sha**。sha 一變（頁被改動）
  舊的 clean streak 全部作廢（§10.1 邊界 line 873：「某檔已 4 clean 後又被改動 → streak
  歸零、重跑 5 clean」）。fail-closed：ledger 不足證據一律判為違規。

這組「哪些頁要檢查」來自 `data/units_index.json`（已建單元的 `page` 欄）。

Ledger：authoring/page_converge_ledger.json
  {
    "_doc": "...",
    "required_clean": 5,
    "pages": {
      "<page 檔名，如 english_addition.html>": {
        "rounds": [
          {"round":1, "content_sha":"<16hex>", "clean":true, "l3_exit":0, "recorded_at":"ISO"},
          ...
        ]
      },
      ...
    }
  }
  * content_sha＝sha256(頁 HTML bytes ＋ 其 data-units sidecar bytes)[:16]（綁內容載體：
    單元內容在 *.units.json、由 unit.js 執行期注入，故改頁或改 sidecar 任一都使指紋變、streak 作廢——
    堵「只綁 HTML sha、改 JSON 內容卻不重置 streak」的 fail-open）；round 只應在**實際跑完該輪 content_audit
    且 L3 coverage_check exit 0** 後誠實記入（手造＝作弊；此 gate 只驗結構/一致/綁 sha，
    真實性靠「記入時實跑」的紀律＋綁 sha：改頁就得重跑）。
  * 本 gate fail-closed：round 未帶 `l3_exit==0` 或 `clean!=true` 或 `content_sha` 不等於
    當前頁 sha 或日期非法，該 round **不計入** streak。

介面
  python3 tools/per_page_5clean_gate.py --selftest   # 自測（好紀錄 ALLOW、壞紀錄 DENY）
  python3 tools/per_page_5clean_gate.py --verify      # 對真實 repo 驗每頁 5-clean 證據
  忽略 orchestrator 附加的 --root <dir> / --release-id <id>（--root 會改用為 repo 根）
EXIT：
  --selftest → 0=全部斷言成立；2=自測失敗
  --verify   → 0=零違規（PASS）；否則＝違規數 clamp 到 1..255（FAIL）
  無參數     → 印用法、exit 2
"""
import sys, os, json, hashlib, datetime, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEDGER_REL = os.path.join("authoring", "page_converge_ledger.json")
UNITS_INDEX_REL = os.path.join("data", "units_index.json")
REQUIRED_CLEAN = 5


def content_sha(path):
    """頁的內容指紋＝sha256(頁 HTML bytes ＋ 其 data-units sidecar bytes)[:16]。
    為何綁 sidecar：單元教學內容在 `*.units.json`（由 unit.js 讀 <body data-units> 執行期注入），
    HTML 殼幾乎不含內容。若只綁 HTML sha，改 sidecar 內容不會使 streak 作廢＝fail-open
    （審計過的是內容、streak 卻對內容變動無感）。故改頁或改其 sidecar 任一，指紋都須改變。
    sidecar 由頁的 data-units 屬性解析（權威，非僅檔名慣例）；無 data-units/sidecar 不存在→僅綁 HTML。"""
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
        sidecar_bytes = b""   # 解析失敗→退回僅綁 HTML（不崩）
    h = hashlib.sha256()
    h.update(html_bytes)
    h.update(b"\x00")          # 分隔符，避免 bytes 串接歧義
    h.update(sidecar_bytes)
    return h.hexdigest()[:16]


def _iso_ok(s):
    """ISO 日期合法且不晚於今天（未來日＝可疑，fail-closed 不計）。"""
    try:
        d = datetime.date.fromisoformat(str(s)[:10])
    except Exception:
        return False
    return d <= datetime.date.today()


def evaluate_page(record, cur_sha, need=REQUIRED_CLEAN):
    """
    回傳 (ok, reason)。純函式、fail-closed；不觸碰檔案系統，供 selftest 與 verify 共用。
    streak＝由最後一輪往回數「clean==true ＋ content_sha==cur_sha ＋ l3_exit==0 ＋ 日期合法」
    的連續輪數；任一不符即中斷。
    """
    if not isinstance(record, dict):
        return False, "無此頁的 5-clean 紀錄"
    rounds = record.get("rounds")
    if not isinstance(rounds, list) or not rounds:
        return False, "紀錄無 rounds 陣列或為空"
    streak = 0
    for r in reversed(rounds):
        if not isinstance(r, dict):
            break
        if (r.get("clean") is True
                and r.get("content_sha") == cur_sha
                and r.get("l3_exit") == 0
                and _iso_ok(r.get("recorded_at"))):
            streak += 1
        else:
            break
    if streak >= need:
        return True, f"連續 {streak} clean（同 sha={cur_sha}、L3 exit 0）"
    # 區分「sha 已漂移」與「單純輪數不足」以利除錯
    latest = rounds[-1] if isinstance(rounds[-1], dict) else {}
    if latest.get("content_sha") not in (cur_sha, None):
        return False, (f"最後一輪綁舊 sha={latest.get('content_sha')}≠當前頁 sha={cur_sha}"
                       f"（內容已變，streak 作廢）；需連續 {need} clean")
    return False, f"未達連續 {need} clean（同 sha={cur_sha}、L3 exit 0）：目前連續 {streak}"


def _load_pages(root):
    """從 units_index.json 取已建單元頁清單（去重、保序）。回傳 (pages[], err_or_None)。"""
    ui = os.path.join(root, UNITS_INDEX_REL)
    if not os.path.exists(ui):
        return None, f"找不到 {UNITS_INDEX_REL}（無法得知已建單元頁清單）"
    try:
        d = json.load(open(ui, encoding="utf-8"))
    except Exception as e:
        return None, f"{UNITS_INDEX_REL} 解析失敗：{e}"
    units = d.get("units") if isinstance(d, dict) else None
    if not isinstance(units, list):
        return None, f"{UNITS_INDEX_REL} 無 units 陣列"
    seen, pages = set(), []
    for u in units:
        if not isinstance(u, dict):
            continue
        p = u.get("page")
        if isinstance(p, str) and p and p not in seen:
            seen.add(p)
            pages.append(p)
    return pages, None


def verify(root):
    root = os.path.abspath(root)
    pages, err = _load_pages(root)
    if err:
        print(f"  FAIL：{err}")
        print("RESULT: FAIL ❌")
        return 1
    print(f"=== AC-UNIT-2 每頁 5-clean 驗收（已建單元頁 {len(pages)} 個）===")

    ledger_path = os.path.join(root, LEDGER_REL)
    ledger = None
    if not os.path.exists(ledger_path):
        print(f"  ✗ 尚無每頁收斂 ledger（{LEDGER_REL}）——per-page 5-clean 機制尚未建立。")
        print(f"    依 AC-UNIT-2，{len(pages)} 個已建單元頁**全部**缺 5-clean 紀錄（真實缺口：")
        print(f"    單元已上線但未跑/未記 per-file content_audit 5 連續 clean）。誠實 FAIL，不假裝通過。")
    else:
        try:
            ledger = json.load(open(ledger_path, encoding="utf-8"))
        except Exception as e:
            print(f"  ✗ ledger 解析失敗：{e}（fail-closed：視為全部頁無效證據）")
            ledger = None

    need = REQUIRED_CLEAN
    pages_map = {}
    if isinstance(ledger, dict):
        need = int(ledger.get("required_clean", REQUIRED_CLEAN))
        pm = ledger.get("pages")
        if isinstance(pm, dict):
            pages_map = pm

    violations = []
    passed = 0
    for page in pages:
        page_path = os.path.join(root, page)
        if not os.path.exists(page_path):
            violations.append((page, "頁檔不存在於 repo（units_index 參照了未建的頁）"))
            continue
        try:
            cur = content_sha(page_path)
        except Exception as e:
            violations.append((page, f"無法讀頁內容算 sha：{e}"))
            continue
        # fail-closed：HTML 外殼必須是新單元引擎（載 assets/unit.js）。舊版頁即使 ledger
        # 給了 5-clean 也不得算收斂——content_audit 只審 sidecar 內容，不保證學習者看到的是
        # 新版 UI；少了這道檢查，一張舊版頁可被 sidecar 收斂「假完成」（HD 2026-11-03 指出）。
        try:
            if b"assets/unit.js" not in open(page_path, "rb").read():
                violations.append((page, "HTML 外殼非新引擎（未載 assets/unit.js）——舊版頁不得算收斂，須先遷移到新單元引擎"))
                continue
        except Exception as e:
            violations.append((page, f"無法讀頁 HTML 檢查引擎：{e}"))
            continue
        ok, reason = evaluate_page(pages_map.get(page), cur, need)
        if ok:
            passed += 1
        else:
            violations.append((page, reason))

    # 逐頁違規（最多列 40 條避免洗版，仍以總數計 exit）
    shown = 0
    for page, reason in violations:
        if shown < 40:
            print(f"  ✗ {page}：{reason}")
            shown += 1
    if len(violations) > shown:
        print(f"  …（另有 {len(violations) - shown} 個違規頁未逐列，見總數）")

    nviol = len(violations)
    print(f"--- 通過 {passed} / {len(pages)} 頁；違規 {nviol} 頁（required_clean={need}）---")
    if nviol == 0:
        print("RESULT: PASS ✅")
        return 0
    print("RESULT: FAIL ❌")
    return max(1, min(255, nviol))


def selftest():
    sha = "abcd1234abcd1234"
    today = datetime.date.today().isoformat()

    def rounds(n, s=sha, clean=True, l3=0, date=today):
        return [{"round": i, "content_sha": s, "clean": clean, "l3_exit": l3, "recorded_at": date}
                for i in range(1, n + 1)]

    good = {"rounds": rounds(5)}
    ok = True

    r, _ = evaluate_page(good, sha)
    if not r:
        print("  selftest FAIL：好紀錄（5 clean 同 sha、L3 exit 0）應 ALLOW"); ok = False
    else:
        print("  selftest：好紀錄（5 clean 同 sha、L3 exit 0）→ ALLOW ✅")

    bad_cases = {
        "只有 4 clean": {"rounds": rounds(4)},
        "第 3 輪 clean=false 打斷連續": {"rounds": [
            {**x, "clean": (x["round"] != 3)} for x in rounds(5)]},
        "最後一輪 sha 不同（頁已改動）": {"rounds": [
            {**x, "content_sha": ("zzzz0000zzzz0000" if x["round"] == 5 else sha)} for x in rounds(5)]},
        "某輪 L3 exit≠0": {"rounds": [
            {**x, "l3_exit": (1 if x["round"] == 5 else 0)} for x in rounds(5)]},
        "缺 l3_exit 欄（fail-closed 不計）": {"rounds": [
            {k: v for k, v in x.items() if k != "l3_exit"} for x in rounds(5)]},
        "未來日期": {"rounds": rounds(5, date="9999-01-01")},
        "日期非法": {"rounds": rounds(5, date="not-a-date")},
        "無此頁紀錄（None）": None,
        "rounds 為空": {"rounds": []},
        "rounds 非陣列": {"rounds": {}},
    }
    for name, rec in bad_cases.items():
        r, _ = evaluate_page(rec, sha)
        if r:
            print(f"  selftest FAIL：壞例『{name}』竟被放行"); ok = False
        else:
            print(f"  selftest：壞例『{name}』→ DENY ✅")

    # sha 綁定正例：改頁 sha 後，原本 5-clean 紀錄對新 sha 應作廢
    r, _ = evaluate_page(good, "ffff9999ffff9999")
    if r:
        print("  selftest FAIL：舊 sha 的 5-clean 對新頁 sha 竟被放行"); ok = False
    else:
        print("  selftest：壞例『頁內容已變、舊 sha 的 streak 對新 sha 作廢』→ DENY ✅")

    # content_sha 紅隊：綁 HTML+sidecar 聯集——改頁或改 sidecar 任一，指紋都須改變（堵 fail-open）
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        pg = os.path.join(td, "english_x.html")
        side = os.path.join(td, "english_x.units.json")
        with open(pg, "w", encoding="utf-8") as f:
            f.write('<body data-units="english_x.units.json"><div id="root"></div></body>')
        with open(side, "w", encoding="utf-8") as f:
            f.write('{"units":[{"unit_id":"eng.t.x.y","teach":[{"body":"A"}]}]}')
        s1 = content_sha(pg)
        # 改 sidecar 內容 → 指紋須變
        with open(side, "w", encoding="utf-8") as f:
            f.write('{"units":[{"unit_id":"eng.t.x.y","teach":[{"body":"B (edited)"}]}]}')
        s2 = content_sha(pg)
        # 改 HTML（非 sidecar）→ 指紋須變
        with open(pg, "w", encoding="utf-8") as f:
            f.write('<body data-units="english_x.units.json"><div id="root"> </div></body>')
        s3 = content_sha(pg)
        # 無 sidecar 檔 → 退回僅綁 HTML（不崩、有值）
        os.remove(side)
        s4 = content_sha(pg)
        for label, cond in [
            ("改 sidecar 內容→指紋變（堵 fail-open）", s2 != s1),
            ("改 HTML→指紋變", s3 != s2),
            ("sidecar 缺→僅綁 HTML 不崩", isinstance(s4, str) and len(s4) == 16),
        ]:
            if cond:
                print(f"  selftest(content_sha)：{label} ✅")
            else:
                print(f"  selftest(content_sha) FAIL：{label}"); ok = False

    print("SELFTEST:", "PASS ✅" if ok else "FAIL ❌")
    return 0 if ok else 2


def _parse(argv):
    """容忍多餘參數；抓 --root（下一個 token）與各 mode 旗標。"""
    root = ROOT
    mode = None
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--root" and i + 1 < len(argv):
            root = argv[i + 1]; i += 2; continue
        if a == "--release-id" and i + 1 < len(argv):
            i += 2; continue  # 忽略
        if a == "--selftest":
            mode = "selftest"
        elif a == "--verify":
            mode = "verify"
        i += 1
    return mode, root


def main():
    argv = sys.argv[1:]
    if not argv:
        print("用法：--selftest | --verify [--root <dir>]")
        return 2
    mode, root = _parse(argv)
    if mode == "selftest":
        print("=== per_page_5clean_gate --selftest ===")
        return selftest()
    if mode == "verify":
        return verify(root)
    print("用法：--selftest | --verify [--root <dir>]")
    return 2


if __name__ == "__main__":
    sys.exit(main())
