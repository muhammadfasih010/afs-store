/* ============================================================
   api.js
   The only outside network API this project talks to: Cloudinary,
   used by the admin panel to upload product / option images.
   ============================================================ */

async function uploadToCloudinary(file, statusEl, onSuccess){
  if(!file) return;
  statusEl.textContent = 'Uploading...';
  statusEl.style.color = 'var(--gold)';
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', 'Imagee');
  fd.append('api_key', 'V2ZzYvfWumKsgoDhS9ITW6QMcVY');
  try{
    const res = await fetch('https://api.cloudinary.com/v1_1/j8ilvbr9/image/upload', { method:'POST', body:fd });
    const data = await res.json();
    if(data.secure_url){
      onSuccess(data.secure_url);
      statusEl.textContent = '✓ Upload ho gaya!';
      statusEl.style.color = '#a9d0aa';
      setTimeout(() => statusEl.textContent = '', 3000);
    } else {
      statusEl.textContent = 'Error: ' + (data.error?.message || 'Try again');
      statusEl.style.color = '#b76d5d';
    }
  } catch(e){
    statusEl.textContent = 'Upload fail hua. Internet check karo.';
    statusEl.style.color = '#b76d5d';
  }
}

