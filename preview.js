let previewProducts=[];
const previewId=new URLSearchParams(location.search).get('id');
function esc(v){const d=document.createElement('div');d.textContent=v??'';return d.innerHTML}
function renderPreview(){
 const root=document.querySelector('#previewRoot');
 const p=previewProducts.find(x=>x.id===previewId);
 if(!p){root.innerHTML='<div><h1>Product not found</h1><p>Please return to the shop and choose a product.</p></div>';return}
 root.innerHTML=`<div class="pd-media"><img src="${esc(p.image)}" alt="${esc(p.name)}"></div>
 <div class="pd-info"><p class="eyebrow">${esc(p.category)} / Made to order</p><h1>${esc(p.name)}</h1>
 <div class="pd-price-row"><strong class="pd-price">${money(p.price)}</strong></div>
 <p class="pd-desc">${esc(p.description)}</p>
 <div class="pd-qty-row"><strong>Quantity</strong><div class="qty-stepper"><button id="minus">−</button><span id="qty">1</span><button id="plus">+</button></div></div>
 <div class="pd-actions"><button class="button gold" id="add">Add to bag →</button><a class="button dark" href="user.html#collection">Continue shopping</a></div></div>`;
 let qty=1; const sync=()=>document.querySelector('#qty').textContent=qty;
 document.querySelector('#minus').onclick=()=>{qty=Math.max(1,qty-1);sync()};
 document.querySelector('#plus').onclick=()=>{qty++;sync()};
 document.querySelector('#add').onclick=()=>{const cart=getCart(); const existing=cart.find(x=>x.id===p.id&&JSON.stringify(x.options||[])==='[]');if(existing)existing.qty=(existing.qty||1)+qty;else cart.push({id:p.id,name:p.name,price:p.price,image:p.image,qty,options:[]});saveCartData(cart);location.href='user.html?cart=1';};
}
watchProducts(list=>{previewProducts=list;renderPreview();});
   
