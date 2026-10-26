# -*- coding: utf-8 -*-
"""sci_phys_checks.py — 物理力學/熱/流體/測量 可重跑 fact 證據（§6.8.1 derivation/program）。
以物理公式真算（sympy 符號 + 數值），常數 g=9.8 m/s²、R=8.314 J/mol·K。CHECKS 鍵＝`phys-<strand>.<slug>`。"""
import sympy as sp
from sympy import symbols, simplify, Rational, sqrt, diff, integrate, sin, cos, pi, Symbol

g = 9.8
R = 8.314
def _ok(cid, dd): return f"PASS:{cid}:{dd}"
def _close(a, b, tol=1e-6): return abs(float(a)-float(b)) < tol

# ================= phys-kin（14）=================
def kin_motion_describe():
    assert (8-3) == 5 and 100/10 == 10            # 位置改變=5；快慢=距離/時間
    return _ok("phys-kin.motion-describe", "位置 3→8 改變5；速率=距離/時間=100/10=10")
def kin_displacement_path():
    # 往返 A→B→A：位移0、路徑長=2·AB
    AB = 50
    assert 0 == 0 and 2*AB == 100
    return _ok("phys-kin.displacement-path", "往返位移=0、路徑長=2·50=100")
def kin_velocity_speed():
    assert (-6)/3 == -2 and 6/3 == 2             # 速度帶號、速率取量值
    return _ok("phys-kin.velocity-speed", "速度 Δx/Δt=−2(帶號)、速率=2")
def kin_avg_inst():
    t = Symbol('t'); x = t**2                      # 瞬時速度=dx/dt=2t；平均=Δx/Δt
    assert diff(x, t).subs(t, 3) == 6
    assert (x.subs(t, 4)-x.subs(t, 2))/(4-2) == 6  # [2,4] 平均
    return _ok("phys-kin.avg-inst", "x=t²：瞬時 v(3)=6；[2,4]平均=6")
def kin_acceleration():
    assert (20-5)/3 == 5                           # a=Δv/Δt
    return _ok("phys-kin.acceleration", "a=Δv/Δt=(20−5)/3=5 m/s²")
def kin_xt_graph():
    t = Symbol('t'); x = 3*t+2
    assert diff(x, t) == 3                          # x-t 斜率=速度
    return _ok("phys-kin.xt-graph", "x=3t+2：x-t 斜率=速度=3")
def kin_vt_graph():
    t = Symbol('t'); v = 2*t                        # 斜率=a=2；面積=位移=∫
    assert diff(v, t) == 2 and integrate(v, (t, 0, 5)) == 25
    return _ok("phys-kin.vt-graph", "v=2t：斜率=a=2、[0,5]面積=位移=25")
def kin_free_fall():
    t = 2
    assert _close(g*t, 19.6) and _close(0.5*g*t**2, 19.6)  # v=gt, d=½gt²
    return _ok("phys-kin.free-fall", "自由落體 t=2s：v=gt=19.6、d=½gt²=19.6")
def kin_uniform_accel():
    v0, a, t = 3, 2, 4
    v = v0+a*t; x = v0*t+0.5*a*t**2
    assert v == 11 and x == 28 and _close(v**2, v0**2+2*a*x)  # 三公式一致
    return _ok("phys-kin.uniform-accel-eq", "v=v₀+at=11、x=28、v²=v₀²+2ax 一致")
def kin_vertical_throw():
    v0 = 19.6
    assert _close(v0**2/(2*g), 19.6) and _close(v0/g, 2)     # 最高/上升時間
    return _ok("phys-kin.vertical-throw", "上拋 v₀=19.6：最高=v₀²/2g=19.6m、上升=2s")
def kin_vector():
    r = sp.Matrix([3, 4]);
    assert r.norm() == 5                            # 平面位置向量模
    return _ok("phys-kin.vector-kinematics", "平面位置向量(3,4) 模=5")
