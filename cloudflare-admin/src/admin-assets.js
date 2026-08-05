export const ADMIN_CSS = String.raw`
:root{color-scheme:dark;--bg:#050d12;--panel:#0c1a21;--panel2:#10232c;--text:#f4fafb;--muted:#98adb5;--line:rgba(137,190,201,.2);--cyan:#68d0df;--gold:#f2c75c;--danger:#ef6d68;--shadow:0 24px 65px rgba(0,0,0,.38)}
*{box-sizing:border-box}body{margin:0;min-height:100vh;color:var(--text);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:radial-gradient(circle at 12% 3%,rgba(104,208,223,.13),transparent 28%),radial-gradient(circle at 88% 82%,rgba(242,199,92,.06),transparent 30%),linear-gradient(180deg,#061117,#03090d)}button,input,textarea,select{font:inherit}a{color:inherit;text-decoration:none}.eyebrow{margin:0 0 7px;color:var(--cyan);font-size:.7rem;font-weight:800;letter-spacing:.14em}.muted{color:var(--muted)}
.login-shell{min-height:100vh;display:grid;place-items:center;padding:24px}.login-card{width:min(460px,100%);padding:38px;border:1px solid var(--line);border-radius:28px;background:linear-gradient(180deg,rgba(255,255,255,.035),transparent),rgba(8,22,29,.94);box-shadow:var(--shadow);text-align:center}.login-card img{width:82px;height:82px;object-fit:contain;margin:0 auto 18px}.login-card h1{margin:0 0 12px;font-size:2.4rem;letter-spacing:-.05em}.login-card p{color:var(--muted);line-height:1.65}.login-card small{display:block;margin-top:18px;color:var(--muted)}
.primary,.secondary,.danger,.icon{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 16px;border:1px solid transparent;border-radius:13px;cursor:pointer;font-weight:800;transition:transform .18s ease,filter .18s ease,border-color .18s ease}.primary{color:#061117;background:var(--cyan)}.secondary{color:var(--text);border-color:var(--line);background:rgba(255,255,255,.03)}.danger{color:#ffd9d7;border-color:rgba(239,109,104,.35);background:rgba(239,109,104,.08)}.icon{width:42px;padding:0;color:#061117;background:var(--gold);font-size:1.35rem}.primary:hover,.secondary:hover,.danger:hover,.icon:hover{transform:translateY(-1px);filter:brightness(1.06)}
.admin-header{position:sticky;top:0;z-index:40;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:13px 22px;border-bottom:1px solid var(--line);background:rgba(4,12,17,.9);backdrop-filter:blur(16px)}.admin-brand{display:flex;align-items:center;gap:12px}.admin-brand img{width:44px;height:44px;object-fit:contain}.admin-brand span{display:flex;flex-direction:column}.admin-brand small{color:var(--muted)}.header-actions{display:flex;gap:10px}.header-actions a{padding:9px 12px;border:1px solid var(--line);border-radius:11px;color:var(--muted);font-weight:750}
.dashboard{width:min(1460px,calc(100% - 28px));margin:20px auto 50px;display:grid;grid-template-columns:330px minmax(0,1fr);gap:18px}.sidebar,.editor{border:1px solid var(--line);border-radius:24px;background:rgba(9,24,31,.9);box-shadow:var(--shadow)}.sidebar{position:sticky;top:90px;align-self:start;max-height:calc(100vh - 112px);overflow:auto;padding:18px}.sidebar-head,.editor-head,.section-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px}.sidebar h2,.section-toolbar h2,.editor h1{margin:0;letter-spacing:-.035em}.post-list{display:grid;gap:9px;margin-top:18px}.post-item{width:100%;padding:13px;border:1px solid var(--line);border-radius:14px;color:var(--text);background:rgba(255,255,255,.025);text-align:left;cursor:pointer}.post-item:hover,.post-item.active{border-color:rgba(104,208,223,.48);background:rgba(104,208,223,.065)}.post-item strong,.post-item small{display:block}.post-item small{margin-top:5px;color:var(--muted)}
.editor{padding:24px}.status{padding:7px 10px;border:1px solid var(--line);border-radius:999px;color:var(--muted);font-size:.75rem;font-weight:800}.editor form{display:grid;gap:17px;margin-top:22px}.grid{display:grid;gap:14px}.grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}.grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}label>span{display:block;margin-bottom:7px;color:#dce8eb;font-size:.82rem;font-weight:800}input,textarea,select{width:100%;border:1px solid var(--line);border-radius:13px;color:var(--text);background:#09171e;padding:12px 13px;outline:none}input:focus,textarea:focus,select:focus{border-color:rgba(104,208,223,.55);box-shadow:0 0 0 3px rgba(104,208,223,.08)}textarea{resize:vertical;line-height:1.6}.upload{padding:15px;border:1px dashed rgba(145,190,202,.32);border-radius:16px;background:rgba(255,255,255,.02)}.upload input{padding:9px}.upload small{display:block;margin-top:8px;color:var(--muted);word-break:break-all}.switch{display:flex;align-items:center;gap:12px;padding:14px;border:1px solid var(--line);border-radius:15px;background:rgba(255,255,255,.02)}.switch input{width:20px;height:20px}.switch span{margin:0}.switch small{display:block;margin-top:3px;color:var(--muted)}
.section-toolbar{margin-top:8px;padding-top:18px;border-top:1px solid var(--line)}.sections{display:grid;gap:13px}.section-card{padding:16px;border:1px solid var(--line);border-radius:17px;background:rgba(255,255,255,.022)}.section-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.section-actions{display:flex;gap:7px}.section-actions button{min-height:34px;padding:6px 10px}.section-card textarea{min-height:130px}.existing-media{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0}.existing-media span{padding:6px 8px;border:1px solid var(--line);border-radius:9px;color:var(--muted);font-size:.74rem}
.editor-actions{position:sticky;bottom:12px;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:9px;padding:13px;border:1px solid var(--line);border-radius:16px;background:rgba(5,15,21,.94);backdrop-filter:blur(14px)}dialog{width:min(900px,calc(100% - 28px));max-height:90vh;overflow:auto;border:1px solid var(--line);border-radius:24px;color:var(--text);background:#07151b;box-shadow:var(--shadow)}dialog::backdrop{background:rgba(0,0,0,.72);backdrop-filter:blur(6px)}.dialog-close{position:sticky;float:right;top:0;width:40px;height:40px;border:1px solid var(--line);border-radius:50%;color:var(--text);background:#0d2028;cursor:pointer}.preview{padding:18px 10px}.preview h1{font-size:clamp(2.3rem,6vw,4.8rem);letter-spacing:-.06em}.preview h2{margin-top:36px}.preview p{color:var(--muted);line-height:1.8}.preview-media{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.preview-media img,.preview-media video{width:100%;max-height:420px;object-fit:cover;border:1px solid var(--line);border-radius:16px}
@media(max-width:900px){.dashboard{grid-template-columns:1fr}.sidebar{position:static;max-height:none}.grid.three{grid-template-columns:1fr 1fr}.editor-actions{position:static}}@media(max-width:620px){.admin-header{align-items:flex-start;padding:10px 12px}.header-actions{flex-direction:column;gap:5px}.dashboard{width:calc(100% - 14px);margin-top:10px}.editor,.sidebar{padding:15px;border-radius:18px}.grid.two,.grid.three{grid-template-columns:1fr}.editor-actions{justify-content:stretch}.editor-actions button{flex:1 1 45%}}
`;

