# 理化（物理＋化學）知識點母體 — 深層 enumerated 清單

> 範圍：自然科-理化（物理＋化學）only；生物／地科不在本切片。
> 分層（tier，學習者看不到，純內部排序）：
> `t_base`=國小自然相關地基 ｜ `t_mid`=國中理化/會考 ｜ `t_adv`=高中物理·化學（學測，高一二範圍）｜ `t_sub`=分科測驗（高三選修深水區）。
> 體例：`- [id] 標題  {tier, exam}`；id = `sci.<tier>.<strand>.<slug>`（strand 前綴 phys.* 或 chem.*）；id 穩定、可被 spec 引用。
> exam ∈ 會考 / 學測 / 分科-物理 / 分科-化學 / 無。
> 深度標準：每一條 = 一個具體、可測的 micro-skill；寬標題（如「酸鹼」「電路」）不得當條目。
> 語言：全繁體、零簡體、零 PRC 詞彙。`(待核)` = 年段/分流/課綱歸屬需對照教育部《十二年國教課程綱要自然領域》與大考中心考試說明核實。
> 來源：理化領域專家 recon（2026-10-26），以 KNOWLEDGE_POINT_INVENTORY.md 之 A-4/B-4/C-4 為粗起點再深化。

---

## 物理 PHYSICS

### 物理-01 測量與單位 `phys-meas`
- [sci.t_base.phys-meas.measure-tools] 長度/質量/時間/溫度用適當工具測量  {t_base, 無}
- [sci.t_base.phys-meas.unit-idea] 量需要單位、認識常見生活單位  {t_base, 無}
- [sci.t_mid.phys-meas.si-base] SI 基本量與單位（公尺/公斤/秒/安培/克耳文…）  {t_mid, 會考}
- [sci.t_mid.phys-meas.unit-convert] 單位的換算（含詞頭 k/m/μ 等）  {t_mid, 會考}
- [sci.t_mid.phys-meas.sci-notation] 以科學記號表示極大極小的量  {t_mid, 會考}
- [sci.t_mid.phys-meas.sigfig-read] 刻度的最小刻度 1/10 估讀  {t_mid, 會考}
- [sci.t_mid.phys-meas.err-type] 系統誤差與隨機誤差的區別  {t_mid, 會考}
- [sci.t_mid.phys-meas.accuracy-precision] 準確度與精密度的區別  {t_mid, 會考}
- [sci.t_mid.phys-meas.scalar-vector] 純量與向量的區分  {t_mid, 會考}
- [sci.t_adv.phys-meas.dimension] 因次（量綱）分析檢驗公式  {t_adv, 學測}
- [sci.t_adv.phys-meas.sigfig-ops] 有效數字在加減與乘除運算的規則  {t_adv, 學測}
- [sci.t_adv.phys-meas.mean-sd] 實驗數據的平均值與標準差（不確定度估計）  {t_adv, 學測}
- [sci.t_sub.phys-meas.err-propagation] 測量不確定度的傳遞（誤差傳播）  {t_sub, 分科-物理}

### 物理-02 運動學 `phys-kin`
- [sci.t_base.phys-kin.motion-describe] 描述物體位置改變與運動快慢  {t_base, 無}
- [sci.t_mid.phys-kin.displacement-path] 位移與路徑長的區別  {t_mid, 會考}
- [sci.t_mid.phys-kin.velocity-speed] 速度與速率的區別  {t_mid, 會考}
- [sci.t_mid.phys-kin.avg-inst] 平均速度與瞬時速度  {t_mid, 會考}
- [sci.t_mid.phys-kin.acceleration] 加速度的定義與單位  {t_mid, 會考}
- [sci.t_mid.phys-kin.xt-graph] 等速度運動 x-t 圖的判讀（斜率=速度）  {t_mid, 會考}
- [sci.t_mid.phys-kin.vt-graph] 等加速度 v-t 圖判讀（斜率=加速度、面積=位移）  {t_mid, 會考}
- [sci.t_mid.phys-kin.free-fall] 自由落體與重力加速度 g  {t_mid, 會考}
- [sci.t_adv.phys-kin.uniform-accel-eq] 等加速度運動三公式（v=v₀+at 等）運用  {t_adv, 學測}
- [sci.t_adv.phys-kin.vertical-throw] 鉛直上拋運動的分析  {t_adv, 學測}
- [sci.t_adv.phys-kin.vector-kinematics] 平面運動的位置/速度/加速度向量  {t_adv, 學測}
- [sci.t_adv.phys-kin.projectile-h] 水平拋射運動的水平鉛直分量分解  {t_adv, 學測}
- [sci.t_sub.phys-kin.projectile-angled] 斜向拋體運動（射程/最大高度/飛行時間）  {t_sub, 分科-物理}
- [sci.t_sub.phys-kin.relative-motion] 相對運動與相對速度（一維/二維）  {t_sub, 分科-物理}

### 物理-03 力與牛頓運動定律 `phys-force`
- [sci.t_base.phys-force.push-pull] 推與拉是力、力能改變運動與形狀  {t_base, 無}
- [sci.t_base.phys-force.friction-exist] 摩擦力的存在與影響  {t_base, 無}
- [sci.t_mid.phys-force.force-elements] 力的三要素與力圖表示  {t_mid, 會考}
- [sci.t_mid.phys-force.force-unit] 力的單位（牛頓）與彈簧測力計測量  {t_mid, 會考}
- [sci.t_mid.phys-force.weight-mass] 重力與質量的區別（W=mg）  {t_mid, 會考}
- [sci.t_mid.phys-force.hooke] 虎克定律（彈力與形變量成正比）  {t_mid, 會考}
- [sci.t_mid.phys-force.friction-factor] 靜摩擦與動摩擦及影響因素  {t_mid, 會考}
- [sci.t_mid.phys-force.force-add-1d] 一維同向/反向力的合成  {t_mid, 會考}
- [sci.t_adv.phys-force.resolve-compose] 共點力的合成與分解（分量法）  {t_adv, 學測}
- [sci.t_adv.phys-force.equilibrium] 力平衡（合力為零）的靜力問題  {t_adv, 學測}
- [sci.t_adv.phys-force.newton1] 牛頓第一運動定律（慣性）  {t_adv, 學測}
- [sci.t_adv.phys-force.newton2] 牛頓第二運動定律（F=ma）應用  {t_adv, 學測}
- [sci.t_adv.phys-force.newton3] 牛頓第三運動定律（作用反作用）辨識  {t_adv, 學測}
- [sci.t_adv.phys-force.incline] 斜面上物體的受力分析  {t_adv, 學測}
- [sci.t_adv.phys-force.tension-system] 繩張力與連結體系統（電梯/阿特午機）  {t_adv, 學測}
- [sci.t_adv.phys-force.friction-coeff] 靜/動摩擦係數的定量計算  {t_adv, 學測}
- [sci.t_sub.phys-force.noninertial] 非慣性座標系與假想力（慣性力/離心力）  {t_sub, 分科-物理}
- [sci.t_sub.phys-force.newton-2d] 二維牛頓定律聯立求解  {t_sub, 分科-物理}

