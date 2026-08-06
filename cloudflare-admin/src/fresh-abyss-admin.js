export const FRESH_ABYSS_ADMIN_JS = String.raw`
(function(){
  var workspace=document.querySelector('.workspace');
  var workspaceHead=workspace&&workspace.querySelector('.workspace-head');
  var postForm=document.getElementById('postForm');
  var sidebarSearch=document.querySelector('.sidebar-search');
  var newPost=document.getElementById('newPost');
  if(!workspace||!workspaceHead||!postForm||!sidebarSearch)return;

  var csrf='';
  var config=null;
  var previewObjectUrl='';
  var saving=false;

  var nav=document.createElement('button');
  nav.type='button';
  nav.className='abyss-nav-card';
  nav.innerHTML='<span class="abyss-nav-icon">◉</span><span><strong>Fresh Abyss</strong><small>Private page controls</small></span><span class="abyss-nav-state">LIVE</span>';
  sidebarSearch.insertAdjacentElement('afterend',nav);

  var manager=document.createElement('section');
  manager.id='freshAbyssManager';
  manager.className='abyss-manager';
  manager.hidden=true;
  manager.innerHTML=''
    +'<div class="abyss-manager-head">'
      +'<div><p class="eyebrow">HIDDEN PAGE</p><h1>Fresh Abyss</h1><p>Control whether the secret page is visible and replace its image without touching the rest of your website.</p></div>'
      +'<div class="abyss-head-actions"><a href="https://danny4686.com/fresh_abyss/" target="_blank" rel="noopener">Open page</a><button id="abyssBack" class="secondary" type="button">Journal editor</button></div>'
    +'</div>'
    +'<div id="abyssFeedback" class="abyss-feedback" hidden role="status" aria-live="polite">'
      +'<span class="abyss-feedback-icon"><span class="abyss-feedback-spinner"></span><span class="abyss-feedback-check">✓</span><span class="abyss-feedback-error">!</span></span>'
      +'<span><strong id="abyssFeedbackTitle">Saving Fresh Abyss</strong><small id="abyssFeedbackDetail">Preparing the update…</small></span>'
    +'</div>'
    +'<div class="abyss-layout">'
      +'<div class="abyss-controls">'
        +'<section class="abyss-card abyss-visibility-card">'
          +'<div class="abyss-card-heading"><div><p class="eyebrow">VISIBILITY</p><h2>Secret page status</h2></div><span id="abyssStatusPill" class="abyss-status-pill">Loading</span></div>'
          +'<label class="abyss-toggle-row" for="abyssEnabled">'
            +'<span><strong>Make Fresh Abyss visible</strong><small>When turned off, the URL displays a completely blank black page with no links or image.</small></span>'
            +'<span class="abyss-switch"><input id="abyssEnabled" type="checkbox"><span></span></span>'
          +'</label>'
        +'</section>'
        +'<section class="abyss-card">'
          +'<div class="abyss-card-heading"><div><p class="eyebrow">IMAGE</p><h2>Change the image</h2></div><p>Uploading is recommended because Discord links can expire.</p></div>'
          +'<label class="abyss-upload"><span>Upload a replacement image</span><input id="abyssImageFile" type="file" accept="image/*"><small id="abyssFileName">No new file selected</small></label>'
          +'<div class="abyss-divider"><span>OR</span></div>'
          +'<label><span>Image URL</span><input id="abyssImageUrl" type="url" inputmode="url" placeholder="https://example.com/image.png"></label>'
          +'<p class="abyss-note">A selected upload takes priority over the URL. The page remains unlinked and marked not to appear in search results.</p>'
        +'</section>'
        +'<button id="abyssSave" class="primary abyss-save" type="button">Save Fresh Abyss</button>'
      +'</div>'
      +'<aside class="abyss-preview-card">'
        +'<div class="abyss-preview-top"><span>PAGE PREVIEW</span><span id="abyssPreviewState">VISIBLE</span></div>'
        +'<div id="abyssPreview" class="abyss-preview"><span>Loading image…</span></div>'
        +'<div class="abyss-preview-copy"><strong>danny4686.com/fresh_abyss</strong><small id="abyssUpdated">Not changed through the dashboard yet</small></div>'
      +'</aside>'
    +'</div>';
  workspace.insertBefore(manager,postForm);

  var enabled=document.getElementById('abyssEnabled');
  var statusPill=document.getElementById('abyssStatusPill');
  var previewState=document.getElementById('abyssPreviewState');
  var preview=document.getElementById('abyssPreview');
  var imageFile=document.getElementById('abyssImageFile');
  var imageUrl=document.getElementById('abyssImageUrl');
  var fileName=document.getElementById('abyssFileName');
  var saveButton=document.getElementById('abyssSave');
  var feedback=document.getElementById('abyssFeedback');
  var feedbackTitle=document.getElementById('abyssFeedbackTitle');
  var feedbackDetail=document.getElementById('abyssFeedbackDetail');
  var updated=document.getElementById('abyssUpdated');

  function publicUrl(value){
    if(!value)return '';
    if(/^https?:\/\//i.test(value))return value;
    return 'https://danny4686.com/'+String(value).replace(/^\/+/, '');
  }

  function clearObjectUrl(){
    if(previewObjectUrl){URL.revokeObjectURL(previewObjectUrl);previewObjectUrl='';}
  }

  async function request(url,options){
    options=options||{};
    options.headers=options.headers||{};
    if(options.method&&options.method!=='GET')options.headers['X-CSRF-Token']=csrf;
    var response=await fetch(url,options);
    var data=await response.json().catch(function(){return {};});
    if(!response.ok)throw new Error(data.error||'Fresh Abyss could not be updated.');
    return data;
  }

  function showJournal(){
    manager.hidden=true;
    workspaceHead.hidden=false;
    postForm.hidden=false;
    nav.classList.remove('active');
  }

  async function showManager(){
    workspaceHead.hidden=true;
    postForm.hidden=true;
    manager.hidden=false;
    nav.classList.add('active');
    window.scrollTo({top:0,behavior:'smooth'});
    if(!config)await load();
  }

  function setBusy(busy){
    saving=busy;
    [enabled,imageFile,imageUrl,saveButton].forEach(function(control){control.disabled=busy;});
    manager.classList.toggle('is-saving',busy);
    saveButton.textContent=busy?'Saving changes…':'Save Fresh Abyss';
  }

  function showFeedback(kind,title,detail){
    feedback.hidden=false;
    feedback.className='abyss-feedback is-'+kind;
    feedbackTitle.textContent=title;
    feedbackDetail.textContent=detail;
    if(kind==='success'){
      setTimeout(function(){feedback.classList.add('is-leaving');},2800);
      setTimeout(function(){feedback.hidden=true;feedback.className='abyss-feedback';},3250);
    }
  }

  function updateVisibilityUi(){
    var isEnabled=enabled.checked;
    statusPill.textContent=isEnabled?'Visible':'Hidden';
    statusPill.classList.toggle('is-off',!isEnabled);
    previewState.textContent=isEnabled?'VISIBLE':'HIDDEN';
    previewState.classList.toggle('is-off',!isEnabled);
    preview.classList.toggle('is-disabled',!isEnabled);
    nav.querySelector('.abyss-nav-state').textContent=isEnabled?'LIVE':'OFF';
    nav.classList.toggle('is-off',!isEnabled);
  }

  function renderPreview(){
    clearObjectUrl();
    var file=imageFile.files&&imageFile.files[0];
    var source='';
    if(file){previewObjectUrl=URL.createObjectURL(file);source=previewObjectUrl;}
    else source=publicUrl(imageUrl.value.trim()||(config&&config.image)||'');

    preview.replaceChildren();
    if(!source){var empty=document.createElement('span');empty.textContent='Choose an image';preview.appendChild(empty);return;}
    var image=document.createElement('img');image.src=source;image.alt='Fresh Abyss preview';image.referrerPolicy='no-referrer';
    image.onerror=function(){preview.classList.add('has-error');};
    image.onload=function(){preview.classList.remove('has-error');};
    preview.appendChild(image);
  }

  function applyConfig(value){
    config=value;
    enabled.checked=value.enabled!==false;
    imageUrl.value=value.image||'';
    imageFile.value='';
    fileName.textContent='No new file selected';
    if(value.updatedAt){
      var date=new Date(value.updatedAt);
      updated.textContent='Last changed '+date.toLocaleString();
    }else updated.textContent='Not changed through the dashboard yet';
    updateVisibilityUi();
    renderPreview();
  }

  async function load(){
    try{
      statusPill.textContent='Loading';
      var session=await request('/api/session');csrf=session.csrfToken;
      var data=await request('/api/fresh-abyss');
      applyConfig(data.config);
    }catch(error){
      showFeedback('error','Could not load Fresh Abyss',error.message);
      statusPill.textContent='Error';
    }
  }

  async function save(){
    if(saving)return;
    try{
      setBusy(true);
      showFeedback('loading',enabled.checked?'Publishing Fresh Abyss':'Hiding Fresh Abyss','Uploading the image and creating the GitHub commit…');
      var data=new FormData();
      data.append('enabled',String(enabled.checked));
      data.append('imageUrl',imageUrl.value.trim());
      if(imageFile.files[0])data.append('image',imageFile.files[0]);
      var result=await request('/api/fresh-abyss',{method:'POST',body:data});
      applyConfig(result.config);
      manager.classList.remove('just-saved');
      void manager.offsetWidth;
      manager.classList.add('just-saved');
      showFeedback('success',result.config.enabled?'Fresh Abyss is live':'Fresh Abyss is hidden',result.config.enabled?'The page and image were updated successfully.':'The URL now displays a blank page with no image or links.');
    }catch(error){
      showFeedback('error','Fresh Abyss was not changed',error.message);
    }finally{
      setBusy(false);
    }
  }

  nav.addEventListener('click',showManager);
  document.getElementById('abyssBack').addEventListener('click',showJournal);
  if(newPost)newPost.addEventListener('click',showJournal,true);
  enabled.addEventListener('change',updateVisibilityUi);
  imageUrl.addEventListener('input',function(){if(!imageFile.files[0])renderPreview();});
  imageFile.addEventListener('change',function(){fileName.textContent=imageFile.files[0]?imageFile.files[0].name:'No new file selected';renderPreview();});
  saveButton.addEventListener('click',save);

  load();
})();
`;
