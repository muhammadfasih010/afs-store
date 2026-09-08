// Standalone admin page state
let products = [];
let heroImages = [];
let orders = [];
let adminSelected = null;
document.addEventListener('DOMContentLoaded', () => {
  watchProducts(list => { products=list; adminSelected=products.find(p=>p.id===adminSelected?.id)||products[0]||null; safeRenderAdmin(); });
  watchHeroImages(list => { heroImages=list; safeRenderAdminHero(); });
  watchOrders(list => { orders=list; safeRenderAdminOrders(); });
  wireAdminPanel();
});
/* ============================================================
   admin.js
   Logic for the private studio / admin panel — same page as the
   storefront now (reachable via the 5-click + password gate in
   user.js). Uses the shared `products` / `orders` / `adminSelected`
   variables declared in user.js, and the shared live Firebase
   listeners set up there too.
   ============================================================ */


// ---- Product list (left column) ----
function renderAdminList(){
  const box = $('#adminProductList');
  if(!box) return;
  box.innerHTML = products.map(p => `<div class="admin-product-row ${adminSelected && p.id===adminSelected.id?'active':''}" data-admin-product="${p.id}"><img src="${p.image}" alt=""><div><strong>${p.name}</strong><small>${p.category} · ${money(p.price)}</small></div><button class="admin-delete-product" data-delete-product="${p.id}" title="Product delete karo">🗑</button></div>`).join('');
  box.querySelectorAll('[data-admin-product]').forEach(row => {
    row.onclick = (e) => {
      if(e.target.closest('[data-delete-product]')) return;
      adminSelected = products.find(p => p.id === row.dataset.adminProduct);
      renderAdmin();
    };
  });
  box.querySelectorAll('[data-delete-product]').forEach(btn => btn.onclick = (e) => {
    e.stopPropagation();
    const pid = btn.dataset.deleteProduct;
    const p = products.find(x => x.id === pid);
    if(!confirm(`"${p.name}" delete karna chahte ho? Yeh wapas nahi aayega.`)) return;
    products = products.filter(x => x.id !== pid);
    saveProducts(products).catch(() => alert('Delete save nahi hua — internet check karo.'));
    if(products.length > 0){ adminSelected = products[0]; }
    else { adminSelected = null; }
    renderAdmin();
  });
}