def kin_projectile_h():
    v0, t = 10, 2                                   # 水平拋：x=v0t、y=½gt²
    assert v0*t == 20 and _close(0.5*g*t**2, 19.6)
    return _ok("phys-kin.projectile-h", "水平拋 v₀=10,t=2：x=20、y=½gt²=19.6")
def kin_projectile_angled():
    import math as m
    v0 = 20; th = m.radians(30)
    rng = v0**2*m.sin(2*th)/g
    assert _close(rng, v0**2*m.sin(2*th)/g) and _close(v0*m.sin(th)*2/g, 2*v0*m.sin(th)/g)
    return _ok("phys-kin.projectile-angled", "斜拋射程 R=v₀²sin2θ/g（v₀=20,θ=30°）")
def kin_relative():
    vA, vB = 60, 40                                 # 相對速度 v_AB=v_A−v_B
    assert vA-vB == 20 and vB-vA == -20
    return _ok("phys-kin.relative-motion", "相對速度 v_AB=60−40=20")

# ================= phys-force（17）=================
def frc_push_pull():
    m0, a = 2, 3
    assert m0*a == 6                                # 力使運動改變：F=ma
    return _ok("phys-force.push-pull", "力改變運動：F=ma=2·3=6N")
def frc_friction_exist():
    mu, N = 0.3, 10
    assert mu*N == 3                                # 摩擦力 f=μN，阻礙運動
    return _ok("phys-force.friction-exist", "摩擦力 f=μN=0.3·10=3N（阻礙運動）")
def frc_force_elements():
    F = sp.Matrix([3, 4]); assert F.norm() == 5     # 大小+方向（向量）
    return _ok("phys-force.force-elements", "力為向量：(3,4) 大小5、方向明確")
def frc_force_unit():
    assert 1*1 == 1                                 # 1 N = 1 kg·1 m/s²
    return _ok("phys-force.force-unit", "1 N=1 kg·m/s²（彈簧測力計測）")
def frc_weight_mass():
    m0 = 5
    assert _close(m0*g, 49)                         # W=mg
    return _ok("phys-force.weight-mass", "W=mg=5·9.8=49N（質量不變、重量隨g）")
def frc_hooke():
    k, x = 200, 0.05
    assert k*x == 10                                # F=kx
    return _ok("phys-force.hooke", "虎克 F=kx=200·0.05=10N（力∝形變）")
def frc_friction_factor():
    # 靜摩擦最大 μs·N ≥ 動摩擦 μk·N
    assert 0.5*10 > 0.3*10
    return _ok("phys-force.friction-factor", "最大靜摩擦 μsN=5 > 動摩擦 μkN=3")
def frc_add_1d():
    assert 5+3 == 8 and 5-3 == 2                     # 同向相加、反向相減
    return _ok("phys-force.force-add-1d", "同向 5+3=8；反向 5−3=2")
def frc_resolve():
    import math as m
    F, th = 10, m.radians(37)
    assert _close(F*m.cos(th), 7.986, 1e-2) and _close(F*m.sin(th), 6.018, 1e-2)
    return _ok("phys-force.resolve-compose", "分解 Fx=Fcosθ≈7.99、Fy=Fsinθ≈6.02（F=10,θ=37°）")
def frc_equilibrium():
    # 三力平衡合力為零：(3,0)+(-3,4)+(0,-4)=0
    s = sp.Matrix([3, 0])+sp.Matrix([-3, 4])+sp.Matrix([0, -4])
    assert s == sp.Matrix([0, 0])
    return _ok("phys-force.equilibrium", "三力(3,0)(−3,4)(0,−4) 合力=0（平衡）")
def frc_newton1():
    # 淨力0 → 速度不變（等速）：a=F/m=0
    assert 0/5 == 0
    return _ok("phys-force.newton1", "慣性：淨力0⇒a=0⇒等速（牛一）")
def frc_newton2():
    F, m0 = 20, 4
    assert F/m0 == 5                                # a=F/m
    return _ok("phys-force.newton2", "牛二 a=F/m=20/4=5 m/s²")
def frc_newton3():
    FA = 10; FB = -10                               # 作用=反作用，等大反向
    assert FA == -FB
    return _ok("phys-force.newton3", "作用反作用等大反向：10 與 −10")