### 物理-04 功、能量與動量 `phys-energy`
- [sci.t_base.phys-energy.energy-forms] 能量的形式（動能/位能/光/熱/電）  {t_base, 無}
- [sci.t_base.phys-energy.simple-machine] 簡單機械省力（槓桿/滑輪/輪軸）初步  {t_base, 無}
- [sci.t_mid.phys-energy.work-def] 功的定義（力沿位移方向作功）  {t_mid, 會考}
- [sci.t_mid.phys-energy.power-def] 功率的定義與單位（瓦特）  {t_mid, 會考}
- [sci.t_mid.phys-energy.ke-pe] 動能與（重力）位能的概念  {t_mid, 會考}
- [sci.t_mid.phys-energy.energy-conserve] 能量守恆與形式轉換  {t_mid, 會考}
- [sci.t_mid.phys-energy.lever-torque] 槓桿原理與力矩（省力/費力/等臂）  {t_mid, 會考}
- [sci.t_mid.phys-energy.pulley-wheel] 滑輪/輪軸/斜面的機械利益  {t_mid, 會考}
- [sci.t_mid.phys-energy.work-principle] 功的原理（省力費距離）  {t_mid, 會考}
- [sci.t_adv.phys-energy.work-cos] 功的計算（W=Fs cosθ）  {t_adv, 學測}
- [sci.t_adv.phys-energy.work-energy-thm] 功能定理（淨功=動能變化）  {t_adv, 學測}
- [sci.t_adv.phys-energy.pe-types] 重力位能與彈性位能  {t_adv, 學測}
- [sci.t_adv.phys-energy.mech-conserve] 力學能守恆定律應用  {t_adv, 學測}
- [sci.t_adv.phys-energy.conservative] 保守力與非保守力、摩擦生熱  {t_adv, 學測}
- [sci.t_adv.phys-energy.power-fv] 瞬時功率與 P=Fv  {t_adv, 學測}
- [sci.t_adv.phys-energy.momentum-impulse] 動量與衝量（I=Ft=Δp）  {t_adv, 學測}
- [sci.t_adv.phys-energy.momentum-conserve] 動量守恆定律  {t_adv, 學測}
- [sci.t_adv.phys-energy.collision-1d] 一維碰撞（彈性/非彈性/完全非彈性）  {t_adv, 學測}
- [sci.t_sub.phys-energy.collision-2d] 二維碰撞與動量守恆分量  {t_sub, 分科-物理}
- [sci.t_sub.phys-energy.elastic-formula] 彈性碰撞速度公式推導  {t_sub, 分科-物理}
- [sci.t_sub.phys-energy.center-of-mass] 質心運動與質心座標  {t_sub, 分科-物理}
- [sci.t_sub.phys-energy.variable-force-work] 變力作功（力-位移圖面積/積分）  {t_sub, 分科-物理}

### 物理-05 圓周運動與重力/天體 `phys-circ`
- [sci.t_mid.phys-circ.circular-idea] 等速圓周運動方向持續改變的概念  {t_mid, 會考}
- [sci.t_adv.phys-circ.angular-speed] 角速度、週期、頻率與線速度關係（v=rω）  {t_adv, 學測}
- [sci.t_adv.phys-circ.centripetal-accel] 向心加速度（a=v²/r）  {t_adv, 學測}
- [sci.t_adv.phys-circ.centripetal-force] 向心力的來源與計算  {t_adv, 學測}
- [sci.t_adv.phys-circ.vertical-circle] 水平圓周與鉛直圓周運動  {t_adv, 學測}
- [sci.t_adv.phys-circ.kepler] 克卜勒行星運動三定律  {t_adv, 學測}
- [sci.t_adv.phys-circ.gravitation] 萬有引力定律（F=GMm/r²）  {t_adv, 學測}
- [sci.t_adv.phys-circ.g-variation] 重力場與重力加速度隨高度變化  {t_adv, 學測}
- [sci.t_adv.phys-circ.satellite] 人造衛星環繞速度與脫離速度  {t_adv, 學測}
- [sci.t_sub.phys-circ.shm-link] 等速圓周運動與簡諧運動的關係  {t_sub, 分科-物理}
- [sci.t_sub.phys-circ.kepler3-derive] 克卜勒第三定律（圓軌道）的推導  {t_sub, 分科-物理}
- [sci.t_sub.phys-circ.orbit-energy] 以能量觀點分析衛星軌道（束縛能/脫離速度）  {t_sub, 分科-物理}
- [sci.t_sub.phys-circ.grav-pe] 重力位能（−GMm/r）與重力位  {t_sub, 分科-物理}

### 物理-06 流體與壓力浮力 `phys-fluid`
- [sci.t_base.phys-fluid.float-sink] 物體在水中的浮沉現象  {t_base, 無}
- [sci.t_mid.phys-fluid.pressure-def] 壓力的定義（P=F/A）與單位（帕）  {t_mid, 會考}
- [sci.t_mid.phys-fluid.solid-pressure] 固體壓力與受力面積的關係  {t_mid, 會考}
- [sci.t_mid.phys-fluid.liquid-pressure] 液體壓力（P=ρgh）與連通管  {t_mid, 會考}
- [sci.t_mid.phys-fluid.atm-pressure] 大氣壓力與托里切利水銀柱實驗  {t_mid, 會考}
- [sci.t_mid.phys-fluid.buoyancy-idea] 浮力的概念與測量  {t_mid, 會考}
- [sci.t_mid.phys-fluid.archimedes] 阿基米德原理（浮力=排開流體重）  {t_mid, 會考}
- [sci.t_mid.phys-fluid.float-condition] 浮沉條件（密度比較）  {t_mid, 會考}
- [sci.t_mid.phys-fluid.pascal] 帕斯卡原理與液壓機  {t_mid, 會考}
- [sci.t_adv.phys-fluid.buoyancy-calc] 浮力與視重的定量計算  {t_adv, 學測}
- [sci.t_adv.phys-fluid.float-quant] 浮體/沉體/懸浮的定量分析  {t_adv, 學測}
- [sci.t_sub.phys-fluid.continuity] 流體連續方程式（A₁v₁=A₂v₂）  {t_sub, 分科-物理 (待核)}
- [sci.t_sub.phys-fluid.bernoulli] 白努利原理與應用  {t_sub, 分科-物理 (待核)}

### 物理-07 熱學 `phys-heat`
- [sci.t_base.phys-heat.thermometer] 溫度與溫度計的使用  {t_base, 無}
- [sci.t_base.phys-heat.conduction-basic] 熱由高溫傳向低溫  {t_base, 無}
- [sci.t_mid.phys-heat.temp-vs-heat] 溫度與熱量的區別  {t_mid, 會考}
- [sci.t_mid.phys-heat.celsius] 攝氏溫標與溫度計原理  {t_mid, 會考}
- [sci.t_mid.phys-heat.heat-unit] 熱量單位（卡/焦耳）與熱功當量  {t_mid, 會考}
- [sci.t_mid.phys-heat.specific-heat] 比熱與熱容量（Q=mcΔT）  {t_mid, 會考}
- [sci.t_mid.phys-heat.thermal-equilibrium] 熱平衡與混合後終溫計算  {t_mid, 會考}
- [sci.t_mid.phys-heat.heat-transfer] 熱的三種傳播（傳導/對流/輻射）  {t_mid, 會考}
- [sci.t_mid.phys-heat.expansion] 熱膨脹（固/液/氣）與應用  {t_mid, 會考}
- [sci.t_mid.phys-heat.latent-heat] 潛熱（熔化熱/汽化熱）與相變化吸放熱  {t_mid, 會考}
- [sci.t_adv.phys-heat.kelvin] 絕對溫標（克耳文）與絕對零度  {t_adv, 學測}
- [sci.t_adv.phys-heat.ideal-gas-law] 理想氣體方程式（PV=nRT）  {t_adv, 學測}
- [sci.t_adv.phys-heat.gas-laws] 波以耳/查理/給呂薩克定律  {t_adv, 學測}
- [sci.t_adv.phys-heat.kinetic-theory] 氣體分子動力論（壓力與分子運動）  {t_adv, 學測}
- [sci.t_adv.phys-heat.internal-energy] 內能與溫度的微觀意義  {t_adv, 學測}
- [sci.t_adv.phys-heat.thermo1] 熱力學第一定律（ΔU=Q−W）  {t_adv, 學測}
- [sci.t_sub.phys-heat.pv-processes] 等溫/等壓/等容/絕熱過程的 PV 圖與作功  {t_sub, 分科-物理}
- [sci.t_sub.phys-heat.molar-heat] 氣體莫耳比熱（Cp、Cv）與自由度  {t_sub, 分科-物理}
- [sci.t_sub.phys-heat.entropy] 熱力學第二定律與熵的概念  {t_sub, 分科-物理 (待核)}
- [sci.t_sub.phys-heat.carnot] 熱機效率與卡諾循環  {t_sub, 分科-物理 (待核)}

