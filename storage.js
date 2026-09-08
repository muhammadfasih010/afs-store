/* ============================================================
   storage.js
   Firebase database + local browser storage.

   SECURITY:
   Firebase configuration is loaded from config.local.js
   instead of storing API keys inside this file.

   Load order:

   config.js
   config.local.js
   storage.js
   api.js
   user.js / admin.js / preview.js
   ============================================================ */

(function () {
  'use strict';

  // Firebase config config.local.js se ayegi
  const firebaseConfig = window.AFS_FIREBASE_CONFIG;

  if (!firebaseConfig || typeof firebaseConfig !== 'object') {
    console.error(
      '[AFS Store] Firebase configuration missing. ' +
      'Please load config.local.js before storage.js.'
    );
    return;
  }

  // Check Firebase SDK
  if (typeof firebase === 'undefined') {
    console.error(
      '[AFS Store] Firebase SDK is not loaded.'
    );
    return;
  }

  // Firebase initialize
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  window.db = firebase.database();


  /* ============================================================
     HELPERS
     ============================================================ */

  window.stripBase64 = function stripBase64(arr) {
    return (arr || []).map(product => ({
      ...product,

      image:
        product.image &&
        product.image.startsWith('data:')
          ? ''
          : product.image,

      groups: (product.groups || []).map(group => ({
        ...group,

        options: (group.options || []).map(option => ({
          ...option,

          image:
            option.image &&
            option.image.startsWith('data:')
              ? ''
              : option.image
        }))
      }))
    }));
  };


  function toArray(value) {
    if (!value) return [];

    return Array.isArray(value)
      ? value
      : Object.values(value);
  }


  /* ============================================================
     PRODUCTS
     ============================================================ */

  window.watchProducts = function watchProducts(callback) {

    const ref = window.db.ref('products');

    ref.on(
      'value',

      snap => {

        const value = snap.val();

        // Agar database mein products nahi hain
        // toh seed products use karo
        if (!value) {

          if (
            typeof seedProducts !== 'undefined' &&
            seedProducts.length
          ) {

            ref.set(seedProducts)
              .catch(err => {

                console.error(
                  '[AFS Store] Could not seed products:',
                  err
                );

                callback([]);
              });

          } else {

            callback([]);

          }

          return;
        }

        callback(
          window.stripBase64(
            toArray(value)
          )
        );
      },

      err => {

        console.error(
          '[AFS Store] Could not read products:',
          err
        );

        callback([]);
      }
    );
  };


  window.saveProducts = function saveProducts(products) {

    return window.db
      .ref('products')
      .set(
        window.stripBase64(products || [])
      );
  };


  /* ============================================================
     HERO IMAGES
     5 homepage images
     ============================================================ */

  window.watchHeroImages =
    function watchHeroImages(callback) {

      window.db
        .ref('settings/hero')
        .on(

          'value',

          snap => {

            const value = snap.val();

            if (
              value &&
              Array.isArray(value.images)
            ) {

              callback(value.images);

            } else {

              callback([]);

            }
          },

          err => {

            console.error(
              '[AFS Store] Could not read hero images:',
              err
            );

            callback([]);
          }
        );
    };


  window.saveHeroImages =
    function saveHeroImages(images) {

      return window.db
        .ref('settings/hero')
        .set({

          images: Array.isArray(images)
            ? images
            : []

        });
    };


  /* ============================================================
     ORDERS
     ============================================================ */

  window.watchOrders =
    function watchOrders(callback) {

      window.db
        .ref('orders')
        .on(

          'value',

          snap => {

            callback(
              toArray(snap.val())
            );

          },

          err => {

            console.error(
              '[AFS Store] Could not read orders:',
              err
            );

            callback([]);
          }
        );
    };


  window.saveOrders =
    function saveOrders(orders) {

      return window.db
        .ref('orders')
        .set(

          Array.isArray(orders)
            ? orders
            : []

        );
    };


  /* ============================================================
     CART
     Cart sirf current browser mein save hota hai
     ============================================================ */

  window.getCart = function getCart() {

    try {

      return JSON.parse(
        localStorage.getItem(
          'afs-cart-static'
        ) || '[]'
      );

    } catch (err) {

      console.error(
        '[AFS Store] Could not read cart:',
        err
      );

      return [];
    }
  };


  window.saveCartData =
    function saveCartData(cart) {

      localStorage.setItem(

        'afs-cart-static',

        JSON.stringify(
          Array.isArray(cart)
            ? cart
            : []
        )
      );
    };


  /* ============================================================
     ORDER STATUS
     ============================================================ */

  window.statusColor =
    function statusColor(status) {

      const map = {

        'Pending acceptance':
          'pending',

        'Accepted':
          'accepted',

        'Shipped':
          'shipped',

        'Delivered':
          'delivered',

        'Cancelled':
          'cancelled'

      };

      return map[status] || 'pending';
    };


  window.trackOrder =
    function trackOrder(id, orders) {

      const order = (orders || []).find(

        item =>

          String(item.id)
            .toLowerCase() ===

          String(id)
            .toLowerCase()

      );


      if (!order) {

        return (
          `No order found for ${id}. ` +
          `Check the number and try again.`
        );
      }


      const items = order.items || [];


      let message =

        `Order ${order.id} · ` +
        `${order.status} · ` +
        `${items.length} piece` +
        `${items.length === 1 ? '' : 's'} · ` +

        `${
          typeof money === 'function'
            ? money(order.total)
            : order.total
        }`;


      if (order.eta) {

        message +=
          ` · Expected: ${order.eta}`;
      }


      return message;
    };


  /* ============================================================
     USER ACCOUNTS
     ============================================================ */

  window.userKeyFromEmail =
    function userKeyFromEmail(email) {

      return String(email)

        .trim()

        .toLowerCase()

        .replace(
          /[.#$\[\]]/g,
          '_'
        );
    };


  window.getUserByEmail =
    function getUserByEmail(email) {

      return window.db

        .ref(
          'users/' +
          window.userKeyFromEmail(email)
        )

        .once('value')

        .then(
          snap => snap.val()
        );
    };


  window.saveUser =
    function saveUser(user) {

      return window.db

        .ref(

          'users/' +

          window.userKeyFromEmail(
            user.email
          )

        )

        .set(user);
    };


  window.updateUserFields =
    function updateUserFields(
      email,
      fields
    ) {

      return window.db

        .ref(

          'users/' +

          window.userKeyFromEmail(
            email
          )

        )

        .update(fields);
    };


  /* ============================================================
     OTP
     ============================================================ */

  window.saveOtp =
    function saveOtp(
      email,
      code
    ) {

      return window.db

        .ref(

          'otps/' +

          window.userKeyFromEmail(
            email
          )

        )

        .set({

          code: code,

          expiresAt:

            Date.now() +

            10 * 60 * 1000

        });
    };


  window.getOtp =
    function getOtp(email) {

      return window.db

        .ref(

          'otps/' +

          window.userKeyFromEmail(
            email
          )

        )

        .once('value')

        .then(
          snap => snap.val()
        );
    };


  window.clearOtp =
    function clearOtp(email) {

      return window.db

        .ref(

          'otps/' +

          window.userKeyFromEmail(
            email
          )

        )

        .remove();
    };


  /* ============================================================
     PASSWORD HASHING
     ============================================================ */

  window.randomSalt =
    function randomSalt(
      length = 16
    ) {

      const bytes =
        new Uint8Array(length);


      crypto.getRandomValues(
        bytes
      );


      return Array
        .from(bytes)

        .map(

          byte =>

            byte
              .toString(16)
              .padStart(
                2,
                '0'
              )

        )

        .join('');
    };


  window.hashPassword =
    async function hashPassword(
      password,
      salt
    ) {

      const data =
        new TextEncoder()
          .encode(

            salt +
            ':' +
            password

          );


      const buffer =
        await crypto.subtle.digest(

          'SHA-256',

          data

        );


      return Array

        .from(
          new Uint8Array(buffer)
        )

        .map(

          byte =>

            byte
              .toString(16)
              .padStart(
                2,
                '0'
              )

        )

        .join('');
    };


  /* ============================================================
     EMAIL OTP
     ============================================================ */

  window.sendOtpEmail =
    function sendOtpEmail(

      toEmail,
      toName,
      code

    ) {

      if (
        typeof emailjs ===
        'undefined'
      ) {

        return Promise.reject(

          new Error(
            'EmailJS is not loaded.'
          )

        );
      }


      return emailjs.send(

        window.EMAILJS_SERVICE_ID,

        window.EMAILJS_TEMPLATE_ID,

        {

          to_email:
            toEmail,

          to_name:
            toName || '',

          otp_code:
            code

        }

      );
    };


})();
