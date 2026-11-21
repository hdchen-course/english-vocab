# RESUME SNAPSHOT（自動產生 by lp-precompact-snapshot.sh，compact 前自動刷新；勿手改）

- 快照時間（台北）：2026-11-21 17:44:31
- git HEAD：`0432d1f2d`
- **resume 入口（compact 後先讀這順序）**：① `authoring/LEARNING_PATH_BUILD_PLAN.md`（導航計畫＋§0 固定檔案清單＋8 phase＋現狀＋完成定義，★先讀這個才不會東做一個西做一個）→ ② `LEARNING_PATH_REBUILD_SPEC.md`（唯一 normative 規範）→ ③ 跑 `python -I tools/build_status.py`（即時進度）→ ④ `authoring/LEARNING_PATH_PROGRESS.md`（詳實流水帳）。做學習路徑工作前重讀 spec，否則 lp-reanchor-guard 會擋收斂宣告。

## 最近 commit（＝進度流水帳，git 不會遺失）
```
0432d1f2d fix(sci): refractive-index selfeval_note 殘留『折射率比較』→『的比值』(深輪抓上次修漏變體; 全檔掃清, alt描述性比較保留); de-converge 重凍
6054ff802 fix(sci): refractive-index can_do+claim 相對折射率『比較』→『比值』(r1深輪7ag major terminology: 量化概念定義精確化n2/n1、與_note/teach一致、消定性歧義); de-converge 重凍
9c4fc33b5 feat(sci): 新單元 phys-optics refractive-index(折射率與光速,t_adv學測); 絕對折射率n=c÷v(n≥1越大越慢)+相對折射率+偏折; oracle水n=1.33→v≈2.26×10⁸真值; figure光速比例條(真空/水/玻璃按值, 標籤在條外, 無裁切); 全形運算子; pre-freeze全綠; frozen 709bf48ccae30cb8
1456d9733 docs(progress): phys-optics 四單元批次全收斂定案(convex-image/curved-mirror/dispersion-color/imaging-eq)+深輪教訓+下一步refractive-index
47ed50eb5 chore(ledger): imaging-eq 5/5 收斂定案 (frozen a1db7f59df3dcd34; r1深輪修面鏡out-of-scope後重凍r1-5全clean); DONE-GATE simp/prc/5clean PASS; phys-optics 四單元批次全收斂
482d97bb3 chore(ledger): dispersion-color 5/5 收斂定案 (frozen e78e0a9bec88cb02; r4深輪修暗蘋果裝飾葉柄後重凍r1-5全clean); DONE-GATE simp/prc/5clean PASS
19400ae1b fix(sci): imaging-eq can_do+claim 移除『(和)面鏡』(r1深輪7ag major c-out-of-scope: 公式同形但『實像在另一側』符號規約只對透鏡、凹面鏡實像在同側;本單元全透鏡面鏡誤導); de-converge 重凍 + dispersion r3 clean banked
dad687ee2 chore(ledger): curved-mirror 5/5 收斂定案 (frozen 05cd353f953280ef; r1-5全clean 零de-converge); DONE-GATE simp/prc/5clean PASS
```
## 未提交工作樹（排除 .claude/.sda/training）
```
 M authoring/RESUME_SNAPSHOT.md
?? .agents/
?? nav_review/
```
