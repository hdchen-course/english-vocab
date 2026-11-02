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

## wave2 片3（構詞/其餘 8 單元）— audit-w2s3：blocker0/major0/minor1/INFO4；CLEAN 7
審：shallwouldlike/wouldmodal/compoundadj/prefixneg/suffixadj/suffixnoun/suffixverb/wordfamily
- [minor 已修] suffixverb claim c-sv-en | A 精確度 | 「strong/strength -> strengthen」暗示 strong+en（實為 *strongen）→ 改「…dark->darken；亦可加名詞：strength(noun)->strengthen」。teach body 本已正確，僅後台 claim 措辭。
- INFO：suffixadj P2/P4 誘答為保守排除（非 overstate）；全 8 單元 R14 teach 雙語內嵌＝全站既有 house-style（系統性 backlog）。strand 全對、零簡體、唯一正解全成立。

## wave2 片1（連接/副子句 8）＋片2（情態 8）— audit-w2s1/w2s2：blocker0/major0/minor
片1：CLEAN 6；修 reasonclause P5（not…because 否定範圍歧義句→前置「Because it was cold, I didn't go out.」消歧義）。purposeresult teach 英文領述與他單元體例不一＝系統性 R14 backlog。
片2：CLEAN 7；修 musthaveto P2 誘答「must to」理由刪誤導括號「has to 更自然」→「must 後直接接原形、此處填 has to」。maymight c-mm-might-less 以 often/usually hedge＝可接受 INFO、不修。modalperfect（最高風險）全 CLEAN。
## wave2 修正批次（2026-11-02 12:15）＋總結
已修 3 處 minor：suffixverb claim c-sv-en、reasonclause P5 歧義句、musthaveto P2 誘答措辭。皆不改正解。gate 全綠。
**wave2 總結：24 單元，0 blocker / 0 major。** 情態助動詞（含 modalperfect 推測）語意正確、唯一正解設計貫徹。累計 core 48/150 審畢、全程 0 blocker/0 major。

## wave3 片1（不定詞/動名詞 8）— audit-w3s1：blocker0/major0/minor0，全 8 CLEAN
審：bareinfinitive/gerundidiom/gerundroles/infadjadv/infnoun/infpurpose/meaningchange/subjectofinfinitive
高風險 meaningchange（remember/stop/forget/try to-V vs V-ing）逐題語境鎖唯一正解、誘答第二解不成立；subjectofinfinitive for/of 對比理由不 overstate；bareinfinitive 感官動詞 -ing 誠實標註且選項未放故唯一。零簡體（now 為掃描假命中）。無需修。

## wave3 片2（不定詞/名詞複數 8）— audit-w3s2：blocker0/major0/minor1；CLEAN 7
審：verbinf/vgerund/whinf/irregularplural/nounmod/pieceof/regularplural/sameplural
- [minor 已修] regularplural claim c-rpl-es＋teach | A | 「-ch 加 -es」寫成無條件規則，但發 /k/ 音的 -ch（stomach→stomachs）加 -s → 補「-ch 指 /tʃ/ 音（watch/church）；少數 /k/ 音如 stomach 加 -s」限定。本單元所有例字/題目皆 /tʃ/，無反例，正解不受影響。
- 正面：sameplural 只把 fishs 列錯、未否定 fishes（多種魚合法）；c-rpl-fves 用 "Some nouns" 避 roofs/chiefs overstate；verbinf/vgerund 刻意避開 like/begin/start 兩可動詞。零簡體（now 假命中）。

## wave3 片3（名詞子句/間接問句 8）— audit-w3s3：blocker0/major0/minor1；CLEAN 7
審：uncountable/indirectwh/indirectyesno/nounclsubj/thatobject/whetherclause/pattern2/tenseagree
- [minor 已修] tenseagree P4 | C overstate | 「went 會讓人以為地球不再繞太陽」誇大（普遍真理 backshift 為可選、過去式不傳達真理失效）→ 理由改「真理慣用現在式 goes、最清楚；此處選 goes」，去失真語意。正解 goes 保留。
- 正面：whetherclause 的 whether/if 高階分野（主詞位/介系詞後/接 to/or not）精準；indirectwh/yesno 間接問句語序與 backshift 正確。零簡體零 PRC。
## wave3 修正批次（2026-11-02 12:21）＋總結
已修 2 處 minor（regularplural -ch /tʃ/ 限定、tenseagree P4 去 overstate）。片1 全 CLEAN。gate 全綠。
**wave3 總結：24 單元，0 blocker / 0 major。** 高風險 meaningchange/複數分歧/間接問句全過。累計 core 72/150 審畢、全程 0 blocker/0 major。