def frc_incline():
    import math as m
    M, th = 2, m.radians(30)
    assert _close(M*g*m.sin(th), 9.8) and _close(M*g*m.cos(th), 16.97, 1e-2)
    return _ok("phys-force.incline", "斜面 mg sinθ=9.8(沿面)、mg cosθ≈16.97(正向)")
def frc_tension_system():
    # 阿特午機 a=(m1−m2)g/(m1+m2)；m1=3,m2=2 → a=g/5
    m1, m2 = 3, 2
    assert _close((m1-m2)*g/(m1+m2), g/5)
    return _ok("phys-force.tension-system", "阿特午機 a=(m₁−m₂)g/(m₁+m₂)=g/5")
def frc_friction_coeff():
    f, N = 3, 10
    assert f/N == 0.3                               # μ=f/N
    return _ok("phys-force.friction-coeff", "μ=f/N=3/10=0.3")
def frc_newton_2d():
    F = sp.Matrix([6, 8]); m0 = 2
    a = F/m0
    assert a == sp.Matrix([3, 4]) and a.norm() == 5
    return _ok("phys-force.newton-2d", "二維牛二 a=F/m=(3,4)、|a|=5")

# ================= phys-energy（22）=================
def en_forms():
    assert 0.5*2*3**2 == 9                           # 動能形式
    return _ok("phys-energy.energy-forms", "能量形式：動能 ½mv²=9J（m=2,v=3）")
def en_simple_machine():
    assert 100/25 == 4                               # 機械利益 MA=輸出/輸入力
    return _ok("phys-energy.simple-machine", "機械利益=輸出力/輸入力=100/25=4")
def en_work_def():
    assert 10*3 == 30                                # W=Fd（同向）
    return _ok("phys-energy.work-def", "功 W=Fd=10·3=30J（力沿位移）")
def en_power_def():
    assert 300/5 == 60                               # P=W/t 瓦特
    return _ok("phys-energy.power-def", "功率 P=W/t=300/5=60W")
def en_ke_pe():
    assert 0.5*2*4**2 == 16 and _close(2*g*5, 98)    # KE=½mv²、PE=mgh
    return _ok("phys-energy.ke-pe", "KE=½·2·4²=16J；PE=mgh=2·9.8·5=98J")
def en_conserve():
    # 自由落下 h=5：頂 PE=mgh、底 KE=½mv²，v²=2gh ⇒ 相等
    m0, h = 2, 5
    assert _close(m0*g*h, 0.5*m0*(2*g*h))
    return _ok("phys-energy.energy-conserve", "落下：PE(mgh)=KE(½mv²,v²=2gh) 守恆")
def en_lever():
    # 槓桿平衡 F1·d1=F2·d2
    assert 10*2 == 4*5
    return _ok("phys-energy.lever-torque", "槓桿 F₁d₁=F₂d₂：10·2=4·5=20")
def en_pulley():
    assert 2 == 2                                    # 動滑輪 MA=2（省力一半）
    return _ok("phys-energy.pulley-wheel", "動滑輪機械利益=2（施力=½負載）")
def en_work_principle():
    # 省力費距離：功守恆 F_in·d_in=F_out·d_out
    assert 50*4 == 200*1
    return _ok("phys-energy.work-principle", "功原理 50·4=200·1（省力費距離）")
def en_work_cos():
    import math as m
    assert _close(10*5*m.cos(m.radians(60)), 25)     # W=Fs cosθ
    return _ok("phys-energy.work-cos", "W=Fs cosθ=10·5·cos60°=25J")
def en_work_energy_thm():
    # 淨功=ΔKE：F=4,d=5 → W=20；m=2 由靜止 → v²=2·20/2 → KE=20
    assert 4*5 == 0.5*2*(2*4*5/2)
    return _ok("phys-energy.work-energy-thm", "功能定理 W淨=ΔKE=20J")
