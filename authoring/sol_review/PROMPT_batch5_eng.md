# 任務：第五批交叉查證（78 條英文文法/構詞/音韻硬事實）

同前規則：fail-closed gate 會真抓每個 URL、逐字比對 quote；維基全家族算同一 publisher。這 78 條是英語文的文法/構詞/發音硬事實（經雙人分流確認標題正確，少數已修正）。請用**英文權威**（非維基）：
- Cambridge Dictionary + Grammar https://dictionary.cambridge.org/grammar/
- Merriam-Webster https://www.merriam-webster.com/
- British Council LearnEnglish https://learnenglish.britishcouncil.org/
- Purdue OWL https://owl.purdue.edu/
每 KP ≥2 個**不同 publisher**、quote 逐字 12–40 字、取靜態可抓頁面。

## 鐵律
1. 正確性第一（教小孩、道地非台式英語）。2. 全繁體中文 claim/concern、零簡體、零 PRC 詞；URL 不得含簡體。3. ≥2 不同 publisher（維基家族算一家）、verbatim quote。4. 查無源留 refs:[]+concern，不硬湊。
5. 這些 KP 多有「常見過度簡化/台式英語迷思」，若你查到標題或某教法有誤，在 concern 直說（例：between/among 非數量二分、which 可用於限定子句、KK≠IPA、some/any 非肯否二分）。

## 輸出：寫到（覆蓋）
```
/Volumes/workplace/EnglishTraining/english-vocab-deploy/authoring/sol_review/batch5_result.json
```
JSON 格式同前：{"checks":{"<kp_id>":{"claim":"…","refs":[{"url","publisher","quote"}],"concern":""}}}