## wave4 片1（句型/介系詞 8）— audit-w4s1：blocker0/major0/minor1；CLEAN 7
審：pattern5/patternsv/patternsvo/twoobjects/phrasalprep/prepcolloc/prepdirection/prepduration
- [minor 已修] prepdirection | E 範圍一致性 | title/can_do 列 "to" 但 teach/claims/practice 未教 → 移除 title/can_do/_note 的「to（往目的地）」對齊實教（into/onto/through/across/along）。
- 正面（高風險區確認無缺陷）：prepcolloc good at vs good in 以「美式口語偶爾、正式/會考用 good at」誠實 hedge 不 overstate；phrasalprep despite 不加 of；prepduration for/during/since/by/until/within 六者精準；twoobjects to/for 類劃分正確。零簡體零 PRC。

## wave4 片3（代名詞/關係子句 8）— audit-w4s3：blocker0/major0/minor3；CLEAN 5
審：reflexive/preprel/reduceclause/reladverb/relcomma/relomit/relthat/relwhat
- [minor 已修] reflexive claim c-rf-standard＋teach＋_note＋P4 themself＋P5 ourself | D overstate | 把 themself/ourself 說成「無此標準字」誇大（themself 已被收為單數 they 標準反身、ourself 用於編輯語氣）→ 改錨定「本題主詞複數故用 -selves；themself 僅單數 they／ourself 僅 we 自稱單一者」。正解 themselves/ourselves 不變。
- [minor 已修] relwhat P5 | D R14 | 理解題四選項中文 → 改英文（the thing(s) that you need / the reason… / the place… / the way…），同 wave1 moreandmore 先例。
- [minor 已修] relomit P4 | B 邊界第二解 | 誘答「My brother you met yesterday is a doctor.」本身合文法（限定省略受格關代）→ rationale 補「此句文法正確但屬限定，不符題幹非限定補充語意」。
- 正面：preprel/reduceclause/reladverb/relcomma/relthat 刻意不並列 who/which 避第二解，限定/非限定/省略規則正確。零簡體零 PRC。

## wave4 片2b（介系詞/代名詞 8，重跑）— audit-w4s2b：全 8 CLEAN，0 findings
審：prepgerund/prepmeans/prepplace/indefinitepron/interrogativepron/itusage/oneones/reciprocalpron
reciprocalpron each other/one another 正確處理為現代可互通、不列唯一正解題；prepmeans 避開 by cash/on foot BrE/AmE 兩可。零簡體。
## wave4 總結：24 單元，0 blocker/0 major，修 4 minor（prepdirection/reflexive/relwhat/relomit）。累計 core 96/150 審畢、全程 0 blocker/0 major。

## wave5（core 96–120，24 單元）— 2026-11-02
片1 audit-w5s1（relwhich/relwhose/relwhowhom/cleftit/doemphasis/exclamatory/formalobjit/formalsubjit）：全 8 CLEAN。
片2 audit-w5s2（inversionnegative/participleactive/participlepassive/soneither/tagquestion/inversionomitif/itstime/subjpast）：全 8 CLEAN。
片3 audit-w5s3（subjpresent/wishsubj/ditransitive/futuregoingto/futureperfect/futureprogressive/futurewill/irregularverb3）：2 minor。
修：
- futurewill P5-promise：answer_evidence 原掛 c-will-future（僅涵蓋預測），新增 claim c-will-promise（will 表承諾/願意）並改掛，證據與題意吻合。
- irregularverb3 P4-same-form："cuts" 誘答理由括號 (a minute ago) 與題幹 (A moment ago) 不一致 → 改 (a moment ago)。
## wave5 總結：24 單元，0 blocker/0 major，修 2 minor。累計 core 120/150 審畢、全程 0 blocker/0 major。