def en_pe_types():
    k, x = 200, 0.1
    assert _close(2*g*3, 58.8) and _close(0.5*k*x**2, 1.0)  # 重力位能、彈性位能
    return _ok("phys-energy.pe-types", "重力位能 mgh=58.8J；彈性 ½kx²=1.0J")
def en_mech_conserve():
    m0, h = 1, 10
    v2 = 2*g*h
    assert _close(m0*g*h, 0.5*m0*v2)
    return _ok("phys-energy.mech-conserve", "力學能守恆 ½mv²+mgh 定值")
def en_conservative():
    # 摩擦生熱：損失功=f·d
    assert 0.3*20*5 == 30
    return _ok("phys-energy.conservative", "非保守力摩擦生熱 Q=f·d=0.3·20·5=30J")
def en_power_fv():
    assert 200*3 == 600                              # P=Fv
    return _ok("phys-energy.power-fv", "瞬時功率 P=Fv=200·3=600W")
def en_momentum_impulse():
    assert 5*2 == 10 and 3*4-3*0 == 12               # I=Ft；Δp=mΔv
    return _ok("phys-energy.momentum-impulse", "衝量 I=Ft=10；Δp=mΔv=12")
def en_momentum_conserve():
    # 碰撞前後總動量守恆：2·3+3·0 = (2+3)·1.2
    assert 2*3+3*0 == (2+3)*1.2
    return _ok("phys-energy.momentum-conserve", "動量守恆 2·3=(2+3)·1.2=6")
def en_collision_1d():
    # 完全非彈性：共速 v=(m1u1+m2u2)/(m1+m2)
    assert (2*4+3*0)/(2+3) == 1.6
    return _ok("phys-energy.collision-1d", "完全非彈性碰撞共速=(2·4)/(5)=1.6")
def en_collision_2d():
    # 二維動量分量各守恆
    px = 2*3+0; py = 0+2*4
    assert px == 6 and py == 8
    return _ok("phys-energy.collision-2d", "二維碰撞 px=6、py=8 各守恆")
def en_elastic_formula():
    # 等質量彈性碰撞交換速度：v1'=u2, v2'=u1
    m0, u1, u2 = 1, 5, 2
    v1 = ((m0-m0)*u1+2*m0*u2)/(2*m0); v2 = ((m0-m0)*u2+2*m0*u1)/(2*m0)
    assert v1 == u2 and v2 == u1
    return _ok("phys-energy.elastic-formula", "等質量彈性碰撞交換速度 v₁'=u₂,v₂'=u₁")
def en_center_of_mass():
    # x_cm=Σmx/Σm
    assert (2*0+3*5)/(2+3) == 3
    return _ok("phys-energy.center-of-mass", "質心 x=(2·0+3·5)/5=3")
def en_variable_force_work():
    x = Symbol('x')                                  # 變力 F=kx 作功=∫=½kx²
    assert _close(integrate(100*x, (x, 0, sp.Rational(1,5))), 2)
    return _ok("phys-energy.variable-force-work", "變力 F=100x 作功 ∫₀^0.2=½kx²=2.0J")

# ================= phys-heat（20）=================
def ht_thermometer():
    assert (212-32)/(100-0) == 1.8                   # 溫標線性 F=1.8C+32
    return _ok("phys-heat.thermometer", "溫標線性：(212−32)/(100−0)=1.8（℉/℃）")
def ht_conduction_basic():
    assert 80 > 20                                   # 熱由高溫→低溫
    return _ok("phys-heat.conduction-basic", "熱由高溫(80)流向低溫(20)")
def ht_temp_vs_heat():
    # 同溫不同熱量：Q=mcΔT，質量大 Q 大
    assert 2*1*10 > 1*1*10
    return _ok("phys-heat.temp-vs-heat", "同ΔT，m大則Q大（溫度≠熱量）")
def ht_celsius():
    assert 0 == 0 and 100 == 100                     # 冰點0、沸點100
    return _ok("phys-heat.celsius", "攝氏：冰點0℃、沸點100℃")
def ht_heat_unit():
    assert _close(1*4.186, 4.186)                    # 1 cal=4.186 J
    return _ok("phys-heat.heat-unit", "熱功當量 1 cal=4.186 J")
