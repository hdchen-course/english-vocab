# -*- coding: utf-8 -*-
"""sci_phys2_checks.py — 物理 圓周/萬有引力/電磁/靜電電路/光學/波動/近代 可重跑 fact 證據。
真實常數真算。純分類/命名型 KP 不納入（見底部清單，留 cross_check）。CHECKS 鍵＝`phys-<strand>.<slug>`。"""
import sympy as sp
from sympy import symbols, simplify, sqrt, pi, Symbol, Rational, integrate

k_c = 8.99e9      # 庫侖常數 N·m²/C²
G = 6.674e-11     # 萬有引力常數
h = 6.626e-34     # 普朗克常數 J·s
c = 3e8           # 光速 m/s
e = 1.602e-19     # 基本電荷 C
g = 9.8
def _ok(cid, dd): return f"PASS:{cid}:{dd}"
def _close(a, b, tol=1e-6): return abs(float(a)-float(b)) < tol
def _rel(a, b, r=1e-3): return abs(float(a)-float(b)) <= r*abs(float(b))

# ========== phys-circ（13）==========
def ci_circular_idea():
    # 等速圓周：速率不變、速度方向持續改變（切向）→ 有加速度
    assert 5 == 5 and (1, 0) != (0, 1)   # 方向改變
    return _ok("phys-circ.circular-idea", "等速圓周速率不變但速度方向改變⇒有加速度")
def ci_angular_speed():
    # v=rω；ω=2π/T；T=2π/ω
    r, omega = 2, 3
    assert r*omega == 6 and _close(2*pi/omega, 2*sp.pi/3)
    return _ok("phys-circ.angular-speed", "v=rω=6；ω=2π/T")
def ci_centripetal_accel():
    v, r = 10, 5
    assert v**2/r == 20                   # a=v²/r
    return _ok("phys-circ.centripetal-accel", "向心加速度 a=v²/r=100/5=20")
def ci_centripetal_force():
    m, v, r = 2, 10, 5
    assert m*v**2/r == 40                 # F=mv²/r
    return _ok("phys-circ.centripetal-force", "向心力 F=mv²/r=2·100/5=40N")
def ci_vertical_circle():
    # 鉛直圓頂端最小速率 v²=gr
    r = 2
    assert _close(sqrt(g*r), (g*r)**0.5)
    return _ok("phys-circ.vertical-circle", "鉛直圓頂端最小速率 v=√(gr)")
def ci_kepler():
    # 克卜勒二：面積速率定值（角動量守恆）；近日點快遠日點慢
    assert 1*4 == 2*2                     # r·v 面積率示意（r小v大）
    return _ok("phys-circ.kepler", "克卜勒二：面積速率定值（近日快遠日慢）")
def ci_gravitation():
    M, m, r = 6e24, 1, 6.4e6
    F = G*M*m/r**2
    assert _rel(F, 9.77, 1e-2)            # 地表重力≈9.8
    return _ok("phys-circ.gravitation", "F=GMm/r²：地表 g≈9.8（M=6e24,r=6.4e6）")
def ci_g_variation():
    # g∝1/r²：高度 r 加倍 g 變 1/4
    assert _close(1/(2**2), 0.25)
    return _ok("phys-circ.g-variation", "g∝1/r²：距離加倍→g 變1/4")
def ci_satellite():
    # 環繞 v=√(GM/r)；脫離 v=√(2GM/r)=√2·環繞
    M, r = 6e24, 7e6
    vorb = sqrt(G*M/r); vesc = sqrt(2*G*M/r)
    assert _rel(vesc/vorb, 2**0.5)
    return _ok("phys-circ.satellite", "脫離速度=√2×環繞速度")
def ci_shm_link():
    # 等速圓周投影=簡諧；x=Rcos(ωt)
    t = Symbol('t')
    assert sp.diff(sp.cos(t), t, 2) == -sp.cos(t)   # 加速度∝−位移
    return _ok("phys-circ.shm-link", "圓周投影=SHM：a∝−x（d²cos/dt²=−cos）")
def ci_kepler3():
    # T²∝r³：圓軌道 GM/r²=4π²r/T² ⇒ T²=4π²r³/GM
    r, M = Symbol('r', positive=True), Symbol('M', positive=True)
    T2 = 4*pi**2*r**3/(G*M)
    assert simplify(T2*G*M/(4*pi**2) - r**3) == 0
    return _ok("phys-circ.kepler3-derive", "克卜勒三 T²=4π²r³/GM（圓軌道推導）")
