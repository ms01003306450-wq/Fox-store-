// extra.js: تفاعل للموقع (بحث، ترتيب، مفضلة، عرض سريع، إشعار، حركات)
(() => {
  const $ = (id) => document.getElementById(id);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const st = document.createElement("style");
  st.textContent = `
.tools{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}
.tools[hidden]{display:none}
.tools #q{flex:1 1 100%}
.tools input,.tools select{flex:1 1 160px;min-width:0;border:1.5px solid #000;background:#fff;color:#000;padding:8px 12px;border-radius:4px;font:inherit}
.thumb{position:relative}
.fav{position:absolute;top:8px;left:8px;width:36px;height:36px;border:0;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;font-size:1.15rem;line-height:1;cursor:pointer}
.fav.on{background:#fff;color:#000}
.qvb{position:absolute;bottom:0;left:0;right:0;border:0;background:rgba(255,255,255,.92);color:#000;padding:8px;font-family:Changa,Tajawal,sans-serif;font-size:.95rem;cursor:pointer}
.rv{opacity:0;transform:translateY(14px) scale(.98);transition:opacity .45s ease,transform .45s cubic-bezier(.2,.7,.2,1)}
.rv.in{opacity:1;transform:none}
.card.rv .thumb img{transform:scale(1.08);transition:transform .9s cubic-bezier(.2,.7,.2,1)}
.card.rv.in .thumb img{transform:none}
.qv{position:fixed;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);padding:16px}
.qv[hidden]{display:none}
.qv-box{position:relative;background:#fff;color:#000;width:min(720px,100%);max-height:100%;overflow:auto;display:grid;grid-template-columns:1fr}
.qv-img{aspect-ratio:4/5}
.qv-info{padding:20px}
.qv-info h3{font-size:1.3rem;margin:0}
.qv-info .price{margin:4px 0 0;font-size:1.2rem}
.qv-info .sizes{margin:14px 0}
.qv-info .add{margin:0;width:100%}
.qs{width:38px;height:38px;border:1.5px solid #000;background:#fff;color:#000;cursor:pointer;font-weight:700;border-radius:4px}
.qs.on{background:#000;color:#fff}
.qv-x{position:absolute;top:8px;left:8px;z-index:2;width:36px;height:36px;padding:0;border-radius:50%;background:#000;color:#fff}
.toast{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom,0px));transform:translate(-50%,20px);opacity:0;visibility:hidden;display:flex;align-items:center;gap:14px;padding:12px 18px;background:#000;color:#fff;border:1.5px solid #fff;border-radius:4px;z-index:50;transition:opacity .25s,transform .25s,visibility 0s .25s}
.toast.show{opacity:1;visibility:visible;transform:translate(-50%,0);transition:opacity .25s,transform .25s}
.toast button{background:#fff;color:#000;border:0;padding:6px 12px;border-radius:4px;font-family:Changa,Tajawal,sans-serif;cursor:pointer}
@media(min-width:640px){.qv-box{grid-template-columns:1fr 1fr}}
@keyframes qvFade{from{opacity:0}}
@keyframes qvUp{from{opacity:0;transform:translateY(28px) scale(.97)}}
@keyframes qvSheet{from{transform:translateY(100%)}}
@keyframes qvImg{from{opacity:0;transform:scale(1.08)}}
.qv:not([hidden]),.m:not([hidden]),.pm:not([hidden]){animation:qvFade .25s ease}
.qv-box,.m-box,.pm-box{animation:qvUp .38s cubic-bezier(.2,.8,.2,1)}
.qv-img img{animation:qvImg .65s cubic-bezier(.2,.8,.2,1)}
.qv-info>*{animation:qvFade .4s .12s ease both}
@media(max-width:639px){.qv{align-items:flex-end;padding:0}.qv-box{max-height:92vh;animation:qvSheet .4s cubic-bezier(.2,.8,.2,1)}}
@media(prefers-reduced-motion:reduce){.qv,.m,.pm,.qv-box,.m-box,.pm-box,.qv-img img,.qv-info>*{animation:none!important}}`;
  document.head.appendChild(st);

  let q = "", sort = "", favOnly = false, fav = [];
  try { fav = JSON.parse(localStorage.getItem("fox-fav")) || []; } catch (e) {}
  const saveFav = () => { try { localStorage.setItem("fox-fav", JSON.stringify(fav)); } catch (e) {} };

  // شريط البحث والترتيب
  const tools = document.createElement("div");
  tools.className = "tools";
  tools.innerHTML = `<input id="q" type="search" placeholder="ابحث عن منتج" aria-label="بحث"><select id="sort" aria-label="ترتيب"><option value="">الأحدث</option><option value="asc">السعر: الأقل أولًا</option><option value="desc">السعر: الأعلى أولًا</option></select><button id="favOnly" class="chip" aria-pressed="false">♥ المفضلة</button>`;
  $("grid").before(tools);

  // الحركات: ظهور تدريجي
  const io = null; // حركة ظهور المنتجات متوقفة (مفيش انيمشن)
  let first = true; // الحركة بتتعمل مرة واحدة، وبعد كده (بحث/فلتر) المنتجات بتظهر على طول
  function reveal() {
    if (!io) return;
    document.querySelectorAll(".card:not(.rv),.cols>div:not(.rv)").forEach((el, i) => {
      el.classList.add("rv");
      if (!first) { el.classList.add("in"); return; }
      el.style.transitionDelay = (i % 2) * 60 + "ms";
      io.observe(el);
    });
    if (document.querySelector(".card")) first = false;
  }

  // عرض المنتجات (بديل للدالة الأصلية)
  const card = (p) => `
    <article class="card">
      <div class="thumb${p.img ? "" : " ph"}">
        <img src="${p.img || LOGO}" alt="${p.name}">
        <button class="fav${fav.includes(p.id) ? " on" : ""}" data-f="${p.id}" aria-label="مفضلة">${fav.includes(p.id) ? "♥" : "♡"}</button>
        <button class="qvb" data-q="${p.id}">عرض سريع</button>
      </div>
      <h3>${p.name}</h3>
      <p class="price">${money(p.price)}</p>
      <div class="sizes" data-id="${p.id}">
        ${SIZES.map((s) => `<button class="sz${picked[p.id] === s ? " on" : ""}" data-s="${s}">${s}</button>`).join("")}
      </div>
      <button class="add" data-id="${p.id}">أضف للسلة</button>
    </article>`;

  window.renderGrid = () => {
    tools.hidden = !PRODUCTS.length;
    if (!PRODUCTS.length) {
      $("grid").innerHTML = `<p class="soon">المنتجات جاية قريب. تابعنا.</p>`;
      return;
    }
    let list = PRODUCTS.filter((p) =>
      (cat === "الكل" || p.cat === cat) &&
      p.name.toLowerCase().includes(q) &&
      (!favOnly || fav.includes(p.id)));
    if (sort) list = [...list].sort((a, b) => (sort === "asc" ? a.price - b.price : b.price - a.price));
    $("grid").innerHTML = list.length ? list.map(card).join("") : `<p class="soon">مفيش منتجات مطابقة.</p>`;
    reveal();
  };

  $("q").addEventListener("input", (e) => { q = e.target.value.trim().toLowerCase(); renderGrid(); });
  $("sort").addEventListener("change", (e) => { sort = e.target.value; renderGrid(); });
  $("favOnly").addEventListener("click", (e) => {
    favOnly = !favOnly;
    e.currentTarget.classList.toggle("on", favOnly);
    e.currentTarget.setAttribute("aria-pressed", favOnly);
    renderGrid();
  });

  // المفضلة + فتح العرض السريع
  $("grid").addEventListener("click", (e) => {
    const f = e.target.closest("[data-f]"), v = e.target.closest("[data-q]");
    if (f) {
      const id = +f.dataset.f;
      fav = fav.includes(id) ? fav.filter((x) => x !== id) : [...fav, id];
      saveFav();
      const on = fav.includes(id);
      f.classList.toggle("on", on);
      f.textContent = on ? "♥" : "♡";
      if (favOnly) renderGrid();
    } else if (v) openQV(+v.dataset.q);
  });

  // العرض السريع
  const qv = document.createElement("div");
  qv.className = "qv";
  qv.hidden = true;
  qv.setAttribute("role", "dialog");
  qv.setAttribute("aria-modal", "true");
  document.body.appendChild(qv);
  let cur = null;
  const closeQV = () => { qv.hidden = true; };
  function openQV(id) {
    cur = PRODUCTS.find((p) => p.id === id);
    if (!cur) return;
    qv.innerHTML = `
      <div class="qv-box">
        <button class="x qv-x" aria-label="إغلاق">✕</button>
        <div class="thumb${cur.img ? "" : " ph"} qv-img"><img src="${cur.img || LOGO}" alt="${cur.name}"></div>
        <div class="qv-info">
          <h3>${cur.name}</h3>
          <p class="price">${money(cur.price)}</p>
          <div class="sizes">${SIZES.map((s) => `<button class="qs${picked[cur.id] === s ? " on" : ""}" data-s="${s}">${s}</button>`).join("")}</div>
          <button class="add qv-add">أضف للسلة</button>
        </div>
      </div>`;
    qv.hidden = false;
    qv.querySelector(".qv-x").focus();
  }
  qv.addEventListener("click", (e) => {
    if (e.target === qv || e.target.closest(".qv-x")) return closeQV();
    const s = e.target.closest(".qs");
    if (s) {
      picked[cur.id] = s.dataset.s;
      qv.querySelectorAll(".qs").forEach((x) => x.classList.toggle("on", x === s));
      document.querySelectorAll(`.sizes[data-id="${cur.id}"] .sz`).forEach((x) => x.classList.toggle("on", x.dataset.s === s.dataset.s));
      return;
    }
    const b = e.target.closest(".qv-add");
    if (!b) return;
    const size = picked[cur.id];
    if (!size) {
      b.textContent = "اختار المقاس أولًا";
      setTimeout(() => (b.textContent = "أضف للسلة"), 1400);
      return;
    }
    const k = cur.id + "-" + size, hit = cart.find((i) => i.k === k);
    if (hit) hit.q++; else cart.push({ k, name: cur.name, size, price: cur.price, q: 1 });
    renderCart();
    closeQV();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeQV(); });

  // إشعار الإضافة للسلة (بيتفعّل لما عدد السلة يزيد)
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.innerHTML = `<span>اتضافت للسلة ✓</span><button type="button">افتح السلة</button>`;
  document.body.appendChild(toast);
  toast.querySelector("button").onclick = () => {
    toast.classList.remove("show");
    document.body.classList.add("open");
  };
  let tt, last = parseInt($("cartCount").textContent) || 0;
  new MutationObserver(() => {
    const n = parseInt($("cartCount").textContent) || 0;
    if (n > last && !document.body.classList.contains("open")) {
      toast.classList.add("show");
      clearTimeout(tt);
      tt = setTimeout(() => toast.classList.remove("show"), 2400);
    }
    last = n;
  }).observe($("cartCount"), { childList: true, characterData: true, subtree: true });

  // اللوجو بيميل مع حركة الإصبع أو الماوس
  const hero = document.querySelector(".hero"), logo = document.querySelector(".hero-logo");
  if (hero && logo && !reduce) {
    logo.style.transition = "transform .12s ease-out";
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      logo.style.transform = `perspective(700px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
    });
    hero.addEventListener("pointerleave", () => (logo.style.transform = ""));
  }

  renderGrid();
  reveal();
})();
function toggleSizes(open){
  document.getElementById('sizeModal').classList.toggle('open', open);
}