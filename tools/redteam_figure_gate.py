import importlib.util, json, os, sys
spec=importlib.util.spec_from_file_location('g','/Volumes/workplace/EnglishTraining/english-vocab-deploy/tools/unit_schema_gate.py')
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
ROOT='/tmp/figgate_rt'
def base_unit(fig_teach=None, fig_prac=None):
    t={"kind":"text","body":"x","kp_ids":["eng.t_x.y.z"]}
    if fig_teach is not None: t["figure"]=fig_teach
    p={"question_id":"q1","type":"mcq","stem":"s","answer":"a","options":["a","b"],"kp_ids":["eng.t_x.y.z"]}
    if fig_prac is not None: p["figure"]=fig_prac
    return {"unit_id":"eng.t_x.y.z","title_zh":"t","subject":"eng","strand":"reading",
            "knowledge_point_ids":["eng.t_x.y.z"],"prerequisites":[],"est_minutes":5,
            "teach":[t],"practice":[p],"selfeval":["a","b","c"],"claims":[]}
def write(units):
    with open(ROOT+'/x.units.json','w',encoding='utf-8') as fh: json.dump({"units":units},fh,ensure_ascii=False)
    # units_index 與磁碟一致，避免無關 violation 汙染
    with open(ROOT+'/data/units_index.json','w',encoding='utf-8') as fh:
        json.dump({"units":[{"unit_id":u["unit_id"],"title_zh":u["title_zh"],"page":"x.html"} for u in units]},fh)
def figviol(units):
    write(units); v,_=m.run(ROOT)
    return [x for x in v if 'figure' in x]

good={"svg":"<svg viewBox='0 0 10 10'><rect/></svg>","alt":"a box"}
cases=[
 ("GOOD teach figure → allow",      figviol([base_unit(fig_teach=good)]),            False),
 ("GOOD practice figure → allow",   figviol([base_unit(fig_prac=good)]),             False),
 ("BAD non-dict → deny",            figviol([base_unit(fig_teach="oops")]),          True),
 ("BAD missing svg → deny",         figviol([base_unit(fig_teach={"alt":"a"})]),     True),
 ("BAD svg not <svg> → deny",       figviol([base_unit(fig_teach={"svg":"<div/>","alt":"a"})]), True),
 ("BAD <script> inject → deny",     figviol([base_unit(fig_teach={"svg":"<svg><script>x()</script></svg>","alt":"a"})]), True),
 ("BAD missing alt → deny",         figviol([base_unit(fig_teach={"svg":"<svg></svg>"})]), True),
 ("BAD empty alt → deny",           figviol([base_unit(fig_teach={"svg":"<svg></svg>","alt":"  "})]), True),
 ("no figure → allow (absent key)", figviol([base_unit()]),                          False),
]
ok=True
for name, viol, expect_deny in cases:
    got_deny=len(viol)>0
    res='PASS' if got_deny==expect_deny else 'FAIL'
    if res=='FAIL': ok=False
    print(f"[{res}] {name}  (figure-violations={len(viol)})")
    if viol and res=='PASS' and expect_deny: print('        e.g.', viol[0][:90])
print('RED-TEAM', 'ALL PASS ✅' if ok else 'HAS FAILURE ❌')
sys.exit(0 if ok else 1)