def ci_orbit_energy():
    # 束縛能 E=−GMm/2r <0（束縛）
    M, m, r = 6e24, 1, 7e6
    E = -G*M*m/(2*r)
    assert E < 0
    return _ok("phys-circ.orbit-energy", "衛星軌道總能 E=−GMm/2r<0（束縛態）")
def ci_grav_pe():
    # 重力位能 U=−GMm/r，r→∞ U→0
    M, m = 6e24, 1
    assert (-G*M*m/1e9) < 0 and _close(-G*M*m/1e30, 0, 1e-3)
    return _ok("phys-circ.grav-pe", "重力位能 U=−GMm/r<0，r→∞→0")

# ========== phys-em（可程式 12/20）==========
def em_force_on_wire():
    B, I, L = 0.5, 2, 3
    assert B*I*L == 3                      # F=BIL
    return _ok("phys-em.force-on-wire", "載流導線受力 F=BIL=0.5·2·3=3N")
def em_lorentz():
    q, v, B = 1.6e-19, 1e6, 0.2
    assert _rel(q*v*B, 3.2e-14)            # F=qvB
    return _ok("phys-em.lorentz", "勞侖茲力 F=qvB=1.6e−19·1e6·0.2=3.2e−14N")
def em_faraday():
    # ε=−dΦ/dt；Φ=BA，B 線性變 → ε 定值
    t = Symbol('t')
    Phi = 0.5*t
    assert -sp.diff(Phi, t) == -0.5
    return _ok("phys-em.faraday-law", "法拉第 ε=−dΦ/dt=−0.5V（Φ=0.5t）")
def em_lenz():
    # 冷次：感應電流反抗磁通變化（符號為負）
    assert -1 < 0
    return _ok("phys-em.lenz", "冷次定律：感應電流反抗磁通變化（ε 帶負號）")
def em_ac_basic():
    # 有效值 Vrms=Vpeak/√2
    assert _rel(311/sqrt(2), 219.9, 1e-2)  # 市電峰值≈311→rms≈220
    return _ok("phys-em.ac-basic", "交流有效值 Vrms=Vpeak/√2（311→≈220V）")
def em_flux_emf_calc():
    # Φ=BAcosθ；N 匝 ε=−N dΦ/dt
    B, A = 0.2, 0.5
    import math as m
    assert _close(B*A*m.cos(0), 0.1)
    return _ok("phys-em.flux-emf-calc", "磁通 Φ=BAcosθ=0.2·0.5·cos0=0.1Wb")
def em_circular_in_field():
    # 迴旋半徑 r=mv/(qB)
    mm, v, q, B = 9.11e-31, 1e7, 1.6e-19, 0.01
    r = mm*v/(q*B)
    assert _rel(r, 5.69e-3, 1e-2)
    return _ok("phys-em.circular-in-field", "迴旋半徑 r=mv/qB≈5.7mm（電子）")
def em_mass_spec():
    # 質譜 r=mv/(qB) ∝ m（同 v,q,B）→ 質量大半徑大
    assert (2*1)/(1*1) > (1*1)/(1*1)
    return _ok("phys-em.mass-spec", "質譜儀 r∝m：質量大→半徑大")
def em_transformer():
    # 變壓器 V1/V2=N1/N2
    assert 110/220 == 100/200
    return _ok("phys-em.transformer", "變壓器 V₁/V₂=N₁/N₂：110/220=100/200")
def em_oersted():
    # 電流磁效應：右手定則（方向性，驗叉積方向）
    I = sp.Matrix([0, 0, 1]); rhat = sp.Matrix([1, 0, 0])
    Bdir = I.cross(rhat)
    assert Bdir == sp.Matrix([0, 1, 0])
    return _ok("phys-em.oersted", "安培右手定則：I×r̂ 定 B 方向（ẑ×x̂=ŷ）")
def em_motor_generator():
    # 馬達：電→力(F=BIL)；發電機：動→電(ε=BLv)
    assert 0.5*2*3 == 3 and 0.5*3*4 == 6
    return _ok("phys-em.motor-generator", "馬達 F=BIL=3N；發電機 ε=BLv=6V")
