export const FRESH_ABYSS_ADMIN_V2_JS = String.raw`
(function(){
  var dashboard=document.querySelector('.dashboard');
  var sidebar=dashboard&&dashboard.querySelector('.sidebar');
  var workspace=dashboard&&dashboard.querySelector('.workspace');
  var workspaceHead=workspace&&workspace.querySelector('.workspace-head');
  var postForm=document.getElementById('postForm');
  var newPost=document.getElementById('newPost');
  var header=document.querySelector('.admin-header');
  if(!dashboard||!sidebar||!workspace||!workspaceHead||!postForm||!header)return;

  var csrf='';
  var config=null;
  var previewObjectUrl='';
  var saving=false;

  var tabs=document.createElement('nav');
  tabs.className='admin-section-tabs';
  tabs.setAttribute('aria-label','Admin sections');
  tabs.innerHTML=''
    +'<button id="journalSectionTab" class="admin-section-tab active" type="button" aria-selected="true">'
      +'<span class="admin-section-tab-icon">✦</span>'
      +'<span><strong>Journal</strong><small>Create and manage posts</small></span>'
    +'</button>'
    +'<button id="abyssSectionTab" class="admin-section-tab" type="button" aria-selected="false">'
      +'<span class="admin-section-tab-icon">◉</span>'
      +'<span><strong>Fresh Abyss</strong><small>Secret URL and media</small></span>'
      +'<span id="abyssTabState" class="admin-section-tab-state">LIVE</span>'
    +'</button>';
  header.insertAdjacentElement('afterend',tabs);

  var manager=document.createElement('section');
  manager.id='freshAbyssManager';
  manager.className='abyss-manager';
  manager.hidden=true;
  manager.innerHTML=''
    +'<div class="abyss-manager-head">'
      +'<div><p class="eyebrow">HIDDEN PAGE</p><h1>Fresh Abyss</h1><p>Control the secret URL, its visibility, and the image, animated GIF, or video displayed inside the frame.</p></div>'
      +'<div class="abyss-head-actions"><a href="https://danny4686.com/fresh_abyss/" target="_blank" rel="noopener">Open Fresh Abyss</a></div>'
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
            +'<span><strong>Make Fresh Abyss visible</strong><small>When off, the URL displays a completely blank black page with no media, text, navigation, or links.</small></span>'
            +'<span class="abyss-switch"><input id="abyssEnabled" type="checkbox"><span></span></span>'
          +'</label>'
        +'</section>'
        +'<section class="abyss-card">'
          +'<div class="abyss-card-heading"><div><p class="eyebrow">MEDIA</p><h2>Image, GIF, or video</h2></div><p>Uploading directly is recommended because external links, especially Discord links, can expire.</p></div>'
          +'<label class="abyss-upload"><span>Upload replacement media</span><input id="abyssMediaFile" type="file" accept="image/*,video/*,.gif"><small id="abyssFileName">Images, GIFs, and videos up to 30 MB</small></label>'
          +'<div class="abyss-divider"><span>OR</span></div>'
          +'<label><span>Media URL</span><input id="abyssMediaUrl" type="url" inputmode="url" placeholder="https://example.com/media.mp4"></label>'
          +'<label class="abyss-type-field"><span>URL media type</span><select id="abyssMediaType"><option value="">Detect automatically</option><option value="image">Image or animated GIF</option><option value="video">Video</option></select><small>Choose Video when a link does not end in .mp4 or .webm.</small></label>'
          +'<p class="abyss-note">A selected upload takes priority over the URL. Uploaded videos are shown with controls and also start muted, looped, and ready for mobile playback.</p>'
        +'</section>'
        +'<button id="abyssSave" class="primary abyss-save" type="button">Save Fresh Abyss</button>'
      +'</div>'
      +'<aside class="abyss-preview-card">'
        +'<div class="abyss-preview-top"><span>PAGE PREVIEW</span><span id="abyssPreviewState">VISIBLE</span></div>'
        +'<div id="abyssPreview" class="abyss-preview"><span>Loading media…</span></div>'
        +'<div class="abyss-preview-copy"><strong>danny4686.com/fresh_abyss</strong><small id="abyssUpdated">Not changed through the dashboard yet</small></div>'
      +'</aside>'
    +'</div>';
  workspace.insertBefore(manager,postForm);

  var journalTab=document.getElementById('journalSectionTab');
  var abyssTab=document.getElementById('abyssSectionTab');
  var tabState=document.getElementById('abyssTabState');
  var enabled=document.getElementById('abyssEnabled');
  var statusPill=document.getElementById('abyssStatusPill');
  var previewState=document.getElementById('abyssPreviewState');
  var preview=document.getElementById('abyssPreview');
  var mediaFile=document.getElementById('abyssMediaFile');
  var mediaUrl=document.getElementById('abyssMediaUrl');
  var mediaType=document.getElementById('abyssMediaType');
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

  function detectType(source,mime,selected){
    if(mime&&mime.indexOf('video/')===0)return 'video';
    if(mime&&mime.indexOf('image/')===0)return 'image';
    if(selected==='video'||selected==='image')return selected;
    try{
      var pathname=new URL(source,window.location.href).pathname;
      return /\.(mp4|webm|mov|m4v|ogv|ogg)$/i.test(pathname)?'video':'image';
    }catch(error){
      return /\.(mp4|webm|mov|m4v|ogv|ogg)(?:$|[?#])/i.test(String(source||''))?'video':'image';
    }
  }

  function clearObjectUrl(){
    if(previewObjectUrl){URL.revokeObjectURL(previewObjectUrl);previewObjectUrl='';}
  }

  function stopPreviewVideo(){
    var video=preview.querySelector('video');
    if(video)video.pause();
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

  function setActiveTab(name,updateHash){
    var isAbyss=name==='abyss';
    journalTab.classList.toggle('active',!isAbyss);
    abyssTab.classList.toggle('active',isAbyss);
    journalTab.setAttribute('aria-selected',String(!isAbyss));
    abyssTab.setAttribute('aria-selected',String(isAbyss));
    dashboard.classList.toggle('is-abyss-view',isAbyss);
    sidebar.hidden=isAbyss;
    workspaceHead.hidden=isAbyss;
    postForm.hidden=isAbyss;
    manager.hidden=!isAbyss;

    if(isAbyss){
      window.scrollTo({top:0,behavior:'smooth'});
      if(!config)load();
      if(updateHash!==false)history.replaceState(null,'','#fresh-abyss');
    }else{
      stopPreviewVideo();
      if(updateHash!==false)history.replaceState(null,'',window.location.pathname+window.location.search+'#journal');
    }
  }

  function setBusy(busy){
    saving=busy;
    [enabled,mediaFile,mediaUrl,mediaType,saveButton].forEach(function(control){control.disabled=busy;});
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
    tabState.textContent=isEnabled?'LIVE':'OFF';
    tabState.classList.toggle('is-off',!isEnabled);
    abyssTab.classList.toggle('is-off',!isEnabled);
  }

  function renderPreview(){
    stopPreviewVideo();
    clearObjectUrl();
    var file=mediaFile.files&&mediaFile.files[0];
    var source='';
    var mime='';
    if(file){
      previewObjectUrl=URL.createObjectURL(file);
      source=previewObjectUrl;
      mime=file.type||'';
    }else{
      source=publicUrl(mediaUrl.value.trim()||(config&&(config.media||config.image))||'');
    }

    var type=detectType(source,mime,mediaType.value||((config&&config.mediaType)||''));
    preview.replaceChildren();
    preview.classList.remove('has-error');
    if(!source){
      var empty=document.createElement('span');
      empty.textContent='Choose media';
      preview.appendChild(empty);
      return;
    }

    var node=document.createElement(type==='video'?'video':'img');
    node.src=source;
    node.referrerPolicy='no-referrer';
    if(type==='video'){
      node.controls=true;
      node.autoplay=true;
      node.muted=true;
      node.loop=true;
      node.playsInline=true;
      node.preload='metadata';
      node.setAttribute('aria-label','Fresh Abyss video preview');
      node.onerror=function(){preview.classList.add('has-error');};
      node.onloadeddata=function(){preview.classList.remove('has-error');};
      node.play().catch(function(){});
    }else{
      node.alt='Fresh Abyss preview';
      node.onerror=function(){preview.classList.add('has-error');};
      node.onload=function(){preview.classList.remove('has-error');};
    }
    preview.appendChild(node);
  }

  function applyConfig(value){
    config=value;
    enabled.checked=value.enabled!==false;
    mediaUrl.value=value.media||value.image||'';
    mediaType.value=value.mediaType||'';
    mediaFile.value='';
    fileName.textContent='Images, GIFs, and videos up to 30 MB';
    if(value.updatedAt){
      var date=new Date(value.updatedAt);
      updated.textContent='Last changed '+date.toLocaleString();
    }else{
      updated.textContent='Not changed through the dashboard yet';
    }
    updateVisibilityUi();
    renderPreview();
  }

  async function load(){
    try{
      statusPill.textContent='Loading';
      var session=await request('/api/session');
      csrf=session.csrfToken;
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
      showFeedback('loading',enabled.checked?'Publishing Fresh Abyss':'Hiding Fresh Abyss','Uploading the media and creating the GitHub commit…');
      var data=new FormData();
      data.append('enabled',String(enabled.checked));
      data.append('mediaUrl',mediaUrl.value.trim());
      data.append('mediaType',mediaType.value);
      if(mediaFile.files[0])data.append('media',mediaFile.files[0]);
      var result=await request('/api/fresh-abyss',{method:'POST',body:data});
      applyConfig(result.config);
      manager.classList.remove('just-saved');
      void manager.offsetWidth;
      manager.classList.add('just-saved');
      showFeedback(
        'success',
        result.config.enabled?'Fresh Abyss is live':'Fresh Abyss is hidden',
        result.config.enabled?'The secret page and its media were updated successfully.':'The URL now displays a blank page with no media or links.'
      );
    }catch(error){
      showFeedback('error','Fresh Abyss was not changed',error.message);
    }finally{
      setBusy(false);
    }
  }

  journalTab.addEventListener('click',function(){setActiveTab('journal');});
  abyssTab.addEventListener('click',function(){setActiveTab('abyss');});
  if(newPost)newPost.addEventListener('click',function(){setActiveTab('journal');},true);
  enabled.addEventListener('change',updateVisibilityUi);
  mediaUrl.addEventListener('input',function(){if(!mediaFile.files[0])renderPreview();});
  mediaType.addEventListener('change',renderPreview);
  mediaFile.addEventListener('change',function(){
    var file=mediaFile.files[0];
    fileName.textContent=file?file.name+' · '+Math.max(.01,file.size/1024/1024).toFixed(2)+' MB':'Images, GIFs, and videos up to 30 MB';
    renderPreview();
  });
  saveButton.addEventListener('click',save);
  window.addEventListener('hashchange',function(){setActiveTab(location.hash==='#fresh-abyss'?'abyss':'journal',false);});

  load();
  setActiveTab(location.hash==='#fresh-abyss'?'abyss':'journal',false);
})();
`;