### 物理-08 波動與聲 `phys-wave`
- [sci.t_base.phys-wave.sound-produce] 聲音由物體振動產生與傳播  {t_base, 無}
- [sci.t_base.phys-wave.loud-pitch] 聲音的大小與高低  {t_base, 無}
- [sci.t_mid.phys-wave.wave-type] 波的分類（橫波/縱波）  {t_mid, 會考}
- [sci.t_mid.phys-wave.wave-quantities] 波長/頻率/週期/振幅與波速（v=fλ）  {t_mid, 會考}
- [sci.t_mid.phys-wave.medium] 力學波的傳播需要介質  {t_mid, 會考}
- [sci.t_mid.phys-wave.sound-medium] 聲速與介質/溫度的關係  {t_mid, 會考}
- [sci.t_mid.phys-wave.sound-three] 聲音三要素（響度/音調/音品）  {t_mid, 會考}
- [sci.t_mid.phys-wave.echo] 回聲與聲音的反射  {t_mid, 會考}
- [sci.t_mid.phys-wave.resonance] 共鳴/共振現象  {t_mid, 會考}
- [sci.t_adv.phys-wave.wave-behavior] 波的反射/折射/繞射/干涉  {t_adv, 學測}
- [sci.t_adv.phys-wave.standing-wave] 駐波與弦/空氣柱共振（基音/泛音）  {t_adv, 學測}
- [sci.t_adv.phys-wave.doppler] 都卜勒效應（聲源/觀察者運動）  {t_adv, 學測}
- [sci.t_adv.phys-wave.shm] 簡諧運動的位移/速度/加速度與相位  {t_adv, 學測}
- [sci.t_adv.phys-wave.shm-period] 簡諧運動週期（彈簧 2π√(m/k)、單擺 2π√(L/g)）  {t_adv, 學測}
- [sci.t_sub.phys-wave.shm-energy] 簡諧運動的能量（動能/位能轉換）  {t_sub, 分科-物理}
- [sci.t_sub.phys-wave.superposition] 波的疊加原理與相位差  {t_sub, 分科-物理}
- [sci.t_sub.phys-wave.standing-quant] 駐波節點/腹點與頻率的定量關係  {t_sub, 分科-物理}
- [sci.t_sub.phys-wave.doppler-calc] 都卜勒效應頻率公式計算  {t_sub, 分科-物理}

### 物理-09 光學（幾何＋物理） `phys-optics`
- [sci.t_base.phys-optics.straight-shadow] 光的直進與影子  {t_base, 無}
- [sci.t_base.phys-optics.reflection-mirror] 光的反射與鏡子成像  {t_base, 無}
- [sci.t_base.phys-optics.color-basic] 光的色散與顏色（彩虹/三稜鏡）  {t_base, 無}
- [sci.t_mid.phys-optics.pinhole] 光的直進與針孔成像  {t_mid, 會考}
- [sci.t_mid.phys-optics.reflection-law] 反射定律（入射角=反射角）  {t_mid, 會考}
- [sci.t_mid.phys-optics.plane-mirror] 平面鏡成像（虛像/左右相反/等距）  {t_mid, 會考}
- [sci.t_mid.phys-optics.refraction-idea] 光的折射現象（初步）  {t_mid, 會考}
- [sci.t_mid.phys-optics.lens-action] 凸/凹透鏡對光的作用與焦點  {t_mid, 會考}
- [sci.t_mid.phys-optics.convex-image] 凸透鏡成像規律（物距與像的關係）  {t_mid, 會考}
- [sci.t_mid.phys-optics.curved-mirror] 凹/凸面鏡成像初步  {t_mid, 會考}
- [sci.t_mid.phys-optics.dispersion-color] 光的色散、可見光光譜與物體顏色  {t_mid, 會考}
- [sci.t_adv.phys-optics.snell] 司乃耳折射定律（n₁sinθ₁=n₂sinθ₂）  {t_adv, 學測}
- [sci.t_adv.phys-optics.refractive-index] 絕對/相對折射率與光速變化  {t_adv, 學測}
- [sci.t_adv.phys-optics.total-reflection] 全反射與臨界角、光纖原理  {t_adv, 學測}
- [sci.t_adv.phys-optics.imaging-eq] 透鏡/面鏡成像公式（1/f=1/p+1/q）與放大率  {t_adv, 學測}
- [sci.t_adv.phys-optics.optical-instr] 放大鏡/顯微鏡/望遠鏡的成像原理  {t_adv, 學測}
- [sci.t_sub.phys-optics.double-slit] 楊氏雙狹縫干涉（亮暗紋條件與間距）  {t_sub, 分科-物理}
- [sci.t_sub.phys-optics.diffraction] 單狹縫繞射與繞射光柵  {t_sub, 分科-物理}
- [sci.t_sub.phys-optics.thin-film] 薄膜干涉  {t_sub, 分科-物理}
- [sci.t_sub.phys-optics.polarization] 光的偏振與偏振片  {t_sub, 分科-物理}
- [sci.t_sub.phys-optics.em-spectrum] 電磁波譜與光的電磁波本質  {t_sub, 分科-物理}