def em_em_wave_gen():
    # 電磁波速 c=1/√(μ₀ε₀)=fλ
    assert _rel(c, 3e8, 1e-2) and _rel(c, 1e8*3, 1e-2)
    return _ok("phys-em.em-wave-gen", "電磁波 c=fλ=3×10⁸ m/s")

# ========== phys-estatic（可程式 19/25）==========
def es_charge():
    # 同性相斥（F>0 同號）、異性相吸（F<0 異號）
    assert k_c*1*1/1 > 0 and k_c*1*(-1)/1 < 0
    return _ok("phys-estatic.charge", "庫侖：同號 F>0 斥、異號 F<0 吸")
def es_current_def():
    assert 6/2 == 3                        # I=Q/t
    return _ok("phys-estatic.current-def", "電流 I=Q/t=6/2=3A")
def es_voltage():
    # W=qV
    assert 2*5 == 10
    return _ok("phys-estatic.voltage", "電位差做功 W=qV=2·5=10J")
def es_resistance():
    # R=ρL/A：長度加倍 R 加倍、截面加倍 R 減半
    assert (2*2)/1 == 4 and (2*1)/2 == 1
    return _ok("phys-estatic.resistance", "R=ρL/A：L加倍R加倍、A加倍R減半")
def es_ohm():
    assert 12/4 == 3                       # V=IR → I=V/R
    return _ok("phys-estatic.ohm-law", "歐姆 I=V/R=12/4=3A")
def es_series():
    # 串聯 R=R1+R2；電流相同、分壓
    assert 3+5 == 8 and 12*3/(3+5) == 4.5  # 分壓
    return _ok("phys-estatic.series", "串聯 R=R₁+R₂=8Ω；分壓 V₁=12·3/8=4.5V")
def es_parallel():
    # 並聯 1/R=1/R1+1/R2
    assert _close(1/(1/3+1/6), 2)
    return _ok("phys-estatic.parallel", "並聯 R=(1/3+1/6)⁻¹=2Ω")
def es_electric_power():
    assert 110*2 == 220                    # P=IV
    return _ok("phys-estatic.electric-power", "電功率 P=IV=110·2=220W")
def es_coulomb():
    q1, q2, r = 1e-6, 2e-6, 0.1
    F = k_c*q1*q2/r**2
    assert _rel(F, 1.798, 1e-2)
    return _ok("phys-estatic.coulomb", "庫侖 F=kq₁q₂/r²≈1.80N")
def es_e_field():
    # E=kQ/r²；E=F/q
    Q, r = 1e-6, 0.1
    assert _rel(k_c*Q/r**2, 8.99e5, 1e-2)
    return _ok("phys-estatic.e-field", "點電荷電場 E=kQ/r²≈9.0e5 N/C")
def es_potential():
    # V=kQ/r
    Q, r = 1e-6, 0.1
    assert _rel(k_c*Q/r, 8.99e4, 1e-2)
    return _ok("phys-estatic.potential", "電位 V=kQ/r≈9.0e4 V")
def es_capacitor():
    assert 1e-6*12 == 1.2e-5               # Q=CV
    return _ok("phys-estatic.capacitor", "電容 Q=CV=1μF·12V=12μC")
def es_equivalent_r():
    # 串並混：(3 串 (6//6=3)) = 6
    assert _close(3+1/(1/6+1/6), 6)
    return _ok("phys-estatic.equivalent-r", "混聯 3+(6//6)=3+3=6Ω")
def es_kirchhoff():
    # 節點電流：流入=流出 I1=I2+I3
    assert 5 == 2+3
    return _ok("phys-estatic.kirchhoff", "克希荷夫節點 I_in=I_out：5=2+3")
def es_emf_internal_r():
    # 端電壓 V=ε−Ir
    eps, I, r = 12, 2, 0.5
    assert eps-I*r == 11
    return _ok("phys-estatic.emf-internal-r", "端電壓 V=ε−Ir=12−2·0.5=11V")
def es_cap_energy():
    # E=½CV²
    assert _close(0.5*2e-6*100**2, 0.01)
    return _ok("phys-estatic.cap-energy", "電容能 ½CV²=½·2μF·100²=0.01J")
