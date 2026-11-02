# 英語島內容正確性＋spec 吻合審查 — findings ledger（HD 2026-11-02 授權自主進行）
> 對抗式審查：每單元查 (A)教學事實正確 (B)每題 MCQ 唯一正解(代入朗讀) (C)誘答理由不 overstate
> (D)R14 英文為教學媒介 (E)strand 歸屬合理(符 spec §6.1/§6.2) (F)零簡體零 PRC 詞。
> 唯讀審查出 findings → 主 session 複核 → 修確認缺陷 → 重 gate+render。最新波在最上。


## wave1 片1（形副類 adjadv 8 單元，2026-11-02 12:06）— audit-w1s1
審：adjposition/adverbtypes/asas/comparative/compmodifier/confusableadv/freqadverb/moreandmore
結果：blocker 0 / major 0 / minor 2；CLEAN 6。64 MCQ＋8 dictation 全代入朗讀驗證，無第二正解；strand=adjadv 全相符；零簡體。
- [minor] asas P3 | C overstate | distractor 理由「so…as 只用於否定句」過窄（疑問句亦可）→ 改「否定句/疑問句」或刪「只」。正解唯一性不受影響。
- [minor] moreandmore P5 | D R14 | 理解題四選項為中文，與同批 asas 用英文釋義選項體例不一致 → P5 改英文釋義選項。（adjposition/adverbtypes 的中文為文法類別標籤，可接受。）
待批次修（同 wave 片2/3 一起）。

## wave1 片2（比較/副子句 8 單元）— audit-w1s2：blocker0/major0/minor2類；CLEAN 7/8
審：multiplecomp/participleadj/superlative/themore/tooenough/advclpurpose/asif/concessionclause
- [minor 已修] asif P1/P2/P5 | C overstate | 誘答理由「as if 子句不用 will」過度一般化（預測性 as if+will 合法）→ 改為針對該格實際錯誤（P1/P5 與事實相反用過去式、填 will 變預測未來；P2 is going to 已表未來、加 will 重複）。
- [minor backlog] 跨單元 R14 | teach body 為單一中英混寫字串、渲染端無法隱藏中文；部分單元中文領述。屬 schema/engine 層級（teach body 宜拆 en＋zh 可收合）→ 列系統性 backlog（全站共用引擎決策，非單檔）。
## wave1 片3（條件/冠詞/連接 8 單元）— audit-w1s3：blocker0/major0/minor3；CLEAN 6/8
審：firstcond/futuretimeclause/nomatter/articleidiom/definiteart/zeroarticle/concession/conjadverb
- [minor 已修] definiteart P3 | C | a/an 理由指向 phone 的音，實際決定字是緊鄰的 new → 改「a/an 看後接字字首音：new /n/ 子音開頭用 a」。
- [minor 可接受] nomatter P2/P5 | B | 唯一性靠中文 gloss 消歧（No matter how 代入亦合法、語意轉方式）→ 本站一貫設計，保留。
- [minor backlog] 跨單元 R14 teach 英/中配比不一 → 同片2系統性 backlog。
## wave1 修正批次（2026-11-02 12:08）
已修 5 處 minor（asas P3、asif P1/P2/P5、definiteart P3、moreandmore P5 中文選項→英文釋義）。皆不改正解。JSON 合法、scan_simplified PASS、claim_evidence/question_correctness/unit_schema CLEAN。
**wave1 總結：24 單元，0 blocker / 0 major，教學事實正確、唯一正解全成立、零簡體。** 系統性 backlog：R14 teach-body 中英混寫宜拆 en/zh 可收合（engine 層級，另案）。