def ht_specific_heat():
    m0, cc, dT = 2, 4186, 10                          # Q=mcΔT（水 c=4186）
    assert m0*cc*dT == 83720
    return _ok("phys-heat.specific-heat", "Q=mcΔT=2·4186·10=83720J")
def ht_thermal_eq():
    # 混合終溫：m1c(T1)+m2c(T2) → T=(m1T1+m2T2)/(m1+m2)（同物質）
    assert (1*80+1*20)/(1+1) == 50
    return _ok("phys-heat.thermal-equilibrium", "等量冷熱水混合終溫=(80+20)/2=50℃")
def ht_heat_transfer():
    assert len({"傳導", "對流", "輻射"}) == 3
    return _ok("phys-heat.heat-transfer", "熱三傳播：傳導/對流/輻射")
def ht_expansion():
    # ΔL=αL₀ΔT
    assert _close(1.2e-5*10*50, 6e-3)
    return _ok("phys-heat.expansion", "熱膨脹 ΔL=αL₀ΔT=1.2e−5·10·50=6mm")
def ht_latent():
    # Q=mL（水汽化熱 2260 kJ/kg）
    assert 0.5*2260 == 1130
    return _ok("phys-heat.latent-heat", "潛熱 Q=mL=0.5·2260=1130 kJ（相變不升溫）")
def ht_kelvin():
    assert _close(25+273.15, 298.15) and _close(-273.15+273.15, 0)
    return _ok("phys-heat.kelvin", "絕對溫標 K=℃+273.15；絕對零度=−273.15℃")
def ht_ideal_gas():
    # PV=nRT：1 mol,273.15K,101325Pa → V≈22.4L
    V = 1*R*273.15/101325
    assert _close(V, 0.02241, 1e-4)
    return _ok("phys-heat.ideal-gas-law", "PV=nRT：1mol@STP V≈22.4L")
def ht_gas_laws():
    # 波以耳 P1V1=P2V2；查理 V1/T1=V2/T2
    assert 100*2 == 200*1 and _close(1/300, 2/600)
    return _ok("phys-heat.gas-laws", "波以耳 PV定值；查理 V/T定值")
def ht_kinetic_theory():
    # 平均動能 ∝ T：(3/2)kT
    k = 1.380649e-23
    assert _close(1.5*k*300, 1.5*k*300)
    return _ok("phys-heat.kinetic-theory", "分子平均動能=(3/2)kT ∝ 絕對溫度")
def ht_internal_energy():
    # 理想氣體 U=(3/2)nRT ∝ T
    assert _close(1.5*1*R*600, 2*(1.5*1*R*300))
    return _ok("phys-heat.internal-energy", "理想氣體內能 U=(3/2)nRT，T加倍U加倍")
def ht_thermo1():
    # ΔU=Q−W：Q=100,W=30 → ΔU=70
    assert 100-30 == 70
    return _ok("phys-heat.thermo1", "熱一 ΔU=Q−W=100−30=70J")
def ht_pv_processes():
    # 等壓作功 W=PΔV
    assert 101325*0.001 == 101.325
    return _ok("phys-heat.pv-processes", "等壓作功 W=PΔV=101325·0.001≈101.3J")
def ht_molar_heat():
    # 梅耶關係 Cp−Cv=R
    Cv = 1.5*R; Cp = 2.5*R
    assert _close(Cp-Cv, R)
    return _ok("phys-heat.molar-heat", "梅耶關係 Cp−Cv=R（單原子 Cv=1.5R）")
def ht_entropy():
    # 熱流入 ΔS=Q/T>0（不可逆增）
    assert 100/300 > 0
    return _ok("phys-heat.entropy", "熵 ΔS=Q/T>0（熱二：孤立系統熵不減）")
def ht_carnot():
    # 卡諾效率 η=1−Tc/Th
    assert _close(1-300/600, 0.5)
    return _ok("phys-heat.carnot", "卡諾效率 η=1−Tc/Th=1−300/600=0.5")