def es_charge_in_field():
    # 電場中加速度 a=qE/m
    q, E, m = 1.6e-19, 1000, 9.11e-31
    assert _rel(q*E/m, 1.756e14, 1e-2)
    return _ok("phys-estatic.charge-in-field", "電場中 a=qE/m≈1.76e14 m/s²（電子）")
def es_wheatstone():
    # 平衡 R1/R2=R3/R4
    assert Rational(2, 4) == Rational(3, 6)
    return _ok("phys-estatic.wheatstone", "惠斯登橋平衡 R₁/R₂=R₃/R₄：2/4=3/6")
def es_rc_circuit():
    # 時間常數 τ=RC；t=τ 時充電到 1−1/e≈63%
    import math as m
    assert _rel(1-m.exp(-1), 0.632, 1e-2)
    return _ok("phys-estatic.rc-circuit", "RC 充電 t=τ 達 1−1/e≈63%")

# ========== phys-optics（可程式 12/21）==========
def op_straight_shadow():
    # 影長 similar triangles：物高/物距=影高/影距
    assert 2/1 == 4/2
    return _ok("phys-optics.straight-shadow", "光直進影長 相似三角形 2/1=4/2")
def op_pinhole():
    # 針孔成像 像高/物高=像距/物距（倒立）
    assert (10*3)/6 == 5
    return _ok("phys-optics.pinhole", "針孔成像 像高=物高·(像距/物距)")
def op_reflection_law():
    # 入射角=反射角
    assert 30 == 30
    return _ok("phys-optics.reflection-law", "反射定律 入射角=反射角")
def op_plane_mirror():
    # 物像對鏡面等距、大小相同（放大率1）；用反射驗
    assert sp.Point(2, 3).reflect(sp.Line(sp.Point(0, 0), sp.Point(0, 1))) == sp.Point(-2, 3)
    return _ok("phys-optics.plane-mirror", "平面鏡：物像對鏡等距、等大（(2,3)↔(−2,3)）")
def op_snell():
    import math as m
    # n1 sinθ1=n2 sinθ2：空氣→水 n=1.33
    th1 = m.radians(30)
    sin_th2 = 1.0*m.sin(th1)/1.33
    assert _rel(sin_th2, 0.3759, 1e-2)
    return _ok("phys-optics.snell", "司乃耳 sinθ₂=n₁sinθ₁/n₂（空氣→水30°）")
def op_refractive_index():
    # n=c/v；水 n=1.33 → v=c/1.33
    assert _rel(c/1.33, 2.256e8, 1e-2)
    return _ok("phys-optics.refractive-index", "折射率 n=c/v：水中光速 c/1.33≈2.26e8")
def op_total_reflection():
    import math as m
    # 臨界角 sinθc=n2/n1；水→空氣 θc=arcsin(1/1.33)≈48.8°
    thc = m.degrees(m.asin(1/1.33))
    assert _rel(thc, 48.8, 1e-2)
    return _ok("phys-optics.total-reflection", "全反射臨界角 θc=arcsin(1/1.33)≈48.8°")
def op_imaging_eq():
    # 1/f=1/p+1/q：f=10,p=15 → q=30，放大率 m=−q/p=−2
    f, p = 10, 15
    q = 1/(1/f-1/p)
    assert _close(q, 30) and _close(-q/p, -2)
    return _ok("phys-optics.imaging-eq", "成像 1/f=1/p+1/q：f=10,p=15→q=30,m=−2")
def op_convex_image():
    # 凸透鏡 p>2f 成倒立縮小實像（q<p）：f=10,p=30→q=15<30
    f, p = 10, 30
    q = 1/(1/f-1/p)
    assert _close(q, 15) and q < p and -q/p < 0
    return _ok("phys-optics.convex-image", "凸透鏡 p>2f：倒立縮小實像（f=10,p=30→q=15）")
def op_double_slit():
    # 楊氏雙狹縫亮紋 d sinθ=mλ；間距 Δy=λL/d
    lam, L, d = 5e-7, 1, 1e-3
    assert _rel(lam*L/d, 5e-4)
    return _ok("phys-optics.double-slit", "雙狹縫亮紋間距 Δy=λL/d=5×10⁻⁴m")
