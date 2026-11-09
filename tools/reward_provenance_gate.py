#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""reward_provenance_gate.py — 獎勵頒獎/裝備「provenance 靜態掃描」fail-closed gate
（§6.7 RT-14／RT-15；封閉 never-disappear 的最後執行面缺口）。

用 workspace venv 跑（讀 exit 不要 pipe 遮蔽）：
  /Volumes/workplace/EnglishTraining/.venv/bin/python tools/reward_provenance_gate.py

本 gate 唯讀靜態掃描 game_core.js（＋ wish_shop.js 若存在），不修改任何既有頁。
對照 authoring/reward_catalog.json 的 live items[]（非 retired）與 types[]（equippable 旗標），
做四類 fail-closed 斷言：

(1) award/grant-provenance（§6.7「頒未入 catalog 的 id」盲區 / RT-15）：
    凡 grant-like 行為所頒的 **id 字面量** MUST ∈ live items[]。
    grant 宇集的「可靜態列舉字面量」來源＝(a) game_core 的 CONFIG.BADGES 物件 key（grantBadge
    以 `CONFIG.BADGES[id]` 為成員守衛，故此即 badge 頒獎宇集）＋(b) wish_shop 的 SKINS／BORDERS
    陣列 `id:` 字面量（ownedItems 經 spendCoins 的物品宇集）＋(c) 具名頒獎 helper
    （awardBadge／grantBadge／grantReward／unlockItem）的字串字面量實參。
    任一 ∉ live items[] ＝ 孤兒頒獎＝FAIL。

(2) equip-provenance（RT-11／§6.7 equippable 交叉驗）：
    凡 equip-like 行為（`profile.equipped<Type> =` 指派、`setProfileField('equipped<Type>',…)`
    呼叫、`equipItem(<type>,…)`）作用的 **type** MUST 在 types[] 且 `equippable:true`。
    作用於不存在／equippable:false 的型別＝FAIL。

(3) 反向 `equipped<Type>` → types[] 參照完整性（§6.7 B-2 反向檢查 / RT-14(B)）：
    game_core 中出現的每個 `equipped<Type>` 欄（schema 預設／setter 分支／字串鍵），其
    `<Type>`（小寫化）MUST 在 types[]（live 或 tombstone）。懸空＝FAIL。
    〔已知真缺口：game_core 有殘留 `equippedMascot` 欄位但 catalog 無 mascot 型別——如實 FAIL。〕

(4) catch-all（原則凌駕列舉，不確定即 fail／fail-closed on uncertainty）：
    任何 grant-like **寫入點**（`profile.badges[<expr>]=`、`*.ownedItems.push(<expr>)`、
    `*.ownedItems[<expr>]=`）其 id-expr 無法靜態證明受「同一函式內對 catalog 來源的成員守衛」
    約束者一律 FAIL（動態 id、無守衛的公開 API 頒獎路徑…）。同理 equip-like 動態型別路徑。

── 誠實分級（§0.2，非 overclaim）────────────────────────────────────────────
本 gate 是 §8 人工把關**之外加一道機器 backstop**，非取代、亦**非**宣稱已完全機器化任意 JS
形式的靜態解析。對「經成員守衛（如 grantBadge 的 `CONFIG.BADGES[id]`）之頒獎寫入」與「經具名
helper 之字面量頒獎」為**確定性判定**；對「繞過守衛／動態 id／間接派發／改名 helper／全新 earned
容器」等間接形式，一律以 catch-all **fail-closed 擋下（寧誤擋）**。殘餘：本 gate 僅掃 profile.badges
／ownedItems 兩個已知 earned 容器＋equipped<Type> 欄；若日後新增別的 earned 容器，屬靜態知識邊界外，
於此具名揭露、由 §8 人工把關涵蓋。

「已知真缺口先管理、不改 live 引擎」機制：`--baseline-known-gaps <file>`（JSON：
`{"known_gaps": ["<finding-key>", ...]}`）把列出的 finding 由 FAIL 降級為
`KNOWN-GAP(待 Phase 0.5(b) 修)`——**仍印出、但不計入 exit code**。preset（無此旗標）＝嚴格 FAIL；
已知缺口須人工顯式納入 baseline 檔，且每筆於回報標記為待修。finding-key 不含行號（行號會漂移），
格式見各斷言。