### 物理-10 靜電與電路 `phys-estatic`
- [sci.t_base.phys-estatic.circuit-basic] 電池、燈泡、導線組成簡單電路  {t_base, 無}
- [sci.t_base.phys-estatic.conductor-insulator] 導體與絕緣體的區別  {t_base, 無}
- [sci.t_base.phys-estatic.static-basic] 摩擦起電與靜電現象  {t_base, 無}
- [sci.t_mid.phys-estatic.charge] 電荷（正/負）與同性相斥異性相吸  {t_mid, 會考}
- [sci.t_mid.phys-estatic.charging] 摩擦/感應/接觸起電  {t_mid, 會考}
- [sci.t_mid.phys-estatic.electroscope] 驗電器的原理  {t_mid, 會考}
- [sci.t_mid.phys-estatic.current-def] 電流的定義與方向（I=Q/t）  {t_mid, 會考}
- [sci.t_mid.phys-estatic.voltage] 電壓（電位差）與電池  {t_mid, 會考}
- [sci.t_mid.phys-estatic.resistance] 電阻的概念與影響因素（材質/長度/截面積/溫度）  {t_mid, 會考}
- [sci.t_mid.phys-estatic.ohm-law] 歐姆定律（V=IR）  {t_mid, 會考}
- [sci.t_mid.phys-estatic.series] 串聯電路（電流相同、分壓）  {t_mid, 會考}
- [sci.t_mid.phys-estatic.parallel] 並聯電路（電壓相同、分流）  {t_mid, 會考}
- [sci.t_mid.phys-estatic.electric-power] 電功率（P=IV）與電能（度/千瓦小時）  {t_mid, 會考}
- [sci.t_mid.phys-estatic.home-safety] 家庭用電安全（保險絲/斷路器/接地）  {t_mid, 會考}
- [sci.t_adv.phys-estatic.coulomb] 庫侖定律（F=kq₁q₂/r²）  {t_adv, 學測}
- [sci.t_adv.phys-estatic.e-field] 電場與電場線、點電荷電場  {t_adv, 學測}
- [sci.t_adv.phys-estatic.potential] 電位與電位差、等電位面  {t_adv, 學測}
- [sci.t_adv.phys-estatic.capacitor] 電容器與電容（C=Q/V）、平行板電容  {t_adv, 學測}
- [sci.t_adv.phys-estatic.equivalent-r] 電阻串並聯等效電阻計算  {t_adv, 學測}
- [sci.t_adv.phys-estatic.kirchhoff] 克希荷夫定律（節點電流/迴路電壓）  {t_adv, 學測}
- [sci.t_adv.phys-estatic.emf-internal-r] 電動勢與內電阻  {t_adv, 學測}
- [sci.t_sub.phys-estatic.cap-energy] 電容器儲存能量（½CV²）與充放電  {t_sub, 分科-物理}
- [sci.t_sub.phys-estatic.charge-in-field] 電場中帶電粒子的運動  {t_sub, 分科-物理}
- [sci.t_sub.phys-estatic.wheatstone] 惠斯登電橋  {t_sub, 分科-物理}
- [sci.t_sub.phys-estatic.rc-circuit] RC 電路充放電  {t_sub, 分科-物理 (待核)}

### 物理-11 電磁與感應 `phys-em`
- [sci.t_base.phys-em.magnet-basic] 磁鐵的磁極、吸引與指南針  {t_base, 無}
- [sci.t_mid.phys-em.mag-field] 磁極（N/S）、磁力、磁場與磁力線  {t_mid, 會考}
- [sci.t_mid.phys-em.geomagnetism] 地磁與指南針指向  {t_mid, 會考}
- [sci.t_mid.phys-em.oersted] 電流的磁效應（安培右手定則）  {t_mid, 會考}
- [sci.t_mid.phys-em.coil-field] 通電導線/線圈/螺線管的磁場  {t_mid, 會考}
- [sci.t_mid.phys-em.electromagnet] 電磁鐵與應用（電鈴/繼電器）  {t_mid, 會考}
- [sci.t_mid.phys-em.motor-basic] 電流在磁場中受力（馬達原理）  {t_mid, 會考}
- [sci.t_mid.phys-em.induction-basic] 電磁感應與發電機原理初步  {t_mid, 會考}
- [sci.t_adv.phys-em.field-of-current] 直導線/線圈/螺線管磁場的方向與強度  {t_adv, 學測}
- [sci.t_adv.phys-em.force-on-wire] 載流導線在磁場受力（F=BIL）與左手定則  {t_adv, 學測}
- [sci.t_adv.phys-em.lorentz] 運動電荷在磁場受力（勞侖茲力 F=qvB）  {t_adv, 學測}
- [sci.t_adv.phys-em.faraday-law] 法拉第電磁感應定律（感應電動勢與磁通變化率）  {t_adv, 學測}
- [sci.t_adv.phys-em.lenz] 冷次定律（感應電流方向）  {t_adv, 學測}
- [sci.t_adv.phys-em.motor-generator] 直流馬達與交流發電機原理  {t_adv, 學測}
- [sci.t_adv.phys-em.ac-basic] 交流電的產生與有效值  {t_adv, 學測}
- [sci.t_sub.phys-em.flux-emf-calc] 磁通量與感應電動勢的定量計算  {t_sub, 分科-物理}
- [sci.t_sub.phys-em.transformer] 自感/互感與變壓器原理  {t_sub, 分科-物理}
- [sci.t_sub.phys-em.circular-in-field] 帶電粒子在磁場中的圓周運動（回旋半徑）  {t_sub, 分科-物理}
- [sci.t_sub.phys-em.mass-spec] 質譜儀/迴旋加速器原理  {t_sub, 分科-物理}
- [sci.t_sub.phys-em.em-wave-gen] LC 振盪與電磁波的產生  {t_sub, 分科-物理 (待核)}

### 物理-12 近代物理（量子/原子/核/相對論） `phys-modern`
- [sci.t_adv.phys-modern.photoelectric] 光電效應與光子能量（E=hf）  {t_adv, 學測}
- [sci.t_adv.phys-modern.bohr-model] 原子光譜與波耳氫原子能階模型  {t_adv, 學測}
- [sci.t_adv.phys-modern.matter-wave] 物質波（德布羅意波）概念  {t_adv, 學測}
- [sci.t_adv.phys-modern.atom-evolution] 原子結構演進（湯姆森/拉塞福/波耳）  {t_adv, 學測}
- [sci.t_adv.phys-modern.nucleus] 原子核組成、同位素與質能概念  {t_adv, 學測}
- [sci.t_adv.phys-modern.radioactivity] 放射性（α/β/γ 射線）與半衰期概念  {t_adv, 學測}
- [sci.t_sub.phys-modern.photoeq] 光電方程式（hf=W+Ek）與遏止電壓  {t_sub, 分科-物理}
- [sci.t_sub.phys-modern.compton] 康普頓效應  {t_sub, 分科-物理 (待核)}
- [sci.t_sub.phys-modern.spectral-lines] 能階躍遷與光譜線波長計算  {t_sub, 分科-物理}
- [sci.t_sub.phys-modern.nuclear-reaction] 核反應（衰變/分裂/融合）與質能互換（E=mc²）  {t_sub, 分科-物理}
- [sci.t_sub.phys-modern.half-life-calc] 半衰期的定量計算  {t_sub, 分科-物理}
- [sci.t_sub.phys-modern.uncertainty] 不確定性原理與量子概念初步  {t_sub, 分科-物理 (待核)}
- [sci.t_sub.phys-modern.relativity] 狹義相對論（時間膨脹/長度收縮/質能等效）初步  {t_sub, 分科-物理}

---

## 化學 CHEMISTRY