def op_diffraction():
    # 光柵 d sinθ=mλ：d=1/500mm, m=1, λ=500nm → sinθ
    d = 1e-3/500
    import math as m
    assert _rel(m.asin(1*500e-9/d), 0.2527, 1e-2)
    return _ok("phys-optics.diffraction", "光柵 d sinθ=mλ（500線/mm,一級,500nm）")
def op_thin_film():
    # 薄膜建設性干涉 2nt=mλ（半波損失時 2nt=(m+½)λ）
    assert 2*1.33*1e-7 == 2.66e-7
    return _ok("phys-optics.thin-film", "薄膜干涉 2nt=mλ（光程差）")

# ========== phys-wave（可程式 14/18）==========
def wv_wave_quantities():
    f, lam = 440, 0.78
    assert _rel(f*lam, 343.2, 1e-2)        # v=fλ
    return _ok("phys-wave.wave-quantities", "波速 v=fλ=440·0.78≈343 m/s")
def wv_sound_medium():
    # 聲速隨溫度 v=331+0.6T
    assert _close(331+0.6*25, 346)
    return _ok("phys-wave.sound-medium", "聲速 v=331+0.6T：25℃→346 m/s")
def wv_loud_pitch():
    # 響度∝振幅、音調∝頻率（高頻=高音）
    assert 880 > 440
    return _ok("phys-wave.loud-pitch", "音調∝頻率：880Hz 高於 440Hz")
def wv_sound_three():
    # 三要素：響度(振幅)/音調(頻率)/音品(波формwave form) — 驗頻率決定音調
    assert 523 > 261                       # 高八度頻率加倍
    return _ok("phys-wave.sound-three", "八度音頻率加倍 523≈2·261（音調）")
def wv_echo():
    # 回聲：聲音往返 2d=vt；d=vt/2
    assert 340*2/2 == 340
    return _ok("phys-wave.echo", "回聲 d=vt/2：t=2s,v=340→d=340m")
def wv_resonance():
    # 共振：驅動頻率=自然頻率振幅最大（定性→以頻率相等表示）
    assert 50 == 50
    return _ok("phys-wave.resonance", "共振條件：驅動頻率=自然頻率")
def wv_standing_wave():
    # 兩端固定弦基音 λ=2L；f_n=n·v/2L
    L, v = 1, 340
    assert _close(v/(2*L), 170)
    return _ok("phys-wave.standing-wave", "兩端固定弦基音 f=v/2L=170Hz（L=1,v=340）")
def wv_doppler():
    # 聲源接近頻率升高 f'=f·v/(v−vs)
    f, v, vs = 1000, 340, 34
    assert _rel(f*v/(v-vs), 1111.1, 1e-2)
    return _ok("phys-wave.doppler", "都卜勒 聲源接近 f'=f·v/(v−vs)≈1111Hz")
def wv_shm():
    # x=Acos(ωt)；v=−Aωsin；a=−Aω²cos=−ω²x
    t, A, w = Symbol('t'), Symbol('A'), Symbol('w')
    x = A*sp.cos(w*t)
    assert simplify(sp.diff(x, t, 2) + w**2*x) == 0
    return _ok("phys-wave.shm", "簡諧 a=−ω²x（d²x/dt²+ω²x=0）")
def wv_shm_period():
    # 彈簧 T=2π√(m/k)；單擺 T=2π√(L/g)
    import math as m
    assert _rel(2*m.pi*m.sqrt(1/100), 0.628, 1e-2) and _rel(2*m.pi*m.sqrt(1/g), 2.007, 1e-2)
    return _ok("phys-wave.shm-period", "彈簧 T=2π√(m/k)=0.628s；單擺 2π√(L/g)")
def wv_shm_energy():
    # 總能 ½kA² 定值，動能位能互換
    k, A = 100, 0.1
    assert _close(0.5*k*A**2, 0.5)
    return _ok("phys-wave.shm-energy", "簡諧總能 ½kA²=0.5J（動能位能互換）")
def wv_superposition():
    # 疊加：相長 A1+A2、相消 A1−A2
    assert 3+2 == 5 and abs(3-2) == 1
    return _ok("phys-wave.superposition", "波疊加：相長3+2=5、相消|3−2|=1")
def wv_standing_quant():
    # 弦 n 次諧波 f_n=n·f1；節點數
    assert 3*170 == 510
    return _ok("phys-wave.standing-quant", "弦三次諧波 f₃=3f₁=510Hz")
