# `deviation_categories.json` — AC-UNIT-3 偏離類別 allowlist（provenance 說明）

此檔是 `LEARNING_PATH_REBUILD_SPEC.md` §6.6①／§6.7／§11.A **AC-UNIT-3** 的
`DEVIATION_CATEGORIES` allowlist。一個新單元若與對應 `authoring/golden/<archetype>.html`
範本有結構偏離，其 unit metadata 的 `deviation_reason.category` 必須取自此檔的 enum，
否則 `unit_acceptance_lint` 的 AC-UNIT-3 視為品質漂移而 FAIL。

## 每項的結構（§6.6①）
```
{category, required_signer_roles:[…§8 角色 id，非空、⊆§8 角色 id allowlist],
 signoff:{by:[art,spatial], status:"signed", sha}}
```
- `sha` = `cat_fact_sha` = `sha256(canonical_json({category, required_signer_roles}))[:16]`
  - canonical = `json.dumps(o, sort_keys=True, ensure_ascii=False, separators=(',',':'))`
  - **pre-image 僅 `{category, required_signer_roles}`、排除 `signoff` 欄本身**（消自我指涉，
    與 `reward_type_sha`／`kp_fact_sha`／`unit_content_sha` 同一「不把 signoff 納入自身 pre-image」紀律）。
  - 某項 `category`／`required_signer_roles` 一改 → 該項 `cat_fact_sha` 失配 → 該項簽核**作廢、須重簽**。
- `required_signer_roles` = 引用此 category 之**單元偏離** MUST 取得的 §8 審查鏡角色簽核
  （category→審查角色的確定性對映；即 §6.6① 單元 `signoff.by[]` 必填子集 `golden-owner ＋ required_signer_roles` 的對映載體）。
  - 這 13 個合法 §8 角色 id：`domain`／`native-en`／`linguist`／`learning-sci`／`knowledge-viz`／
    `eye-comfort`／`psych`／`art`／`spatial`／`pm`／`sim-learner`／`animator`／`translator`（spec §8 line 772）。
  - 注意：`required_signer_roles` 的 allowlist 是上列 **13 個**，**不含** `golden-owner`
    （`golden-owner` 僅屬單元 `signoff.by[]` 的 allowlist＝`{golden-owner}∪13`，不屬 category→審查角色對映）。

## 已 seed 的類別與角色對映（三個，皆為 spec §6.6① 具名者）
| category | required_signer_roles | cat_fact_sha | 對映理由 |
|---|---|---|---|
| `a11y-accommodation` | `eye-comfort`, `psych` | `f67a232ae73c7c7a` | 無障礙調整核心＝生理可讀性（眼科）＋守零貼標籤/情緒安全（心理醫生，R11/no-labeling） |
| `archetype-subtype` | `pm`, `learning-sci` | `59af56c323907c9a` | 原型合法子類＝範疇/旅程認可（PM）＋仍服務記憶 retrieval（學習神經科學） |
| `bespoke-game-screen` | `knowledge-viz`, `animator`, `eye-comfort`, `learning-sci`, `pm` | `8929e3342ae660cb` | 客製互動/遊戲畫面＝視覺說清概念（知識視覺化）＋逐 frame（動畫師）＋iPad 免捲動可讀（眼科）＋retrieval（學習神經科學）＋範疇認可（PM） |

allowlist **刻意最小化**：僅 seed spec §6.6① 親自具名的三類。新增類別必須走同一道
sha-bound 雙簽流程（§6.7「新增類別須雙簽」），不得由漂移 session 逕自把杜撰類別寫進 enum。

## ⚠ Provenance 誠實聲明（§0.2）
**本檔各 enum 項的 `signoff.by=[art,spatial]` 視覺簽核為「作者代理（authoring agent）於本輪所做的
bootstrap 分析性簽核」，而非真人 `art-director`／`spatial-aesthetics` 審查鏡逐項裁決的結果。**
- `signoff.provenance` 欄標記為 `"bootstrap-analytical"`，誠實標示來源，**未偽造任何真人簽核**。
- 這些 bootstrap 簽核足以讓 enum 項在機器 gate（`cat_fact_sha` 綁定、角色 allowlist 檢查）上**結構有效**，
  使 AC-UNIT-3 的依賴就緒；但在 **DONE-GATE 依賴此檔之前**，應由真實的
  `art-director`＋`spatial-aesthetics` 兩審查鏡**重新批准**。
- sha 綁定紀律保證：只要 `category`／`required_signer_roles` 不變，真人重新批准時 sha 沿用；
  一旦內容變動，`cat_fact_sha` 失配、bootstrap 簽核自動作廢，必須重簽（含真人批准）。

## 驗證
- 結構 gate：`python3 tools/deviation_categories_gate.py --verify`（fail-closed；sha 失配／空角色／
  非 allowlist id／缺雙簽皆 DENY）。紅隊自測：`--selftest`（§13 四 case：竄改 sha 失配、空角色、杜撰 id、好例）。
- 整合：`python3 tools/unit_acceptance_lint.py` 的 AC-UNIT-3 依賴檢查會因本檔（＋`authoring/golden/`）皆存在而
  **從 pending-dependency SKIP 轉為就緒**；目前無單元宣告 `deviation_reason`，故 AC-UNIT-3 **真空通過**。