### 化學-01 物質分類與分離 `chem-matter`
- [sci.t_base.chem-matter.three-states] 物質三態與狀態變化（熔化/凝固/蒸發/凝結/昇華）  {t_base, 無}
- [sci.t_base.chem-matter.properties] 物質性質（軟硬/浮沉/磁性/導電）  {t_base, 無}
- [sci.t_base.chem-matter.dissolve-mix] 溶解與混合物的概念  {t_base, 無}
- [sci.t_base.chem-matter.filter-evap] 以過濾、蒸發分離混合物  {t_base, 無}
- [sci.t_mid.chem-matter.pure-vs-mixture] 純物質與混合物的區別  {t_mid, 會考}
- [sci.t_mid.chem-matter.classify] 元素、化合物、混合物的分類  {t_mid, 會考}
- [sci.t_mid.chem-matter.phys-vs-chem-change] 物理變化與化學變化的判別  {t_mid, 會考}
- [sci.t_mid.chem-matter.phys-vs-chem-prop] 物理性質與化學性質的區別  {t_mid, 會考}
- [sci.t_mid.chem-matter.homo-hetero] 均勻與非均勻混合物  {t_mid, 會考}
- [sci.t_mid.chem-matter.density] 密度的定義與測量（d=m/V）  {t_mid, 會考}
- [sci.t_mid.chem-matter.particle-view] 以粒子觀點解釋三態與狀態變化  {t_mid, 會考}
- [sci.t_mid.chem-matter.separation] 混合物分離（過濾/蒸發結晶/蒸餾/萃取/層析）  {t_mid, 會考}
- [sci.t_adv.chem-matter.fractional-distill] 分餾原理（利用沸點差）  {t_adv, 學測}
- [sci.t_adv.chem-matter.recrystallize] 再結晶純化與溶解度關係  {t_adv, 學測}
- [sci.t_adv.chem-matter.chromatography] 層析分離原理（極性/吸附差異）  {t_adv, 學測}
- [sci.t_sub.chem-matter.purity-test] 以熔點/沸點檢定純度並選擇分離技術  {t_sub, 分科-化學}

### 化學-02 原子結構與週期性 `chem-atom`
- [sci.t_mid.chem-atom.dalton] 原子的概念與道耳頓原子說  {t_mid, 會考}
- [sci.t_mid.chem-atom.subatomic] 原子結構（質子/中子/電子）與電性  {t_mid, 會考}
- [sci.t_mid.chem-atom.atomic-number] 原子序與質量數、同位素  {t_mid, 會考}
- [sci.t_mid.chem-atom.symbols] 元素符號與常見元素  {t_mid, 會考}
- [sci.t_mid.chem-atom.periodic-basic] 週期表排列（原子序/週期/族）初步  {t_mid, 會考}
- [sci.t_mid.chem-atom.atom-molecule] 原子與分子的區別、分子式  {t_mid, 會考}
- [sci.t_adv.chem-atom.model-evolution] 原子模型演進（湯姆森/拉塞福）  {t_adv, 學測}
- [sci.t_adv.chem-atom.electron-config] 電子組態與電子殼層（主/副殼層、軌域）  {t_adv, 學測}
- [sci.t_adv.chem-atom.valence-octet] 價電子與八隅體規則  {t_adv, 學測}
- [sci.t_adv.chem-atom.periodic-structure] 週期表結構（週期/族/s·p·d·f 區塊）  {t_adv, 學測}
- [sci.t_adv.chem-atom.radius-trend] 原子/離子半徑的週期趨勢  {t_adv, 學測}
- [sci.t_adv.chem-atom.ionization-trend] 游離能的週期趨勢  {t_adv, 學測}
- [sci.t_adv.chem-atom.electronegativity-trend] 電子親和力與電負度的週期趨勢  {t_adv, 學測}
- [sci.t_adv.chem-atom.metal-nonmetal] 金屬/非金屬/類金屬的分區與性質  {t_adv, 學測}
- [sci.t_sub.chem-atom.quantum-numbers] 量子數（n, l, m, s）與軌域  {t_sub, 分科-化學}
- [sci.t_sub.chem-atom.aufbau-rules] 構築原理、包立不相容與洪德定則  {t_sub, 分科-化學}
- [sci.t_sub.chem-atom.successive-ie] 連續游離能與價電子數判定  {t_sub, 分科-化學}
- [sci.t_sub.chem-atom.isoelectronic] 等電子序列的半徑比較  {t_sub, 分科-化學}

### 化學-03 化學鍵與分子 `chem-bond`
- [sci.t_mid.chem-bond.ion-form] 離子的形成（陽離子/陰離子）  {t_mid, 會考}
- [sci.t_mid.chem-bond.ionic-basic] 離子鍵與離子化合物初步  {t_mid, 會考}
- [sci.t_mid.chem-bond.covalent-basic] 共價鍵與分子化合物初步  {t_mid, 會考}
- [sci.t_adv.chem-bond.ionic-property] 離子鍵的形成與離子化合物性質（熔點/導電）  {t_adv, 學測}
- [sci.t_adv.chem-bond.covalent-lewis] 共價鍵（單/雙/參鍵）與路易斯結構  {t_adv, 學測}
- [sci.t_adv.chem-bond.coordinate] 配位共價鍵  {t_adv, 學測}
- [sci.t_adv.chem-bond.metallic] 金屬鍵與金屬性質（導電/延展）  {t_adv, 學測}
- [sci.t_adv.chem-bond.bond-polarity] 電負度差與鍵的極性（極性/非極性共價）  {t_adv, 學測}
- [sci.t_adv.chem-bond.molecule-polarity] 分子極性的判斷（對稱性/偶極矩）  {t_adv, 學測}
- [sci.t_adv.chem-bond.vsepr] VSEPR 價殼層電子對互斥與分子形狀  {t_adv, 學測}
- [sci.t_adv.chem-bond.intermolecular] 分子間作用力（凡得瓦力/偶極/氫鍵）與沸點  {t_adv, 學測}
- [sci.t_sub.chem-bond.hybridization] 混成軌域（sp/sp²/sp³）與鍵角  {t_sub, 分科-化學}
- [sci.t_sub.chem-bond.sigma-pi] σ 鍵與 π 鍵、鍵能與鍵長  {t_sub, 分科-化學}
- [sci.t_sub.chem-bond.resonance] 共振結構與形式電荷  {t_sub, 分科-化學}
- [sci.t_sub.chem-bond.mo-theory] 分子軌域理論初步  {t_sub, 分科-化學 (待核)}
- [sci.t_sub.chem-bond.crystal-types] 晶體分類（離子/共價網狀/分子/金屬）與性質  {t_sub, 分科-化學}

### 化學-04 化學計量 `chem-stoich`
- [sci.t_mid.chem-stoich.formula] 化學式的意義與讀寫  {t_mid, 會考}
- [sci.t_mid.chem-stoich.balance] 化學反應式的平衡（係數配平）  {t_mid, 會考}
- [sci.t_mid.chem-stoich.mass-conserve] 質量守恆定律  {t_mid, 會考}
- [sci.t_mid.chem-stoich.atomic-mass] 原子量與分子量/式量  {t_mid, 會考}
- [sci.t_mid.chem-stoich.definite-multiple] 定比定律與倍比定律  {t_mid, 會考}
- [sci.t_adv.chem-stoich.mole] 莫耳概念與亞佛加厥數  {t_adv, 學測}
- [sci.t_adv.chem-stoich.mole-mass-num] 莫耳/質量/粒子數的換算  {t_adv, 學測}
- [sci.t_adv.chem-stoich.mole-ratio] 反應式的計量關係（莫耳比）  {t_adv, 學測}
- [sci.t_adv.chem-stoich.limiting] 限量試劑與過量試劑的判定  {t_adv, 學測}
- [sci.t_adv.chem-stoich.yield] 理論產量、實際產量與產率  {t_adv, 學測}
- [sci.t_adv.chem-stoich.empirical] 實驗式與分子式的求法  {t_adv, 學測}
- [sci.t_adv.chem-stoich.combustion-analysis] 以燃燒分析求化學式  {t_adv, 學測}
- [sci.t_sub.chem-stoich.multistep] 多步驟（連續反應）的計量  {t_sub, 分科-化學}
- [sci.t_sub.chem-stoich.mixture-analysis] 混合物計量與含量分析  {t_sub, 分科-化學}
- [sci.t_sub.chem-stoich.titration-gas] 計量在滴定/氣體體積的綜合應用  {t_sub, 分科-化學}

