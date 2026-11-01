#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""deviation_categories_gate.py — authoring/deviation_categories.json 的 fail-closed 結構 gate
（§6.6①／§6.7／§11.A AC-UNIT-3 的 enum-項自治理；比照 reward_catalog_gate 的 sha-bound 簽核）。

每個 enum 項（category）MUST 同時滿足（否則該 category 無效，引用它的單元偏離在 AC-UNIT-3 一律 FAIL）：
  (i)  required_signer_roles[] 非空，且每元素 ∈ §8 角色 id allowlist（13 個 closed set，不含 golden-owner——
       golden-owner 只屬 signoff.by[] allowlist，不屬 category→審查角色對映）；
  (ii) 美術(art)＋空間(spatial)雙簽核：signoff.by[] ⊇ {art,spatial}、status=="signed"、
       signoff.sha == 現算 cat_fact_sha；
       cat_fact_sha = sha256(canonical_json({category, required_signer_roles}))[:16]
       （canonical = json.dumps(o, sort_keys=True, ensure_ascii=False, separators=(',',':'))；
        pre-image 僅 {category, required_signer_roles}、排除 signoff 欄本身，消自我指涉）。
  改動某項 category／required_signer_roles 後未重算 sha → cat_fact_sha 失配 → 該項簽核作廢（無效）。