// ---- Product editor (right column) ----
function renderAdmin(){
  renderAdminList();
  const title = $('#adminTitle'), body = $('#adminEditorBody');
  if(!title || !body) return;
  if(products.length === 0 || !adminSelected){
    title.textContent = 'Koi product nahi';
    body.innerHTML = '<p class="admin-empty">Koi product nahi hai. Neeche "+ Add product" se naya banao.</p>';
    return;
  }
  // Clean up any base64 images already stored
  const safeImg = url => (url && url.startsWith('data:')) ? '' : url;
  title.textContent = adminSelected.name;
  const previewSrc = safeImg(adminSelected.image) || '';
  body.innerHTML = `<div class="admin-form"><div class="admin-image-row">${previewSrc?`<img id="adminPreviewImg" src="${previewSrc}" alt="${adminSelected.name}" style="width:85px;height:96px;object-fit:cover;">`:'<div class="admin-no-preview" id="adminPreviewImg" style="width:85px;height:96px;background:#2a2018;display:grid;place-items:center;color:#998d82;font-size:10px;">No image</div>'}<div><p class="eyebrow">Main product image</p><label class="cloudinary-upload-btn" id="mainUploadBtn">📁 Device se upload karo<input type="file" id="adminMainFile" accept="image/*" style="display:none"></label><p class="upload-status" id="mainUploadStatus"></p></div></div><label>Product name<input id="adminName" value="${adminSelected.name}"></label><label>Base price<input id="adminPrice" type="number" value="${adminSelected.price}"></label><label class="wide">Ya direct URL paste karo<input id="adminImage" value="${previewSrc}" placeholder="https://res.cloudinary.com/..."></label>${adminSelected.groups.map((g,gi) => `<div class="admin-option-card"><div class="admin-option-card-head"><p class="eyebrow">Option group ${gi+1} — ${g.name}</p><button class="admin-remove-group" data-remove-group="${gi}" type="button">Group delete karo ×</button></div>${g.options.map((o,oi) => `<div class="admin-option-line"><input data-gi="${gi}" data-oi="${oi}" data-key="name" value="${o.name}" placeholder="Option name"><input data-gi="${gi}" data-oi="${oi}" data-key="hex" value="${o.hex||''}" placeholder="#8D4E2A"><input data-gi="${gi}" data-oi="${oi}" data-key="price" type="number" value="${o.price||0}" placeholder="Add price"><input data-gi="${gi}" data-oi="${oi}" data-key="image" value="${safeImg(o.image)||''}" placeholder="Ya URL paste karo"><label class="opt-upload-btn" data-ugi="${gi}" data-uoi="${oi}">↑<input type="file" accept="image/*" style="display:none" data-ugi="${gi}" data-uoi="${oi}"></label><button class="admin-remove" data-remove-option="${gi}:${oi}" type="button">×</button></div>`).join('')}<button class="admin-add-option" data-add-option="${gi}" type="button">+ Add option</button></div>`).join('')}<label class="wide">New option group<input id="adminNewGroup" placeholder="e.g. Color, lining, buckle"></label><button class="admin-save wide" id="adminSave" type="button">Save changes</button></div>`;

  // Attach auto-hex to all name inputs in option lines
  function attachColorAutofill(){
    document.querySelectorAll('.admin-option-line input[data-key="name"]').forEach(nameInput => {
      nameInput.addEventListener('input', () => {
        const hex = nameToHex(nameInput.value);
        if(!hex) return;
        const gi = nameInput.dataset.gi, oi = nameInput.dataset.oi;
        const hexInput = document.querySelector(`.admin-option-line input[data-gi="${gi}"][data-oi="${oi}"][data-key="hex"]`);
        if(hexInput){
          hexInput.value = hex;
          hexInput.style.borderColor = 'var(--gold)';
          hexInput.style.background = hex;
          hexInput.style.color = isLight(hex) ? '#1a1a1a' : '#ffffff';
        }
      });
    });
    // Also live-preview hex field changes
    document.querySelectorAll('.admin-option-line input[data-key="hex"]').forEach(hexInput => {
      hexInput.addEventListener('input', () => {
        const val = hexInput.value.trim();
        if(/^#[0-9a-fA-F]{6}$/.test(val)){
          hexInput.style.background = val;
          hexInput.style.color = isLight(val) ? '#1a1a1a' : '#ffffff';
        }
      });
    });
  }
  attachColorAutofill();

  // Main product image upload (Cloudinary — see api.js)
  const mainFile = $('#adminMainFile');
  const mainStatus = $('#mainUploadStatus');
  mainFile?.addEventListener('change', () => {
    uploadToCloudinary(mainFile.files[0], mainStatus, url => {
      $('#adminImage').value = url;
      const prev = $('#adminPreviewImg');
      if(prev) prev.src = url;
    });
  });

  // Option replacement image uploads
  document.querySelectorAll('.opt-upload-btn input[type=file]').forEach(input => {
    input.addEventListener('change', () => {
      const gi = input.dataset.ugi, oi = input.dataset.uoi;
      const statusId = `optStatus_${gi}_${oi}`;
      let statusEl = document.getElementById(statusId);
      if(!statusEl){ statusEl = document.createElement('span'); statusEl.id = statusId; statusEl.style.cssText = 'font-size:9px;margin-left:6px;'; input.closest('.admin-option-line').appendChild(statusEl); }
      uploadToCloudinary(input.files[0], statusEl, url => {
        const imgInput = document.querySelector(`.admin-option-line input[data-gi="${gi}"][data-oi="${oi}"][data-key="image"]`);
        if(imgInput) imgInput.value = url;
      });
    });
  });

  // Live preview when URL typed
  $('#adminImage')?.addEventListener('input', e => {
    const url = e.target.value.trim();
    const img = $('.admin-image-row img');
    if(img && url && !url.startsWith('data:')) img.src = url;
  });

  document.querySelectorAll('[data-add-option]').forEach(btn => btn.onclick = () => {
    const name = prompt('Option name');
    if(!name) return;
    const hex = prompt('Hex color code, e.g. #8D4E2A (optional)') || '';
    adminSelected.groups[+btn.dataset.addOption].options.push({name, hex, price:0, image:''});
    renderAdmin();
  });
  document.querySelectorAll('[data-remove-option]').forEach(btn => btn.onclick = () => {
    const [gi, oi] = btn.dataset.removeOption.split(':').map(Number);
    adminSelected.groups[gi].options.splice(oi, 1);
    renderAdmin();
  });
  document.querySelectorAll('[data-remove-group]').forEach(btn => btn.onclick = () => {
    const gi = +btn.dataset.removeGroup;
    if(!confirm(`"${adminSelected.groups[gi].name}" group aur iske saare options delete karna chahte ho?`)) return;
    adminSelected.groups.splice(gi, 1);
    renderAdmin();
  });

  $('#adminSave').onclick = () => {
    adminSelected.name = $('#adminName').value.trim() || adminSelected.name;
    adminSelected.price = Number($('#adminPrice').value) || adminSelected.price;
    const newImg = $('#adminImage').value.trim();
    if(newImg && !newImg.startsWith('data:')) adminSelected.image = newImg;
    document.querySelectorAll('.admin-option-line input').forEach(input => {
      const option = adminSelected.groups[+input.dataset.gi]?.options[+input.dataset.oi];
      if(!option) return;
      const key = input.dataset.key;
      const val = input.value.trim();
      if(key === 'price') option[key] = Number(val) || 0;
      else if(key === 'image'){ if(val && !val.startsWith('data:')) option[key] = val; }
      else option[key] = val;
    });
    const groupName = $('#adminNewGroup').value.trim();
    if(groupName) adminSelected.groups.push({name:groupName, options:[]});
    // Strip any leftover base64 from all products before saving
    const clean = p => ({...p, image: p.image?.startsWith('data:')?'':p.image, groups: p.groups.map(g => ({...g, options: g.options.map(o => ({...o, image: o.image?.startsWith('data:')?'':o.image}))}))});
    products = products.map(p => p.id === adminSelected.id ? clean(adminSelected) : clean(p));
    saveProducts(products).catch(() => alert('Save nahi hua — internet check karo.'));
    renderAdmin();
    const imgField = $('#adminImage');
    if(imgField){ imgField.value=''; imgField.placeholder='Link save ho gayi ✓'; }
    const saveBtn = $('#adminSave');
    if(saveBtn){ saveBtn.textContent='Saved ✓'; saveBtn.style.background='#4f6e54'; saveBtn.style.color='#d4f0d6'; saveBtn.disabled=true; setTimeout(() => { saveBtn.textContent='Save changes'; saveBtn.style.background=''; saveBtn.style.color=''; saveBtn.disabled=false; }, 3000); }
  };
}

