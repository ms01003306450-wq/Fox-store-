// backend.js: الربط مع Supabase (منتجات أونلاين + لوحة أدمن + تسجيل الطلبات)
// لازم يتحمّل بعد مكتبة supabase-js وبعد extra.js و extra2.js
(() => {
  /* ===== إعداداتك ===== */
    const SUPABASE_URL = "https://rfjidrkgttyxuphbpckl.supabase.co";
  const SUPABASE_KEY = "sb_publishable_LTXHXqojCi5pUonceaQoGQ_KBssJVGb";
  const STATUSES = ["جديد", "اتأكد", "اتشحن", "اتسلم", "ملغي"];
  /* ==================== */

  if (!window.supabase || SUPABASE_URL.includes("YOUR-")) return; // لسه مش متظبط: الموقع بيشتغل عادي
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const BUCKET = "products";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const st = document.createElement("style");
  st.textContent = `
.abar{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.abar[hidden]{display:none}
.abar button{flex:1 1 0;min-width:110px;border:1.5px solid #000;background:#fff;color:#000;padding:10px 12px;border-radius:4px;font-family:Changa,Tajawal,sans-serif;font-size:1rem;cursor:pointer}
.delp{position:absolute;top:8px;right:8px;width:36px;height:36px;border:0;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;cursor:pointer}
.desc{margin:8px 0 0;color:#444;white-space:pre-line}
#adminLink{color:#555;font-size:.85rem}
.bm{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);padding:16px}
.bm[hidden]{display:none}
.bm-box{position:relative;background:#fff;color:#000;width:min(520px,100%);max-height:100%;overflow:auto;padding:22px 18px;display:grid;gap:10px;align-content:start}
.bm-box h3{margin:0;font-size:1.3rem;font-family:Changa,Tajawal,sans-serif}
.bm-box input,.bm-box textarea{width:100%;border:1.5px solid #000;background:#fff;color:#000;padding:10px 12px;border-radius:4px;font:inherit}
.bm-box .pick{border:2px dashed #000;background:#fff;color:#000;padding:14px;border-radius:4px;font-family:Changa,Tajawal,sans-serif;font-size:1rem;cursor:pointer}
.bm-box .go{background:#000;color:#fff;border:0;padding:12px;border-radius:4px;font-family:Changa,Tajawal,sans-serif;font-size:1rem;cursor:pointer}
.bm-box .go:disabled{opacity:.6}
.bm-x{position:absolute;top:8px;left:8px;width:36px;height:36px;padding:0;border:0;border-radius:50%;background:#000;color:#fff;cursor:pointer}
.bm-box h3{padding-left:44px}
.bm-box small{color:#c00}
.bm-box small.hint{color:#555}
.prev{display:flex;gap:8px;flex-wrap:wrap}
.prev img{width:64px;height:80px;object-fit:cover}
.oc{border:1.5px solid #000;padding:12px;display:grid;gap:6px}
.oh{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
.oh span{color:#555;font-size:.9rem}
.oa{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.oa a{border:1.5px solid #000;padding:4px 12px;border-radius:4px;text-decoration:none;color:#000}
.oa select{border:1.5px solid #000;padding:4px 8px;border-radius:4px;background:#fff;color:#000;font:inherit}`;
  document.head.appendChild(st);

  // نافذة عامة
  const modal = (html) => {
    const m = document.createElement("div");
    m.className = "bm";
    m.hidden = true;
    m.setAttribute("role", "dialog");
    m.setAttribute("aria-modal", "true");
    m.innerHTML = html;
    document.body.appendChild(m);
    m.addEventListener("click", (e) => { if (e.target === m || e.target.closest(".bm-x")) m.hidden = true; });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") m.hidden = true; });
    return m;
  };

  /* ===== المنتجات (من قاعدة البيانات) ===== */
  async function load() {
    const { data, error } = await sb.from("products").select("*").order("created_at", { ascending: false });
    if (error) { console.error(error); return; }
    for (let i = PRODUCTS.length - 1; i >= 0; i--) if (PRODUCTS[i].db) PRODUCTS.splice(i, 1);
    data.forEach((r) => {
      const imgs = r.imgs || [];
      PRODUCTS.push({
        id: 100000 + r.id, dbid: r.id, db: true, name: esc(r.name), cat: esc(r.cat), price: +r.price,
        desc: r.descr || "", img: imgs[0] || "", imgs: imgs.length > 1 ? imgs : undefined, allimgs: imgs
      });
    });
    renderChips();
    renderGrid();
  }

  // معلومات المنتج في العرض السريع
  let lastQ = null;
  document.addEventListener("click", (e) => {
    const v = e.target.closest("[data-q]");
    if (v) lastQ = +v.dataset.q;
  }, true);
  const qv = document.querySelector(".qv");
  if (qv) {
    new MutationObserver(() => {
      const p = PRODUCTS.find((x) => x.id === lastQ);
      const price = qv.querySelector(".qv-info .price");
      if (!p || !p.desc || !price || qv.querySelector(".desc")) return;
      const d = document.createElement("p");
      d.className = "desc";
      d.textContent = p.desc;
      price.after(d);
    }).observe(qv, { childList: true, subtree: true });
  }

  /* ===== حفظ الطلبات ===== */
  window.FOX_SAVE_ORDER = (o) => {
    sb.from("orders").insert(o).then(({ error }) => { if (error) console.error("order not saved", error); });
  };

  /* ===== الأدمن ===== */
  let admin = false;

  const bar = document.createElement("div");
  bar.className = "abar";
  bar.hidden = true;
  bar.innerHTML = `<button type="button" id="bAdd">+ إضافة منتج</button><button type="button" id="bOrd">📦 الطلبات</button><button type="button" id="bOut">خروج</button>`;
  $("grid").before(bar);

  const link = document.createElement("a");
  link.id = "adminLink";
  link.href = "#admin";
  link.textContent = "دخول الأدمن";
  $("contact").append(link);
  const showLink = () => { link.hidden = admin || location.hash !== "#admin"; };
  addEventListener("hashchange", showLink);

  function setAdmin(v) {
    admin = v;
    bar.hidden = !v;
    showLink();
    renderGrid();
  }
  sb.auth.getSession().then(({ data }) => setAdmin(!!data.session));
  sb.auth.onAuthStateChange((_e, s) => setAdmin(!!s));

  // تسجيل الدخول
  const lm = modal(`<form class="bm-box" id="lf"><button type="button" class="bm-x" aria-label="إغلاق">✕</button><h3>دخول الأدمن</h3>
    <input id="lmail" type="email" placeholder="الإيميل" required autocomplete="username">
    <input id="lpass" type="password" placeholder="الباسورد" required autocomplete="current-password">
    <small id="lerr"></small><button class="go" type="submit">دخول</button></form>`);
  link.addEventListener("click", (e) => { e.preventDefault(); lm.hidden = false; $("lmail").focus(); });
  $("lf").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("lerr").textContent = "";
    const { error } = await sb.auth.signInWithPassword({ email: $("lmail").value.trim(), password: $("lpass").value });
    if (error) { $("lerr").textContent = "الإيميل أو الباسورد غلط"; return; }
    $("lpass").value = "";
    lm.hidden = true;
  });
  $("bOut").onclick = () => sb.auth.signOut();

  // إضافة منتج
  const am = modal(`<form class="bm-box" id="af"><button type="button" class="bm-x" aria-label="إغلاق">✕</button><h3>إضافة منتج</h3>
    <input id="afile" type="file" accept="image/*" multiple hidden>
    <input id="acam" type="file" accept="image/*" capture="environment" hidden>
    <button type="button" class="pick" id="apick">اختار صور من المعرض (من غير حد)</button>
    <button type="button" class="pick" id="ashot">📷 تصوير بالكاميرا</button>
    <div class="prev" id="aprev"></div>
    <small class="hint" id="ahint" hidden>دوس على أي صورة عشان تمسحها</small>
    <input id="aname" placeholder="اسم المنتج" required>
    <input id="acat" list="acats" placeholder="القسم (مثال: تيشيرتات)" required>
    <datalist id="acats"></datalist>
    <input id="aprice" type="number" min="1" inputmode="numeric" placeholder="السعر بالجنيه" required>
    <textarea id="adesc" rows="3" placeholder="معلومات المنتج (الخامة، الألوان، ملاحظات)"></textarea>
    <small id="aerr"></small><button class="go" type="submit" id="asave">حفظ ونشر</button></form>`);

  let pics = [];
  const shrink = (file) => new Promise((res, rej) => {
    const im = new Image(), u = URL.createObjectURL(file);
    im.onerror = rej;
    im.onload = () => {
      const k = Math.min(1, 1000 / Math.max(im.width, im.height));
      const c = document.createElement("canvas");
      c.width = Math.round(im.width * k);
      c.height = Math.round(im.height * k);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      c.toBlob((b) => (b ? res({ blob: b, url: URL.createObjectURL(b) }) : rej()), "image/jpeg", 0.82);
    };
    im.src = u;
  });
  const renderPrev = () => {
    $("aprev").innerHTML = pics.map((p, i) => `<img src="${p.url}" data-i="${i}" alt="">`).join("");
    $("ahint").hidden = !pics.length;
  };
  const addPics = async (files, input) => {
    $("aerr").textContent = "";
    for (const f of files) {
      try { pics.push(await shrink(f)); renderPrev(); }
      catch (err) { $("aerr").textContent = "في صورة مقدرتش أقرأها، جرّب غيرها."; }
    }
    input.value = "";
  };
  $("apick").onclick = () => $("afile").click();
  $("ashot").onclick = () => $("acam").click();
  $("afile").onchange = (e) => addPics(e.target.files, e.target);
  $("acam").onchange = (e) => addPics(e.target.files, e.target);
  $("aprev").addEventListener("click", (e) => {
    const i = e.target.dataset.i;
    if (i === undefined) return;
    pics.splice(+i, 1);
    renderPrev();
  });

  $("bAdd").onclick = () => {
    pics = [];
    $("af").reset();
    renderPrev();
    $("aerr").textContent = "";
    const cats = [...new Set(["تيشيرتات", "هوديز", "بناطيل", ...PRODUCTS.map((p) => p.cat)])];
    $("acats").innerHTML = cats.map((c) => `<option value="${c}">`).join("");
    am.hidden = false;
    $("aname").focus();
  };

  $("af").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("asave");
    btn.disabled = true;
    $("aerr").textContent = "";
    try {
      const urls = [];
      for (let i = 0; i < pics.length; i++) {
        btn.textContent = `جاري رفع الصورة ${i + 1} من ${pics.length}...`;
        const path = `${Date.now()}-${i}.jpg`;
        const up = await sb.storage.from(BUCKET).upload(path, pics[i].blob, { contentType: "image/jpeg" });
        if (up.error) throw up.error;
        urls.push(sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
      }
      btn.textContent = "جاري الحفظ...";
      const { error } = await sb.from("products").insert({
        name: $("aname").value.trim(), cat: $("acat").value.trim(), price: +$("aprice").value,
        descr: $("adesc").value.trim(), imgs: urls
      });
      if (error) throw error;
      am.hidden = true;
      await load();
    } catch (err) {
      $("aerr").textContent = "حصل خطأ: " + (err.message || err);
    }
    btn.disabled = false;
    btn.textContent = "حفظ ونشر";
  });

  // حذف منتج
  const _rg = window.renderGrid;
  window.renderGrid = () => {
    _rg();
    if (!admin) return;
    $("grid").querySelectorAll(".card").forEach((c) => {
      const f = c.querySelector("[data-f]");
      const p = f && PRODUCTS.find((x) => x.id === +f.dataset.f);
      const t = c.querySelector(".thumb");
      if (p && p.db && t && !t.querySelector(".delp")) {
        t.insertAdjacentHTML("beforeend", `<button type="button" class="delp" data-dbdel="${p.dbid}" aria-label="حذف">🗑</button>`);
      }
    });
  };
  $("grid").addEventListener("click", async (e) => {
    const d = e.target.closest("[data-dbdel]");
    if (!d || !confirm("تمسح المنتج ده نهائي؟")) return;
    const id = +d.dataset.dbdel, p = PRODUCTS.find((x) => x.dbid === id);
    const { error } = await sb.from("products").delete().eq("id", id);
    if (error) { alert("مقدرتش أمسحه: " + error.message); return; }
    const paths = ((p && p.allimgs) || []).map((u) => decodeURIComponent(u.split("/" + BUCKET + "/").pop()));
    if (paths.length) await sb.storage.from(BUCKET).remove(paths);
    await load();
  });

  // الطلبات
  const om = modal(`<div class="bm-box"><button type="button" class="bm-x" aria-label="إغلاق">✕</button><h3>الطلبات</h3><div id="olist" style="display:grid;gap:10px"></div></div>`);
  const waNum = (p) => {
    const d = String(p || "").replace(/\D/g, "");
    return d.startsWith("0") ? "20" + d.slice(1) : d;
  };
  const orderCard = (o) => {
    const items = (o.items || []).map((i) => `${esc(i.name)} (${esc(i.size)}) × ${esc(i.q)}`).join("<br>");
    return `<div class="oc">
      <div class="oh"><b>#${o.id} · ${esc(o.name)}</b><span>${esc(new Date(o.created_at).toLocaleString("ar-EG"))}</span></div>
      <div>${items}</div>
      <div>الإجمالي: <b>${money(+o.total)}</b> · ${esc(o.payment)} · ${esc(o.governorate)}</div>
      <div>${esc(o.address)}</div>
      <div class="oa"><a href="tel:${esc(o.phone)}">اتصل</a><a href="https://wa.me/${waNum(o.phone)}" target="_blank" rel="noopener">واتساب</a>
      <select data-oid="${o.id}">${STATUSES.map((s) => `<option${s === o.status ? " selected" : ""}>${s}</option>`).join("")}</select></div></div>`;
  };
  $("bOrd").onclick = async () => {
    om.hidden = false;
    $("olist").textContent = "جاري التحميل...";
    const { data, error } = await sb.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) { $("olist").textContent = "خطأ: " + error.message; return; }
    $("olist").innerHTML = data.length ? data.map(orderCard).join("") : "مفيش طلبات لسه.";
  };
  om.addEventListener("change", async (e) => {
    const id = e.target.dataset.oid;
    if (!id) return;
    const { error } = await sb.from("orders").update({ status: e.target.value }).eq("id", +id);
    if (error) alert("مقدرتش أغيّر الحالة: " + error.message);
  });

  showLink();
  load();
})();
