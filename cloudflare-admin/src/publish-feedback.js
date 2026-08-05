export const PUBLISH_FEEDBACK_JS = String.raw`
(function(){
  var form=document.getElementById('postForm');
  var status=document.getElementById('status');
  var publishButton=document.getElementById('publishButton');
  if(!form||!status||!publishButton)return;

  var panel=document.createElement('section');
  panel.id='publishProgress';
  panel.className='publish-progress';
  panel.hidden=true;
  panel.setAttribute('role','status');
  panel.setAttribute('aria-live','polite');
  panel.innerHTML='<div class="publish-progress-icon" aria-hidden="true"><span class="publish-spinner"></span><span class="publish-check">✓</span><span class="publish-error-mark">!</span></div><div class="publish-progress-copy"><p class="publish-progress-kicker">JOURNAL PUBLISHER</p><h2 id="publishProgressTitle">Publishing your post</h2><p id="publishProgressDetail">Preparing your files…</p><div class="publish-progress-track" aria-hidden="true"><span></span></div></div><button id="publishProgressClose" class="publish-progress-close" type="button" hidden>Dismiss</button>';
  form.parentNode.insertBefore(panel,form);

  var title=document.getElementById('publishProgressTitle');
  var detail=document.getElementById('publishProgressDetail');
  var closeButton=document.getElementById('publishProgressClose');
  var active=false;
  var timers=[];
  var lockedControls=[];
  var originalButtonText='';

  function clearTimers(){
    timers.forEach(function(timer){clearTimeout(timer);});
    timers=[];
  }

  function selectedMode(){
    var selected=form.querySelector('input[name="postMode"]:checked');
    return selected?selected.value:'article';
  }

  function modeName(mode){
    if(mode==='card')return 'post card';
    if(mode==='coming-soon')return 'coming soon preview';
    return 'full post';
  }

  function lockEditor(lock){
    if(lock){
      lockedControls=Array.from(form.querySelectorAll('button,input,textarea,select')).map(function(control){
        return {control:control,disabled:control.disabled};
      });
      lockedControls.forEach(function(item){item.control.disabled=true;});
      form.setAttribute('aria-busy','true');
      return;
    }
    lockedControls.forEach(function(item){item.control.disabled=item.disabled;});
    lockedControls=[];
    form.removeAttribute('aria-busy');
  }

  function showLoading(){
    if(active)return;
    active=true;
    clearTimers();
    var mode=selectedMode();
    originalButtonText=publishButton.textContent;
    panel.hidden=false;
    panel.className='publish-progress is-visible is-loading';
    closeButton.hidden=true;
    title.textContent=mode==='article'?'Publishing your full post':mode==='card'?'Publishing your post card':'Saving your coming soon preview';
    detail.textContent='Preparing your post and media…';
    publishButton.textContent='Working…';
    lockEditor(true);

    var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(function(){panel.scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});});

    timers.push(setTimeout(function(){if(active)detail.textContent='Uploading media securely…';},1000));
    timers.push(setTimeout(function(){if(active)detail.textContent='Creating the GitHub commit…';},3200));
    timers.push(setTimeout(function(){if(active)detail.textContent='Finalizing the Journal update…';},6500));
  }

  function finish(kind,message,description){
    if(!active)return;
    active=false;
    clearTimers();
    lockEditor(false);
    publishButton.textContent=originalButtonText||publishButton.textContent;
    panel.className='publish-progress is-visible is-'+kind;
    title.textContent=message;
    detail.textContent=description;
    closeButton.hidden=kind==='success';
    if(kind==='success'){
      timers.push(setTimeout(function(){panel.classList.remove('is-visible');},3600));
      timers.push(setTimeout(function(){panel.hidden=true;panel.className='publish-progress';},4050));
    }
  }

  form.addEventListener('submit',function(){showLoading();},true);

  var observer=new MutationObserver(function(){
    if(!active)return;
    var text=(status.textContent||'').trim();
    var lowered=text.toLowerCase();
    if(lowered==='published'||lowered==='post card published'||lowered==='coming soon saved'||lowered==='loaded'){
      finish('success','Published successfully','GitHub received the update. Your public Journal may take a moment to refresh.');
      return;
    }
    if(status.style.color&&text&&lowered.indexOf('publishing')===-1&&lowered.indexOf('saving')===-1&&lowered.indexOf('loading')===-1){
      finish('error','Publishing did not finish',text);
    }
  });
  observer.observe(status,{childList:true,subtree:true,attributes:true,attributeFilter:['style']});

  closeButton.addEventListener('click',function(){
    panel.classList.remove('is-visible');
    setTimeout(function(){panel.hidden=true;panel.className='publish-progress';},240);
  });
})();
`;