exit code＝未被 baseline 降級的 violation 數（0＝clean）。
"""
import argparse
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
CATALOG = os.path.join(REPO, "authoring", "reward_catalog.json")
GAME_CORE = os.path.join(REPO, "game_core.js")
WISH_SHOP = os.path.join(REPO, "wish_shop.js")

# 具名頒獎 helper（grant-like）；裝備 helper（equip-like）。
GRANT_HELPERS = ("awardBadge", "grantBadge", "grantReward", "unlockItem")


class Finding:
    __slots__ = ("key", "path", "line", "msg")

    def __init__(self, key, path, line, msg):
        self.key = key
        self.path = path
        self.line = line
        self.msg = msg


def _lineno(src, pos):
    return src.count("\n", 0, pos) + 1


def _match_brace(src, open_pos, open_ch="{", close_ch="}"):
    """從 open_pos（指向 open_ch）起做平衡括號配對，回傳 close 的 index（含）。
    粗略略過字串／行註解內的括號以避免誤配。失敗回 -1。"""
    depth = 0
    i = open_pos
    n = len(src)
    in_str = None
    while i < n:
        c = src[i]
        if in_str:
            if c == "\\":
                i += 2
                continue
            if c == in_str:
                in_str = None
            i += 1
            continue
        if c in ("'", '"', "`"):
            in_str = c
            i += 1
            continue
        if c == "/" and i + 1 < n and src[i + 1] == "/":
            nl = src.find("\n", i)
            i = n if nl == -1 else nl
            continue
        if c == open_ch:
            depth += 1
        elif c == close_ch:
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return -1


def _enclosing_function_body(src, pos):
    """回傳 pos 所在最內層 function 的 body 文字（{...}），找不到回 ''。"""
    # 往前找最近的 `function` 之後的第一個 `{`
    head = src.rfind("function", 0, pos)
    while head != -1:
        brace = src.find("{", head)
        if brace == -1:
            break
        end = _match_brace(src, brace)
        if end != -1 and brace < pos <= end:
            return src[brace : end + 1]
        head = src.rfind("function", 0, head)
    return ""


def load_catalog(path, problems):
    try:
        with open(path, "r", encoding="utf-8") as f:
            cat = json.load(f)
    except Exception as e:  # noqa: BLE001
        problems.append(f"讀取/解析 catalog 失敗 {path}: {e}")
        return None
    live_items = set()
    for it in cat.get("items") or []:
        iid = it.get("id")
        if isinstance(iid, str) and iid and it.get("retired") is not True:
            live_items.add(iid)
    types_all = set()
    equippable_live = set()
    for t in cat.get("types") or []:
        tn = t.get("type")
        if not isinstance(tn, str) or not tn:
            continue
        types_all.add(tn)  # live 或 tombstone 皆算「已註冊」
        if t.get("retired") is not True and t.get("equippable") is True:
            equippable_live.add(tn)
    return {
        "live_items": live_items,
        "types_all": types_all,
        "equippable_live": equippable_live,
    }


def extract_badges_keys(game_src):
    """CONFIG.BADGES 物件的 top-level key（badge 頒獎宇集）。回傳 [(id, pos)]。"""
    out = []
    m = re.search(r"BADGES\s*:\s*\{", game_src)
    if not m:
        return out
    brace = game_src.index("{", m.start())
    end = _match_brace(game_src, brace)
    if end == -1:
        return out
    block = game_src[brace + 1 : end]
    base = brace + 1
    # top-level：只取 depth==0（相對 block）的 `key: {`
    depth = 0
    in_str = None
    i = 0
    n = len(block)
    line_start = True
    while i < n:
        c = block[i]
        if in_str:
            if c == "\\":
                i += 2
                continue
            if c == in_str:
                in_str = None
            i += 1
            continue
        if c in ("'", '"', "`"):
            in_str = c
            i += 1
            continue
        if c == "/" and i + 1 < n and block[i + 1] == "/":
            nl = block.find("\n", i)
            i = n if nl == -1 else nl
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
        elif depth == 0 and (c.isalpha() or c == "_"):
            km = re.match(r"([A-Za-z_]\w*)\s*:\s*\{", block[i:])
            if km:
                out.append((km.group(1), base + i))
                # 推進到該 `{` 本身（km 末字元），讓下一輪由 depth 計數器處理它，
                # 避免跳過 `{` 造成 depth 失準（否則第一個 key 之後的 top-level key 全被漏掉）。
                i += km.end() - 1
                continue
        i += 1
    return out


def extract_array_ids(src, varname):
    """var <varname> = [ ... ] 內的 id:'X' 字面量。回傳 [(id, pos)]。"""
    out = []
    m = re.search(r"\b" + re.escape(varname) + r"\s*=\s*\[", src)
    if not m:
        return out
    br = src.index("[", m.start())
    end = _match_brace(src, br, "[", "]")
    if end == -1:
        return out
    block = src[br : end + 1]
    for im in re.finditer(r"\bid\s*:\s*'([^']+)'", block):
        out.append((im.group(1), br + im.start()))
    return out


def scan(catalog_path, game_core_path, wish_shop_path):
    problems = []  # fatal load errors
    findings = []  # list[Finding]
    cat = load_catalog(catalog_path, problems)
    if cat is None:
        return problems, findings, {}

    try:
        with open(game_core_path, "r", encoding="utf-8") as f:
            game_src = f.read()
    except Exception as e:  # noqa: BLE001
        problems.append(f"讀取 game_core.js 失敗 {game_core_path}: {e}")
        return problems, findings, {}
    wish_src = ""
    if wish_shop_path and os.path.isfile(wish_shop_path):
        with open(wish_shop_path, "r", encoding="utf-8") as f:
            wish_src = f.read()

    live_items = cat["live_items"]
    types_all = cat["types_all"]
    equippable_live = cat["equippable_live"]

    # ── 收集 grant 宇集的可靜態列舉字面量 ──────────────────────────────
    grant_universe = []  # (id, path, pos, source)
    for iid, pos in extract_badges_keys(game_src):
        grant_universe.append((iid, game_core_path, pos, "CONFIG.BADGES key"))
    for varname in ("SKINS", "BORDERS"):
        for iid, pos in extract_array_ids(wish_src, varname):
            grant_universe.append((iid, wish_shop_path, pos, varname + " id"))
    # 具名 helper 的字串字面量實參
    helper_call_lit = re.compile(
        r"\b(" + "|".join(GRANT_HELPERS) + r")\s*\(\s*(['\"])([^'\"]+)\2"
    )
    for path, src in ((game_core_path, game_src), (wish_shop_path, wish_src)):
        if not src:
            continue
        for m in helper_call_lit.finditer(src):
            grant_universe.append(
                (m.group(3), path, m.start(), m.group(1) + "() 字面量實參")
            )

    # (1) award/grant-provenance：宇集字面量 ⊆ live items[]
    for iid, path, pos, source in grant_universe:
        if iid not in live_items:
            findings.append(
                Finding(
                    f"orphan-grant::id={iid}",
                    path,
                    _lineno(game_src if path == game_core_path else wish_src, pos),
                    f"(1) grant-provenance：頒獎宇集 id `{iid}`（來源 {source}）∉ live items[]＝孤兒頒獎",
                )
            )

    # ── (2) equip-provenance ＋ (3) 反向參照 ──────────────────────────
    # (2) equip-like 動作點作用的型別
    equip_sites = []  # (type, path, pos)
    for m in re.finditer(r"profile\.equipped([A-Z]\w*)\s*=", game_src):
        equip_sites.append((m.group(1).lower(), game_core_path, m.start()))
    setfield_lit = re.compile(r"setProfileField\s*\(\s*(['\"])equipped([A-Z]\w*)\1")
    for path, src in ((game_core_path, game_src), (wish_shop_path, wish_src)):
        if not src:
            continue
        for m in setfield_lit.finditer(src):
            equip_sites.append((m.group(2).lower(), path, m.start()))
    for m in re.finditer(r"\bequipItem\s*\(\s*(['\"])([^'\"]+)\1", game_src + "\n" + wish_src):
        equip_sites.append((m.group(2), game_core_path, 0))
    seen_equip = set()
    for typ, path, pos in equip_sites:
        if typ in seen_equip:
            continue
        seen_equip.add(typ)
        if typ not in types_all:
            findings.append(
                Finding(
                    f"equip-provenance::type={typ}",
                    path,
                    _lineno(game_src if path == game_core_path else wish_src, pos),
                    f"(2) equip-provenance：equip-like 路徑作用於型別 `{typ}`，但該型別未註冊於 types[]＝FAIL",
                )
            )
        elif typ not in equippable_live:
            findings.append(
                Finding(
                    f"equip-provenance::type={typ}",
                    path,
                    _lineno(game_src if path == game_core_path else wish_src, pos),
                    f"(2) equip-provenance：equip-like 路徑作用於型別 `{typ}`，但該型別非 equippable:true（live）＝FAIL",
                )
            )

    # (3) 反向 equipped<Type> 欄參照（schema 預設／setter／字串鍵皆算「欄位被持久化/參照」）
    rev_types = {}  # type_lower -> (pos)
    for m in re.finditer(r"equipped([A-Z]\w*)", game_src):
        tl = m.group(1).lower()
        rev_types.setdefault(tl, m.start())
    for tl, pos in sorted(rev_types.items()):
        if tl not in types_all:
            findings.append(
                Finding(
                    f"reverse-ref::type={tl}",
                    game_core_path,
                    _lineno(game_src, pos),
                    f"(3) 反向參照：game_core 持久化/參照 `equipped{tl.capitalize()}` 欄，但型別 `{tl}` 不在 types[]（live 或 tombstone）＝懸空 FAIL",
                )
            )

    # ── (4) catch-all：grant-like 寫入點的 id provenance ───────────────
    # badges 寫入：profile.badges[<expr>] =
    for m in re.finditer(r"\.badges\s*\[\s*([^\]]+?)\s*\]\s*=(?!=)", game_src):
        expr = m.group(1).strip()
        lit = re.match(r"^(['\"])([^'\"]+)\1$", expr)
        if lit:
            continue  # 字面量 → 已由 (1) 檢查
        body = _enclosing_function_body(game_src, m.start())
        guarded = re.search(r"CONFIG\.BADGES\s*\[\s*" + re.escape(expr) + r"\s*\]", body)
        if not guarded:
            findings.append(
                Finding(
                    "grant-catchall::badges-write-unguarded",
                    game_core_path,
                    _lineno(game_src, m.start()),
                    f"(4) catch-all：profile.badges[{expr}] 動態寫入，所在函式無 `CONFIG.BADGES[{expr}]` 成員守衛＝無法靜態證明所頒 id∈items[]＝FAIL",
                )
            )

    # ownedItems 寫入：push(<expr>) 或 [<expr>]=
    owned_write = re.compile(
        r"\.ownedItems\s*(?:\.\s*push\s*\(\s*([^)]+?)\s*\)|\[\s*([^\]]+?)\s*\]\s*=(?!=))"
    )
    for m in re.finditer(owned_write, game_src):
        expr = (m.group(1) or m.group(2) or "").strip()
        lit = re.match(r"^(['\"])([^'\"]+)\1$", expr)
        if lit:
            continue
        body = _enclosing_function_body(game_src, m.start())
        # 唯一認可的 bounded 守衛：同函式內對某 catalog 來源（items/SKINS/BORDERS/CATALOG）做
        # 成員測試並以其結果 gate 此寫入（如 `CONFIG.OWNED_ITEM_IDS.indexOf(itemId)===-1 → return`）。
        # 反-pseudo-guard：itemId **自身作為 receiver** 的 `itemId.indexOf/.includes/.has(...)` 是對
        # 「id 字串形狀」的假檢查、非 catalog 成員測試，一律不算守衛。
        # 修（2026-11-09，gate 誤擋已正確守衛之碼）：舊規則用 `itemId[^\n]{0,40}(indexOf|includes|has)`
        # 把 itemId 當『參數』時附近合法的去重 `profile.ownedItems.indexOf(itemId)` 也判成假守衛→誤擋
        # spendCoins（它其實已用 OWNED_ITEM_IDS 成員測試＋未知即 return false）。改為只比對 itemId
        # **緊接**成員方法（receiver 形式），精準擋假守衛、放行合法的 catalog.indexOf(itemId)＋去重。
        guarded = bool(
            re.search(r"(items|SKINS|BORDERS|CATALOG)\b[^\n]{0,40}" + re.escape(expr), body)
            and re.search(re.escape(expr) + r"\s*\.\s*(indexOf|includes|has)\b", body) is None
        ) and re.search(r"(SKINS|BORDERS|items)\s*[\[.(]", body) is not None
        if not guarded:
            findings.append(
                Finding(
                    "grant-catchall::ownedItems-push-unguarded",
                    game_core_path,
                    _lineno(game_src, m.start()),
                    f"(4) catch-all：ownedItems 寫入 `{expr}`（動態 id），所在函式無對 catalog 來源的成員守衛＝無法靜態證明所頒 id∈items[]＝FAIL（spendCoins 為公開 API、無 catalog 守衛）",
                )
            )

    stats = {
        "grant_universe": len(grant_universe),
        "live_items": len(live_items),
        "types_all": len(types_all),
        "equippable_live": len(equippable_live),
    }
    return problems, findings, stats


def main(argv=None):
    ap = argparse.ArgumentParser(description="獎勵頒獎/裝備 provenance 靜態掃描 gate（唯讀）")
    ap.add_argument("--catalog", default=CATALOG)
    ap.add_argument("--game-core", default=GAME_CORE)
    ap.add_argument("--wish-shop", default=WISH_SHOP)
    ap.add_argument(
        "--baseline-known-gaps",
        default=None,
        help="JSON 檔 {\"known_gaps\":[finding-key,...]}：把列出的 finding 由 FAIL 降級為 KNOWN-GAP（仍印、不計 exit）",
    )
    args = ap.parse_args(argv)

    known = set()
    if args.baseline_known_gaps:
        try:
            with open(args.baseline_known_gaps, "r", encoding="utf-8") as f:
                known = set(json.load(f).get("known_gaps") or [])
        except Exception as e:  # noqa: BLE001
            print(f"FAIL: 讀取 baseline-known-gaps 失敗 {args.baseline_known_gaps}: {e}")
            return 1

    problems, findings, stats = scan(args.catalog, args.game_core, args.wish_shop)
    if problems:
        for p in problems:
            print("FAIL:", p)
        return len(problems) or 1

    counted = 0
    used_known = set()
    for fd in findings:
        if fd.key in known:
            used_known.add(fd.key)
            print(f"KNOWN-GAP(待 Phase 0.5(b) 修) [{fd.key}] {fd.path}:{fd.line} — {fd.msg}")
        else:
            counted += 1
            print(f"FAIL [{fd.key}] {fd.path}:{fd.line} — {fd.msg}")

    stale = known - used_known
    for k in sorted(stale):
        # baseline 列了卻沒對應 finding：誠實告知（可能缺口已修、該從 baseline 移除）；不影響 exit。
        print(f"NOTE: baseline-known-gaps 列的 `{k}` 本輪無對應 finding（缺口或已修，宜從 baseline 移除）")

    if counted == 0:
        print(
            f"OK: grant 宇集 {stats.get('grant_universe')} 個字面量全 ∈ live items[]"
            f"（live_items={stats.get('live_items')}，types_all={stats.get('types_all')}，"
            f"equippable_live={stats.get('equippable_live')}）"
            + (f"；另 {len(used_known)} 筆已知缺口由 baseline 降級（仍待 Phase 0.5(b) 修）" if used_known else "")
        )
    return counted


if __name__ == "__main__":
    sys.exit(main())
