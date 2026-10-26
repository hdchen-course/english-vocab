#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""verify_learning_path.py — LEARNING_PATH 單一驗證入口（R2/T3/F4/F5/F6 修；contract-freeze 候選）。

fail-closed、registry 驅動、cumulative。F6 修：
- **phase 完成＝evidence（F6-01）**：`--phase=X`／`--release` 預設跑 **evidence_command**（對真實資料），
  不是 qualification。另設 **`--qualify`** 模式單獨跑 qualification_command（證 gate 本身可用，壞例 FAIL）。
- **AC-KP-VERIFY 先重跑 promote（F6-02）**：metric 先 `promote_verified.py --check`（重算 overlay 比對），
  不一致（手工偽造 overlay）即 refuse；再從 overlay∩當前 manifest_sha 現算。
- **release snapshot（F6-05）**：`--release` 須 `--release-id`，由它解析 **immutable snapshot root**
  （`releases/<id>/`）；evidence 的 GLOB／工具 `--root` 皆對該 snapshot 展開，非當前 workspace。
- **bootstrap 驗 required components（F6 補）**：AC-CORRECT 等多子條件 AC 必含其 critical component set，
  刪一個 component 即 exit 2（無條件、不可由 registry 關閉）。
- pure `--json`（stdout 純 JSON，log→stderr）；`--help` exit 0。
"""
import argparse, glob, hashlib, json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REG = ROOT / "authoring" / "acceptance_criteria.json"
MANIFEST = ROOT / "authoring" / "knowledge_points.json"
OVERLAY = ROOT / "authoring" / "verified_overlay.json"

CANONICAL_AC = {
    "AC-SPEC","AC-LANG-1","AC-KP-VERIFY","AC-ANTIDRIFT","AC-NOGRADE","AC-NOBACKEND",
    "AC-COV-1","AC-COV-2","AC-SCHEMA","AC-UNIT-1","AC-UNIT-2","AC-UNIT-3","AC-CORRECT",
    "AC-NAV","AC-VIZ-1","AC-STYLE-1","AC-STYLE-2","AC-REWARD-1","AC-PATH-1","AC-PATH-2",
    "AC-PERF-1","AC-A11Y-1","AC-CODE-DL",
}
REQUIRED_HELPERS = {"chk-manifest","chk-visualqa-draft","chk-source-registry","chk-ledger-gate","chk-release-artifact"}
# F6：多子條件 AC 的 critical component set（刪一個 → bootstrap FAIL）
REQUIRED_COMPONENTS = {
    "AC-CORRECT": {"claim:", "question:", "generator:", "visual:", "freshness:", "release-hash:"},
    "AC-SPEC": {"concreteness:", "5clean+紅隊 ledger:"},
}
PHASE_ORDER = ["-1","0","1","release"]
LEGAL_KINDS = {"gate","artifact-all","metric","release-artifact"}

def log(*a): print(*a, file=sys.stderr)

def bootstrap_validate(reg):
    e = []
    if reg.get("phase_order") != PHASE_ORDER: e.append(f"phase_order≠{PHASE_ORDER}")
    ac = [c for c in reg.get("checks", []) if "ac_id" in c]
    ids = [c["ac_id"] for c in ac]
    if set(ids) != CANONICAL_AC: e.append(f"AC set≠canonical（缺{CANONICAL_AC-set(ids)}／多{set(ids)-CANONICAL_AC}）")
    for a in CANONICAL_AC:
        if ids.count(a) != 1: e.append(f"{a} 出現 {ids.count(a)} 次")
    helpers = {c.get("id") for c in reg.get("checks", []) if "id" in c}
    if not REQUIRED_HELPERS <= helpers: e.append(f"缺 required helper：{REQUIRED_HELPERS-helpers}")
    for c in reg.get("checks", []):
        if c["phase"] not in PHASE_ORDER: e.append(f"{c.get('ac_id') or c.get('id')}: 非法 phase")
        if c["kind"] not in LEGAL_KINDS: e.append(f"{c.get('ac_id') or c.get('id')}: 非法 kind")
    for c in ac:
        req = REQUIRED_COMPONENTS.get(c["ac_id"])
        if req:
            have = {s.get("name") for s in c.get("components", [])}
            if not req <= have: e.append(f"{c['ac_id']} 缺 component：{req-have}")
    return e

def resolve(cmd, root, release_id):
    c = list(cmd)
    if c and c[0] == "PY": c[0] = sys.executable
    elif c and c[0] == "NODE": c[0] = "node"
    out, empties = [], []
    for t in c:
        if isinstance(t, str) and t.startswith("GLOB:"):
            g = sorted(glob.glob(str(root / t[5:])))     # F6-05：對 snapshot root 展開
            if not g: empties.append(t)
            out += g
        else: out.append(t)
    if release_id: out += ["--release-id", release_id, "--root", str(root)]
    return out, empties

def run_cmd(cmd, root, allow_empty, release_id=None):
    full, empties = resolve(cmd, root, release_id)
    if empties and not allow_empty: return False, f"GLOB 空：{empties}"
    tool = cmd[1] if len(cmd) > 1 else ""
    if tool and not (ROOT / tool).exists(): return False, f"工具未建：{tool}"
    p = subprocess.run(full, cwd=ROOT, capture_output=True, text=True)
    return p.returncode == 0, f"exit={p.returncode}"

def manifest_sha():
    return hashlib.sha256(MANIFEST.read_bytes()).hexdigest()[:16] if MANIFEST.exists() else ""

def binding_unverified_live(root):
    # F6-02/第2項：manifest/overlay 一律從**受驗 root**（release 時＝snapshot）讀，不混 workspace。
    ck = subprocess.run([sys.executable, "tools/_kp_build.py", "--check", "--root", str(root)],
                        cwd=ROOT, capture_output=True, text=True)
    if ck.returncode != 0:
        return None, f"manifest --check（root={root.name}）未過，refuse"
    if root == ROOT:
        pc = subprocess.run([sys.executable, "tools/promote_verified.py", "--check"], cwd=ROOT, capture_output=True, text=True)
        if pc.returncode != 0:
            return None, "promote_verified --check 不一致（overlay 疑偽造/過時），refuse"
    else:
        # snapshot 無法在此重算 promote（promote 讀 workspace）→ 不信任 snapshot overlay（保守 refuse）
        return None, "snapshot 的 overlay 無法就地重算 promote，拒絕信任（release promote 流程待 Phase 0 建）"
    man = root / "authoring" / "knowledge_points.json"
    ov_f = root / "authoring" / "verified_overlay.json"
    items = json.loads(man.read_text(encoding="utf-8"))["items"]
    binding = [r["id"] for r in items if not r.get("beyond")]
    verified = set()
    if ov_f.exists():
        ov = json.loads(ov_f.read_text(encoding="utf-8"))
        cur_sha = hashlib.sha256(man.read_bytes()).hexdigest()[:16]
        if ov.get("manifest_sha") == cur_sha: verified = set(ov.get("verified_ids", []))
    n = sum(1 for i in binding if i not in verified)
    return n, f"{n}（binding {len(binding)}−verified {len(verified)}；root={root.name}；overlay 綁 sha）"

def run_check(c, evidence, root, release_id):
    kind = c["kind"]
    if kind == "metric" and c.get("metric") == "binding_unverified_live":
        n, msg = binding_unverified_live(root); return (n == 0), msg
    if kind == "artifact-all":
        miss = []
        for p in c["paths"]:
            if p.startswith("MEMORY_POINTER:"):
                mem = Path.home()/".claude"/"projects"; nm = p.split(":",1)[1]
                if not (mem.exists() and any(nm in f.read_text(encoding="utf-8",errors="ignore") for f in mem.rglob("MEMORY.md"))): miss.append(p)
            else:
                fp = Path(p).expanduser() if p.startswith("~") else root/p
                if not fp.exists(): miss.append(p)
        return (not miss), ("全部存在" if not miss else f"缺：{'／'.join(miss)}")
    if kind == "release-artifact":
        if not release_id: return False, "須 --release-id"
        return run_cmd(c["command"], root, c.get("allow_empty", True), release_id)
    # gate：evidence→evidence_command；qualify→qualification_command。components 全跑。
    subs = c.get("components") or [c]
    oks, msgs = [], []
    for s in subs:
        cmd = s.get("evidence_command") if evidence else s.get("qualification_command")
        nm = s.get("name", "")
        if not cmd:
            oks.append(False); msgs.append(f"{nm}{'無 evidence_command' if evidence else '無 qualification_command'}")
            continue
        ok, m = run_cmd(cmd, root, s.get("allow_empty", True), release_id if evidence and release_id else None)
        oks.append(ok); msgs.append(f"{nm}{m}")
    return all(oks), "；".join(x for x in msgs if x)

def main():
    ap = argparse.ArgumentParser(description="LEARNING_PATH verifier（fail-closed, cumulative, evidence-by-default）")
    ap.add_argument("--phase", choices=PHASE_ORDER)
    ap.add_argument("--release", action="store_true")
    ap.add_argument("--release-id")
    ap.add_argument("--qualify", action="store_true", help="跑 qualification（gate 自測）而非 evidence")
    ap.add_argument("--ready-for-5clean", action="store_true",
                    help="phase 0 但排除 finalization-role（AC-SPEC）；＝『可開始 5-clean』訊號，破 Phase0↔5clean 循環")
    ap.add_argument("--json", action="store_true")
    try: args = ap.parse_args()
    except SystemExit as ex: sys.exit(ex.code if ex.code is not None else 2)
    if args.release and args.phase and args.phase != "release":
        log("衝突：--release 與 --phase"); sys.exit(2)
    ready_mode = args.ready_for_5clean
    phase = "release" if args.release else ("0" if ready_mode else (args.phase or "-1"))
    evidence = not args.qualify

    # F6-05／第2項：release snapshot root，含安全 slug ＋ path containment（防 workspace 混用/逃逸）
    root = ROOT
    if phase == "release":
        rid = args.release_id or ""
        if not re.fullmatch(r"[A-Za-z0-9._-]+", rid):
            log("release-id 非法（僅允許 [A-Za-z0-9._-]）")
            if args.json: print(json.dumps({"mode":phase,"error":"bad release-id"},ensure_ascii=False))
            sys.exit(2)
        rel_base = (ROOT / "releases").resolve()
        root = (rel_base / rid).resolve()
        if rel_base not in root.parents:
            log("release snapshot 路徑逃逸 releases/")
            if args.json: print(json.dumps({"mode":phase,"error":"path escape"},ensure_ascii=False))
            sys.exit(2)
        if not root.is_dir():
            log(f"release snapshot 不存在：releases/{rid}")
            if args.json: print(json.dumps({"mode":phase,"error":"snapshot missing","root":str(root)},ensure_ascii=False))
            sys.exit(1)

    reg = json.loads(REG.read_text(encoding="utf-8"))
    berr = bootstrap_validate(reg)
    if berr:
        log("!! bootstrap 契約自檢失敗："); [log("   "+x) for x in berr]
        if args.json: print(json.dumps({"mode":phase,"bootstrap_ok":False,"errors":berr},ensure_ascii=False))
        sys.exit(2)

    upto = PHASE_ORDER[:PHASE_ORDER.index(phase)+1]
    checks = [c for c in reg["checks"] if c["phase"] in upto]
    if ready_mode:   # 破循環（CF-01）：**component 級**排除 finalization-role（AC-SPEC 的 5clean+紅隊），
        nc = []      #   但 concreteness component 仍必跑 →「可開始 5-clean」訊號會驗 concreteness，不循環要求已完成 5-clean
        for c in checks:
            if c.get("finalization_role"):        # 相容舊式 entry 級標記：整筆略過
                continue
            comps = c.get("components")
            if comps:
                kept = [s for s in comps if not s.get("finalization_role")]
                if not kept:                      # 全為 finalization component → 整筆略過
                    continue
                if len(kept) != len(comps):
                    c = {**c, "components": kept}
            nc.append(c)
        checks = nc
    mode_desc = ("ready-for-5clean" if ready_mode else ("qualify" if args.qualify else "evidence"))
    log(f"=== verify:learning-path --phase={phase}（{mode_desc}；cumulative {'→'.join(upto)}）===")
    results = []
    for c in checks:
        ok, msg = run_check(c, evidence, root, args.release_id)
        nm = c.get("ac_id") or c.get("id")
        results.append({"id": nm, "ok": ok});
        log(f"  [{'PASS' if ok else 'FAIL'}] {nm} @P{c['phase']} ({c['kind']})  {msg}")
    allok = all(r["ok"] for r in results)
    fails = [r["id"] for r in results if not r["ok"]]
    if args.json:
        print(json.dumps({"mode":phase,"evidence":evidence,"cumulative":upto,"bootstrap_ok":True,
                          "complete":allok,"fail":fails}, ensure_ascii=False))
    else:
        extra = ("；定案/5-clean 仍需 --phase=0 全綠" if phase=="-1" and allok else "")
        log(f"\nRESULT: --phase={phase}({mode_desc}) {'COMPLETE ✅'+extra if allok else f'PARTIAL ⛔（{len(fails)} 未過）'}")
    sys.exit(0 if allok else 1)

if __name__ == "__main__":
    main()