介面：--selftest（離線紅隊：好例 ALLOW／各壞例 DENY）；--verify（對真檔跑）。
EXIT：0=過；1=有違規；2=selftest 失敗；3=檔案缺失/解析失敗。
"""
import argparse, hashlib, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATS = os.path.join(ROOT, "authoring", "deviation_categories.json")

# §8 角色 id allowlist（closed set，13 個；spec §8 line 772）。required_signer_roles 的每元素 MUST ∈ 此集合。
ROLE_ALLOWLIST = {
    "domain", "native-en", "linguist", "learning-sci", "knowledge-viz",
    "eye-comfort", "psych", "art", "spatial", "pm", "sim-learner", "animator", "translator",
}
REQUIRED_SIGNERS = {"art", "spatial"}  # §6.6① enum 項自身的雙簽核


def _canon(o):
    return json.dumps(o, sort_keys=True, ensure_ascii=False, separators=(",", ":"))


def cat_fact_sha(category, roles):
    """§6.6①：sha256(canonical_json({category, required_signer_roles}))[:16]；排除 signoff 欄。"""
    return hashlib.sha256(
        _canon({"category": category, "required_signer_roles": roles}).encode("utf-8")
    ).hexdigest()[:16]


def _iter_categories(doc):
    if isinstance(doc, dict):
        return doc.get("categories", []) or []
    if isinstance(doc, list):
        return doc
    return []


def check(doc):
    """驗整份 deviation_categories 檔。回傳 (valid_category_names:set, problems:list[str])。
    純函式，供 selftest 與 verify 共用。某 category 有任一違規即不列入 valid。"""
    problems = []
    valid = set()
    seen = set()
    for entry in _iter_categories(doc):
        if not isinstance(entry, dict):
            problems.append("categories[] 有非物件條目"); continue
        cat = entry.get("category")
        if not cat or not isinstance(cat, str):
            problems.append("categories[] 有缺/非字串 category 欄的條目"); continue
        if cat in seen:
            problems.append(f"category 重複：`{cat}`"); continue
        seen.add(cat)

        ok = True
        roles = entry.get("required_signer_roles")
        # (i) required_signer_roles 非空 ⊆ §8 角色 id allowlist
        if not isinstance(roles, list) or len(roles) == 0:
            problems.append(f"category `{cat}`：required_signer_roles 缺/空（§6.6① 要求非空）"); ok = False
            roles = []
        else:
            bad = [r for r in roles if r not in ROLE_ALLOWLIST]
            if bad:
                problems.append(f"category `{cat}`：required_signer_roles 含非 §8 角色 id allowlist 身分 {bad}"); ok = False

        # (ii) 雙簽核綁 cat_fact_sha
        so = entry.get("signoff") or {}
        by = set(so.get("by") or [])
        want = cat_fact_sha(cat, roles)
        if not (REQUIRED_SIGNERS <= by):
            problems.append(f"category `{cat}`：signoff.by 缺必備雙簽（需 art＋spatial，實為 {sorted(by)}）"); ok = False
        if so.get("status") != "signed":
            problems.append(f"category `{cat}`：signoff.status 非 'signed'（fail-closed）"); ok = False
        if so.get("sha") != want:
            problems.append(f"category `{cat}`：signoff.sha 不符現算 cat_fact_sha（應 {want}，實 {so.get('sha')}）"); ok = False

        if ok:
            valid.add(cat)
    return valid, problems


# ---------------- selftest（§13 紅隊：4 case）----------------
def _good_entry(cat="bespoke-game-screen", roles=None):
    roles = roles or ["knowledge-viz", "animator", "eye-comfort", "learning-sci", "pm"]
    sha = cat_fact_sha(cat, roles)
    return {"category": cat, "required_signer_roles": roles,
            "signoff": {"by": ["art", "spatial"], "status": "signed", "sha": sha}}


def _selftest():
    import copy
    results = []

    # RT-4（好例）：正確成形＋sha-bound → valid
    good = {"categories": [_good_entry()]}
    v, p = check(good)
    results.append(("(4) 正確成形＋sha-bound 項 → VALID", ("bespoke-game-screen" in v) and p == []))

    # RT-1：竄改 category（未重算 sha）→ sha 失配 → 無效
    b = copy.deepcopy(good); b["categories"][0]["category"] = "bespoke-game-screen-TAMPERED"
    v, p = check(b)
    results.append(("(1a) 竄改 category 未重算 sha → INVALID（sha 不符）",
                    ("bespoke-game-screen-TAMPERED" not in v) and any("sha 不符" in x for x in p)))
    # RT-1：竄改 required_signer_roles（未重算 sha）→ sha 失配 → 無效
    b = copy.deepcopy(good); b["categories"][0]["required_signer_roles"] = ["pm"]
    v, p = check(b)
    results.append(("(1b) 竄改 required_signer_roles 未重算 sha → INVALID（sha 不符）",
                    ("bespoke-game-screen" not in v) and any("sha 不符" in x for x in p)))

    # RT-2：required_signer_roles 空 → 無效
    b = {"categories": [{"category": "x", "required_signer_roles": [],
                         "signoff": {"by": ["art", "spatial"], "status": "signed", "sha": cat_fact_sha("x", [])}}]}
    v, p = check(b)
    results.append(("(2) required_signer_roles 空 → INVALID",
                    ("x" not in v) and any("required_signer_roles 缺/空" in x for x in p)))

    # RT-3：required_signer_roles 含 §8 allowlist 外的 id → 無效
    roles3 = ["pm", "made-up-role"]
    b = {"categories": [{"category": "y", "required_signer_roles": roles3,
                         "signoff": {"by": ["art", "spatial"], "status": "signed", "sha": cat_fact_sha("y", roles3)}}]}
    v, p = check(b)
    results.append(("(3) required_signer_roles 含非 allowlist id → INVALID",
                    ("y" not in v) and any("非 §8 角色 id allowlist" in x for x in p)))

    # 額外：缺一方雙簽（只有 art）→ 無效
    b = copy.deepcopy(good); b["categories"][0]["signoff"]["by"] = ["art"]
    v, p = check(b)
    results.append(("(extra) 缺 spatial 雙簽 → INVALID", ("bespoke-game-screen" not in v) and any("缺必備雙簽" in x for x in p)))

    allok = True
    for msg, ok in results:
        print(f"  [{'OK' if ok else 'BAD'}] {msg}")
        allok = allok and ok
    return allok


def main():
    ap = argparse.ArgumentParser(description="deviation_categories 結構 gate（fail-closed）")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--file", default=CATS)
    args = ap.parse_args()

    if args.selftest:
        print("=== deviation_categories_gate --selftest（§13 紅隊 4 case）===")
        ok = _selftest()
        print("RESULT:", "PASS ✅" if ok else "FAIL ❌")
        sys.exit(0 if ok else 2)

    if args.verify:
        if not os.path.exists(args.file):
            print(f"  [error] 找不到 {args.file}"); sys.exit(3)
        try:
            doc = json.loads(open(args.file, encoding="utf-8").read())
        except Exception as e:  # noqa: BLE001
            print(f"  [error] JSON 解析失敗：{e}"); sys.exit(3)
        valid, probs = check(doc)
        for p in probs:
            print(f"  [deviation] {p}")
        total = len(_iter_categories(doc))
        print(f"RESULT: {'PASS ✅' if not probs else 'FAIL ❌'}"
              f"（enum 項 {total}，有效 {len(valid)}，違規 {len(probs)}）")
        if valid:
            print("  有效 category：" + ", ".join(sorted(valid)))
        sys.exit(0 if not probs else 1)

    ap.error("須指定 --verify 或 --selftest")


if __name__ == "__main__":
    main()
