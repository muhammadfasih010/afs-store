/* ============================================================
   storage.js
   Real cloud database layer — Firebase Realtime Database.

   Products and orders are stored in Firebase, so a change made
   in the admin panel on one device/phone shows up on every other
   device — because everyone is now reading/writing the same
   cloud database instead of their own browser's storage.

   The cart stays in THIS browser's localStorage only — a
   shopping bag is personal and in-progress, it shouldn't follow
   you to another phone (same behaviour you'd expect from any
   normal store).

   REQUIRES: firebase-app-compat.js and firebase-database-compat.js
   loaded via <script> BEFORE this file (see user.html / admin.html).

   IMPORTANT — Firebase Realtime Database rules:
   This project has no login system, so the database rules must
   allow open read/write, or every request here will fail with a
   permission-denied error. In the Firebase console →
   Realtime Database → Rules, set:
     {
       "rules": {
         ".read": true,
         ".write": true
       }
     }
   This is fine for a small store front. If you ever add real user
   accounts, tighten these rules to match.
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyAdJnO5Uv6GMTs6TJDJ7f2CHjYsMdDIW_Y",
  authDomain: "leather-731bb.firebaseapp.com",
  databaseURL: "https://leather-731bb-default-rtdb.firebaseio.com",
  projectId: "leather-731bb",
  storageBucket: "leather-731bb.firebasestorage.app",
  messagingSenderId: "1067965421439",
  appId: "1:1067965421439:web:fc1cf12f541f1e04feac4a"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ---- EmailJS (sends the OTP code to the user's email) ----
// Create a free account at https://www.emailjs.com, add an Email Service
// (e.g. Gmail) and an Email Template with {{to_email}}, {{to_name}} and
// {{otp_code}} variables, then paste your own 3 IDs below.
const EMAILJS_SERVICE_ID = 'service_pwjaxb4';
const EMAILJS_TEMPLATE_ID = 'template_no76svr';
const EMAILJS_PUBLIC_KEY = 'pJneFha-OGAh2MiDz';
emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

// Removes any base64 data-URLs before using/persisting (keeps the database small)
function stripBase64(arr){
  return arr.map(p => ({
    ...p,
    image: p.image?.startsWith('data:') ? '' : p.image,
    groups: p.groups.map(g => ({
      ...g,
      options: g.options.map(o => ({
        ...o,
        image: o.image?.startsWith('data:') ? '' : o.image
      }))
    }))
  }));
}

// Firebase can return objects OR arrays depending on the keys — normalize to a plain array
function toArray(val){
  if(!val) return [];
  return Array.isArray(val) ? val : Object.values(val);
}

// ---- Products: live, shared across every device ----
// callback(products) fires immediately with the current data, then again
// every time ANY device changes the products (admin edits, deletes, etc.)
function watchProducts(callback){
  const ref = db.ref('products');
  ref.on('value', snap => {
    const val = snap.val();
    if(!val){
      // Nothing in the database yet (brand new project) — seed it once.
      ref.set(seedProducts);
      return; // set() triggers this same listener again with the real data
    }
    callback(stripBase64(toArray(val)));
  }, err => {
    console.error('Could not read products from Firebase:', err);
  });
}
function saveProducts(products){
  return db.ref('products').set(products);
}

// ---- Hero gallery images: admin-managed, shown as the 5 arch photos on the homepage ----
function watchHeroImages(callback){
  const ref = db.ref('settings/hero');
  ref.on('value', snap => {
    const val = snap.val();
    callback(val && val.images ? val.images : []);
  }, err => {
    console.error('Could not read hero images from Firebase:', err);
  });
}
function saveHeroImages(images){
  return db.ref('settings/hero').set({ images });
}

// ---- Orders: live, shared across every device ----
function watchOrders(callback){
  db.ref('orders').on('value', snap => {
    callback(toArray(snap.val()));
  }, err => {
    console.error('Could not read orders from Firebase:', err);
  });
}
function saveOrders(orders){
  return db.ref('orders').set(orders);
}

// ---- Cart: local to this device only (not synced) ----
function getCart(){
  return JSON.parse(localStorage.getItem('afs-cart-static') || '[]');
}
function saveCartData(cart){
  localStorage.setItem('afs-cart-static', JSON.stringify(cart));
}

function statusColor(s){
  const map = {
    'Pending acceptance':'pending',
    'Accepted':'accepted',
    'Shipped':'shipped',
    'Delivered':'delivered',
    'Cancelled':'cancelled'
  };
  return map[s] || 'pending';
}

// Looks up an order inside an already-loaded orders array (no extra fetch needed —
// both user.js and admin.js keep a live-updated copy via watchOrders above)
function trackOrder(id, orders){
  const order = orders.find(o => o.id.toLowerCase() === id.toLowerCase());
  if(!order) return `No order found for ${id}. Check the number and try again.`;
  let msg = `Order ${order.id} · ${order.status} · ${order.items.length} piece${order.items.length===1?'':'s'} · ${money(order.total)}`;
  if(order.eta) msg += ` · Expected: ${order.eta}`;
  return msg;
}

// ============================================================
// Accounts (signup/login) + OTP password reset — new
// ============================================================

// Turns an email into a safe Firebase key (Firebase keys can't contain . # $ [ ])
function userKeyFromEmail(email){
  return email.trim().toLowerCase().replace(/[.#$\[\]]/g, '_');
}

function getUserByEmail(email){
  return db.ref('users/' + userKeyFromEmail(email)).once('value').then(snap => snap.val());
}
function saveUser(user){
  return db.ref('users/' + userKeyFromEmail(user.email)).set(user);
}
function updateUserFields(email, fields){
  return db.ref('users/' + userKeyFromEmail(email)).update(fields);
}

// One-time-password records, used only during "forgot password"
function saveOtp(email, code){
  return db.ref('otps/' + userKeyFromEmail(email)).set({
    code,
    expiresAt: Date.now() + 10 * 60 * 1000 // valid for 10 minutes
  });
}
function getOtp(email){
  return db.ref('otps/' + userKeyFromEmail(email)).once('value').then(snap => snap.val());
}
function clearOtp(email){
  return db.ref('otps/' + userKeyFromEmail(email)).remove();
}

// Password hashing (client-side, no backend available).
// NOTE: this is a salted SHA-256 hash, not a slow KDF like bcrypt/scrypt —
// reasonable for a small store with no backend, but worth knowing the limit.
function randomSalt(len = 16){
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}
async function hashPassword(password, salt){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + password));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Sends the OTP code by email via EmailJS (see EMAILJS_* constants near the
// top of the page — you must fill these in with your own EmailJS account).
function sendOtpEmail(toEmail, toName, code){
  return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    to_email: toEmail,
    to_name: toName || '',
    otp_code: code
  });
}

    
