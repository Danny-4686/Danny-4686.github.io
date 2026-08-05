export const ADMIN_JS = String.raw`
(function(){
  var csrf='';
  var posts=[];
  var current=null;
  var previewObjectUrl='';
  var byId=function(id){return document.getElementById(id);};
  var form=byId('postForm');
  var sections=byId('sections');
  var postList=byId('postList');
  var status=byId('status');

  function setStatus(text,error){status.textContent=text;status.style.color=error?'#ffaaa6':'';}
  function slugify(value){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90);}
  function modeValue(){var selected=form.querySelector('input[name="postMode"]:checked');return selected?selected.value:'article';}
  function modeFromPost(post){if(post&&post.mode)return post.mode;if(post&&post.comingSoon)return 'coming-soon';if(post&&post.cardOnly)return 'card';return 'article';}
  function publicUrl(path){if(!path)return '';if(/^https?:\/\//i.test(path))return path;return 'https://danny4686.com/'+String(path).replace(/^\/+/, '');}
  function clearPreviewObjectUrl(){if(previewObjectUrl){URL.revokeObjectURL(previewObjectUrl);previewObjectUrl='';}}
  function readableDate(value){if(!value)return 'Today';var date=new Date(value+'T12:00:00');return isNaN(date.getTime())?value:date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}

  async function api(url,options){
    options=options||{};
    options.headers=options.headers||{};
    if(options.method&&options.method!=='GET')options.headers['X-CSRF-Token']=csrf;
    var response=await fetch(url,options);
    var data=await response.json().catch(function(){return {};});
    if(!response.ok)throw new Error(data.error||'Request failed.');
    return data;
  }

  function refreshSectionNumbers(){
    Array.from(sections.querySelectorAll('.section-card')).forEach(function(card,index){
      var number=card.querySelector('.section-number span');
      if(number)number.textContent=String(index+1);
    });
  }

  function renderExistingMedia(card){
    var existing=card.querySelector('.existing-media');
    existing.replaceChildren();
    (card._existing||[]).forEach(function(item,index){
      var chip=document.createElement('span');chip.className='media-chip';
      var text=document.createElement('span');text.textContent=(item.path||'').split('/').pop()||'Existing media';
      var remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Remove existing media');
      remove.onclick=function(){card._existing.splice(index,1);renderExistingMedia(card);setStatus('Unsaved changes');};
      chip.append(text,remove);existing.appendChild(chip);
    });
  }

  function addSection(data){
    data=data||{};
    var card=document.createElement('section');
    card.className='section-card';
    card.innerHTML='<div class="section-head"><div class="section-number"><span>1</span><strong>Content section</strong></div><div class="section-actions"><button class="secondary up" type="button" aria-label="Move section up">↑</button><button class="secondary down" type="button" aria-label="Move section down">↓</button><button class="danger remove" type="button">Remove</button></div></div><label><span>Heading</span><input class="section-title" maxlength="180" placeholder="Section heading"></label><label><span>Text</span><textarea class="section-body" maxlength="12000" placeholder="Write the full post information here. Leave a blank line between paragraphs."></textarea></label><label class="upload"><span>Images or videos</span><input class="section-files" type="file" accept="image/*,video/*" multiple><small>Use one file for a large feature or several files for a gallery.</small></label><div class="existing-media"></div>';
    card.querySelector('.section-title').value=data.heading||'';
    card.querySelector('.section-body').value=data.body||'';
    card._existing=Array.isArray(data.media)?data.media.slice():[];
    renderExistingMedia(card);
    card.querySelector('.remove').onclick=function(){card.remove();refreshSectionNumbers();setStatus('Unsaved changes');};
    card.querySelector('.up').onclick=function(){if(card.previousElementSibling)sections.insertBefore(card,card.previousElementSibling);refreshSectionNumbers();setStatus('Unsaved changes');};
    card.querySelector('.down').onclick=function(){if(card.nextElementSibling)sections.insertBefore(card.nextElementSibling,card);refreshSectionNumbers();setStatus('Unsaved changes');};
    sections.appendChild(card);
    refreshSectionNumbers();
  }

  function setMode(mode){
    var input=form.querySelector('input[name="postMode"][value="'+mode+'"]');
    if(input)input.checked=true;
    updateModeUi();
  }

  function updateModeUi(){
    var mode=modeValue();
    var isArticle=mode==='article';
    byId('articleFields').hidden=!isArticle;
    byId('heroUpload').classList.toggle('is-hidden',!isArticle);
    byId('previewModeBadge').textContent=mode==='article'?'FULL POST':mode==='card'?'POST ONLY':'COMING SOON';
    byId('cardPreviewAction').textContent=mode==='article'?'Read post →':mode==='card'?'Post':'Coming Soon';
    byId('modeHelpTitle').textContent=mode==='article'?'Full Post':mode==='card'?'Post Only':'Coming Soon';
    byId('modeHelpText').textContent=mode==='article'?'Readers can open the card and view the complete article.':mode==='card'?'The card stays in the Journal as the complete post. There is no second page to open.':'The card is visible but clearly marked as upcoming and cannot be opened.';
    byId('publishButton').textContent=mode==='article'?'Publish full post':mode==='card'?'Publish post card':'Save coming soon';
    updateLivePreview();
  }

  function updateLivePreview(){
    var title=byId('title').value.trim()||'Your post title';
    var description=byId('description').value.trim()||'Your short description will appear here.';
    var tags=byId('tags').value.split(',').map(function(tag){return tag.trim();}).filter(Boolean);
    var mode=modeValue();
    byId('cardPreviewTitle').textContent=title;
    byId('cardPreviewDescription').textContent=description;
    byId('cardPreviewTag').textContent=mode==='coming-soon'?'COMING SOON':mode==='card'?'POST':(tags[0]||'JOURNAL').toUpperCase();
    byId('cardPreviewDate').textContent=readableDate(byId('date').value);
    var media=byId('cardPreviewMedia');
    media.classList.toggle('contain',byId('fit').value==='contain');
    clearPreviewObjectUrl();
    var file=byId('thumbnail').files[0];
    var source='';
    var type='';
    if(file){previewObjectUrl=URL.createObjectURL(file);source=previewObjectUrl;type=file.type;}
    else if(current&&current.thumbnail){source=publicUrl(current.thumbnail);type=current.mediaType==='video'?'video/unknown':'';}
    media.replaceChildren();
    if(!source){var empty=document.createElement('span');empty.textContent='Choose a thumbnail';media.appendChild(empty);return;}
    var node=document.createElement(type.indexOf('video/')===0?'video':'img');
    node.src=source;
    if(node.tagName==='VIDEO'){node.muted=true;node.loop=true;node.playsInline=true;node.autoplay=true;}
    node.alt=title+' thumbnail';
    media.appendChild(node);
  }

  function resetForm(){
    current=null;
    form.reset();
    setMode('article');
    byId('date').value=new Date().toISOString().slice(0,10);
    sections.replaceChildren();
    addSection();
    byId('editorTitle').textContent='Create a new post';
    byId('editorSubtitle').textContent='Choose how it should appear, add the details, then publish it directly to your website.';
    byId('thumbCurrent').textContent='No file selected';
    byId('heroCurrent').textContent='Uses the thumbnail when empty';
    byId('unpublish').hidden=true;
    postList.querySelectorAll('.post-item').forEach(function(item){item.classList.remove('active');});
    setStatus('Ready');
    updateLivePreview();
  }

  function renderPosts(){
    var query=byId('postSearch').value.trim().toLowerCase();
    postList.replaceChildren();
    var filtered=posts.filter(function(post){return (post.title+' '+post.description+' '+(post.tags||[]).join(' ')).toLowerCase().indexOf(query)!==-1;});
    if(!filtered.length){var p=document.createElement('p');p.className='muted';p.textContent=query?'No matching posts.':'No posts yet.';postList.appendChild(p);return;}
    filtered.forEach(function(post){
      var mode=modeFromPost(post);
      var button=document.createElement('button');button.type='button';button.className='post-item';button.dataset.slug=post.slug;
      var strong=document.createElement('strong');strong.textContent=post.title;
      var small=document.createElement('small');
      var date=document.createElement('span');date.textContent=post.displayDate;
      var state=document.createElement('span');state.className='post-state '+(mode==='card'?'card':mode==='coming-soon'?'soon':'');state.textContent=mode==='article'?'FULL':mode==='card'?'POST':'SOON';
      small.append(date,state);button.append(strong,small);button.onclick=function(){loadPost(post.slug,button);};postList.appendChild(button);
    });
  }

  async function refreshPosts(){var data=await api('/api/posts');posts=data.posts||[];renderPosts();}

  async function loadPost(slug,button){
    try{
      setStatus('Loading…');
      var data=await api('/api/post?slug='+encodeURIComponent(slug));
      var post=data.post;current=post;
      byId('title').value=post.title||'';
      byId('slug').value=post.slug||'';
      byId('description').value=post.description||'';
      byId('date').value=post.date||new Date().toISOString().slice(0,10);
      byId('tags').value=(post.tags||[]).join(', ');
      byId('fit').value=post.fit||'cover';
      setMode(modeFromPost(post));
      byId('thumbCurrent').textContent=post.thumbnail||'No thumbnail';
      byId('heroCurrent').textContent=post.hero||post.thumbnail||'Uses the thumbnail when empty';
      sections.replaceChildren();
      (post.sections||[]).forEach(addSection);
      if(!(post.sections||[]).length)addSection();
      byId('editorTitle').textContent='Edit post';
      byId('editorSubtitle').textContent='Update the card, post type, media, or full article content.';
      byId('unpublish').hidden=false;
      postList.querySelectorAll('.post-item').forEach(function(item){item.classList.toggle('active',item===button);});
      setStatus('Loaded');
      updateLivePreview();
      window.scrollTo({top:0,behavior:'smooth'});
    }catch(error){setStatus(error.message,true);alert(error.message);}
  }

  function collectMetadata(data){
    var sectionData=[];
    sections.querySelectorAll('.section-card').forEach(function(card,index){
      var uploads=[];
      Array.from(card.querySelector('.section-files').files).forEach(function(file,fileIndex){
        var field='section-'+index+'-'+fileIndex;data.append(field,file);uploads.push({field:field,alt:file.name});
      });
      sectionData.push({heading:card.querySelector('.section-title').value.trim(),body:card.querySelector('.section-body').value.trim(),existingMedia:card._existing||[],uploads:uploads});
    });
    return {
      title:byId('title').value.trim(),
      slug:byId('slug').value.trim(),
      description:byId('description').value.trim(),
      date:byId('date').value,
      tags:byId('tags').value.split(',').map(function(tag){return tag.trim();}).filter(Boolean),
      fit:byId('fit').value,
      mode:modeValue(),
      existingThumbnail:current&&current.thumbnail||'',
      existingHero:current&&(current.hero||current.thumbnail)||'',
      sections:sectionData
    };
  }

  form.onsubmit=async function(event){
    event.preventDefault();
    try{
      var mode=modeValue();
      setStatus(mode==='article'?'Publishing…':'Saving…');
      var data=new FormData();
      if(byId('thumbnail').files[0])data.append('thumbnail',byId('thumbnail').files[0]);
      if(mode==='article'&&byId('hero').files[0])data.append('hero',byId('hero').files[0]);
      data.append('metadata',JSON.stringify(collectMetadata(data)));
      var result=await api('/api/publish',{method:'POST',body:data});
      setStatus(result.mode==='article'?'Published':result.mode==='card'?'Post card published':'Coming Soon saved');
      localStorage.removeItem('cloudlab-journal-draft');
      await refreshPosts();
      var button=postList.querySelector('.post-item[data-slug="'+result.slug+'"]');
      if(button)await loadPost(result.slug,button);
    }catch(error){setStatus(error.message,true);alert(error.message);}
  };

  function createPreviewMedia(fileOrPath,fallbackType){
    var source='';var type=fallbackType||'';
    if(fileOrPath instanceof File){source=URL.createObjectURL(fileOrPath);type=fileOrPath.type;}
    else source=publicUrl(fileOrPath);
    if(!source)return null;
    var node=document.createElement(type.indexOf('video/')===0?'video':'img');node.src=source;
    if(node.tagName==='VIDEO'){node.controls=true;node.playsInline=true;}
    return node;
  }

  byId('preview').onclick=function(){
    var mode=modeValue();
    var preview=byId('previewContent');preview.replaceChildren();
    var shell=document.createElement('div');shell.className=mode==='article'?'':'static-preview';
    var intro=document.createElement('section');intro.className='preview-intro';
    var hero=document.createElement('div');hero.className='preview-hero';
    var heroFile=mode==='article'&&byId('hero').files[0]?byId('hero').files[0]:byId('thumbnail').files[0];
    var existingHero=current&&(current.hero||current.thumbnail)||'';
    var heroNode=createPreviewMedia(heroFile||existingHero,heroFile&&heroFile.type||'');
    if(heroNode)hero.appendChild(heroNode);else{var placeholder=document.createElement('span');placeholder.textContent='Hero media';hero.appendChild(placeholder);}
    var copy=document.createElement('div');copy.className='preview-copy';
    var meta=document.createElement('div');meta.className='preview-meta';
    var badge=document.createElement('span');badge.textContent=mode==='coming-soon'?'COMING SOON':mode==='card'?'POST':(byId('tags').value.split(',')[0].trim()||'JOURNAL').toUpperCase();
    var date=document.createElement('time');date.textContent=readableDate(byId('date').value);meta.append(badge,date);
    var h1=document.createElement('h1');h1.textContent=byId('title').value||'Untitled post';
    var lead=document.createElement('p');lead.textContent=byId('description').value||'Post description';
    copy.append(meta,h1,lead);intro.append(hero,copy);shell.appendChild(intro);
    if(mode==='article'){
      var divider=document.createElement('div');divider.className='preview-divider';divider.textContent='FULL POST';shell.appendChild(divider);
      sections.querySelectorAll('.section-card').forEach(function(card){
        var section=document.createElement('section');section.className='preview-section';
        var heading=card.querySelector('.section-title').value.trim();var body=card.querySelector('.section-body').value.trim();
        if(heading){var h2=document.createElement('h2');h2.textContent=heading;section.appendChild(h2);}
        body.split(/\n\s*\n/).filter(Boolean).forEach(function(text){var p=document.createElement('p');p.textContent=text;section.appendChild(p);});
        var mediaItems=[];
        (card._existing||[]).forEach(function(item){var node=createPreviewMedia(item.path,item.type==='video'?'video/unknown':'');if(node)mediaItems.push(node);});
        Array.from(card.querySelector('.section-files').files).forEach(function(file){var node=createPreviewMedia(file,file.type);if(node)mediaItems.push(node);});
        if(mediaItems.length){var media=document.createElement('div');media.className='preview-media'+(mediaItems.length===1?' single':'');mediaItems.forEach(function(node){media.appendChild(node);});section.appendChild(media);}
        if(section.children.length)shell.appendChild(section);
      });
    }
    preview.appendChild(shell);byId('previewDialog').showModal();
  };

  byId('newPost').onclick=resetForm;
  byId('addSection').onclick=function(){addSection();setStatus('Unsaved changes');};
  byId('title').oninput=function(){if(!current)byId('slug').value=slugify(byId('title').value);updateLivePreview();};
  byId('description').oninput=updateLivePreview;
  byId('tags').oninput=updateLivePreview;
  byId('date').oninput=updateLivePreview;
  byId('fit').onchange=updateLivePreview;
  byId('thumbnail').onchange=function(){byId('thumbCurrent').textContent=byId('thumbnail').files[0]?byId('thumbnail').files[0].name:(current&&current.thumbnail||'No file selected');updateLivePreview();};
  byId('hero').onchange=function(){byId('heroCurrent').textContent=byId('hero').files[0]?byId('hero').files[0].name:(current&&current.hero||'Uses the thumbnail when empty');};
  byId('postSearch').oninput=renderPosts;
  form.querySelectorAll('input[name="postMode"]').forEach(function(input){input.onchange=function(){updateModeUi();setStatus('Unsaved changes');};});
  form.addEventListener('input',function(event){if(event.target.id!=='postSearch')setStatus('Unsaved changes');});

  byId('saveDraft').onclick=function(){var data=new FormData();localStorage.setItem('cloudlab-journal-draft',JSON.stringify(collectMetadata(data)));setStatus('Draft saved on this device');};
  byId('unpublish').onclick=async function(){
    if(!current||!current.slug||!confirm('Unpublish this item and remove its dashboard-managed Journal media?'))return;
    try{setStatus('Unpublishing…');await api('/api/unpublish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug:current.slug})});await refreshPosts();resetForm();}catch(error){setStatus(error.message,true);alert(error.message);}
  };
  byId('closePreview').onclick=function(){byId('previewDialog').close();};

  (async function(){
    try{
      var session=await api('/api/session');csrf=session.csrfToken;await refreshPosts();resetForm();
      var raw=localStorage.getItem('cloudlab-journal-draft');
      if(raw&&confirm('Load your locally saved Journal draft?')){
        var draft=JSON.parse(raw);
        byId('title').value=draft.title||'';byId('slug').value=draft.slug||'';byId('description').value=draft.description||'';byId('date').value=draft.date||new Date().toISOString().slice(0,10);byId('tags').value=(draft.tags||[]).join(', ');byId('fit').value=draft.fit||'cover';setMode(draft.mode||'article');sections.replaceChildren();(draft.sections||[]).forEach(function(section){addSection({heading:section.heading,body:section.body,media:section.existingMedia||[]});});if(!(draft.sections||[]).length)addSection();setStatus('Local draft loaded');updateLivePreview();
      }
    }catch(error){setStatus(error.message,true);}
  })();
})();
`;