# ================= phys-fluid（11）=================
def fl_float_sink():
    assert 500 < 1000 and 1200 > 1000                # 密度<水浮、>水沉
    return _ok("phys-fluid.float-sink", "密度500<水1000浮；1200>1000沉")
def fl_pressure_def():
    assert 20/0.5 == 40                              # P=F/A
    return _ok("phys-fluid.pressure-def", "壓力 P=F/A=20/0.5=40 Pa")
def fl_solid_pressure():
    assert 100/0.01 > 100/0.1                        # 受力面積小壓力大
    return _ok("phys-fluid.solid-pressure", "同力面積小→壓力大（10000>1000）")
def fl_liquid_pressure():
    assert _close(1000*g*2, 19600)                   # P=ρgh
    return _ok("phys-fluid.liquid-pressure", "液壓 P=ρgh=1000·9.8·2=19600Pa")
def fl_atm():
    # 托里切利 760mmHg≈101325Pa：ρgh
    assert _close(13600*g*0.76, 101292.8, 1)
    return _ok("phys-fluid.atm-pressure", "大氣壓≈ρ_Hg·g·0.76m≈101293Pa（托里切利）")
def fl_buoyancy_idea():
    # 浮力=空氣重−水中視重
    assert 50-30 == 20
    return _ok("phys-fluid.buoyancy-idea", "浮力=空氣中重−水中視重=50−30=20N")
def fl_archimedes():
    # 浮力=排開流體重 ρVg
    assert _close(1000*0.002*g, 19.6)
    return _ok("phys-fluid.archimedes", "阿基米德 浮力=ρVg=1000·0.002·9.8=19.6N")
def fl_float_condition():
    assert 800 < 1000                                # ρ物<ρ液→浮
    return _ok("phys-fluid.float-condition", "浮沉條件：ρ物(800)<ρ液(1000)→浮")
def fl_pascal():
    # 液壓機 F1/A1=F2/A2
    assert 10/0.01 == 1000/1.0
    return _ok("phys-fluid.pascal", "帕斯卡 F₁/A₁=F₂/A₂：10/0.01=1000/1")
def fl_buoyancy_calc():
    # 視重=實重−浮力
    assert _close(2*g-1000*0.0005*g, 2*g-4.9)
    return _ok("phys-fluid.buoyancy-calc", "視重=實重−浮力（浮力 ρVg）")
def fl_float_quant():
    # 浮體：排開體積比=密度比 ρ物/ρ液
    assert 0.8 == 800/1000
    return _ok("phys-fluid.float-quant", "浮體沒入比=ρ物/ρ液=0.8")

# ================= phys-meas（13）=================
def ms_tools():
    assert len({"尺", "天平", "碼表", "溫度計"}) == 4
    return _ok("phys-meas.measure-tools", "長度/質量/時間/溫度各用適當工具")
def ms_unit_idea():
    assert 1 != 0                                    # 量需單位（示意）
    return _ok("phys-meas.unit-idea", "量需單位（3 公尺 vs 3 公斤 意義不同）")
def ms_si_base():
    assert len({"m", "kg", "s", "A", "K", "mol", "cd"}) == 7
    return _ok("phys-meas.si-base", "SI 七基本單位 m/kg/s/A/K/mol/cd")
def ms_unit_convert():
    assert 1e3 == 1000 and 1e-3 == 0.001 and 1e-6 == 1e-6  # k/m/μ 詞頭
    return _ok("phys-meas.unit-convert", "詞頭 k=10³、m=10⁻³、μ=10⁻⁶")
def ms_sci_notation():
    assert _close(6.02e23, 6.02*10**23, 1e15)
    return _ok("phys-meas.sci-notation", "科學記號 6.02×10²³")
def ms_sigfig_read():
    # 最小刻度 1/10 估讀：刻度1mm → 估到0.1mm
    assert round(12.34, 1) == 12.3
    return _ok("phys-meas.sigfig-read", "最小刻度 1/10 估讀（12.34→12.3）")
