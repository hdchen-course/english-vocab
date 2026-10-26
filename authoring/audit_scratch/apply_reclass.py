#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Phase -1 ④⑤ 套用 KP 重分類決策（5 域 team + 對抗式 reviewer 定稿）。
依 id 改寫 slice 行的 {tier, exam} 與（必要時）title，並去除 (待核)。
只動 DECISIONS 列出的 id；其餘（含 ESCALATE 保守留 pending 項、high-risk、KEEP-PENDING）一律不碰。"""
import re, sys
from pathlib import Path

ROOT = Path("/Volumes/workplace/EnglishTraining/english-vocab-deploy")
SLICE = ROOT / "authoring" / "_kp_slices"

PENDING_RE = re.compile(r"[(（]\s*待核[^)）]*[)）]")
LINE_RE = re.compile(r"^(\s*-\s*\[)(?P<id>[A-Za-z0-9][A-Za-z0-9._-]+)(\]\s*)(?P<title>.+?)\s*[\{｛](?P<meta>[^}｝]*)[\}｝](?P<trail>.*)$")

def parse_meta(meta):
    tier=None; exams=[]
    for tok in re.split(r"[，,]", meta):
        tok=tok.strip()
        if not tok: continue
        m=re.match(r"^(?:tier|exam)\s*[:：]\s*(.*)$", tok, re.I)
        if m: tok=m.group(1).strip()
        tok=PENDING_RE.sub("", tok).strip()
        if not tok: continue
        if re.match(r"^t_[a-z]+$", tok): tier=tok
        else: exams.append(tok)
    return tier, exams

# id -> {tier?, exam?, title?}  (未給則沿用原值；全部去待核)
E_ENRICH = {"tier":"t_enrich","exam":"無"}
DECISIONS = {
 # ENRICH-BEYOND
 "math.t_sub.trig.inverse-function": E_ENRICH,
 "math.t_sub.space.sphere": E_ENRICH,
 "math.t_sub.calc.integration-by-parts": E_ENRICH,
 "sci.t_sub.phys-fluid.continuity": E_ENRICH,
 "sci.t_sub.phys-fluid.bernoulli": E_ENRICH,
 "sci.t_sub.phys-force.noninertial": E_ENRICH,
 "sci.t_sub.chem-bond.mo-theory": E_ENRICH,
 "sci.t_sub.chem-gas.real-gas": E_ENRICH,
 "sci.t_sub.chem-redox.nernst": E_ENRICH,
 "sci.t_sub.chem-organic.mechanism": E_ENRICH,
 "sci.t_sub.bio-genetics-classical.chi-square-genetics": E_ENRICH,
 "sci.t_sub.bio-biotech.crispr": E_ENRICH,
 "soc-geo.t_sub.skill.spatial-interp": E_ENRICH,
 "chi.t_adv.prac.official-doc": E_ENRICH,
 "eng.t_sub.reading.academic-long": E_ENRICH,
 "eng.t_sub.writing.argumentative": E_ENRICH,
 "eng.t_sub.vocab.expand-6000": {"tier":"t_enrich","exam":"無",
   "title":"進階擴充至約 6,000 字（參考詞彙表第 5–6 級，逾學測；英文無上限、以生活實用為主）"},
 # IN-SCOPE-ADV（reviewer AGREE）→ 去待核、保留 exam
 "sci.t_sub.phys-modern.compton": {},
 "sci.t_sub.phys-modern.uncertainty": {},
 "sci.t_sub.bio-plant-physiology.secondary-growth": {},
 "sci.t_sub.bio-ecology.phosphorus-cycle": {},
 "sci.t_sub.bio-conservation.carbon-neutral": {},
 "math.t_sub.conic.reflection-apply": {},
 "math.t_sub.finmath.marginal-elasticity": {},
 "sci.t_sub.bio-inquiry.statistics-basic": {"exam":"探究",
   "title":"以平均數、標準差、誤差線初步判讀生物數據（資料素養）"},
 # VERIFIED-MINIMUM（reviewer AGREE）→ 去待核
 "sci.t_adv.earth-astronomy.kepler-laws": {},
 "sci.t_adv.earth-astronomy.distance-scale": {},
 "chi.t_base.phon.tone-sandhi-third": {},
 "chi.t_adv.lit.taiwan-lit": {},
 "chi.t_base.char.recognition-count": {
   "title":"常用字認讀與書寫累積量（國小畢業：認讀 2,700 字、其中 2,200 字能寫；課綱 Ab-III）"},
 "chi.t_sub.gwrk.time-budget": {"exam":"學測-國寫",
   "title":"字數與時間分配：國寫無統一字數上限，逐題依題幹字數規定，於全卷時間內分配知性題與情意題兩大題"},
 "soc-geo.t_mid.reg-cn.pop-line": {"exam":"會考",
   "title":"中國人口分布東密西疏（受地形、氣候、經濟影響；「胡煥庸線／黑河—騰衝線」專名為補充）"},
 # ENG 進階文法 22 → 學測 / t_adv
 **{f"eng.t_sub.{s}": {"tier":"t_adv","exam":"學測"} for s in [
   "verb.past-perfect-progressive","verb.future-perfect-progressive","voice.nonfinite",
   "voice.it-is-said","nonfinite.perfect-passive","relcl.compound-wh-ever",
   "relcl.quantifier-of-which","nouncl.suggest-should","subj.future-unreal","subj.mixed",
   "subj.inversion-omit-if","subj.would-rather","subj.if-only","subj.its-time","subj.mandative",
   "subj.without-but-for","special.inversion-negative","special.inversion-only",
   "special.inversion-so-such","special.what-cleft","special.perfect-participle","special.absolute-with"]},
 "eng.t_sub.modal.need-dare": {"tier":"t_adv","exam":"無"},  # reviewer: 非 beyond
 "eng.t_mid.vocab.expand-2000": {"exam":"會考",
   "title":"擴充至約 2,000 字（國中高標，逾會考命題基準 1,200 字，銜接學測）"},
 "eng.t_adv.vocab.ceec-4500": {"exam":"學測"},  # 確切字數待官方，不進 ledger
 "eng.t_adv.listening.monologue": {"tier":"t_adv","exam":"學測",
   "title":"短文／獨白聽解（主旨／細節／推論）；高中英語聽力測驗為大考中心獨立測驗、等級制、採計方式依校系"},
 # LIFE：去待核（分齡/時效屬撰寫層，非事實待核）；5 條改寫
 "life.safety.extra.harassment": {},
 "life.sel.extra.grief": {},
 "life.think.deduction-induction.abduction": {},
 "life.think.critical-creative.creative-thinking": {},
 "life.digital.privacy.data-rights": {},
 "life.data.judgment.data-ethics": {},
 "life.compute.algorithm.efficiency": {},
 "life.compute.hardware.compile-interpret": {},
 "life.compute.tech-society.algo-fairness": {},
 "life.compute.extra.block-coding": {},
 "life.finance.market.gdp-cycle": {},
 "life.sustain.news.media-manipulation": {},
 "life.digital.ai-algo.ai-detection": {"title":"AI 生成內容不一定看得出來：別只靠肉眼特徵判斷，要查證來源與是否有 AI 標示（內容來源／憑證）"},
 "life.digital.factcheck.factcheck-platforms": {"title":"善用事實查核平台：先查傳言是否已被查核、看它的查證方法與證據，再交叉比對（不依賴單一平台）"},
 "life.finance.extra.first-job": {"title":"第一份工作／打工：你有勞動權益——雇主應投保勞健保，工時、加班、最低工資受法律保障（實際金額逐年調整）"},
 "life.sustain.civic-action.taiwan-issues": {"title":"認識台灣常見的環境議題類型（空氣品質、水資源、海洋與河川污染、海廢、廢棄物與回收、生態與開發衝突、能源轉型）"},
 "life.innovate.inventions.everyday-inventions": {"title":"日常發明是怎麼來的：多半是許多人長期接力改良的結果（破除單一發明者迷思）"},
}

def main():
    changed=0; seen=set()
    for f in sorted(SLICE.glob("*.md")):
        lines=f.read_text(encoding="utf-8").splitlines()
        out=[]; dirty=False
        for raw in lines:
            m=LINE_RE.match(raw)
            if m and m.group("id") in DECISIONS:
                kid=m.group("id"); seen.add(kid); e=DECISIONS[kid]
                tier0,exams0=parse_meta(m.group("meta"))
                title=e.get("title") or PENDING_RE.sub("",m.group("title")).strip()
                tier=e.get("tier") or tier0 or "t_mid"
                exam=e.get("exam") if "exam" in e else ("／".join(exams0) if exams0 else "無")
                new=f"  - [{kid}] {title}  {{{tier}, {exam}}}"
                # 保留行首縮排
                indent=re.match(r"^(\s*)-",raw).group(1)
                new=f"{indent}- [{kid}] {title}  {{{tier}, {exam}}}"
                if new!=raw: dirty=True; changed+=1
                out.append(new)
            else:
                out.append(raw)
        if dirty:
            f.write_text("\n".join(out)+"\n", encoding="utf-8")
    missing=set(DECISIONS)-seen
    print(f"changed lines: {changed}; decided ids matched: {len(seen)}/{len(DECISIONS)}")
    if missing:
        print("!! 未找到的 id（需查）:")
        for i in sorted(missing): print("   ", i)
        sys.exit(1)
    sys.exit(0)

if __name__=="__main__":
    main()