### 化學-05 氣體 `chem-gas`
- [sci.t_mid.chem-gas.gas-properties] 氣體的性質與粒子觀點  {t_mid, 會考}
- [sci.t_mid.chem-gas.prepare-test] 常見氣體的製備與檢驗（氧/氫/二氧化碳）  {t_mid, 會考}
- [sci.t_adv.chem-gas.boyle] 波以耳定律（PV=定值）  {t_adv, 學測}
- [sci.t_adv.chem-gas.charles] 查理/給呂薩克定律（V-T、P-T）  {t_adv, 學測}
- [sci.t_adv.chem-gas.combined] 聯合氣體定律  {t_adv, 學測}
- [sci.t_adv.chem-gas.avogadro] 亞佛加厥定律（同溫同壓同體積同分子數）  {t_adv, 學測}
- [sci.t_adv.chem-gas.ideal-gas] 理想氣體方程式（PV=nRT）應用  {t_adv, 學測}
- [sci.t_adv.chem-gas.molar-volume] 氣體莫耳體積（STP 22.4 L）  {t_adv, 學測}
- [sci.t_adv.chem-gas.dalton-partial] 道耳頓分壓定律與莫耳分率  {t_adv, 學測}
- [sci.t_sub.chem-gas.kinetic-rms] 氣體分子動力論與方均根速率  {t_sub, 分科-化學}
- [sci.t_sub.chem-gas.graham] 格銳目擴散定律  {t_sub, 分科-化學}
- [sci.t_sub.chem-gas.real-gas] 真實氣體偏差與凡得瓦方程式  {t_sub, 分科-化學 (待核)}

### 化學-06 溶液與濃度 `chem-soln`
- [sci.t_base.chem-soln.solution-idea] 溶解與溶液的概念  {t_base, 無}
- [sci.t_mid.chem-soln.solute-solvent] 溶質/溶劑/溶液的辨識  {t_mid, 會考}
- [sci.t_mid.chem-soln.solubility-curve] 溶解度與溶解度曲線判讀  {t_mid, 會考}
- [sci.t_mid.chem-soln.saturation] 飽和/未飽和/過飽和溶液  {t_mid, 會考}
- [sci.t_mid.chem-soln.solubility-factor] 影響溶解度的因素（溫度/壓力）  {t_mid, 會考}
- [sci.t_mid.chem-soln.weight-percent] 重量百分濃度計算  {t_mid, 會考}
- [sci.t_mid.chem-soln.ppm] 濃度 ppm 的初步概念  {t_mid, 會考}
- [sci.t_mid.chem-soln.electrolyte] 電解質與非電解質、溶液導電  {t_mid, 會考}
- [sci.t_adv.chem-soln.molarity] 體積莫耳濃度（M）計算  {t_adv, 學測}
- [sci.t_adv.chem-soln.molality] 重量莫耳濃度（m）  {t_adv, 學測}
- [sci.t_adv.chem-soln.dilution] 溶液的稀釋（M₁V₁=M₂V₂）  {t_adv, 學測}
- [sci.t_adv.chem-soln.mole-fraction] 莫耳分率  {t_adv, 學測}
- [sci.t_adv.chem-soln.vapor-lower] 依數性質：蒸氣壓下降（拉午耳定律）  {t_adv, 學測}
- [sci.t_adv.chem-soln.bp-fp] 依數性質：沸點上升與凝固點下降  {t_adv, 學測}
- [sci.t_adv.chem-soln.osmotic] 依數性質：滲透壓  {t_adv, 學測}
- [sci.t_sub.chem-soln.colligative-calc] 依數性質定量計算與凡特何夫因子  {t_sub, 分科-化學}
- [sci.t_sub.chem-soln.ksp-common-ion] 溶解度積與同離子效應  {t_sub, 分科-化學}

### 化學-07 反應速率 `chem-rate`
- [sci.t_mid.chem-rate.rate-idea] 化學反應速率（快慢）的概念  {t_mid, 會考}
- [sci.t_mid.chem-rate.factors] 影響反應速率的因素（濃度/溫度/表面積/催化劑）  {t_mid, 會考}
- [sci.t_adv.chem-rate.rate-express] 反應速率的定義與表示（濃度變化率）  {t_adv, 學測}
- [sci.t_adv.chem-rate.collision] 碰撞學說與有效碰撞  {t_adv, 學測}
- [sci.t_adv.chem-rate.activation-energy] 活化能與反應位能圖  {t_adv, 學測}
- [sci.t_adv.chem-rate.catalyst] 催化劑對活化能的影響  {t_adv, 學測}
- [sci.t_adv.chem-rate.temp-effect] 溫度對速率的影響（定性）  {t_adv, 學測}
- [sci.t_sub.chem-rate.rate-law] 速率定律與反應級數（由數據求）  {t_sub, 分科-化學}
- [sci.t_sub.chem-rate.arrhenius] 速率常數與溫度（阿瑞尼士方程式）  {t_sub, 分科-化學}
- [sci.t_sub.chem-rate.mechanism] 反應機構與速率決定步驟  {t_sub, 分科-化學}
- [sci.t_sub.chem-rate.half-life] 一級反應的半衰期  {t_sub, 分科-化學}

### 化學-08 化學平衡 `chem-eq`
- [sci.t_adv.chem-eq.reversible] 可逆反應與動態平衡的概念  {t_adv, 學測}
- [sci.t_adv.chem-eq.kc-meaning] 平衡常數 Kc 的意義與表示  {t_adv, 學測}
- [sci.t_adv.chem-eq.kc-calc] 平衡常數的計算  {t_adv, 學測}
- [sci.t_adv.chem-eq.le-chatelier] 勒沙特列原理（濃度/壓力/溫度的影響）  {t_adv, 學測}
- [sci.t_adv.chem-eq.catalyst-noeffect] 催化劑不改變平衡位置  {t_adv, 學測}
- [sci.t_sub.chem-eq.kp-kc] Kp 與 Kc 的關係  {t_sub, 分科-化學}
- [sci.t_sub.chem-eq.reaction-quotient] 反應商 Q 與平衡方向判定  {t_sub, 分科-化學}
- [sci.t_sub.chem-eq.ice-table] 以 ICE 表格求平衡濃度  {t_sub, 分科-化學}
- [sci.t_sub.chem-eq.ksp] 溶解度積 Ksp 與沉澱生成判定  {t_sub, 分科-化學}
- [sci.t_sub.chem-eq.common-ion] 同離子效應與分段沉澱  {t_sub, 分科-化學}

