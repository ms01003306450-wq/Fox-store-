// extra2.js: دليل المقاسات، كود خصم + شحن بالمحافظة، معرض صور بالسحب، حركات للرئيسية
// لازم يتحمّل بعد script.js الأساسي وبعد extra.js
(() => {
  const $ = (id) => document.getElementById(id);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ===== إعداداتك (عدّلها) ===== */
  const GUIDE = [ // المقاس، الصدر (سم)، الطول (سم)، الوزن (كجم) - أرقام تجريبية
    ["S", 50, 68, "55-65"],
    ["M", 53, 70, "65-75"],
    ["L", 56, 72, "75-85"],
    ["XL", 59, 74, "85-95"],
    ["2XL", 62, 76, "95-105"],
    ["3XL", 65, 78, "105-120"]
  ];
  const PROMOS = { FOX10: { type: "pct", v: 10 }, WELCOME50: { type: "fix", v: 50 } }; // أكواد تجريبية
  const FREE_FROM = 1500; // شحن مجاني لو الطلب (بعد الخصم) وصل المبلغ ده، اكتب 0 لإلغاء الميزة
  const ZONES = [ // أسعار الشحن تجريبية
    { price: 60, gov: ["القاهرة", "الجيزة", "القليوبية"] },
    { price: 70, gov: ["الإسكندرية", "الدقهلية", "الغربية", "الشرقية", "المنوفية", "كفر الشيخ", "البحيرة", "دمياط", "بورسعيد", "الإسماعيلية", "السويس"] },
    { price: 90, gov: ["الفيوم", "بني سويف", "المنيا", "أسيوط", "مطروح"] },
    { price: 110, gov: ["سوهاج", "قنا", "الأقصر", "أسوان", "الوادي الجديد", "البحر الأحمر", "شمال سيناء", "جنوب سيناء"] }
  ];
  const PAY = [ // طرق الدفع. غيّر الرقم والحساب لبياناتك (info فاضية = مفيش تحويل)
    { id: "cod", name: "كاش عند الاستلام", info: "" },
    { id: "vf", name: "فودافون كاش", info: "01000000000" },
    { id: "ip", name: "إنستا باي", info: "yourname@instapay" }
  ];
  const BAND = ["FOX", "لبس بيشبهك", "توصيل لكل المحافظات", "الدفع عند الاستلام"];
  /* ============================== */

  const RATES = {};
  ZONES.forEach((z) => z.gov.forEach((g) => (RATES[g] = z.price)));

  const st = document.createElement("style");
  st.textContent = `
@keyframes up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes logoIn{from{opacity:0;transform:scale(.88)}}
@keyframes mq{to{transform:translateX(-25%)}}
.hero h1{animation:up .7s .05s both}
.hero p{animation:up .7s .2s both}
.hero .btn{animation:up .7s .35s both}
.hero-logo{animation:logoIn .9s ease-out backwards}
.band{background:#fff;color:#000;overflow:hidden;direction:ltr;white-space:nowrap}
.band div{display:inline-flex;padding:10px 0;animation:mq 30s linear infinite}
.band:hover div{animation-play-state:paused}
.band span{font-family:Changa,Tajawal,sans-serif;font-weight:800;font-size:1.1rem;padding:0 20px}
.top{transition:transform .3s}
.top.hide{transform:translateY(-100%)}
@media(prefers-reduced-motion:reduce){.hero h1,.hero p,.hero .btn,.hero-logo,.band div{animation:none}}
.sg{background:none;border:0;padding:0;font:inherit;font-size:.85rem;color:#555;text-decoration:underline;cursor:pointer;align-self:flex-start;margin:0 12px 10px}
.qv-info .sg{margin:-6px 0 14px}
.m{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);padding:16px}
.m[hidden]{display:none}
.m-box{position:relative;background:#fff;color:#000;width:min(460px,100%);padding:22px 20px;max-height:100%;overflow:auto}
.m-box h3{margin:0 0 12px;font-size:1.3rem;font-family:Changa,Tajawal,sans-serif}
.m table{width:100%;border-collapse:collapse;text-align:center;color:#000;font:inherit}
.m th,.m td{padding:10px 6px;border-bottom:1px solid #ddd}
.m th{font-family:Changa,Tajawal,sans-serif}
.m small{display:block;margin-top:10px;color:#555}
.m .x{position:absolute;top:8px;left:8px;width:36px;height:36px;padding:0;border-radius:50%;background:#000;color:#fff}
.gal{display:flex;height:100%;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}
.gal::-webkit-scrollbar{display:none}
.gal img{flex:0 0 100%;width:100%;height:100%;object-fit:cover;scroll-snap-align:start}
.dots{position:absolute;bottom:44px;left:0;right:0;display:flex;justify-content:center;gap:6px;pointer-events:none}
.qv-img .dots{bottom:12px}
.dt{pointer-events:auto;width:9px;height:9px;padding:0;border:1px solid #fff;border-radius:50%;background:rgba(0,0,0,.5);cursor:pointer}
.dt.on{background:#fff}
.df{max-height:62vh;overflow:auto}
.ck{display:grid;gap:8px;margin-bottom:12px}
.ck input,.ck select{width:100%;border:1.5px solid #000;background:#fff;color:#000;padding:9px 12px;border-radius:4px;font:inherit}
.pr{display:flex;gap:8px}
.pr button{border:1.5px solid #000;background:#fff;color:#000;padding:0 16px;border-radius:4px;font-family:Changa,Tajawal,sans-serif;cursor:pointer}
.ck small{color:#555}
.ck small.gm{color:#c00}
#sum div{display:flex;justify-content:space-between}
.sizes{flex-wrap:wrap}
.sz,.qs{width:auto;min-width:38px;padding:0 8px}
.pay{display:grid;gap:6px}
.pay label{display:flex;align-items:center;gap:8px;border:1.5px solid #000;padding:9px 12px;border-radius:4px;cursor:pointer}
.pay label:has(input:checked){background:#000;color:#fff}
.pay input{width:auto;padding:0;border:0;accent-color:#000}
#payinfo{line-height:1.8}
#payinfo b{color:#000;user-select:all}
.cp{border:1.5px solid #000;background:#fff;color:#000;padding:2px 10px;border-radius:4px;font-family:Changa,Tajawal,sans-serif;cursor:pointer}`;
  document.head.appendChild(st);

  /* ===== شريط متحرك + اختفاء الهيدر ===== */
  const hero = document.querySelector(".hero");
  if (hero) {
    const band = document.createElement("div");
    band.className = "band";
    band.setAttribute("aria-hidden", "true");
    const one = BAND.map((t) => `<span>${t}</span><span>✦</span>`).join("");
    band.innerHTML = `<div>${one.repeat(4)}</div>`;
    hero.after(band);
  }
  const top = document.querySelector(".top");
  let ly = scrollY;
  addEventListener("scroll", () => {
    const y = scrollY;
    if (top) top.classList.toggle("hide", y > ly && y > 160 && !document.body.classList.contains("open"));
    ly = y;
  }, { passive: true });

  /* ===== دليل المقاسات ===== */
  const m = document.createElement("div");
  m.className = "m";
  m.hidden = true;
  m.setAttribute("role", "dialog");
  m.setAttribute("aria-modal", "true");
  m.innerHTML = `<div class="m-box"><button class="x" aria-label="إغلاق">✕</button><h3>دليل المقاسات</h3>
    <table><tr><th>المقاس</th><th>الصدر (سم)</th><th>الطول (سم)</th><th>الوزن (كجم)</th></tr>
    ${GUIDE.map((r) => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join("")}</table>
    <small>القياسات تقريبية، ولو بين مقاسين اختار الأكبر.</small></div>`;
  document.body.appendChild(m);
  const closeM = () => { m.hidden = true; };
  m.addEventListener("click", (e) => { if (e.target === m || e.target.closest(".x")) closeM(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeM(); });
  document.addEventListener("click", (e) => {
    if (e.target.closest(".sg")) { m.hidden = false; m.querySelector(".x").focus(); }
  });

  /* ===== معرض الصور (حط imgs: ["a.jpg","b.jpg"] في المنتج) ===== */
  function gallery(t, p) {
    t.classList.add("g-ok");
    const list = p.imgs || [];
    if (list.length < 2) return;
    t.classList.remove("ph");
    const old = t.querySelector("img");
    if (old) old.remove();
    const g = document.createElement("div");
    g.className = "gal";
    g.innerHTML = list.map((u) => `<img src="${u}" alt="${p.name}" loading="lazy">`).join("");
    const d = document.createElement("div");
    d.className = "dots";
    d.innerHTML = list.map((_, i) => `<button type="button" class="dt${i ? "" : " on"}" data-i="${i}" aria-label="صورة ${i + 1}"></button>`).join("");
    t.prepend(g);
    t.appendChild(d);
    g.addEventListener("scroll", () => {
      const i = Math.round(Math.abs(g.scrollLeft) / g.clientWidth);
      d.querySelectorAll(".dt").forEach((x, k) => x.classList.toggle("on", k === i));
    }, { passive: true });
    d.addEventListener("click", (e) => {
      const b = e.target.closest(".dt");
      if (b) g.children[+b.dataset.i].scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    });
  }

  function decorate(root) {
    root.querySelectorAll(".sizes:not(.sg-ok)").forEach((s) => {
      s.classList.add("sg-ok");
      s.insertAdjacentHTML("afterend", `<button type="button" class="sg">دليل المقاسات</button>`);
    });
    root.querySelectorAll(".card").forEach((c) => {
      const f = c.querySelector("[data-f]");
      const p = f && PRODUCTS.find((x) => x.id === +f.dataset.f);
      const t = c.querySelector(".thumb:not(.g-ok)");
      if (p && t) gallery(t, p);
    });
  }

  const _rg = window.renderGrid;
  window.renderGrid = () => { _rg(); decorate(document); };

  let lastQ = null;
  document.addEventListener("click", (e) => {
    const v = e.target.closest("[data-q]");
    if (v) lastQ = +v.dataset.q;
  }, true);
  const qv = document.querySelector(".qv");
  if (qv) {
    new MutationObserver(() => {
      decorate(qv);
      const t = qv.querySelector(".thumb:not(.g-ok)");
      const p = PRODUCTS.find((x) => x.id === lastQ);
      if (t && p) gallery(t, p);
    }).observe(qv, { childList: true, subtree: true });
  }

  /* ===== كود الخصم + الشحن في السلة ===== */
  let promo = null, code = "", gov = "", pay = PAY[0].id;
  const ck = document.createElement("div");
  ck.className = "ck";
  ck.innerHTML = `
    <div class="pr"><input id="promo" placeholder="كود الخصم" autocomplete="off"><button id="applyP" type="button">تطبيق</button></div>
    <small id="pmsg"></small>
    <input id="cname" placeholder="الاسم" autocomplete="name">
    <input id="cphone" type="tel" inputmode="tel" placeholder="رقم الموبايل" autocomplete="tel">
    <input id="caddr" placeholder="العنوان بالتفصيل" autocomplete="street-address">
    <select id="gov" aria-label="المحافظة"><option value="">اختار المحافظة</option>${Object.keys(RATES).map((g) => `<option>${g}</option>`).join("")}</select>
    <small id="gmsg"></small>
    <div class="pay"><b>طريقة الدفع</b>
      ${PAY.map((p, i) => `<label><input type="radio" name="pay" value="${p.id}"${i ? "" : " checked"}> ${p.name}</label>`).join("")}
      <small id="payinfo"></small>
    </div>
    <div id="sum"></div>`;
  document.querySelector(".df").prepend(ck);

  function calc() {
    const sub = cart.reduce((a, i) => a + i.q * i.price, 0);
    let disc = 0;
    if (promo) disc = promo.type === "pct" ? Math.round((sub * promo.v) / 100) : Math.min(promo.v, sub);
    const after = sub - disc;
    const free = FREE_FROM > 0 && after >= FREE_FROM;
    const ship = !sub || !gov || free ? 0 : RATES[gov];
    return { sub, disc, after, ship, free, total: after + ship };
  }

  function summary() {
    const s = calc();
    $("sum").hidden = !cart.length;
    $("sum").innerHTML =
      `<div><span>المجموع</span><span>${money(s.sub)}</span></div>` +
      (s.disc ? `<div><span>خصم ${code}</span><span>-${money(s.disc)}</span></div>` : "") +
      `<div><span>الشحن</span><span>${!gov ? "اختار المحافظة" : s.ship ? money(s.ship) : "مجاني"}</span></div>` +
      (gov && s.sub && !s.free && FREE_FROM > 0 ? `<small>زوّد ${money(FREE_FROM - s.after)} والشحن يبقى مجاني</small>` : "");
    $("total").textContent = money(s.total);
  }

  const _rc = window.renderCart;
  window.renderCart = () => { _rc(); summary(); };

  function applyPromo() {
    const c = $("promo").value.trim().toUpperCase();
    if (c && PROMOS[c]) { promo = PROMOS[c]; code = c; $("pmsg").textContent = "تم تطبيق الكود ✓"; }
    else { promo = null; code = ""; $("pmsg").textContent = c ? "الكود غير صحيح" : ""; }
    summary();
  }
  $("applyP").onclick = applyPromo;
  $("promo").addEventListener("keydown", (e) => { if (e.key === "Enter") applyPromo(); });
  $("gov").onchange = () => { gov = $("gov").value; $("gmsg").textContent = ""; summary(); };

  function payInfo() {
    const p = PAY.find((x) => x.id === pay);
    $("payinfo").innerHTML = p.info
      ? `حوّل الإجمالي على ${p.name}: <b>${p.info}</b> <button type="button" class="cp" id="copyPay">نسخ</button><br>وابعت صورة التحويل على واتساب بعد الطلب.`
      : "";
  }
  ck.addEventListener("change", (e) => {
    if (e.target.name === "pay") { pay = e.target.value; payInfo(); }
  });
  $("payinfo").addEventListener("click", async (e) => {
    if (!e.target.closest("#copyPay")) return;
    const b = e.target.closest("#copyPay");
    try { await navigator.clipboard.writeText(PAY.find((x) => x.id === pay).info); b.textContent = "تم ✓"; }
    catch (err) { b.textContent = "انسخه يدوي"; }
  });
  payInfo();

  $("order").onclick = () => {
    if (!cart.length) return;
    const cname = $("cname").value.trim(), cphone = $("cphone").value.trim(), caddr = $("caddr").value.trim();
    if (!cname || cphone.replace(/\D/g, "").length < 10 || !caddr) {
      $("gmsg").textContent = "اكتب الاسم ورقم الموبايل والعنوان";
      $("gmsg").className = "gm";
      return;
    }
    if (!gov) {
      $("gmsg").textContent = "اختار المحافظة الأول عشان نحسب الشحن";
      $("gmsg").className = "gm";
      $("gov").focus();
      return;
    }
    const s = calc();
    const lines = cart.map((i) => `- ${i.name} (${i.size}) × ${i.q} = ${money(i.q * i.price)}`);
    let text = `طلب جديد من موقع FOX:\n${lines.join("\n")}\nالمجموع: ${money(s.sub)}`;
    if (s.disc) text += `\nالخصم (${code}): -${money(s.disc)}`;
    const pmt = PAY.find((x) => x.id === pay);
    text += `\nالشحن (${gov}): ${s.ship ? money(s.ship) : "مجاني"}\nالإجمالي: ${money(s.total)}\nطريقة الدفع: ${pmt.name}`;
    if (pmt.info) text += `\n(هبعتلك صورة التحويل)`;
    text += `\nالاسم: ${cname}\nالموبايل: ${cphone}\nالعنوان: ${caddr}`;
    if (window.FOX_SAVE_ORDER) {
      window.FOX_SAVE_ORDER({
        name: cname, phone: cphone, address: caddr, governorate: gov, payment: pmt.name,
        items: cart.map((i) => ({ name: i.name, size: i.size, q: i.q, price: i.price })),
        subtotal: s.sub, discount: s.disc, code, shipping: s.ship, total: s.total
      });
    }
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank");
  };

  renderGrid();
  renderCart();
})();