export const ADMIN_JS = String.raw`
(function(){
  var csrf='';
  var posts=[];
  var current=null;
  var byId=function(id){return document.getElementById(id);};
  var form=byId('postForm');
  var sections=byId('sections');
  var postList=byId('postList');
  var status=byId('status');

  function setStatus(text,error){status.textContent=text;status.style.color=error?'#ffaaa6':'';}
  function slugify(value){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90);}
  async function api(url,options){
    options=options||{};
    options.headers=options.headers||{};
    if(options.method&&options.method!=='GET')options.headers['X-CSRF-Token']=csrf;
    var response=await fetch(url,options);
    var data=await response.json().catch(function(){return {};});
    if(!response.ok)throw new Error(data.error||'Request failed.');
    return data;
  }

  function addSection(data){
    data=data||{};
    var card=document.createElement('section');
    card.className='section-card';
    card.innerHTML='<div class="section-head"><strong>Section</strong><div class="section-actions"><button class="secondary up" type="button">↑</button><button class="secondary down" type="button">↓</button><button class="danger remove" type="button">Remove</button></div></div><label><span>Heading</span><input class="section-title" maxlength="180" placeholder="Section heading"></label><label><span>Text</span><textarea class="section-body" maxlength="12000" placeholder="Write paragraphs here. Leave a blank line between paragraphs."></textarea></label><label class="upload"><span>Images or videos</span><input class="section-files" type="file" accept="image/*,video/*" multiple><small>Add one file for a full-width block or several for a gallery.</small></label><div class="existing-media"></div>';
    card.querySelector('.section-title').value=data.heading||'';
    card.querySelector('.section-body').value=data.body||'';
    card._existing=Array.isArray(data.media)?data.media:[];
    var existing=card.querySelector('.existing-media');
    card._existing.forEach(function(item){var chip=document.createElement('span');chip.textContent=(item.path||'').split('/').pop()||'Existing media';existing.appendChild(chip);});
    card.querySelector('.remove').onclick=function(){card.remove();};
    card.querySelector('.up').onclick=function(){if(card.previousElementSibling)sections.insertBefore(card,card.previousElementSibling);};
    card.querySelector('.down').onclick=function(){if(card.nextElementSibling)sections.insertBefore(card.nextElementSibling,card);};
    sections.appendChild(card);
  }

  function resetForm(){
    current=null;form.reset();byId('date').value=new Date().toISOString().slice(0,10);sections.replaceChildren();addSection();byId('editorTitle').textContent='New post';byId('thumbCurrent').textContent='No file selected';byId('heroCurrent').textContent='No file selected';byId('unpublish').hidden=true;postList.querySelectorAll('.post-item').forEach(function(item){item.classList.remove('active');});setStatus('Ready');
  }

  function renderPosts(){
    postList.replaceChildren();
    if(!posts.length){var p=document.createElement('p');p.className='muted';p.textContent='No posts yet.';postList.appendChild(p);return;}
    posts.forEach(function(post){
      var button=document.createElement('button');button.type='button';button.className='post-item';
      var strong=document.createElement('strong');strong.textContent=post.title;
      var small=document.createElement('small');small.textContent=(post.comingSoon?'Coming Soon · ':'')+post.displayDate;
      button.append(strong,small);button.onclick=function(){loadPost(post.slug,button);};postList.appendChild(button);
    });
  }

  async function refreshPosts(){var data=await api('/api/posts');posts=data.posts||[];renderPosts();}

  async function loadPost(slug,button){
    try{
      setStatus('Loading…');var data=await api('/api/post?slug='+encodeURIComponent(slug));var post=data.post;current=post;
      byId('title').value=post.title||'';byId('slug').value=post.slug||'';byId('description').value=post.description||'';byId('date').value=post.date||new Date().toISOString().slice(0,10);byId('tags').value=(post.tags||[]).join(', ');byId('fit').value=post.fit||'cover';byId('comingSoon').checked=!!post.comingSoon;byId('thumbCurrent').textContent=post.thumbnail||'No thumbnail';byId('heroCurrent').textContent=post.hero||post.thumbnail||'No hero';sections.replaceChildren();(post.sections||[]).forEach(addSection);if(!(post.sections||[]).length)addSection();byId('editorTitle').textContent='Edit post';byId('unpublish').hidden=false;postList.querySelectorAll('.post-item').forEach(function(item){item.classList.toggle('active',item===button);});setStatus('Loaded');
    }catch(error){setStatus(error.message,true);alert(error.message);}
  }

  function collectMetadata(data){
    var sectionData=[];
    sections.querySelectorAll('.section-card').forEach(function(card,index){
      var uploads=[];Array.from(card.querySelector('.section-files').files).forEach(function(file,fileIndex){var field='section-'+index+'-'+fileIndex;data.append(field,file);uploads.push({field:field,alt:file.name});});
      sectionData.push({heading:card.querySelector('.section-title').value.trim(),body:card.querySelector('.section-body').value.trim(),existingMedia:card._existing||[],uploads:uploads});
    });
    return {title:byId('title').value.trim(),slug:byId('slug').value.trim(),description:byId('description').value.trim(),date:byId('date').value,tags:byId('tags').value.split(',').map(function(tag){return tag.trim();}).filter(Boolean),fit:byId('fit').value,comingSoon:byId('comingSoon').checked,existingThumbnail:current&&current.thumbnail||'',existingHero:current&&(current.hero||current.thumbnail)||'',sections:sectionData};
  }

  form.onsubmit=async function(event){
    event.preventDefault();
    try{
      setStatus('Publishing…');var data=new FormData();if(byId('thumbnail').files[0])data.append('thumbnail',byId('thumbnail').files[0]);if(byId('hero').files[0])data.append('hero',byId('hero').files[0]);data.append('metadata',JSON.stringify(collectMetadata(data)));var result=await api('/api/publish',{method:'POST',body:data});setStatus(result.comingSoon?'Coming Soon saved':'Published');await refreshPosts();var button=Array.from(postList.querySelectorAll('.post-item')).find(function(item){return item.querySelector('strong').textContent===byId('title').value.trim();});if(button)await loadPost(result.slug,button);
    }catch(error){setStatus(error.message,true);alert(error.message);}
  };

  byId('newPost').onclick=resetForm;
  byId('addSection').onclick=function(){addSection();};
  byId('title').oninput=function(){if(!current)byId('slug').value=slugify(byId('title').value);};
  byId('thumbnail').onchange=function(){byId('thumbCurrent').textContent=byId('thumbnail').files[0]?byId('thumbnail').files[0].name:(current&&current.thumbnail||'No file selected');};
  byId('hero').onchange=function(){byId('heroCurrent').textContent=byId('hero').files[0]?byId('hero').files[0].name:(current&&current.hero||'No file selected');};

  byId('saveDraft').onclick=function(){var data=new FormData();localStorage.setItem('cloudlab-journal-draft',JSON.stringify(collectMetadata(data)));setStatus('Draft saved locally');};

  byId('unpublish').onclick=async function(){
    if(!current||!current.slug||!confirm('Unpublish this post and remove its uploaded Journal media?'))return;
    try{setStatus('Unpublishing…');await api('/api/unpublish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug:current.slug})});await refreshPosts();resetForm();}catch(error){setStatus(error.message,true);alert(error.message);}
  };

  byId('preview').onclick=function(){
    var article=byId('previewContent');article.replaceChildren();var h1=document.createElement('h1');h1.textContent=byId('title').value||'Untitled post';var lead=document.createElement('p');lead.textContent=byId('description').value;article.append(h1,lead);
    sections.querySelectorAll('.section-card').forEach(function(card){var heading=card.querySelector('.section-title').value.trim();var body=card.querySelector('.section-body').value.trim();if(heading){var h2=document.createElement('h2');h2.textContent=heading;article.appendChild(h2);}body.split(/\n\s*\n/).filter(Boolean).forEach(function(text){var p=document.createElement('p');p.textContent=text;article.appendChild(p);});var files=Array.from(card.querySelector('.section-files').files);if(files.length){var media=document.createElement('div');media.className='preview-media';files.forEach(function(file){var node=document.createElement(file.type.indexOf('video/')===0?'video':'img');node.src=URL.createObjectURL(file);if(node.tagName==='VIDEO')node.controls=true;media.appendChild(node);});article.appendChild(media);}});byId('previewDialog').showModal();
  };
  byId('closePreview').onclick=function(){byId('previewDialog').close();};

  (async function(){
    try{var session=await api('/api/session');csrf=session.csrfToken;await refreshPosts();resetForm();var raw=localStorage.getItem('cloudlab-journal-draft');if(raw&&confirm('Load your locally saved Journal draft?')){var draft=JSON.parse(raw);byId('title').value=draft.title||'';byId('slug').value=draft.slug||'';byId('description').value=draft.description||'';byId('date').value=draft.date||new Date().toISOString().slice(0,10);byId('tags').value=(draft.tags||[]).join(', ');byId('fit').value=draft.fit||'cover';byId('comingSoon').checked=!!draft.comingSoon;sections.replaceChildren();(draft.sections||[]).forEach(function(section){addSection({heading:section.heading,body:section.body,media:section.existingMedia||[]});});if(!(draft.sections||[]).length)addSection();setStatus('Local draft loaded');}}catch(error){setStatus(error.message,true);}
  })();
})();
`;