## 清單（78 條；<kp_id> | <中文標題>）
eng.t_adv.adjadv.comparative-modifier | 比較級修飾語（much/far/a little + 比較級）
eng.t_adv.advcl.manner-as-if | 方式副詞子句（as if / as though）
eng.t_adv.conj.conj-vs-prep | 連接詞 vs 介系詞辨析（because/because of；although/despite）
eng.t_adv.modal.would | would（過去習慣/委婉/意願）
eng.t_adv.morph.prefix-degree | 數量/程度字首（bi-/tri-/multi-/semi-/over-/under-/super-）
eng.t_adv.nonfinite.bare-infinitive | 原形不定詞（make/let/have/see/hear + 原形）
eng.t_adv.nouncl.sequence-of-tenses | 名詞子句的時態呼應
eng.t_adv.pattern.sv-agreement | 主詞動詞一致（單複數/就近/集合名詞）
eng.t_adv.prep.others | 其他介系詞語意（about/of/for/against/despite）
eng.t_adv.pron.quantifier-agreement | 數量代名詞與動詞一致（both/either/neither/all/none/each）
eng.t_adv.pron.reciprocal | 相互代名詞（each other / one another）
eng.t_adv.relcl.restrictive-vs-nonrestrictive | 限定 vs 非限定關係子句（逗號）
eng.t_adv.relcl.what | 複合關係代名詞 what
eng.t_adv.special.apposition | 同位語
eng.t_adv.special.do-emphasis | do/does/did 強調動詞
eng.t_adv.special.inversion-place | 地方副詞/介片語句首倒裝（Here comes…）
eng.t_adv.special.participial-active | 分詞構句（現在分詞表主動/同時）
eng.t_adv.subj.as-if | as if / as though 的假設語氣（與事實相反；亦有對比可能為真的直陳用法）
eng.t_adv.subj.present-unreal | 與現在事實相反（If + 過去式, would/could/might + V）
eng.t_adv.subj.wish | I wish 句型（現在/過去/未來願望）
eng.t_adv.verb.tense-consistency | 時態一致與時間副詞搭配
eng.t_adv.verb.used-to-family | used to / be used to / get used to 辨析
eng.t_adv.voice.causative-perception | 感官/使役被動（be made to / be seen to）
eng.t_base.morph.compound-noun | 合成名詞（classroom/raincoat）
eng.t_base.morph.suffix-adverb-ly | 副詞字尾 -ly 構成
eng.t_base.phonics.hard-soft-cg | 硬軟 c/g（cat/city、go/giant）
eng.t_base.phonics.silent-e | 長母音與 silent e（magic e：a_e/i_e/o_e/u_e）
eng.t_base.phonics.single-consonants | 單子音發音
eng.t_base.phonics.syllable-stress | 音節切分與單字重音
eng.t_base.phonics.vowel-teams | 母音組合（ee/ea/oo 長短/ai/ay/oa/ow/oi/oy/au/aw）
eng.t_base.prep.time-at-on-in | 時間介系詞 at/on/in
eng.t_base.pron.possessive | 所有格形容詞 vs 所有格代名詞（my/mine）
eng.t_base.pron.subject-object | 人稱代名詞主格/受格
eng.t_base.verb.past-simple-regular | 過去簡單式（規則動詞 -ed）
eng.t_base.verb.present-progressive | 現在進行式構成與 -ing 拼寫
eng.t_mid.adjadv.adjective-position | 形容詞位置（限定/敘述、前位/後位）
eng.t_mid.adjadv.comparative | 比較級（規則與不規則）
eng.t_mid.adjadv.participle-adjective | 分詞形容詞 -ing vs -ed（boring/bored）
eng.t_mid.advcl.first-conditional | 條件副詞子句（第一類：if + 現在式, will）
eng.t_mid.article.idiom | 冠詞慣用語（play the piano、go to school）
eng.t_mid.conj.coordinating | 對等連接詞 FANBOYS（and/but/or/so/for/nor/yet）
eng.t_mid.conj.subordinate-concession | 從屬-讓步（although/though/even though/even if）
eng.t_mid.conj.subordinate-condition | 從屬-條件（if/unless/as long as）
eng.t_mid.modal.could | could（過去能力/委婉請求/可能）
eng.t_mid.modal.must | must（義務/強烈推測）
eng.t_mid.morph.prefix-negative | 否定/反義字首（un-/in-/im-/il-/ir-/dis-/non-）
eng.t_mid.morph.suffix-verb | 動詞字尾（-ize/-ify/-en/-ate）
eng.t_mid.nonfinite.verb-plus-infinitive | 接不定詞的動詞（want/hope/decide/promise）
eng.t_mid.nonfinite.wh-infinitive | 疑問詞 + 不定詞（how to…）
eng.t_mid.noun.collective | 集合名詞
eng.t_mid.noun.noun-as-modifier | 名詞當形容詞修飾名詞
eng.t_mid.noun.same-form-plural | 單複同形（sheep/deer/fish）
eng.t_mid.noun.uncountable | 不可數名詞概念
eng.t_mid.nouncl.indirect-wh | 間接問句（wh- 疑問詞）語序
eng.t_mid.nouncl.indirect-yesno | 間接問句（if/whether 是非）
eng.t_mid.pattern.sv | 句型一 S + V（完全不及物）
eng.t_mid.pattern.svc | 句型二 S + V + C（主詞補語/連綴動詞）
eng.t_mid.pattern.svo | 句型三 S + V + O（完全及物）
eng.t_mid.pattern.svoc | 句型五 S + V + O + C（受詞補語）
eng.t_mid.phonics.kk-ipa | KK 音標／IPA 符號認讀與對應
eng.t_mid.prep.means | by/with/in 表方式與工具
eng.t_mid.prep.position | 位置介系詞（above/below/over/under/between/among/beside/behind）
eng.t_mid.prep.prep-gerund | 介系詞 + 動名詞
eng.t_mid.pron.indefinite | 不定代名詞（some/any/no/every 複合字 someone/anything…）
eng.t_mid.pron.reflexive | 反身代名詞與強調用法（myself…）
eng.t_mid.relcl.which | 關係代名詞 which
eng.t_mid.relcl.who-whom | 關係代名詞 who/whom
eng.t_mid.relcl.whose | 關係代名詞 whose（所有格）
eng.t_mid.special.tag-question | 附加問句（tag question）
eng.t_mid.verb.ditransitive | 授與動詞雙受詞（give sb sth / to/for）
eng.t_mid.verb.past-simple-irregular | 過去簡單式（不規則動詞）
eng.t_mid.verb.past-when-while | 過去簡單 vs 過去進行（when/while）
eng.t_sub.modal.need-dare | need / dare 作情態助動詞
eng.t_sub.nouncl.suggest-should | 建議要求動詞後 that 子句（suggest that sb (should) do）
eng.t_sub.relcl.compound-wh-ever | 複合關係代名詞 whatever/whoever/whichever
eng.t_sub.special.perfect-participle | 完成式分詞構句（Having done…）
eng.t_sub.subj.mixed | 混合假設（兩型：過去條件→現在結果／現在持續條件→過去結果）
eng.t_sub.voice.it-is-said | It is said that… / be said to 結構
