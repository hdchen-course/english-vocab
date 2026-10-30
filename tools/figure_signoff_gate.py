#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""figure_signoff_gate.py — AC-VIZ-1 視覺簽核 fail-closed gate（visual-qa SOP / §11.A）。

守「視覺相關工作宣告完成前，當前內容 sha 必須有：全覆蓋 render manifest ＋ 四角色逐狀態簽核（綁同一 sha）」。
sha 變＝舊簽核作廢，須重 render＋重簽（仿 Sidewalk .sha-manifest）。

斷言（對 index_new.html hub）：
  (1) 當前 index_new.html 內容 sha ＝ hub_render_manifest.json.source_sha ＝ hub_signoff.json.source_sha（三者綁同一 sha）。
  (2) render 全覆蓋：manifest.required_states 皆出現在 manifest.states（每狀態有 PNG 記錄）。
  (3) 四角色逐簽：hub_signoff.json.roles 含 art／spatial／eye-comfort／animator，每個 status=="signed"。
  (4) 簽核涵蓋：signoff.states_reviewed ⊇ manifest.required_states 之「不同版面代表」——至少涵蓋每個 viewport 與最密/最疏島
      （本 gate 要求 states_reviewed ⊇ required_states，杜絕「只看一張就簽」）。

介面：--selftest；--verify。EXIT：0=過；1=違規（含 sha 不符/未簽/覆蓋不足）；2=selftest 失敗。
"""
import argparse, hashlib, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "authoring")
MANIFEST = os.path.join(A, "hub_render_manifest.json")
SIGNOFF = os.path.join(A, "hub_signoff.json")
REQUIRED_ROLES = {"art", "spatial", "eye-comfort", "animator"}


def file_sha(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()[:16]


def check(cur_sha, manifest, signoff):
    probs = []
    msha = manifest.get("source_sha")
    ssha = signoff.get("source_sha")
    if msha != cur_sha:
        probs.append(f"render manifest source_sha {msha} ≠ 當前 index_new.html sha {cur_sha}（須重 render）")
    if ssha != cur_sha:
        probs.append(f"signoff source_sha {ssha} ≠ 當前 index_new.html sha {cur_sha}（舊簽核作廢，須重簽）")
    # (2) render 全覆蓋
    state_ids = {s.get("id") for s in manifest.get("states", [])}
    required = set(manifest.get("required_states", []))
    for r in sorted(required - state_ids):
        probs.append(f"required 狀態未 render：{r}")
    # (3) 四角色逐簽
    roles = signoff.get("roles", {})
    for role in sorted(REQUIRED_ROLES):
        rec = roles.get(role)
        if not rec:
            probs.append(f"缺角色簽核：{role}")
        elif rec.get("status") != "signed":
            probs.append(f"角色 {role} 未 signed（status={rec.get('status')}）")
    for extra in set(roles) - REQUIRED_ROLES:
        pass  # 允許額外角色
    # (4) 簽核涵蓋 ⊇ required
    reviewed = set(signoff.get("states_reviewed", []))
    for r in sorted(required - reviewed):
        probs.append(f"狀態未經簽核檢視：{r}（states_reviewed 須涵蓋全部 required）")
    return probs


def _mk(sha, states, roles, reviewed):
    manifest = {"source_sha": sha,
                "required_states": states,
                "states": [{"id": s, "png": s + ".png"} for s in states]}
    signoff = {"source_sha": sha, "roles": roles, "states_reviewed": reviewed}
    return manifest, signoff


def _selftest():
    sha = "abc123"
    states = ["island:eng", "island:math", "island:eng@mbp16"]
    full_roles = {r: {"status": "signed"} for r in REQUIRED_ROLES}
    results = []
    m, s = _mk(sha, states, full_roles, states)
    results.append(("好例（sha 綁定、全覆蓋、四簽、涵蓋）→ ALLOW", check(sha, m, s) == []))
    m, s = _mk(sha, states, full_roles, states)
    results.append(("source 改動（sha 不符）→ DENY", any("≠ 當前" in p for p in check("different", m, s))))
    m, s = _mk(sha, states, full_roles, states); del m["states"][1]  # math 未 render
    results.append(("required 狀態未 render → DENY", any("未 render" in p for p in check(sha, m, s))))
    partial = {r: {"status": "signed"} for r in ["art", "spatial", "eye-comfort"]}
    m, s = _mk(sha, states, partial, states)
    results.append(("缺 animator 簽核 → DENY", any("缺角色簽核：animator" in p for p in check(sha, m, s))))
    halfsigned = dict(full_roles); halfsigned["eye-comfort"] = {"status": "pending"}
    m, s = _mk(sha, states, halfsigned, states)
    results.append(("eye-comfort 未 signed → DENY", any("eye-comfort 未 signed" in p for p in check(sha, m, s))))
    m, s = _mk(sha, states, full_roles, states[:1])  # 只看一張就簽
    results.append(("只檢視一張就簽（涵蓋不足）→ DENY", any("未經簽核檢視" in p for p in check(sha, m, s))))
    allok = True
    for msg, ok in results:
        print(f"  [{'OK' if ok else 'BAD'}] {msg}"); allok = allok and ok
    return allok


def main():
    ap = argparse.ArgumentParser(description="AC-VIZ-1 視覺簽核 gate（fail-closed）")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--verify", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        print("=== figure_signoff_gate --selftest ===")
        ok = _selftest(); print("RESULT:", "PASS ✅" if ok else "FAIL ❌"); sys.exit(0 if ok else 2)
    if args.verify:
        src = os.path.join(ROOT, "index_new.html")
        if not (os.path.exists(MANIFEST) and os.path.exists(SIGNOFF)):
            print("  [signoff] 缺 hub_render_manifest.json 或 hub_signoff.json"); print("RESULT(AC-VIZ-1): FAIL ❌"); sys.exit(1)
        cur = file_sha(src)
        manifest = json.loads(open(MANIFEST, encoding="utf-8").read())
        signoff = json.loads(open(SIGNOFF, encoding="utf-8").read())
        probs = check(cur, manifest, signoff)
        for p in probs:
            print(f"  [signoff] {p}")
        print(f"RESULT(AC-VIZ-1): {'PASS ✅' if not probs else 'FAIL ❌'}"
              f"（sha {cur}，render {len(manifest.get('states', []))} 狀態，角色 {len(signoff.get('roles', {}))}，違規 {len(probs)}）")
        sys.exit(0 if not probs else 1)
    ap.error("須指定 --verify 或 --selftest")


if __name__ == "__main__":
    main()