// ---- Orders tab ----
function renderAdminHero(){
  const body = $('#adminHeroBody');
  if(!body) return;
  body.innerHTML = Array.from({length:5}).map((_,i) => {
    const slot = heroImages[i] || {};
    const preview = slot.image || '';
    return `<div class="admin-image-row" style="margin-bottom:14px;align-items:center;">
      ${preview ? `<img src="${preview}" alt="Hero slot ${i+1}" id="heroPreview${i}">` : `<div class="admin-no-preview" id="heroPreview${i}" style="width:85px;height:96px;background:#2a2018;display:grid;place-items:center;color:#998d82;font-size:10px;">No image</div>`}
      <div style="flex:1;display:grid;gap:8px;">
        <p class="eyebrow" style="margin:0;">Slot ${i+1}${i===2?' — gets the price badge':''}</p>
        <label class="cloudinary-upload-btn" id="heroUploadBtn${i}">📁 Device se upload karo<input type="file" accept="image/*" style="display:none" id="heroFile${i}"></label>
        <p class="upload-status" id="heroStatus${i}"></p>
        <input id="heroUrl${i}" value="${preview}" placeholder="Ya direct URL paste karo">
        ${i===2 ? `<input id="heroTagLabel" value="${slot.tagLabel||''}" placeholder="Badge label, e.g. Made to order"><input id="heroTagValue" value="${slot.tagValue||''}" placeholder="Badge value, e.g. From Rs. 12,000">` : ''}
      </div>
    </div>`;
  }).join('');

  Array.from({length:5}).forEach((_,i) => {
    const fileInput = $(`#heroFile${i}`);
    const statusEl = $(`#heroStatus${i}`);
    fileInput?.addEventListener('change', () => {
      uploadToCloudinary(fileInput.files[0], statusEl, url => {
        $(`#heroUrl${i}`).value = url;
        const prevEl = $(`#heroPreview${i}`);
        if(prevEl?.tagName === 'IMG') prevEl.src = url;
        else prevEl?.replaceWith(Object.assign(new Image(), { src: url, id: `heroPreview${i}`, style: prevEl.style.cssText }));
      });
    });
  });
}

function safeRenderAdminHero(){
  const active = document.activeElement;
  if(active?.closest?.('#adminHeroBody')) return;
  renderAdminHero();
}

