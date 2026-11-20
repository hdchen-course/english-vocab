# Figure 視覺稽核 findings（HD 2026-11-20 要求：SVG 要「看」）

來源：tools/figure_visual_audit.py 算繪 → 視覺 agent（知識視覺化＋眼科）逐張 Read 實看。
系統性問題＝**方頭箭頭**（手繪短鈍 polygon，底邊寬≈長度的楔形）。正解＝換共用尖三角 marker（orient=auto、refX 近尖端）或把 polygon 底邊收窄成尖三角（保 tip/方向/附著）。
每個修正＝改 content_sha→de-converge→重跑 5-clean＋重新視覺簽核。

## FORCE 群（17 張，agent a60c2351 2026-11-20 看過）
- major（最鈍優先）：newton2(綠合力最胖)、friction_factor(兩面板綠推力)、friction_exist(綠+紅；且紅摩擦箭頭貼灰地面線，需上移)、newton3(綠+紅)
- minor：elements(綠；上下留白)、friction_coeff(橘 f)、incline(橘分量；箱附近略擠)、newton1(綠 v)、resolve_compose(橘 Fx)、weight_mass(月球綠；且 49N:8N 長度比例未如實)、add_1d(略)
- 箭頭已可接受：equilibrium、hooke、newton_2d、push_pull、tension_system(但兩砝碼過近置中)、unit
- 無裁切/溢出、無嚴重壓線；物理幾何(分解/tip-to-tail/直角標記)皆正確。

## ENERGY 群（22 張）— 待 agent a377c6bc 回報

## ESTATIC / FORCE-其餘 / OPTICS / HEAT / KIN 群 — 待掃
（kirchhoff、charge-in-field、plane-mirror、work-cos 已個別修為尖 marker。）

## ENERGY 群（22 張，agent a377c6bc 2026-11-20 看過）
- 方頭優先修：work_energy_thm(淨力藍)、power_fv(施力紅+速率藍)、ke_pe(速率v紅)、momentum_impulse(兩藍)、碰撞系列水平速度+灰過渡箭頭(collision_1d/collision_2d/elastic_formula/momentum_conserve 最鈍)
- 略鈍一併修：work_def(F10N紅)、conservative(紅/藍)、forms(黃/紅斜)
- 箭頭已銳利範例(勿動)：power_def、variable_force_work、pulley_wheel、lever_torque、energy_conserve
- 構圖(非箭頭)：上方留白重心偏下 lever_torque/work_def/work_energy_thm/momentum_impulse/center_of_mass；mech_conserve「底0m」紅字脫節應移右下底球旁；center_of_mass 右球壓刻度5與軸末x；ke_pe 中段大留白
- 無裁切/無嚴重壓線/無方向畫反。