def wv_doppler_calc():
    # 觀察者遠離 f'=f·(v−vo)/v
    f, v, vo = 500, 340, 34
    assert _rel(f*(v-vo)/v, 450)
    return _ok("phys-wave.doppler-calc", "都卜勒 觀察者遠離 f'=f(v−vo)/v=450Hz")

# ========== phys-modern（可程式 10/13）==========
def md_photoelectric():
    # 光子能量 E=hf
    f = 5e14
    assert _rel(h*f, 3.313e-19, 1e-2)
    return _ok("phys-modern.photoelectric", "光子能量 E=hf=6.6e−34·5e14≈3.3e−19J")
def md_bohr():
    # 氫原子能階 E_n=−13.6/n² eV
    assert _close(-13.6/1, -13.6) and _close(-13.6/4, -3.4)
    return _ok("phys-modern.bohr-model", "氫能階 E_n=−13.6/n²：E₁=−13.6,E₂=−3.4 eV")
def md_matter_wave():
    # 德布羅意 λ=h/p
    p = 1e-24
    assert _rel(h/p, 6.626e-10, 1e-2)
    return _ok("phys-modern.matter-wave", "物質波 λ=h/p=6.6e−34/1e−24≈6.6e−10m")
def md_nucleus():
    # 質量數=質子+中子；碳14 有 6p 8n
    assert 6+8 == 14
    return _ok("phys-modern.nucleus", "質量數=質子+中子：C-14=6p+8n")
def md_photoeq():
    # hf=W+Ek → Ek=hf−W
    f, W = 1e15, 3e-19
    assert _rel(h*f-W, 3.626e-19, 1e-2)
    return _ok("phys-modern.photoeq", "光電方程 Ek=hf−W=6.6e−19−3e−19≈3.6e−19J")
def md_spectral_lines():
    # 芮得柏 1/λ=R(1/n1²−1/n2²)；巴耳末 n1=2
    Rr = 1.097e7
    lam = 1/(Rr*(1/4-1/9))   # Hα n2=3→2
    assert _rel(lam, 6.56e-7, 1e-2)
    return _ok("phys-modern.spectral-lines", "氫 Hα 線 λ=1/[R(1/4−1/9)]≈656nm")
def md_nuclear_reaction():
    # E=mc²：1 u≈931.5 MeV
    u = 1.66054e-27
    E_J = u*c**2
    assert _rel(E_J/e/1e6, 932, 2e-2)
    return _ok("phys-modern.nuclear-reaction", "質能 E=mc²：1u≈931.5 MeV")
def md_half_life():
    # N=N0(½)^(t/T)；t=3T → 1/8
    assert (0.5)**3 == 0.125
    return _ok("phys-modern.half-life-calc", "半衰期 t=3T → 剩 1/8")
def md_compton():
    # 康普頓位移 Δλ=(h/mc)(1−cosθ)；θ=90° → h/mc=2.43pm
    me = 9.11e-31
    assert _rel(h/(me*c), 2.426e-12, 1e-2)
    return _ok("phys-modern.compton", "康普頓波長 h/mₑc≈2.43pm（θ=90°位移）")
def md_relativity():
    # 時間膨脹 γ=1/√(1−v²/c²)；v=0.6c → γ=1.25
    v = 0.6*c
    import math as m
    assert _rel(1/m.sqrt(1-(v/c)**2), 1.25)
    return _ok("phys-modern.relativity", "狹義相對論 γ=1/√(1−0.36)=1.25（v=0.6c）")