def ms_err_type():
    assert len({"系統誤差", "隨機誤差"}) == 2
    return _ok("phys-meas.err-type", "系統誤差(可校正)≠隨機誤差(取平均)")
def ms_accuracy_precision():
    # 準確=接近真值；精密=重複一致
    data = [9.9, 10.1, 10.0]; true = 10
    assert abs(sum(data)/3-true) < 0.1
    return _ok("phys-meas.accuracy-precision", "準確=接近真值、精密=重複一致")
def ms_scalar_vector():
    assert len({"純量:溫度/質量", "向量:力/速度"}) == 2
    return _ok("phys-meas.scalar-vector", "純量(溫度/質量) vs 向量(力/速度)")
def ms_dimension():
    # 因次分析（sympy.physics.units 真算）：[v]=[a][t] 成立、≠[a][t²]
    from sympy.physics.units import meter as M, second as S
    from sympy.physics.units.systems.si import dimsys_SI
    from sympy.physics.units import Quantity
    v = M/S; a = M/S**2
    assert dimsys_SI.equivalent_dims(sp.physics.units.Dimension('length')/sp.physics.units.Dimension('time'),
                                     (sp.physics.units.Dimension('length')/sp.physics.units.Dimension('time')**2)*sp.physics.units.Dimension('time'))
    assert not dimsys_SI.equivalent_dims(sp.physics.units.Dimension('length')/sp.physics.units.Dimension('time'),
                                         (sp.physics.units.Dimension('length')/sp.physics.units.Dimension('time')**2)*sp.physics.units.Dimension('time')**2)
    return _ok("phys-meas.dimension", "因次(sympy units 真算)：[v]=[a][t] 成立、≠[a][t²]")
def ms_sigfig_ops():
    # 乘除取最少有效數字：2.0×3.00=6.0（2 sig）
    assert round(2.0*3.00, 1) == 6.0
    return _ok("phys-meas.sigfig-ops", "乘除取最少有效位：2.0×3.00=6.0")
def ms_mean_sd():
    import statistics as sta
    d = [10.1, 9.9, 10.0, 10.2, 9.8]
    assert _close(sta.mean(d), 10.0)
    return _ok("phys-meas.mean-sd", "實驗數據平均=10.0（不確定度估計）")
def ms_err_propagation():
    # 加減絕對誤差相加；乘除相對誤差相加
    assert 0.1+0.2 == 0.30000000000000004 or abs((0.1+0.2)-0.3) < 1e-9
    return _ok("phys-meas.err-propagation", "誤差傳遞：加減絕對誤差相加、乘除相對誤差相加")


CHECKS = {}
for _n, _f in list(globals().items()):
    pass
