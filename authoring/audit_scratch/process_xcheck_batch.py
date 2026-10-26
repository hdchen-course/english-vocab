#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""process_xcheck_batch.py — 一條龍處理一個 cross_check 批（兩 agent 輸出→verified）。

步驟：combine(host-獨立) → 把 adversarial 標了 concern 的 KP 自動排除並記 content_defect_backlog
（correctness-first：對抗方寫了疑慮就不自動 verify）→ 丟 manifest-pending(scope-待核) → 註冊 benign
→ cross_check_gate 真抓驗(re-fetch) → prune 未過 → 重生 manifest → promote → 印 verified 數。

用法：python3 process_xcheck_batch.py <batch> <scope_sid> <res.json> <adv.json>
"""
import json, sys, subprocess, hashlib, re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT/"tools"/"verify"))
import cross_check_gate as g

def host_pub(url): return g.host_publisher(url)
def badclaim(rec):
    c=(rec.get("claim") or "").strip().upper()
    return c.startswith("UNVERIFIABLE") or c.startswith("WRONG") or not (rec.get("refs") or [])

def main():
    batch, scope_sid, f_res, f_adv = sys.argv[1:5]
    res=json.loads(Path(f_res).read_text(encoding="utf-8")).get("checks",{})
    adv=json.loads(Path(f_adv).read_text(encoding="utf-8")).get("checks",{})
    man={r["id"]:r for r in json.loads((ROOT/"authoring"/"knowledge_points.json").read_text(encoding="utf-8"))["items"]}
    reg=json.loads((ROOT/"authoring"/"source_registry.json").read_text(encoding="utf-8"))
    led=json.loads((ROOT/"authoring"/"fact_check_ledger.json").read_text(encoding="utf-8"))
    bl=json.loads((ROOT/"authoring"/"content_defect_backlog.json").read_text(encoding="utf-8"))

    accepted, excluded_concern, skipped = {}, [], []
    for kid in res:
        e,a=res.get(kid),adv.get(kid)
        if kid not in man: skipped.append((kid,"不在 manifest")); continue
        if not a or badclaim(e) or badclaim(a): skipped.append((kid,"一方存疑/查不到")); continue
        if man[kid].get("verification_status")=="pending": skipped.append((kid,"scope-待核")); continue
        concern=(a.get("concern") or "").strip()
        # 只有「正確性」疑慮才排除；純取證完整度 caveat(gate 已保證 ≥2 confirmed 源)→ 仍驗、記 note
        # HARD：出現即一律排除（真正主張本題有錯/過時/應改…），不因任何 all-clear 開頭而鬆動。
        HARD=("錯","誤導","過時","過度簡化","不符","應改","須改","宜改","勿寫","勿用","誤用",
              "wrong","incorrect","outdated","mislead","oversimplif","泥石流","排序",
              # 時效性：對抗方指出所述事實已變更（如原住民族 16→17 族）→ 不可當 release-grade verified
              "須更新","已更新","已改為","已增至","已增為","已認定","已不再","不再是","已過期",
              # 錯誤複合詞（明指所述有誤）；不收裸「誤」以免誤擋「誤以為/誤解」這類破除迷思的 enhancement
              "小誤","筆誤","謬誤","有誤","誤植","訛誤","為誤","係誤")
        # SOFT：迷思/misconception 這類字會合法出現在「破除…的迷思」教學提醒裡（非指本題犯錯）。
        SOFT=("迷思","misconception")
        # 校準：唯有「開頭即明示本題無正確性疑慮」且「只出現 SOFT 字」時，才視為教學框架提醒→仍驗。
        # 任何 HARD 字 → 一律排除（紅隊：self-contradictory『無疑慮…但排序錯』仍 EXCLUDE）。
        CLEAR=("無正確性疑慮","無正確性問題","無疑慮","無錯誤","正確無誤","內容正確",
               "no correctness issue","no correctness concern","no issue","no error")
        head=concern.lstrip("　 \t-•*（(【[「\"'")
        concern_is_clear = any(head.startswith(m) for m in CLEAR)
        has_hard = any(k in concern for k in HARD)
        has_soft = any(k in concern for k in SOFT)
        concern_is_error = (has_hard or (has_soft and not concern_is_clear)) if concern else False
        # union refs by url, host-distinct
        refs,seen=[],set()
        for r in e.get("refs",[])+a.get("refs",[]):
            u=(r.get("url") or "").strip()
            if u and u not in seen and r.get("quote") and r.get("publisher"):
                seen.add(u); refs.append({"url":u,"publisher":r["publisher"],"quote":r["quote"]})
        if len({host_pub(r["url"]) for r in refs})<2:
            skipped.append((kid,"union host<2")); continue
        if concern_is_error:   # 正確性疑慮 → 不自動 verify，記 backlog
            excluded_concern.append(kid)
            bl["defects"].append({"kp_id_suffix":kid,"domain":kid.split('.')[0],
                "found_by":f"{batch} adversarial(cross_check)","found_at":"2026-10-27","severity":"minor",
                "issue":concern[:300],"fix":"實作時依 concern 修正措辭/來源後再驗。","status":"open"})
            continue
        if concern:   # 僅取證完整度 caveat → 驗證但記 note（供實作加強，不擋）
            bl.setdefault("cross_check_notes",[]).append({"kp_id_suffix":kid,"note":concern[:300],"severity":"sourcing"})
        accepted[kid]={"claim":e.get("claim") or a.get("claim"),"refs":refs}

    # 註冊 accepted
    for n,(kid,rec) in enumerate(sorted(accepted.items())):
        sha=hashlib.sha256(json.dumps(rec,ensure_ascii=False,sort_keys=True).encode()).hexdigest()[:16]
        sid=f"xcheck-{batch}-{n}"
        reg["sources"][sid]={"publisher":"；".join(sorted({r["publisher"] for r in rec["refs"]})),
            "locator":rec["claim"][:200] or kid,"accessed_at":"2026-10-27","authority_class":"cross_check",
            "evidence_method":"cross_check","content_fingerprint":sha,
            "independent_refs":rec["refs"],"claim":rec["claim"],
            "note":"經驗事實 ≥2 獨立來源；cross_check_gate 真抓驗。"}
        led["entries"][kid]={"scope_source_ids":[scope_sid],"fact_source_ids":[sid],
            "verified_by":[f"{batch}:researcher+adversarial(cross_check)"],"verified_as_of":"2026-10-27",
            "note":"scope=課綱；fact=cross_check 真抓驗。"}
    (ROOT/"authoring"/"source_registry.json").write_text(json.dumps(reg,ensure_ascii=False,indent=2),encoding="utf-8")
    (ROOT/"authoring"/"fact_check_ledger.json").write_text(json.dumps(led,ensure_ascii=False,indent=2),encoding="utf-8")
    (ROOT/"authoring"/"content_defect_backlog.json").write_text(json.dumps(bl,ensure_ascii=False,indent=2),encoding="utf-8")
    print(f"[{batch}] accepted-to-verify {len(accepted)}、concern排除 {len(excluded_concern)}、skip {len(skipped)}")

    # 真抓驗 + prune 未過（只驗「本批」新來源；舊批先前已 gate 驗過且 overlay 鎖定，不重抓以免愈跑愈慢）
    fail=[]
    for sid,s in list(reg["sources"].items()):
        if s.get("evidence_method")=="cross_check" and sid.startswith(f"xcheck-{batch}-"):
            ok,_=g.check_source(sid,s)
            if not ok: fail.append(sid)
    if fail:
        for sid in fail: reg["sources"].pop(sid,None)
        rm=[k for k,ent in led["entries"].items() if any(fs in fail for fs in ent.get("fact_source_ids",[]))]
        for k in rm: led["entries"].pop(k,None)
        (ROOT/"authoring"/"source_registry.json").write_text(json.dumps(reg,ensure_ascii=False,indent=2),encoding="utf-8")
        (ROOT/"authoring"/"fact_check_ledger.json").write_text(json.dumps(led,ensure_ascii=False,indent=2),encoding="utf-8")
    print(f"[{batch}] gate pruned {len(fail)} 未過")
    # regen + promote
    subprocess.run([sys.executable,"tools/_kp_build.py"],cwd=ROOT,capture_output=True)
    chk=subprocess.run([sys.executable,"tools/_kp_build.py","--check"],cwd=ROOT,capture_output=True)
    print(f"[{batch}] build --check rc={chk.returncode}")
    subprocess.run([sys.executable,"tools/promote_verified.py"],cwd=ROOT,capture_output=True)
    ver=subprocess.run([sys.executable,"tools/promote_verified.py","--check"],cwd=ROOT,capture_output=True,text=True)
    print(f"[{batch}] {ver.stdout.strip().splitlines()[-1] if ver.stdout.strip() else ''}")

if __name__=="__main__":
    main()