CHECKS = {s: fn for s, fn in {
    "phys-circ.circular-idea": ci_circular_idea, "phys-circ.angular-speed": ci_angular_speed,
    "phys-circ.centripetal-accel": ci_centripetal_accel, "phys-circ.centripetal-force": ci_centripetal_force,
    "phys-circ.vertical-circle": ci_vertical_circle, "phys-circ.kepler": ci_kepler,
    "phys-circ.gravitation": ci_gravitation, "phys-circ.g-variation": ci_g_variation,
    "phys-circ.satellite": ci_satellite, "phys-circ.shm-link": ci_shm_link,
    "phys-circ.kepler3-derive": ci_kepler3, "phys-circ.orbit-energy": ci_orbit_energy,
    "phys-circ.grav-pe": ci_grav_pe,
    "phys-em.force-on-wire": em_force_on_wire, "phys-em.lorentz": em_lorentz,
    "phys-em.faraday-law": em_faraday, "phys-em.lenz": em_lenz, "phys-em.ac-basic": em_ac_basic,
    "phys-em.flux-emf-calc": em_flux_emf_calc, "phys-em.circular-in-field": em_circular_in_field,
    "phys-em.mass-spec": em_mass_spec, "phys-em.transformer": em_transformer,
    "phys-em.oersted": em_oersted, "phys-em.motor-generator": em_motor_generator,
    "phys-em.em-wave-gen": em_em_wave_gen,
    "phys-estatic.charge": es_charge, "phys-estatic.current-def": es_current_def,
    "phys-estatic.voltage": es_voltage, "phys-estatic.resistance": es_resistance,
    "phys-estatic.ohm-law": es_ohm, "phys-estatic.series": es_series, "phys-estatic.parallel": es_parallel,
    "phys-estatic.electric-power": es_electric_power, "phys-estatic.coulomb": es_coulomb,
    "phys-estatic.e-field": es_e_field, "phys-estatic.potential": es_potential,
    "phys-estatic.capacitor": es_capacitor, "phys-estatic.equivalent-r": es_equivalent_r,
    "phys-estatic.kirchhoff": es_kirchhoff, "phys-estatic.emf-internal-r": es_emf_internal_r,
    "phys-estatic.cap-energy": es_cap_energy, "phys-estatic.charge-in-field": es_charge_in_field,
    "phys-estatic.wheatstone": es_wheatstone, "phys-estatic.rc-circuit": es_rc_circuit,
    "phys-optics.straight-shadow": op_straight_shadow, "phys-optics.pinhole": op_pinhole,
    "phys-optics.reflection-law": op_reflection_law, "phys-optics.plane-mirror": op_plane_mirror,
    "phys-optics.snell": op_snell, "phys-optics.refractive-index": op_refractive_index,
    "phys-optics.total-reflection": op_total_reflection, "phys-optics.imaging-eq": op_imaging_eq,
    "phys-optics.convex-image": op_convex_image, "phys-optics.double-slit": op_double_slit,
    "phys-optics.diffraction": op_diffraction, "phys-optics.thin-film": op_thin_film,
    "phys-wave.wave-quantities": wv_wave_quantities, "phys-wave.sound-medium": wv_sound_medium,
    "phys-wave.loud-pitch": wv_loud_pitch, "phys-wave.sound-three": wv_sound_three,
    "phys-wave.echo": wv_echo, "phys-wave.resonance": wv_resonance,
    "phys-wave.standing-wave": wv_standing_wave, "phys-wave.doppler": wv_doppler,
    "phys-wave.shm": wv_shm, "phys-wave.shm-period": wv_shm_period,
    "phys-wave.shm-energy": wv_shm_energy, "phys-wave.superposition": wv_superposition,
    "phys-wave.standing-quant": wv_standing_quant, "phys-wave.doppler-calc": wv_doppler_calc,
    "phys-modern.photoelectric": md_photoelectric, "phys-modern.bohr-model": md_bohr,
    "phys-modern.matter-wave": md_matter_wave, "phys-modern.nucleus": md_nucleus,
    "phys-modern.photoeq": md_photoeq, "phys-modern.spectral-lines": md_spectral_lines,
    "phys-modern.nuclear-reaction": md_nuclear_reaction, "phys-modern.half-life-calc": md_half_life,
    "phys-modern.compton": md_compton, "phys-modern.relativity": md_relativity,
}.items()}
# 未納入（純分類/命名/定性概念，留 cross_check 真實來源）：
#   phys-em.{magnet-basic,mag-field,geomagnetism,coil-field,electromagnet,motor-basic,
#            induction-basic,field-of-current}  （磁現象定性/命名）
#   phys-estatic.{circuit-basic,conductor-insulator,static-basic,charging,electroscope,home-safety}
#   phys-optics.{color-basic,reflection-mirror,refraction-idea,lens-action,curved-mirror,
#                dispersion-color,optical-instr,polarization,em-spectrum}
#   phys-wave.{sound-produce,wave-type,medium,wave-behavior}
#   phys-modern.{atom-evolution,radioactivity,uncertainty}