### 化學-09 酸鹼 `chem-acidbase`
- [sci.t_mid.chem-acidbase.properties] 酸與鹼的通性（味道/指示劑/腐蝕）  {t_mid, 會考}
- [sci.t_mid.chem-acidbase.common] 常見酸鹼與日常應用  {t_mid, 會考}
- [sci.t_mid.chem-acidbase.indicator-ph] 指示劑/廣用試紙與 pH 值初步  {t_mid, 會考}
- [sci.t_mid.chem-acidbase.neutralization] 酸鹼中和反應與鹽的生成  {t_mid, 會考}
- [sci.t_mid.chem-acidbase.salts] 鹽類的性質與應用  {t_mid, 會考}
- [sci.t_adv.chem-acidbase.arrhenius] 阿瑞尼士酸鹼定義  {t_adv, 學測}
- [sci.t_adv.chem-acidbase.bronsted] 布忍司特-洛瑞定義與共軛酸鹼對  {t_adv, 學測}
- [sci.t_adv.chem-acidbase.kw] 水的自解離與 Kw  {t_adv, 學測}
- [sci.t_adv.chem-acidbase.ph-poh] pH 與 pOH 的定義與計算  {t_adv, 學測}
- [sci.t_adv.chem-acidbase.strong-ph] 強酸強鹼的 pH 計算  {t_adv, 學測}
- [sci.t_adv.chem-acidbase.weak-ka] 弱酸弱鹼的解離與 Ka/Kb  {t_adv, 學測}
- [sci.t_adv.chem-acidbase.equivalent] 酸鹼中和當量與濃度計算  {t_adv, 學測}
- [sci.t_adv.chem-acidbase.titration] 酸鹼滴定與當量點  {t_adv, 學測}
- [sci.t_sub.chem-acidbase.titration-curve] 滴定曲線判讀（強/弱酸鹼組合）  {t_sub, 分科-化學}
- [sci.t_sub.chem-acidbase.indicator-choice] 指示劑的選擇（變色範圍 vs 當量點）  {t_sub, 分科-化學}
- [sci.t_sub.chem-acidbase.buffer-principle] 緩衝溶液的組成與原理  {t_sub, 分科-化學}
- [sci.t_sub.chem-acidbase.buffer-calc] 緩衝溶液 pH 計算（韓德森-哈塞爾巴赫）  {t_sub, 分科-化學}
- [sci.t_sub.chem-acidbase.salt-hydrolysis] 鹽類水解與溶液酸鹼性判定  {t_sub, 分科-化學}
- [sci.t_sub.chem-acidbase.lewis] 路易斯酸鹼定義  {t_sub, 分科-化學 (待核)}
- [sci.t_sub.chem-acidbase.polyprotic] 多質子酸的分段解離  {t_sub, 分科-化學}

### 化學-10 氧化還原與電化學 `chem-redox`
- [sci.t_mid.chem-redox.oxid-reduc-idea] 氧化與還原的概念（得氧失氧/燃燒）  {t_mid, 會考}
- [sci.t_mid.chem-redox.activity-basic] 金屬活性大小（活性序）初步  {t_mid, 會考}
- [sci.t_mid.chem-redox.common] 常見氧化還原現象（生鏽/燃燒/呼吸）  {t_mid, 會考}
- [sci.t_adv.chem-redox.oxidation-number] 氧化數的定義與計算規則  {t_adv, 學測}
- [sci.t_adv.chem-redox.identify] 以氧化數變化判別氧化還原  {t_adv, 學測}
- [sci.t_adv.chem-redox.agents] 氧化劑與還原劑的判定  {t_adv, 學測}
- [sci.t_adv.chem-redox.balance] 氧化還原反應式的平衡（氧化數法/半反應法）  {t_adv, 學測}
- [sci.t_adv.chem-redox.activity-series] 金屬活性序與置換反應  {t_adv, 學測}
- [sci.t_adv.chem-redox.galvanic] 原電池（伏打電池）的構造與原理  {t_adv, 學測}
- [sci.t_adv.chem-redox.electrolysis] 電解與電鍍原理  {t_adv, 學測}
- [sci.t_sub.chem-redox.electrode-potential] 標準電極電位與電池電動勢計算  {t_sub, 分科-化學}
- [sci.t_sub.chem-redox.spontaneity] 以 E° 與 ΔG 判定反應自發性  {t_sub, 分科-化學}
- [sci.t_sub.chem-redox.nernst] 能斯特方程式  {t_sub, 分科-化學 (待核)}
- [sci.t_sub.chem-redox.faraday-electrolysis] 法拉第電解定律（電量與析出量）  {t_sub, 分科-化學}
- [sci.t_sub.chem-redox.batteries] 常見電池（乾電池/鉛蓄電池/燃料電池）  {t_sub, 分科-化學}
- [sci.t_sub.chem-redox.corrosion] 金屬腐蝕與防蝕（犧牲陽極/鍍層）  {t_sub, 分科-化學}

### 化學-11 熱化學 `chem-thermo`
- [sci.t_mid.chem-thermo.endo-exo] 吸熱與放熱反應的判別  {t_mid, 會考}
- [sci.t_mid.chem-thermo.energy-change] 反應伴隨的能量變化（定性）  {t_mid, 會考}
- [sci.t_adv.chem-thermo.enthalpy] 反應熱（焓變 ΔH）的意義與正負  {t_adv, 學測}
- [sci.t_adv.chem-thermo.energy-diagram] 反應位能圖與活化能  {t_adv, 學測}
- [sci.t_adv.chem-thermo.heat-types] 生成熱、燃燒熱與中和熱  {t_adv, 學測}
- [sci.t_adv.chem-thermo.hess] 赫斯定律與反應熱計算  {t_adv, 學測}
- [sci.t_adv.chem-thermo.bond-energy] 以鍵能估算反應熱  {t_adv, 學測}
- [sci.t_sub.chem-thermo.standard-enthalpy] 標準生成焓與反應焓計算  {t_sub, 分科-化學}
- [sci.t_sub.chem-thermo.entropy] 熵（ΔS）與亂度的概念  {t_sub, 分科-化學}
- [sci.t_sub.chem-thermo.gibbs] 自由能（ΔG=ΔH−TΔS）與反應自發性  {t_sub, 分科-化學}
- [sci.t_sub.chem-thermo.temp-spontaneity] 溫度對反應自發性的影響  {t_sub, 分科-化學}

### 化學-12 有機化學 `chem-organic`
- [sci.t_mid.chem-organic.carbon-idea] 有機化合物的概念與碳的特性  {t_mid, 會考}
- [sci.t_mid.chem-organic.common] 常見有機物（甲烷/乙醇/醋酸）與生活應用  {t_mid, 會考}
- [sci.t_adv.chem-organic.carbon-bonding] 碳的鍵結特性與有機物多樣性  {t_adv, 學測}
- [sci.t_adv.chem-organic.hydrocarbons] 烷/烯/炔（飽和/不飽和烴）與通式  {t_adv, 學測}
- [sci.t_adv.chem-organic.isomer-idea] 同分異構物的概念  {t_adv, 學測}
- [sci.t_adv.chem-organic.functional-groups] 官能基的辨識（羥基/羰基/羧基/胺基）  {t_adv, 學測}
- [sci.t_adv.chem-organic.oxygen-families] 醇/醛/酮/羧酸/酯的分類與性質  {t_adv, 學測}
- [sci.t_adv.chem-organic.esterification] 酯化反應  {t_adv, 學測}
- [sci.t_adv.chem-organic.polymers] 聚合物（加成/縮合聚合）與塑膠  {t_adv, 學測}
- [sci.t_adv.chem-organic.biomolecules] 生物分子初步（醣類/蛋白質/脂質）  {t_adv, 學測}
- [sci.t_sub.chem-organic.iupac] 有機物命名（IUPAC）初步  {t_sub, 分科-化學}
- [sci.t_sub.chem-organic.stereoisomer] 結構異構與立體異構（順反/鏡像）  {t_sub, 分科-化學}
- [sci.t_sub.chem-organic.reaction-types] 取代/加成/消去反應類型  {t_sub, 分科-化學}
- [sci.t_sub.chem-organic.aromatic] 芳香烴（苯）與其結構  {t_sub, 分科-化學}
- [sci.t_sub.chem-organic.mechanism] 有機反應機構初步  {t_sub, 分科-化學 (待核)}
- [sci.t_sub.chem-organic.saponification] 皂化反應與界面活性劑  {t_sub, 分科-化學}

