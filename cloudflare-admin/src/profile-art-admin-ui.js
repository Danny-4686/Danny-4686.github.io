export const PROFILE_ART_ADMIN_JS = String.raw`
(function(){
  var manager=document.getElementById('siteIntroManager');
  if(!manager)return;
  var settingsTab=document.getElementById('siteIntroSectionTab');
  var settingsTabSmall=settingsTab&&settingsTab.querySelector('small');
  if(settingsTabSmall)settingsTabSmall.textContent='Loading, games & profile';
  var settingsIntro=manager.querySelector('.site-intro-manager-head p:not(.eyebrow)');
  if(settingsIntro)settingsIntro.textContent='Manage the loading experience, featured arcade lineup, and the profile artwork displayed across the homepage.';

  var card=document.createElement('section');
  card.className='profile-art-card';
  card.id='profileArtAdminCard';
  card.innerHTML=''
    +'<div class="settings-section-label"><span>03</span><div><strong>Profile Artwork</strong><small>Preview and replace the character image used whenever the homepage displays Danny4686.</small></div></div>'
    +'<div class="profile-art-head"><div><p class="eyebrow">HOMEPAGE IDENTITY</p><h2>Displayed profile image</h2><p>Upload one image here and the homepage hero plus the Connect section will automatically use it after the site deploys.</p></div></div>'
    +'<div class="profile-art-layout">'
      +'<div class="profile-art-preview"><img id="profileArtPreview" alt="Current Danny4686 profile artwork"></div>'
      +'<div class="profile-art-controls">'
        +'<div class="profile-art-current"><strong>Current image</strong><small id="profileArtCurrentPath">Loading…</small></div>'
        +'<input id="profileArtInput" type="file" accept="image/png,image/jpeg,image/webp" hidden>'
        +'<label class="profile-art-drop" id="profileArtDrop" for="profileArtInput"><span><strong>Choose a new image</strong><small>PNG, JPG, or WebP · up to 8 MB<br>Transparent artwork works best.</small></span></label>'
        +'<div class="profile-art-actions">'
          +'<button id="profileArtSave" class="primary" type="button" disabled>Save new image</button>'
          +'<button id="profileArtClearSelection" type="button" disabled>Clear selection</button>'
          +'<button id="profileArtReset" type="button">Restore original</button>'
        +'</div>'
        +'<p id="profileArtNote" class="profile-art-note">Loading the currently published artwork…</p>'
      +'</div>'
    +'</div>';
  manager.appendChild(card);

  var input=document.getElementById('profileArtInput');
  var preview=document.getElementById('profileArtPreview');
  var currentPath=document.getElementById('profileArtCurrentPath');
  var save=document.getElementById('profileArtSave');
  var clear=document.getElementById('profileArtClearSelection');
  var reset=document.getElementById('profileArtReset');
  var drop=document.getElementById('profileArtDrop');
  var note=document.getElementById('profileArtNote');
  var csrf='';
  var livePath='/assets/images/optimized/profile-600.webp';
  var objectUrl='';
  var busy=false;

  function publicUrl(path){
    if(!path)return 'https://danny4686.com/assets/images/optimized/profile-600.webp';
    if(/^https?:\/\//i.test(path))return path;
    return 'https://danny4686.com/'+String(path).replace(/^\/+/, '');
  }
  function clearObject(){if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl='';}}
  function setBusy(value){busy=value;card.classList.toggle('is-saving',value);save.disabled=value||!input.files[0];clear.disabled=value||!input.files[0];reset.disabled=value;}
  function setNote(text,error){note.textContent=text;note.style.color=error?'#ffaaa6':'';}
  async function request(url,options){
    options=options||{};options.headers=options.headers||{};
    if(options.method&&options.method!=='GET')options.headers['X-CSRF-Token']=csrf;
    var response=await fetch(url,options);var data=await response.json().catch(function(){return {};});
    if(!response.ok)throw new Error(data.error||'The profile image could not be updated.');
    return data;
  }
  function showLive(path){
    livePath=path||'/assets/images/optimized/profile-600.webp';
    currentPath.textContent=livePath;
    preview.src=publicUrl(livePath)+'?preview='+(Date.now());
    preview.hidden=false;
    setNote('This is the image currently used on the homepage.');
  }
  function useSelected(file){
    if(!file)return;
    if(!/^image\/(png|jpeg|webp)$/i.test(file.type)){input.value='';setNote('Choose a PNG, JPG, or WebP image.',true);return;}
    if(file.size>8*1024*1024){input.value='';setNote('The image must be 8 MB or smaller.',true);return;}
    clearObject();objectUrl=URL.createObjectURL(file);preview.src=objectUrl;currentPath.textContent='New image ready: '+file.name;setNote('Previewing an unsaved image. Save it when you are happy with the result.');
    save.disabled=busy;clear.disabled=busy;
  }
  function clearSelection(){input.value='';clearObject();showLive(livePath);save.disabled=true;clear.disabled=true;}

  input.addEventListener('change',function(){useSelected(input.files[0]);});
  ['dragenter','dragover'].forEach(function(type){drop.addEventListener(type,function(event){event.preventDefault();drop.classList.add('is-dragging');});});
  ['dragleave','drop'].forEach(function(type){drop.addEventListener(type,function(event){event.preventDefault();drop.classList.remove('is-dragging');});});
  drop.addEventListener('drop',function(event){var file=event.dataTransfer&&event.dataTransfer.files&&event.dataTransfer.files[0];if(!file)return;var transfer=new DataTransfer();transfer.items.add(file);input.files=transfer.files;useSelected(file);});
  clear.addEventListener('click',clearSelection);

  save.addEventListener('click',async function(){
    var file=input.files[0];if(!file||busy)return;
    setBusy(true);setNote('Uploading and publishing the new profile image…');
    try{
      var form=new FormData();form.append('image',file);
      var data=await request('/api/profile-art',{method:'POST',body:form});
      input.value='';clearObject();showLive(data.profileImage);setNote('Profile artwork saved. It will appear as soon as the website deployment finishes.');
    }catch(error){setNote(error.message,true);}
    finally{setBusy(false);save.disabled=!input.files[0];clear.disabled=!input.files[0];}
  });

  reset.addEventListener('click',async function(){
    if(busy||!confirm('Restore the original Danny4686 profile artwork?'))return;
    setBusy(true);setNote('Restoring the original profile image…');
    try{
      var data=await request('/api/profile-art',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reset:true})});
      input.value='';clearObject();showLive(data.profileImage);setNote('Original profile artwork restored.');
    }catch(error){setNote(error.message,true);}
    finally{setBusy(false);}
  });

  async function load(){
    try{
      var session=await fetch('/api/session').then(function(response){return response.json();});csrf=session.csrfToken||'';
      var data=await request('/api/profile-art');showLive(data.profileImage);
    }catch(error){currentPath.textContent='Unavailable';setNote(error.message,true);}
  }
  load();
})();
`;
