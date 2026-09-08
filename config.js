/* ============================================================
   config.js
   Shared constants + tiny helpers used by BOTH user.js and admin.js.
   Load this file BEFORE storage.js, api.js, user.js / admin.js.
   ============================================================ */

const ASSET = 'https://afsleather-eebazv6q.manus.space/manus-storage/';

const seedProducts = [
  { id:'jacket', name:'The Rider Jacket', category:'Jackets', price:38900, image:ASSET+'jacket_45bdb1d5.jpg', description:'A tailored silhouette with clean lines and soft structure.', groups:[
    { name:'Color', options:[
      { name:'Classic black', hex:'#171514', price:0 },
      { name:'Tobacco', hex:'#6d3d27', price:1200 },
      { name:'Oxblood', hex:'#5b171e', price:1500 }
    ]},
    { name:'Hardware', options:[
      { name:'Antique brass', price:0 },
      { name:'Gunmetal', price:650 }
    ]}
  ]},
  { id:'belt', name:'The Forge Belt', category:'Belts', price:9200, image:ASSET+'belt_5890ecf3.jpg', description:'Bridle leather with a sculpted profile and two sides to make it yours.', groups:[
    { name:'Strap color', options:[
      { name:'Saddle brown', hex:'#8d4e2a', price:0 },
      { name:'Black', hex:'#1d1a18', price:250 },
      { name:'Oxblood', hex:'#641c1f', price:400 }
    ]},
    { name:'Buckle', options:[
      { name:'Classic pin', price:0 },
      { name:'Matte black automatic', price:1100 }
    ]}
  ]},
  { id:'wallet', name:'The Atelier Bifold', category:'Wallets', price:7800, image:ASSET+'wallet_f4252cca.jpg', description:'A slim bifold cut from a single hide and finished by hand.', groups:[
    { name:'Leather tone', options:[
      { name:'Walnut', hex:'#6f3d25', price:0 },
      { name:'Obsidian', hex:'#1a1817', price:450 },
      { name:'Cognac', hex:'#a85d2f', price:300 }
    ]}
  ]},
  { id:'cap', name:'The Crown Cap', category:'Caps', price:6900, image:ASSET+'cap_a8e460e5.jpg', description:'An understated cap with a considered crown and a blank canvas for your mark.', groups:[
    { name:'Finish color', options:[
      { name:'Coal', hex:'#22201e', price:0 },
      { name:'Tobacco', hex:'#844522', price:350 },
      { name:'Stone', hex:'#8f8479', price:450 }
    ]}
  ]}
];

// Color name -> hex autofill map (used by admin.js)
const colorMap = {
  'black':'#171514','classic black':'#171514','jet black':'#0a0a0a','matte black':'#1a1a1a',
  'white':'#f5f5f5','off white':'#f0ede8','cream':'#f5f0e8','ivory':'#fffff0',
  'red':'#c0392b','dark red':'#8b0000','crimson':'#dc143c',
  'oxblood':'#5b171e','burgundy':'#6d0f1f','maroon':'#5c0a11','wine':'#722f37',
  'brown':'#8b5e3c','dark brown':'#4a2c1a','chocolate':'#3d1c02','chestnut':'#6b3a2a',
  'saddle brown':'#8d4e2a','cognac':'#a85d2f','tan':'#c4986a','camel':'#c19a6b',
  'tobacco':'#6d3d27','walnut':'#6f3d25','mahogany':'#4a1a0e',
  'navy':'#1b2a4a','navy blue':'#1b2a4a','dark blue':'#1a2b4a','blue':'#2c4a7c',
  'grey':'#808080','gray':'#808080','dark grey':'#404040','light grey':'#c0c0c0',
  'stone':'#8f8479','slate':'#6b7280','charcoal':'#36454f',
  'green':'#2d6a4f','dark green':'#1a3d2b','olive':'#6b7c3b','forest':'#2d4a1e',
  'yellow':'#d4a017','gold':'#c79a5a','antique gold':'#b8962e','brass':'#b5a642',
  'antique brass':'#b5a642','gunmetal':'#2c3539','silver':'#a8a9ad','chrome':'#d4d5d9',
  'orange':'#c85a17','rust':'#8b3a0f','copper':'#b87333',
  'pink':'#e8829a','blush':'#de8fa0','rose':'#c4687a',
  'purple':'#6b3fa0','violet':'#7f4f9e','plum':'#5e2750',
  'obsidian':'#1a1817','coal':'#22201e','midnight':'#0d0d1a',
  'natural':'#d4b896','nude':'#d4a882','beige':'#c8a97a'
};

const $ = s => document.querySelector(s);
const money = n => 'Rs. ' + Number(n).toLocaleString('en-PK');

function nameToHex(name){
  const key = name.toLowerCase().trim();
  return colorMap[key] || null;
}

function isLight(hex){
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return (r*299 + g*587 + b*114) / 1000 > 128;
}

        
