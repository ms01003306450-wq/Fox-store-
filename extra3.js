// extra3.js: زرار "إضافة صورة ومعلومات المنتج" مكان المنتجات (لازم يتحمّل بعد extra.js و extra2.js)
(() => {
  const OWNER = location.hostname === "localhost" || location.hash === "#owner";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const st = document.createElement("style");
  st.textContent = `
.ownerbar{grid-column:1/-1;display:flex;gap:8px}
.addp{flex:1 1 0;display:flex;align-items:center;justify-content:center;gap:8px;min-height:0;padding:10px 12px;border:1.5px solid #000;border-radius:4px;background:#fff;color:#000;cursor:pointer;font-family:Changa,Tajawal,sans-serif;font-size:1rem}
.addp span{font-size:1.2rem;line-height:1}
.delp{position:absolute;top:8px;right:8px;width:36px;height:36px;border:0;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;cursor:pointer}
.desc{margin:8px 0 0;color:#444;white-space:pre-line}
.pm{position:fixed;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);padding:16px}
.pm[hidden]{display:none}
.pm-box{position:relative;background:#fff;color:#000;width:min(460px,100%);max-height:100%;overflow:auto;padding:22px 18px;display:grid;gap:10px}
.pm-box h3{margin:0;font-size:1.3rem;font-family:Changa,Tajawal,sans-serif}
.pm-box input,.pm-box textarea{width:100%;border:1.5px solid #000;background:#fff;color:#000;padding:10px 12px;border-radius:4px;font:inherit}
.pm-box .pick{border:2px dashed #000;background:#fff;color:#000;padding:14px;border-radius:4px;font-family:Changa,Tajawal,sans-serif;font-size:1rem;cursor:pointer}
.pm-box .x{position:absolute;top:8px;left:8px;width:36px;height:36px;padding:0;border-radius:50%;background:#000;color:#fff}
.pm-box .add{margin:0;width:100%}
.prev{display:flex;gap:8px;flex-wrap:wrap}
.prev img{width:64px;height:80px;object-fit:cover}
.pm-box small{color:#c00}
.pm-box small.hint{color:#555}`;
  document.head.appendChild(st);

  // المنتجات المنشورة (products.js) ثم اللي محفوظة على الجهاز ده
  const pub = window.FOX_PRODUCTS || [];
  pub.forEach((p) => { p.fox = true; PRODUCTS.push(p); });
  try {
    (JSON.parse(localStorage.getItem("fox-products")) || []).forEach((p) => {
      if (!pub.some((x) => x.id === p.id)) PRODUCTS.push(p);
    });
  } catch (e) {}
  const saveLocal = () => {
    try { localStorage.setItem("fox-products", JSON.stringify(PRODUCTS.filter((p) => p.local))); return true; }
    catch (e) { return false; }
  };

  // تصغير الصورة قبل الحفظ
  const shrink = (file) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onerror = rej;
    r.onload = () => {
      const im = new Image();
      im.onerror = rej;
      im.onload = () => {
        const k = Math.min(1, 800 / Math.max(im.width, im.height));
        const c = document.createElement("canvas");
        c.width = Math.round(im.width * k);
        c.height = Math.round(im.height * k);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", 0.78));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  });

  // نافذة الإضافة
  const pm = document.createElement("div");
  pm.className = "pm";
  pm.hidden = true;
  pm.setAttribute("role", "dialog");
  pm.setAttribute("aria-modal", "true");
  pm.innerHTML = `
    <form class="pm-box" id="pf">
      <button type="button" class="x" id="pmx" aria-label="إغلاق">✕</button>
      <h3>إضافة منتج</h3>
      <input id="pfile" type="file" accept="image/*" multiple hidden>
      <input id="pcam" type="file" accept="image/*" capture="environment" hidden>
      <button type="button" class="pick" id="ppick">اختار صور من المعرض (من غير حد)</button>
      <button type="button" class="pick" id="pshot">📷 تصوير بالكاميرا</button>
      <div class="prev" id="pprev"></div>
      <small class="hint" id="phint" hidden>دوس على أي صورة عشان تمسحها</small>
      <input id="pname" placeholder="اسم المنتج" required>
      <input id="pcat" list="pcats" placeholder="القسم (مثال: تيشيرتات)" required>
      <datalist id="pcats"></datalist>
      <input id="pprice" type="number" min="1" inputmode="numeric" placeholder="السعر بالجنيه" required>
      <textarea id="pdesc" rows="3" placeholder="معلومات المنتج (الخامة، الألوان، ملاحظات)"></textarea>
      <small id="perr"></small>
      <button class="add" type="submit">حفظ المنتج</button>
    </form>`;
  document.body.appendChild(pm);

  let imgs = [];
  const closePM = () => { pm.hidden = true; };
  const openPM = () => {
    imgs = [];
    $("pf").reset();
    renderPrev();
    $("perr").textContent = "";
    const cats = [...new Set(["تيشيرتات", "هوديز", "بناطيل", ...PRODUCTS.map((p) => p.cat)])];
    $("pcats").innerHTML = cats.map((c) => `<option value="${c}">`).join("");
    pm.hidden = false;
    $("pname").focus();
  };

  $("pmx").onclick = closePM;
  pm.addEventListener("click", (e) => { if (e.target === pm) closePM(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePM(); });
  $("ppick").onclick = () => $("pfile").click();
  const renderPrev = () => {
    $("pprev").innerHTML = imgs.map((u, i) => `<img src="${u}" data-i="${i}" alt="">`).join("");
    $("phint").hidden = !imgs.length;
  };
  $("pprev").addEventListener("click", (e) => {
    const i = e.target.dataset.i;
    if (i === undefined) return;
    imgs.splice(+i, 1);
    renderPrev();
  });
  const addImgs = async (files, input) => {
    $("perr").textContent = "";
    for (const f of files) {
      try { imgs.push(await shrink(f)); renderPrev(); }
      catch (err) { $("perr").textContent = "في صورة مقدرتش أقرأها، جرّب غيرها."; }
    }
    input.value = "";
  };
  $("pfile").onchange = (e) => addImgs(e.target.files, e.target);
  $("pshot").onclick = () => $("pcam").click();
  $("pcam").onchange = (e) => addImgs(e.target.files, e.target);

  $("pf").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = Math.max(999, ...PRODUCTS.map((p) => p.id)) + 1;
    const p = {
      id,
      name: esc($("pname").value.trim()),
      cat: esc($("pcat").value.trim()),
      price: +$("pprice").value,
      img: imgs[0] || "",
      imgs: imgs.length > 1 ? imgs : undefined,
      desc: $("pdesc").value.trim(),
      local: true
    };
    PRODUCTS.push(p);
    if (!saveLocal()) {
      PRODUCTS.pop();
      $("perr").textContent = "مساحة التخزين امتلت. قلّل عدد الصور أو احذف منتجات قديمة.";
      return;
    }
    closePM();
    renderChips();
    renderGrid();
  });

  // كارت الإضافة + زرار الحذف
  const addCard = document.createElement("button");
  addCard.type = "button";
  addCard.className = "addp";
  addCard.innerHTML = `<span>+</span><b>إضافة منتج</b>`;
  addCard.onclick = openPM;

  // تصدير المنتجات: ينزّل products.js + صور المنتجات الجديدة
  const dl = (href, name) => {
    const a = document.createElement("a");
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function exportAll() {
    const files = [];
    const list = PRODUCTS.filter((p) => p.local || p.fox).map((p) => {
      const src = p.imgs && p.imgs.length ? p.imgs : p.img ? [p.img] : [];
      const names = src.map((u, i) => {
        if (!u.startsWith("data:")) return u;
        const n = `p${p.id}-${i + 1}.jpg`;
        files.push([n, u]);
        return n;
      });
      const q = { id: p.id, name: p.name, cat: p.cat, price: p.price, desc: p.desc || "", img: names[0] || "" };
      if (names.length > 1) q.imgs = names;
      return q;
    });
    const js = "window.FOX_PRODUCTS = " + JSON.stringify(list, null, 2) + ";\n";
    dl(URL.createObjectURL(new Blob([js], { type: "text/javascript" })), "products.js");
    for (const [n, u] of files) {
      await wait(600);
      const b = await (await fetch(u)).blob();
      dl(URL.createObjectURL(b), n);
    }
    alert(`تم تنزيل products.js و ${files.length} صورة. ارفعهم كلهم على GitHub جنب index.html.`);
  }
  const expCard = document.createElement("button");
  expCard.type = "button";
  expCard.className = "addp";
  expCard.innerHTML = `<span>⬇</span><b>تصدير للنشر</b>`;
  expCard.onclick = exportAll;

  const bar = document.createElement("div");
  bar.className = "ownerbar";

  const _rg = window.renderGrid;
  window.renderGrid = () => {
    _rg();
    if (!OWNER) return;
    const grid = $("grid");
    if (!PRODUCTS.length) { const s = grid.querySelector(".soon"); if (s) s.remove(); }
    grid.querySelectorAll(".card").forEach((c) => {
      const f = c.querySelector("[data-f]");
      const p = f && PRODUCTS.find((x) => x.id === +f.dataset.f);
      const t = c.querySelector(".thumb");
      if (p && p.local && t && !t.querySelector(".delp")) {
        t.insertAdjacentHTML("beforeend", `<button type="button" class="delp" data-del="${p.id}" aria-label="حذف">🗑</button>`);
      }
    });
    bar.innerHTML = "";
    bar.append(addCard);
    if (PRODUCTS.some((p) => p.local)) bar.append(expCard);
    grid.prepend(bar);
  };

  $("grid").addEventListener("click", (e) => {
    const d = e.target.closest("[data-del]");
    if (!d || !confirm("تحذف المنتج ده؟")) return;
    const i = PRODUCTS.findIndex((p) => p.id === +d.dataset.del && p.local);
    if (i < 0) return;
    PRODUCTS.splice(i, 1);
    saveLocal();
    renderChips();
    renderGrid();
  });

  // عرض معلومات المنتج في العرض السريع
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

  renderChips();
  renderGrid();
})();