### 化學-13 應用/永續化學 `chem-applied`
- [sci.t_base.chem-applied.household-acidbase] 生活中的酸鹼物質（清潔劑/食物）  {t_base, 無}
- [sci.t_mid.chem-applied.pollution] 空氣汙染與水汙染（成因/防治）  {t_mid, 會考}
- [sci.t_mid.chem-applied.materials] 常見材料（金屬/塑膠/陶瓷）與回收  {t_mid, 會考}
- [sci.t_mid.chem-applied.fuels] 燃料與能源（化石燃料/燃燒產物）  {t_mid, 會考}
- [sci.t_adv.chem-applied.greenhouse] 溫室效應與碳排放的化學  {t_adv, 學測}
- [sci.t_adv.chem-applied.acid-rain] 酸雨的成因與影響  {t_adv, 學測}
- [sci.t_adv.chem-applied.green-chemistry] 綠色化學與永續發展概念  {t_adv, 學測}
- [sci.t_adv.chem-applied.energy-storage] 電池與能源儲存的化學  {t_adv, 學測}
- [sci.t_sub.chem-applied.alt-energy] 替代能源與燃料電池的化學  {t_sub, 分科-化學}
- [sci.t_sub.chem-applied.nanomaterials] 奈米材料與新興材料初步  {t_sub, 分科-化學 (待核)}
- [sci.t_sub.chem-applied.remediation] 化學在環境治理的應用  {t_sub, 分科-化學}

---

## 探究與實作 `inquiry`（跨物理/化學）
- [sci.t_base.inquiry.observe-predict] 觀察、提問與預測  {t_base, 無}
- [sci.t_base.inquiry.fair-test] 操縱變因與控制變因初步（公平測試）  {t_base, 無}
- [sci.t_base.inquiry.measure-record] 測量、記錄與製表製圖  {t_base, 無}
- [sci.t_mid.inquiry.variables] 辨識操縱/應變/控制變因  {t_mid, 會考}
- [sci.t_mid.inquiry.hypothesis] 提出可驗證的假說  {t_mid, 會考}
- [sci.t_mid.inquiry.experiment-design] 實驗設計與對照組  {t_mid, 會考}
- [sci.t_mid.inquiry.data-graph] 數據表格化與折線/長條/散布圖繪製  {t_mid, 會考}
- [sci.t_mid.inquiry.graph-trend] 圖表判讀與趨勢分析  {t_mid, 會考}
- [sci.t_mid.inquiry.error-repro] 誤差來源與再現性  {t_mid, 會考}
- [sci.t_mid.inquiry.evidence-conclusion] 由證據推論並形成結論  {t_mid, 會考}
- [sci.t_mid.inquiry.lab-safety] 實驗室安全與器材操作規範  {t_mid, 會考}
- [sci.t_adv.inquiry.sigfig-uncertainty] 有效數字與測量不確定度  {t_adv, 學測}
- [sci.t_adv.inquiry.linear-relation] 由數據建立數學關係（線性迴歸/比例）  {t_adv, 學測}
- [sci.t_adv.inquiry.rigor] 控制變因的實驗嚴謹性評估  {t_adv, 學測}
- [sci.t_adv.inquiry.argumentation] 科學論證（主張-證據-推理）  {t_adv, 學測}
- [sci.t_adv.inquiry.slope-intercept] 作圖求斜率/截距的物理意義  {t_adv, 學測}
- [sci.t_sub.inquiry.modeling] 建模與數據擬合  {t_sub, 分科-物理}
- [sci.t_sub.inquiry.systematic-error] 系統誤差的辨識與修正  {t_sub, 分科-化學}
- [sci.t_sub.inquiry.uncertainty-propagation] 不確定度傳遞與結果可信度評估  {t_sub, 分科-物理}
- [sci.t_sub.inquiry.sci-writing] 科學寫作與同儕審查  {t_sub, 分科-化學}

---

## 每-strand 計數表

### 物理
| strand | 條數 |
|---|---|
| phys-meas 測量與單位 | 13 |
| phys-kin 運動學 | 14 |
| phys-force 力與牛頓運動定律 | 18 |
| phys-energy 功能量動量 | 22 |
| phys-circ 圓周與重力/天體 | 13 |
| phys-fluid 流體與壓力浮力 | 13 |
| phys-heat 熱學 | 20 |
| phys-wave 波動與聲 | 18 |
| phys-optics 光學 | 21 |
| phys-estatic 靜電與電路 | 25 |
| phys-em 電磁與感應 | 20 |
| phys-modern 近代物理 | 13 |
| **物理小計** | **210** |

### 化學
| strand | 條數 |
|---|---|
| chem-matter 物質分類與分離 | 16 |
| chem-atom 原子結構與週期性 | 18 |
| chem-bond 化學鍵與分子 | 16 |
| chem-stoich 化學計量 | 15 |
| chem-gas 氣體 | 12 |
| chem-soln 溶液與濃度 | 17 |
| chem-rate 反應速率 | 11 |
| chem-eq 化學平衡 | 10 |
| chem-acidbase 酸鹼 | 20 |
| chem-redox 氧化還原與電化學 | 16 |
| chem-thermo 熱化學 | 11 |
| chem-organic 有機化學 | 16 |
| chem-applied 應用/永續化學 | 11 |
| **化學小計** | **189** |

### 探究與實作
| strand | 條數 |
|---|---|
| inquiry 探究與實作 | 20 |
| **探究小計** | **20** |

### 分層（tier）橫向計數
| tier | 條數 |
|---|---|
| t_base 國小 | 28 |
| t_mid 國中/會考 | 133 |
| t_adv 高中/學測 | 157 |
| t_sub 分科 | 101 |
| **合計** | **419** |

### 全切片總計
| 區塊 | 條數 |
|---|---|
| 物理 | 210 |
| 化學 | 189 |
| 探究與實作 | 20 |
| **理化總計** | **419** |

---

## 待核清單（建置前對照教育部《十二年國教課綱自然領域》與大考中心考試說明）
> 全部 `(待核)` 標記條目見內文；以下三項最需人工覆核年段/分流歸屬，優先處理：

1. **白努利原理/流體連續方程式**（`sci.t_sub.phys-fluid.bernoulli`、`sci.t_sub.phys-fluid.continuity`）— 108 課綱物理選修對流體力學著墨不深，是否列入分科-物理考試範圍、以及是否下放至學測需核實。
2. **熱力學第二定律與熵、卡諾循環**（`sci.t_sub.phys-heat.entropy`、`sci.t_sub.phys-heat.carnot`）— 熵/卡諾循環在高中物理的深度與是否出現於分科測驗，各版本差異大，需對照考試說明確認收納深度。
3. **路易斯酸鹼定義**（`sci.t_sub.chem-acidbase.lewis`）— 路易斯酸鹼於 108 課綱化學究竟屬必修/選修或僅作延伸閱讀，年段歸屬不確定，需核實是否實際入題。