function renderAdminOrders(){
  const box = $('#adminOrdersList');
  if(!box) return;
  const badge = $('#adminOrderBadge');
  const pending = orders.filter(o => o.status === 'Pending acceptance').length;
  if(badge) badge.textContent = pending || '';
  if(badge) badge.style.display = pending ? 'inline-flex' : 'none';
  if(!orders.length){ box.innerHTML = '<div class="admin-no-orders">Abhi koi order nahi aaya.</div>'; return; }
  box.innerHTML = [...orders].reverse().map((o) => `
    <div class="admin-order-card">
      <div class="admin-order-card-head">
        <div>
          <div class="admin-order-id">${o.id}</div>
          <div class="admin-order-meta">${new Date(o.createdAt).toLocaleString('en-PK')} · ${o.payment}</div>
        </div>
        <span class="my-order-status status-${statusColor(o.status)}">${o.status}</span>
      </div>
      <div class="admin-customer-info">
        👤 ${o.customer?.name||'—'} · 📞 ${o.customer?.phone||'—'}<br>
        📍 ${o.customer?.address||'—'} · 📮 ${o.customer?.postal||'—'}
      </div>
      <div class="admin-order-items">
        ${o.items.map(i => `<div class="admin-order-item"><span>${i.name} ${i.options?.length?'('+i.options.join(', ')+')':''}</span><span>${money(i.price)}</span></div>`).join('')}
      </div>
      <div class="admin-order-total">Total: ${money(o.total)}</div>
      <div class="admin-status-row">
        <select class="admin-status-select" id="status_${o.id}">
          ${['Pending acceptance','Accepted','Shipped','Delivered','Cancelled'].map(s => `<option${o.status===s?' selected':''}>${s}</option>`).join('')}
        </select>
        <input class="admin-eta-input" id="eta_${o.id}" placeholder="Expected date, e.g. 10 Sep 2026" value="${o.eta||''}">
        <input class="admin-eta-input" id="note_${o.id}" placeholder="Note for customer (optional)" value="${o.adminNote||''}" style="border-color:#463c36">
        <button class="admin-update-btn" data-order-id="${o.id}">Update →</button>
      </div>
    </div>`).join('');

  box.querySelectorAll('[data-order-id]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.orderId;
      const idx = orders.findIndex(o => o.id === id);
      if(idx === -1) return;
      orders[idx].status = document.getElementById('status_'+id).value;
      orders[idx].eta = document.getElementById('eta_'+id).value.trim();
      orders[idx].adminNote = document.getElementById('note_'+id).value.trim();
      saveOrders(orders).catch(() => alert('Update save nahi hua — internet check karo.'));
      renderAdminOrders();
      btn.textContent = 'Saved ✓'; btn.style.borderColor = '#4f6e54'; btn.style.color = '#a9d0aa';
      setTimeout(() => { btn.textContent = 'Update →'; btn.style.borderColor=''; btn.style.color=''; }, 2500);
    };
  });
}

// Don't let a live Firebase update wipe out text the admin is
// mid-typing — only re-render a panel when nothing inside it is focused.
function safeRenderAdmin(){
  const active = document.activeElement;
  if(active?.closest?.('#adminEditorBody')) return;
  renderAdmin();
}
function safeRenderAdminOrders(){
  const active = document.activeElement;
  if(active?.closest?.('#adminOrdersList')) return;
  renderAdminOrders();
}

// Called from user.js once the 5-click + password gate succeeds.
function unlockAdminPanel(){
  $('#adminPanel').classList.add('open');
  $('#adminPanel').setAttribute('aria-hidden', 'false');
  renderAdmin();
  renderAdminOrders();
}

// Wires the admin panel's own controls (tabs, new product, close button).
// Called once from user.js's DOMContentLoaded.
function wireAdminPanel(){
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const t = tab.dataset.tab;
      $('#tabProducts').style.display = t==='products' ? 'block' : 'none';
      $('#tabOrders').style.display = t==='orders' ? 'block' : 'none';
      $('#tabHero').style.display = t==='hero' ? 'block' : 'none';
      if(t==='orders') renderAdminOrders();
      if(t==='hero') renderAdminHero();
    };
  });

  $('#adminHeroSave')?.addEventListener('click', () => {
    const btn = $('#adminHeroSave');
    const images = Array.from({length:5}).map((_,i) => ({
      image: $(`#heroUrl${i}`)?.value.trim() || '',
      tagLabel: i===2 ? ($('#heroTagLabel')?.value.trim() || '') : '',
      tagValue: i===2 ? ($('#heroTagValue')?.value.trim() || '') : ''
    }));
    saveHeroImages(images).then(() => {
      btn.textContent = 'Saved ✓';
      setTimeout(() => btn.textContent = 'Save hero images', 2200);
    }).catch(() => alert('Hero images save nahi ho saka — internet check karo.'));
  });

  // Close = just hide the overlay, back to the storefront (same page)
  $('#closeAdmin')?.addEventListener('click', () => {
    $('#adminPanel').classList.remove('open');
    $('#adminPanel').setAttribute('aria-hidden', 'true');
  });

  // New product
  $('#newProduct')?.addEventListener('click', () => {
    const name = prompt('Product name');
    if(!name) return;
    const p = { id:'product-'+Date.now(), name, category:'Leather goods', price:0, image:ASSET+'wallet_f4252cca.jpg', description:'A new made-to-order piece.', groups:[] };
    products.push(p);
    adminSelected = p;
    saveProducts(products).catch(() => alert('Save nahi hua — internet check karo.'));
    renderAdmin();
  });
}
  
