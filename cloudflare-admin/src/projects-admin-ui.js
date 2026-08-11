export const PROJECTS_ADMIN_JS = String.raw`
(function(){
  var dashboard=document.querySelector('.dashboard');
  var sidebar=dashboard&&dashboard.querySelector('.sidebar');
  var workspace=dashboard&&dashboard.querySelector('.workspace');
  var workspaceHead=workspace&&workspace.querySelector('.workspace-head');
  var postForm=document.getElementById('postForm');
  var tabs=document.querySelector('.admin-section-tabs');
  var journalTab=document.getElementById('journalSectionTab');
  var abyssTab=document.getElementById('abyssSectionTab');
  var abyssManager=document.getElementById('freshAbyssManager');
  var settingsTab=document.getElementById('siteIntroSectionTab');
  var settingsManager=document.getElementById('siteIntroManager');
  if(!dashboard||!sidebar||!workspace||!workspaceHead||!postForm||!tabs||!journalTab||!abyssTab)return;

  var tab=document.createElement('button');
  tab.id='projectsSectionTab';tab.className='admin-section-tab';tab.type='button';tab.setAttribute('aria-selected','false');
  tab.innerHTML='<span class="admin-section-tab-icon">◇</span><span><strong>Projects</strong><small>Homepage work</small></span><span id="projectsTabState" class="admin-section-tab-state">0</span>';
  tabs.appendChild(tab);

  var manager=document.createElement('section');
  manager.id='projectsManager';manager.className='projects-manager';manager.hidden=true;
  manager.innerHTML=''
    +'<div class="projects-manager-head"><div><p class="eyebrow">HOMEPAGE CONTENT</p><h1>Projects</h1><p>Add, edit, reorder, link, style, publish, or keep projects as drafts. Only published projects appear on the main page.</p></div><a href="https://danny4686.com/#projects" target="_blank" rel="noopener">Open projects</a></div>'
    +'<div id="projectsFeedback" class="projects-feedback" hidden role="status" aria-live="polite"></div>'
    +'<div class="projects-layout">'
      +'<aside class="projects-sidebar-card"><div class="projects-sidebar-top"><strong>Project list</strong><button id="newProjectButton" type="button">+ New</button></div><div id="projectsList" class="projects-list"></div></aside>'
      +'<section class="project-editor-card">'
        +'<div class="project-editor-heading"><div><p class="eyebrow">PROJECT EDITOR</p><h2 id="projectEditorTitle">Create a project</h2><p id="projectEditorSubtitle">Build a polished card, then publish it when it is ready.</p></div><label class="project-live-switch"><input id="projectPublished" type="checkbox" checked><span>Published</span></label></div>'
        +'<form id="projectEditorForm" class="project-editor-grid">'
          +'<label class="project-field"><span>Project name</span><input id="projectTitle" maxlength="90" required placeholder="CloudLab"></label>'
          +'<label class="project-field"><span>Category / kicker</span><input id="projectKicker" maxlength="40" placeholder="COMMUNITY"></label>'
          +'<label class="project-field"><span>Status badge</span><input id="projectBadge" maxlength="28" placeholder="IN DEVELOPMENT"></label>'
          +'<label class="project-field"><span>Project URL</span><input id="projectUrl" maxlength="600" placeholder="https://… or /page/"></label>'
          +'<label class="project-field wide"><span>Description</span><textarea id="projectDescription" maxlength="1200" required placeholder="What are you building?"></textarea></label>'
          +'<label class="project-field"><span>Accent</span><select id="projectAccent"><option value="cyan">Cloud cyan</option><option value="gold">Gold</option><option value="mint">Mint</option><option value="orange">Orange</option></select></label>'
          +'<label class="project-field"><span>Card layout</span><select id="projectLayout"><option value="media-left">Media left</option><option value="media-top">Media top</option><option value="compact">Compact</option></select></label>'
          +'<label class="project-field"><span>Image fit</span><select id="projectFit"><option value="cover">Fill card</option><option value="contain">Show full image</option></select></label>'
          +'<label class="project-field"><span>Button label</span><input id="projectButtonLabel" maxlength="40" placeholder="Open project"></label>'
          +'<div class="project-options">'
            +'<label class="project-option"><input id="projectShowButton" type="checkbox" checked><span><strong>Show button</strong>Display a clear action button when a URL is set.</span></label>'
            +'<label class="project-option"><input id="projectClickable" type="checkbox"><span><strong>Clickable card</strong>Let visitors open the URL by clicking the card itself.</span></label>'
            +'<label class="project-option"><input id="projectNewTab" type="checkbox" checked><span><strong>Open new tab</strong>Best for Roblox, Discord, GitHub, and other external links.</span></label>'
          +'</div>'
          +'<div class="project-media-editor">'
            +'<div id="projectMediaPreview" class="project-media-preview"><span class="project-media-empty">No project image selected</span></div>'
            +'<div class="project-media-controls"><strong>Project image</strong><small id="projectImageCurrent">No image selected</small><input id="projectImageInput" type="file" accept="image/png,image/jpeg,image/webp" hidden><button id="projectChooseImage" type="button">Choose image</button><button id="projectClearImage" type="button">Remove image</button><p class="project-media-note">PNG, JPG, or WebP up to 8 MB. Existing website image paths are preserved when editing.</p></div>'
          +'</div>'
          +'<div class="project-card-preview"><small>LIVE CARD PREVIEW</small><div id="projectPreviewShell" class="project-preview-shell"><div id="projectPreviewArt" class="project-preview-art"><span class="project-media-empty">IMAGE</span></div><div class="project-preview-copy"><span id="projectPreviewKicker">PROJECT</span><h3 id="projectPreviewTitle">Your project</h3><p id="projectPreviewDescription">The project description will appear here.</p><b id="projectPreviewButton" class="project-preview-button">Open project</b></div></div></div>'
          +'<div class="project-editor-actions"><div class="left"><button id="projectDelete" class="delete" type="button" disabled>Remove project</button><button id="projectReset" type="button">Clear editor</button></div><button id="projectSave" class="save" type="submit">Save project</button></div>'
        +'</form>'
      +'</section>'
    +'</div>';
  workspace.insertBefore(manager,postForm);

  var byId=function(id){return document.getElementById(id);};
  var list=byId('projectsList');var feedback=byId('projectsFeedback');var form=byId('projectEditorForm');var imageInput=byId('projectImageInput');
  var projects=[];var currentId='';var csrf='';var busy=false;var previewObject='';var removedImage=false;

  function escapeUrl(value){return String(value||'').trim();}
  function publicUrl(path){if(!path)return '';if(/^https?:\/\//i.test(path))return path;return 'https://danny4686.com/'+String(path).replace(/^\/+/, '');}
  function clearObject(){if(previewObject){URL.revokeObjectURL(previewObject);previewObject='';}}
  function showFeedback(text,error){feedback.hidden=false;feedback.className='projects-feedback '+(error?'is-error':'is-success');feedback.textContent=text;window.clearTimeout(showFeedback.timer);if(!error)showFeedback.timer=window.setTimeout(function(){feedback.hidden=true;},4200);}
  function setBusy(value){busy=value;manager.classList.toggle('is-busy',value);byId('projectSave').disabled=value;byId('newProjectButton').disabled=value;}
  async function request(url,options){options=options||{};options.headers=options.headers||{};if(options.method&&options.method!=='GET')options.headers['X-CSRF-Token']=csrf;var response=await fetch(url,options);var data=await response.json().catch(function(){return {};});if(!response.ok)throw new Error(data.error||'Project request failed.');return data;}
  function projectById(id){return projects.find(function(item){return item.id===id;});}
  function selectedProject(){return currentId?projectById(currentId):null;}

  function renderList(){
    list.replaceChildren();byId('projectsTabState').textContent=String(projects.filter(function(p){return !p.draft;}).length);
    if(!projects.length){var empty=document.createElement('div');empty.className='projects-empty';empty.textContent='No projects yet. Create one to start building the homepage list.';list.appendChild(empty);return;}
    projects.forEach(function(project,index){
      var item=document.createElement('div');item.className='project-list-item'+(project.id===currentId?' is-active':'');item.dataset.projectId=project.id;
      var open=document.createElement('button');open.type='button';open.className='project-list-open';open.innerHTML='<strong></strong><small></small><span class="project-list-state'+(project.draft?' is-draft':'')+'"></span>';open.querySelector('strong').textContent=project.title;open.querySelector('small').textContent=project.kicker||'PROJECT';open.querySelector('.project-list-state').textContent=project.draft?'DRAFT':'LIVE';open.onclick=function(){loadEditor(project.id);};
      var actions=document.createElement('div');actions.className='project-list-actions';
      var up=document.createElement('button');up.type='button';up.textContent='↑';up.title='Move up';up.disabled=busy||index===0;up.onclick=function(){move(project.id,-1);};
      var down=document.createElement('button');down.type='button';down.textContent='↓';down.title='Move down';down.disabled=busy||index===projects.length-1;down.onclick=function(){move(project.id,1);};
      var toggle=document.createElement('button');toggle.type='button';toggle.textContent=project.draft?'●':'○';toggle.title=project.draft?'Publish project':'Move to drafts';toggle.disabled=busy;toggle.onclick=function(){togglePublished(project.id);};
      actions.append(up,down,toggle);item.append(open,actions);list.appendChild(item);
    });
  }

  function currentImageSource(){
    var file=imageInput.files[0];if(file){if(!previewObject)previewObject=URL.createObjectURL(file);return previewObject;}
    var project=selectedProject();return !removedImage&&project&&project.image?publicUrl(project.image):'';
  }
  function renderImagePreview(){
    var source=currentImageSource();var preview=byId('projectMediaPreview');var art=byId('projectPreviewArt');preview.classList.toggle('is-contain',byId('projectFit').value==='contain');art.classList.toggle('contain',byId('projectFit').value==='contain');preview.replaceChildren();art.replaceChildren();
    if(!source){var a=document.createElement('span');a.className='project-media-empty';a.textContent='No project image selected';preview.appendChild(a);var b=a.cloneNode(true);b.textContent='IMAGE';art.appendChild(b);byId('projectImageCurrent').textContent='No image selected';return;}
    var one=document.createElement('img');one.src=source;one.alt='Project image preview';var two=one.cloneNode();preview.appendChild(one);art.appendChild(two);byId('projectImageCurrent').textContent=imageInput.files[0]?'New image: '+imageInput.files[0].name:(selectedProject()&&selectedProject().image||'Current image');
  }
  function renderPreview(){
    byId('projectPreviewTitle').textContent=byId('projectTitle').value.trim()||'Your project';byId('projectPreviewKicker').textContent=(byId('projectKicker').value.trim()||'PROJECT').toUpperCase();byId('projectPreviewDescription').textContent=byId('projectDescription').value.trim()||'The project description will appear here.';byId('projectPreviewButton').textContent=byId('projectButtonLabel').value.trim()||'Open project';byId('projectPreviewButton').hidden=!byId('projectShowButton').checked||!byId('projectUrl').value.trim();
    var shell=byId('projectPreviewShell');var accent=byId('projectAccent').value;var color=accent==='gold'?'#f2c75c':accent==='mint'?'#8bcf9b':accent==='orange'?'#ed8b45':'#68d0df';shell.style.borderColor=color+'55';byId('projectPreviewKicker').style.color=color;byId('projectPreviewButton').style.background=color;
    renderImagePreview();
  }
  function clearEditor(){
    currentId='';removedImage=false;clearObject();imageInput.value='';form.reset();byId('projectPublished').checked=true;byId('projectAccent').value='cyan';byId('projectLayout').value='media-left';byId('projectFit').value='cover';byId('projectShowButton').checked=true;byId('projectNewTab').checked=true;byId('projectClickable').checked=false;byId('projectEditorTitle').textContent='Create a project';byId('projectEditorSubtitle').textContent='Build a polished card, then publish it when it is ready.';byId('projectDelete').disabled=true;renderList();renderPreview();
  }
  function loadEditor(id){
    var project=projectById(id);if(!project)return;currentId=id;removedImage=false;clearObject();imageInput.value='';byId('projectTitle').value=project.title||'';byId('projectKicker').value=project.kicker||'';byId('projectBadge').value=project.badge||'';byId('projectUrl').value=project.url||'';byId('projectDescription').value=project.description||'';byId('projectAccent').value=project.accent||'cyan';byId('projectLayout').value=project.layout||'media-left';byId('projectFit').value=project.fit||'cover';byId('projectButtonLabel').value=project.buttonLabel||'Open project';byId('projectShowButton').checked=project.showButton!==false;byId('projectClickable').checked=Boolean(project.clickable);byId('projectNewTab').checked=project.newTab!==false;byId('projectPublished').checked=!project.draft;byId('projectEditorTitle').textContent='Edit project';byId('projectEditorSubtitle').textContent='Update the card, image, behavior, link, or publish state.';byId('projectDelete').disabled=false;renderList();renderPreview();window.scrollTo({top:0,behavior:'smooth'});
  }

  function metadata(){var project=selectedProject();return {id:currentId,title:byId('projectTitle').value.trim(),kicker:byId('projectKicker').value.trim(),badge:byId('projectBadge').value.trim(),description:byId('projectDescription').value.trim(),url:escapeUrl(byId('projectUrl').value),buttonLabel:byId('projectButtonLabel').value.trim(),showButton:byId('projectShowButton').checked,clickable:byId('projectClickable').checked,newTab:byId('projectNewTab').checked,draft:!byId('projectPublished').checked,accent:byId('projectAccent').value,layout:byId('projectLayout').value,fit:byId('projectFit').value,existingImage:!removedImage&&project?project.image||'':''};}

  form.addEventListener('submit',async function(event){
    event.preventDefault();if(busy)return;var meta=metadata();if(!meta.title||!meta.description){showFeedback('Project name and description are required.',true);return;}
    setBusy(true);
    try{var data=new FormData();data.append('metadata',JSON.stringify(meta));if(imageInput.files[0])data.append('image',imageInput.files[0]);var result=await request('/api/projects',{method:'POST',body:data});projects=result.projects||[];currentId=result.project&&result.project.id||'';clearObject();imageInput.value='';removedImage=false;renderList();loadEditor(currentId);showFeedback('Project saved to the site repository.');}
    catch(error){showFeedback(error.message,true);}finally{setBusy(false);renderList();}
  });

  byId('projectDelete').addEventListener('click',async function(){if(!currentId||busy)return;var project=selectedProject();if(!project||!confirm('Remove "'+project.title+'" from the project list?'))return;setBusy(true);try{var data=await request('/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'delete',id:currentId})});projects=data.projects||[];clearEditor();showFeedback('Project removed.');}catch(error){showFeedback(error.message,true);}finally{setBusy(false);renderList();}});
  byId('projectReset').addEventListener('click',clearEditor);byId('newProjectButton').addEventListener('click',clearEditor);
  byId('projectChooseImage').addEventListener('click',function(){imageInput.click();});
  byId('projectClearImage').addEventListener('click',function(){clearObject();imageInput.value='';removedImage=true;renderPreview();});
  imageInput.addEventListener('change',function(){var file=imageInput.files[0];if(file&&(!/^image\/(png|jpeg|webp)$/i.test(file.type)||file.size>8*1024*1024)){imageInput.value='';showFeedback('Project images must be PNG, JPG, or WebP and no larger than 8 MB.',true);}removedImage=false;clearObject();renderPreview();});
  form.addEventListener('input',renderPreview);form.addEventListener('change',renderPreview);

  async function move(id,direction){var index=projects.findIndex(function(item){return item.id===id;});var target=index+direction;if(index<0||target<0||target>=projects.length||busy)return;var copy=projects.slice();var temp=copy[index];copy[index]=copy[target];copy[target]=temp;projects=copy;renderList();setBusy(true);try{var data=await request('/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reorder',ids:projects.map(function(item){return item.id;})})});projects=data.projects||projects;showFeedback('Project order updated.');}catch(error){showFeedback(error.message,true);await load();}finally{setBusy(false);renderList();}}
  async function togglePublished(id){if(busy)return;setBusy(true);try{var data=await request('/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'toggle',id:id})});projects=data.projects||[];if(currentId===id)loadEditor(id);showFeedback((projectById(id)&&projectById(id).draft)?'Project moved to drafts.':'Project published.');}catch(error){showFeedback(error.message,true);}finally{setBusy(false);renderList();}}

  function hideProjects(){manager.hidden=true;tab.classList.remove('active');tab.setAttribute('aria-selected','false');}
  function activate(updateHash){
    [journalTab,abyssTab,settingsTab].forEach(function(item){if(item){item.classList.remove('active');item.setAttribute('aria-selected','false');}});tab.classList.add('active');tab.setAttribute('aria-selected','true');dashboard.classList.add('is-abyss-view');sidebar.hidden=true;workspaceHead.hidden=true;postForm.hidden=true;if(abyssManager)abyssManager.hidden=true;if(settingsManager)settingsManager.hidden=true;manager.hidden=false;window.scrollTo({top:0,behavior:'smooth'});if(updateHash!==false)history.replaceState(null,'','#projects');if(!projects.length)load();
  }
  journalTab.addEventListener('click',hideProjects);abyssTab.addEventListener('click',hideProjects);if(settingsTab)settingsTab.addEventListener('click',hideProjects);tab.addEventListener('click',function(){activate(true);});

  async function load(){
    try{setBusy(true);var session=await fetch('/api/session').then(function(response){return response.json();});csrf=session.csrfToken||'';var data=await request('/api/projects');projects=data.projects||[];renderList();if(currentId&&projectById(currentId))loadEditor(currentId);else clearEditor();}
    catch(error){showFeedback(error.message,true);list.innerHTML='<div class="projects-empty">Projects could not be loaded. Refresh the dashboard and try again.</div>';}
    finally{setBusy(false);renderList();}
  }
  load();if(location.hash==='#projects')activate(false);
})();
`;