## wave6（core 120–150，30 單元）— 2026-11-02
片1 audit-w6s1（時態 10：pastirregular/pastperfect/pastprog/pastwhenwhile/perfectvspast/presentperfect/presentvsprog/presperfcont/presprogfuture/stativeverb）：全 10 CLEAN。
片2 audit-w6s2（時態+字彙 10：usedtofamily/willvsgoingto/corevocab/emotionadj/environment/expandvocab/festivals/hobbies/illness/quantifiers）：全 10 CLEAN。
片3 audit-w6s3（字彙+被動 10：shoppingmoney/techmedia/travelgeo/activepassive/causativepassive/passivetenses/voicebasic/voicebyagent/voiceditrans/voicemodal）：全 10 CLEAN。
## wave6 總結：30 單元，0 blocker/0 major/0 minor，無需修正。
## === CORE 150/150 審畢 ===：wave1–6 共 150 個 core 單元審完，全程 0 blocker/0 major，累計修 16 minor。接續 100 個 speaking 單元。

## wave7（speaking 情境 1–3 類：社交／人物／學校，30 單元）— 2026-11-02
片1 audit-w7s1（社交 10：greetings/howareyou/phone/compliment/playwithme/timegreet/courtesy/seeyou/welcome/encourage）：全 10 CLEAN。
片2 audit-w7s2（人物自介 10：age/family/likes/possessive/jobs/morefamily/morejobs/hecan/farmanimals/morejobs2）：9 CLEAN + 1 minor。
片3 audit-w7s3（學校物品 10：borrow/thereis/schoolsupplies/myschoolthings/classroom/hehas/classcommands/myschool2/seeschool/haveschool）：全 10 CLEAN。
修：
- possessive P2/P5：誘答「This is your pen?／This is your book?」為合法的上揚直述確認問句（輕微二義，且違反本批 jobs _note 自訂「避開上揚直述問法」標準）→ 改為明顯亂序句「Is this pen your?／Is this book your?」，與同題其餘亂序誘答風格一致。
## wave7 總結：30 單元，0 blocker/0 major，修 1 minor。speaking 累計 30/100 審畢。

## wave8（speaking 情境 4–6 類：數字時間／食物點餐／購物衣物，30 單元）— 2026-11-02
片1 audit-w8s1（數字時間 10：counting/teens/counting20/time/days/months/howmany/birthday/addition/subtraction）：全 10 CLEAN（加減算式逐題驗算正確、星期月份拼寫大寫正確、o'clock/at/on 道地）。
片2 audit-w8s2（食物點餐 10：ordering/want/hungry/canihave/likefood/helikes/fruit/morefood/drinks/fastfood）：全 10 CLEAN（a/an 母音子音判定、可數不可數+some/零冠詞、Yes,I am 不縮正確）。附注 ordering 題號跳 P4（僅編號不連續，非缺陷）。
片3 audit-w8s3（購物衣物 10：shopping/colors/price/buyfruit/wantclothes/morecolors/wearmore/wearing/pricetens/pricehundred）：全 10 CLEAN（數字拼寫 forty/ninety/fifty 正確、try this on 可分離片語動詞、價格數字正確）。
## wave8 總結：30 單元，0 blocker/0 major/0 minor，無需修正。speaking 累計 60/100 審畢。

## wave9（speaking 情境 7–9 類：方向交通／身體健康／天氣自然，30 單元）— 2026-11-02
片1 audit-w9s1（方向交通 10：directions/where/hotel/commute/going/atplace/gomore/atplace2/seetransport/seeplaces）：全 10 CLEAN（by bus/on foot 慣用無冠詞、MRT 在地標註、問路指路句型對照 Swan 無誤）。
片2 audit-w9s2（身體健康 10：body/doctor/feelok/hygiene/eatwell/bodycount/touchmore/sickadvice/touchbody/touchface）：全 10 CLEAN（身體部位單複數 feet/teeth 正確、My…hurts 第三人稱、照顧建議無醫學錯誤/無危險內容）。
片3 audit-w9s3（天氣自然 10：weather/weatherwear/weathermore/isweather/nature/seasons/weatheradj/likeseason/likeweather/sky）：全 10 CLEAN（It's sunny/How's the weather、a typhoon/an earthquake、the sun/the moon、fall 美式一致）。
## wave9 總結：30 單元，0 blocker/0 major/0 minor，無需修正。speaking 累計 90/100 審畢。