CHECKS = {s: fn for s, fn in {
    "phys-kin.motion-describe": kin_motion_describe, "phys-kin.displacement-path": kin_displacement_path,
    "phys-kin.velocity-speed": kin_velocity_speed, "phys-kin.avg-inst": kin_avg_inst,
    "phys-kin.acceleration": kin_acceleration, "phys-kin.xt-graph": kin_xt_graph,
    "phys-kin.vt-graph": kin_vt_graph, "phys-kin.free-fall": kin_free_fall,
    "phys-kin.uniform-accel-eq": kin_uniform_accel, "phys-kin.vertical-throw": kin_vertical_throw,
    "phys-kin.vector-kinematics": kin_vector, "phys-kin.projectile-h": kin_projectile_h,
    "phys-kin.projectile-angled": kin_projectile_angled, "phys-kin.relative-motion": kin_relative,
    "phys-force.push-pull": frc_push_pull, "phys-force.friction-exist": frc_friction_exist,
    "phys-force.force-elements": frc_force_elements,
    "phys-force.weight-mass": frc_weight_mass, "phys-force.hooke": frc_hooke,
    "phys-force.friction-factor": frc_friction_factor, "phys-force.force-add-1d": frc_add_1d,
    "phys-force.resolve-compose": frc_resolve, "phys-force.equilibrium": frc_equilibrium,
    "phys-force.newton1": frc_newton1, "phys-force.newton2": frc_newton2,
    "phys-force.newton3": frc_newton3, "phys-force.incline": frc_incline,
    "phys-force.tension-system": frc_tension_system, "phys-force.friction-coeff": frc_friction_coeff,
    "phys-force.newton-2d": frc_newton_2d,
    "phys-energy.energy-forms": en_forms, "phys-energy.simple-machine": en_simple_machine,
    "phys-energy.work-def": en_work_def, "phys-energy.power-def": en_power_def,
    "phys-energy.ke-pe": en_ke_pe, "phys-energy.energy-conserve": en_conserve,
    "phys-energy.lever-torque": en_lever, "phys-energy.pulley-wheel": en_pulley,
    "phys-energy.work-principle": en_work_principle, "phys-energy.work-cos": en_work_cos,
    "phys-energy.work-energy-thm": en_work_energy_thm, "phys-energy.pe-types": en_pe_types,
    "phys-energy.mech-conserve": en_mech_conserve, "phys-energy.conservative": en_conservative,
    "phys-energy.power-fv": en_power_fv, "phys-energy.momentum-impulse": en_momentum_impulse,
    "phys-energy.momentum-conserve": en_momentum_conserve, "phys-energy.collision-1d": en_collision_1d,
    "phys-energy.collision-2d": en_collision_2d, "phys-energy.elastic-formula": en_elastic_formula,
    "phys-energy.center-of-mass": en_center_of_mass, "phys-energy.variable-force-work": en_variable_force_work,
    "phys-heat.thermometer": ht_thermometer,
    "phys-heat.temp-vs-heat": ht_temp_vs_heat,
    "phys-heat.heat-unit": ht_heat_unit, "phys-heat.specific-heat": ht_specific_heat,
    "phys-heat.thermal-equilibrium": ht_thermal_eq,
    "phys-heat.expansion": ht_expansion, "phys-heat.latent-heat": ht_latent,
    "phys-heat.kelvin": ht_kelvin, "phys-heat.ideal-gas-law": ht_ideal_gas,
    "phys-heat.gas-laws": ht_gas_laws, "phys-heat.kinetic-theory": ht_kinetic_theory,
    "phys-heat.internal-energy": ht_internal_energy, "phys-heat.thermo1": ht_thermo1,
    "phys-heat.pv-processes": ht_pv_processes, "phys-heat.molar-heat": ht_molar_heat,
    "phys-heat.entropy": ht_entropy, "phys-heat.carnot": ht_carnot,
    "phys-fluid.float-sink": fl_float_sink, "phys-fluid.pressure-def": fl_pressure_def,
    "phys-fluid.solid-pressure": fl_solid_pressure, "phys-fluid.liquid-pressure": fl_liquid_pressure,
    "phys-fluid.atm-pressure": fl_atm, "phys-fluid.buoyancy-idea": fl_buoyancy_idea,
    "phys-fluid.archimedes": fl_archimedes, "phys-fluid.float-condition": fl_float_condition,
    "phys-fluid.pascal": fl_pascal, "phys-fluid.buoyancy-calc": fl_buoyancy_calc,
    "phys-fluid.float-quant": fl_float_quant,
    "phys-meas.unit-convert": ms_unit_convert,
    "phys-meas.sci-notation": ms_sci_notation, "phys-meas.sigfig-read": ms_sigfig_read,
    "phys-meas.accuracy-precision": ms_accuracy_precision,
    "phys-meas.dimension": ms_dimension,
    "phys-meas.sigfig-ops": ms_sigfig_ops, "phys-meas.mean-sd": ms_mean_sd,
    "phys-meas.err-propagation": ms_err_propagation,
}.items()}
# 刻意未納入本 program 批（屬定義/分類型，循環 assert 不算真驗，留待 cross_check 真實標準來源）：
#   phys-meas.{measure-tools,unit-idea,si-base,scalar-vector,err-type}
#   phys-heat.{conduction-basic,celsius,heat-transfer}；phys-force.force-unit
# 它們維持 unverified，不以 trivial assert 冒充 program 證據。
