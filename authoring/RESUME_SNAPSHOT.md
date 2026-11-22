# RESUME SNAPSHOT（自動產生 by lp-precompact-snapshot.sh，compact 前自動刷新；勿手改）

- 快照時間（台北）：2026-11-22 07:44:08
- git HEAD：`56076f97b`
- **resume 入口（compact 後先讀這順序）**：① `authoring/LEARNING_PATH_BUILD_PLAN.md`（導航計畫＋§0 固定檔案清單＋8 phase＋現狀＋完成定義，★先讀這個才不會東做一個西做一個）→ ② `LEARNING_PATH_REBUILD_SPEC.md`（唯一 normative 規範）→ ③ 跑 `python -I tools/build_status.py`（即時進度）→ ④ `authoring/LEARNING_PATH_PROGRESS.md`（詳實流水帳）。做學習路徑工作前重讀 spec，否則 lp-reanchor-guard 會擋收斂宣告。

## 最近 commit（＝進度流水帳，git 不會遺失）
```
56076f97b feat(sci): 新單元 phys-em motor-generator 直流馬達與交流發電機原理 (t_adv學測)
8a49db557 feat(sci): 新單元 phys-em lenz 冷次定律 感應電流方向 (t_adv學測)
d41d97961 docs(progress): phys-em 12/20 faraday-law push + lenz 進行中；冷次=臺灣譯名裁示
f2662d4c3 chore(data): units_index 納入 phys-em faraday-law
90e117092 feat(sci): 新單元 phys-em faraday-law 法拉第電磁感應定律 Φ=BA 與 |ε|=N·ΔΦ/Δt (t_adv學測)
9644225be docs(progress): phys-em 11/20 本session再收6單元(electromagnet/motor-basic/induction-basic/field-of-current/force-on-wire/lorentz); t_adv量化.venv驗算; 深輪缺陷類+figure慣例+下一步佇列
a28ae7f8d feat(sci): 新單元 phys-em lorentz 運動電荷勞侖茲力F=qvB(t_adv學測)
0f0a51eb5 feat(sci): phys-em lorentz draft+freeze 運動電荷勞侖茲力F=qvB(t_adv學測)
```
## 未提交工作樹（排除 .claude/.sda/training）
```
 M authoring/RESUME_SNAPSHOT.md
 M authoring/page_converge_ledger.json
 M data/units_index.json
?? .agents/
?? nav_review/
?? sci_phys_em_ac_basic.html
?? sci_phys_em_ac_basic.units.json
```
