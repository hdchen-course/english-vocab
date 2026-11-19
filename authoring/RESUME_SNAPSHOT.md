# RESUME SNAPSHOT（自動產生 by lp-precompact-snapshot.sh，compact 前自動刷新；勿手改）

- 快照時間（台北）：2026-11-19 15:11:53
- git HEAD：`d3db4b086`
- **resume 入口（compact 後先讀這順序）**：① `authoring/LEARNING_PATH_BUILD_PLAN.md`（導航計畫＋§0 固定檔案清單＋8 phase＋現狀＋完成定義，★先讀這個才不會東做一個西做一個）→ ② `LEARNING_PATH_REBUILD_SPEC.md`（唯一 normative 規範）→ ③ 跑 `python -I tools/build_status.py`（即時進度）→ ④ `authoring/LEARNING_PATH_PROGRESS.md`（詳實流水帳）。做學習路徑工作前重讀 spec，否則 lp-reanchor-guard 會擋收斂宣告。

## 最近 commit（＝進度流水帳，git 不會遺失）
```
d3db4b086 feat(sci): phys-energy 彈性碰撞（等質量交換速度）5/5 DONE-GATE (19/22,t_sub)｜彈性碰撞=動量守恆且動能守恆(對比非彈性動能變小)+等質量一維正面交換速度v1'=u2 v2'=u1｜例兩1kg甲5乙2→甲2乙5、動量碰前後7、動能½×1×5²+½×1×2²=14.5J｜oracle錨u1=5,u2=2→2,5｜de-converge:figure兩真缺陷(箭頭長度未依速率比例viewBox擠壓+KE省略質量讀如½v²)修為比例箭頭+KE補質量,viz/eye鏡抓
e34d300ab feat(sci): phys-energy 二維碰撞(x/y分量各自守恆) 5/5 DONE-GATE (18/22,t_sub) + fix(kin_vector 箭頭)｜二維動量分量各守恆+合動量√(px²+py²)｜例A2kg·x3+B2kg·y4→px6 py8 碰後4kg vx1.5 vy2 合動量√(6²+8²)=10(6-8-10)｜oracle強化vx/vy/合動量+re-key(962fc52c→d380c5c5)｜tier修正t_adv→t_sub(manifest裁定)｜de-converge:_note自檢distractor漂移修正｜★HD視覺回報kin_vector位置向量箭頭:原垂直三角形懸P下方未沿向量方向→改沿方向對齊+藍點縮小,render-only缺陷,de-converge 1b483764→48d0342a重新5-clean
56d9c2e5e feat(sci): phys-energy 一維完全非彈性碰撞（黏合共同速度）5/5 DONE-GATE (17/22,t_adv)｜完全非彈性=碰後黏合共同速度+動量守恆但動能不守恆(部分變熱與聲音)+共速=總動量÷總質量=(m1u1+m2u2)/(m1+m2)｜例2kg·4m/s撞3kg靜止黏合→8÷5=1.6m/s｜figure碰前2kg→4m/s+3kg靜止→碰後5kg→1.6m/s+紅字動量守恆動能變小｜oracle錨(2·4+3·0)/(2+3)=1.6｜首輪即零零de-converge
c8d6b644c feat(sci): phys-energy 動量守恆（系統不受外力總動量不變）5/5 DONE-GATE (16/22,t_adv)｜動量守恆=合外力為零時碰前=碰後總動量+總動量=各質量×速度相加+用碰前=碰後解速度｜例2kg·3m/s撞3kg靜止黏合→共同速度6÷5=1.2m/s、碰後總動量仍6｜figure碰前2kg→3m/s+3kg靜止總動量6→碰後5kg合成→1.2m/s總動量6｜oracle錨2·3+3·0=(2+3)·1.2=6｜首輪即零零de-converge
73251b352 feat(sci): phys-energy 衝量與動量變化 I=Ft=Δp 5/5 DONE-GATE (15/22,t_adv)｜動量p=mv+衝量I=Ft+衝量-動量定理I=Δp=mΔv｜例F6N×t2s=I12N·s=Δp、3kg靜止末速v=12/3=4m/s｜figure推前靜止動量0→力6N×2s衝量12→推後v4動量3×4=12｜oracle en_momentum_impulse強化+registry honest re-key(f15f059f→fbced5bb)｜de-converge自抓真實blocker(小提醒把I=Δp誤成無條件衝量=動量→改條件化,5鏡皆判DEFECT)
aae423ad0 feat(sci): phys-energy 瞬時功率 P=Fv(力×速率) 5/5 DONE-GATE (14/22,t_adv)｜瞬時功率P=F×v+由P=W/t推導(d=vt,W=Fvt)+同力速率越快功率越大P∝v｜例引擎200N推車v=3m/s P=600W驗證W=Fd=2400J P=W/t=600W｜figure車F/v同向箭頭+速率加倍功率加倍對比｜oracle en_power_fv強化+registry honest re-key｜de-converge自引入(claim前面學的平均功率暗示已學詞→改先功率再點明)
f3ff8c595 feat(sci): phys-energy 保守力與非保守力(摩擦生熱力學能不守恆) 5/5 DONE-GATE (13/22,t_adv)｜保守力(重力/彈力)路徑無關力學能守恆+非保守力(摩擦)轉熱力學能減少但總能量守恆+Q=f×d、f=μN｜例μ0.3×N20=f6N、Q=6×5=30J、末動能50−30=20J｜figure箱子粗糙地面滑行摩擦生熱能量條50→20｜oracle en_conservative強化+registry honest re-key｜de-converge自引入(figure f·d→f×d乘號統一)
8fdeaead4 feat(sci): phys-energy 力學能守恆(動能與位能的總和不變) 5/5 DONE-GATE (12/22,t_adv)｜力學能=動能+位能無摩擦守恆+任意點成立(頂端力學能=任意點KE+PE)+末速只看高度差與軌道形狀無關｜例2kg自20m滑下總力學能mgh=392J=中點(PE294+KE98)=底KE392J｜figure無摩擦滑道三車依高度等比定位｜oracle en_mech_conserve強化3點能量分配+registry honest re-key｜三度de-converge皆自引入(球→車/figure軸非等比/alt稍微矛盾)
```
## 未提交工作樹（排除 .claude/.sda/training）
```
 M authoring/RESUME_SNAPSHOT.md
 M authoring/page_converge_ledger.json
 M data/units_index.json
?? .agents/
?? nav_review/
?? sci_phys_energy_center_of_mass.html
?? sci_phys_energy_center_of_mass.units.json
```
