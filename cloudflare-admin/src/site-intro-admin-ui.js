export const SITE_INTRO_ADMIN_JS = String.raw`
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
  if(!dashboard||!sidebar||!workspace||!workspaceHead||!postForm||!tabs||!journalTab||!abyssTab)return;

  var csrf='';
  var loaded=false;
  var saving=false;
  var currentForce=false;

  var introTab=document.createElement('button');
  introTab.id='siteIntroSectionTab';
  introTab.className='admin-section-tab';
  introTab.type='button';
  introTab.setAttribute('aria-selected','false');
  introTab.innerHTML=''
    +'<span class="admin-section-tab-icon">◎</span>'
    +'<span><strong>Site Intro</strong><small>Loading animation</small></span>'
    +'<span id="siteIntroTabState" class="admin-section-tab-state is-off">1H</span>';
  tabs.appendChild(introTab);

  var manager=document.createElement('section');
  manager.id='siteIntroManager';
  manager.className='site-intro-manager';
  manager.hidden=true;
  manager.innerHTML=''
    +'<div class="site-intro-manager-head">'
      +'<div><p class="eyebrow">SITE EXPERIENCE</p><h1>Intro & Loading</h1><p>Control whether the CloudLab Earth loading animation follows its normal one-hour cooldown or is forced to play on every eligible page load.</p></div>'
      +'<a href="https://danny4686.com/" target="_blank" rel="noopener">Open website</a>'
    +'</div>'
    +'<div id="siteIntroFeedback" class="site-intro-feedback" hidden role="status" aria-live="polite">'
      +'<span id="siteIntroFeedbackIcon" class="site-intro-feedback-icon">…</span>'
      +'<span><strong id="siteIntroFeedbackTitle">Updating setting</strong><small id="siteIntroFeedbackDetail">Applying the change…</small></span>'
    +'</div>'
    +'<div class="site-intro-layout">'
      +'<section class="site-intro-card">'
        +'<div class="site-intro-card-heading">'
          +'<div><p class="eyebrow">BEHAVIOR</p><h2>Force loading animation</h2><p>Use this when you want the intro to appear every time instead of waiting for the one-hour timer.</p></div>'
          +'<span id="siteIntroStatusPill" class="site-intro-status-pill">Loading</span>'
        +'</div>'
        +'<label class="site-intro-toggle-row" for="forceSiteIntroToggle">'
          +'<span><strong>Force the Earth intro on every page load</strong><small>When enabled, the normal one-hour cooldown is ignored. Turning this off immediately restores the once-per-hour behavior.</small></span>'
          +'<span class="site-intro-switch"><input id="forceSiteIntroToggle" type="checkbox" disabled><span></span></span>'
        +'</label>'
        +'<p class="site-intro-note">Reduced Motion is still respected for visitors who have animation reduction enabled on their device.</p>'
      +'</section>'
      +'<aside class="site-intro-preview-card">'
        +'<div class="site-intro-preview-stage">'
          +'<div class="site-intro-preview-earth"><img src="https://danny4686.com/assets/images/cloudlab-logo.png" alt="CloudLab Earth logo"></div>'
          +'<p class="eyebrow">CLOUDLAB</p>'
          +'<h3>Danny4686</h3>'
          +'<p>Loading the studio</p>'
        +'</div>'
        +'<div id="siteIntroUpdated" class="site-intro-preview-updated">Loading current setting…</div>'
      +'</aside>'
    +'</div>';
  workspace.insertBefore(manager,postForm);

  var toggle=document.getElementById('forceSiteIntroToggle');
  var tabState=document.getElementById('siteIntroTabState');
  var statusPill=document.getElementById('siteIntroStatusPill');
  var feedback=document.getElementById('siteIntroFeedback');
  var feedbackIcon=document.getElementById('siteIntroFeedbackIcon');
  var feedbackTitle=document.getElementById('siteIntroFeedbackTitle');
  var feedbackDetail=document.getElementById('siteIntroFeedbackDetail');
  var updated=document.getElementById('siteIntroUpdated');

  function readableTime(value){
    if(!value)return 'No admin change recorded yet';
    var date=new Date(value);
    if(isNaN(date.getTime()))return 'Setting updated';
    return 'Last changed '+date.toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
  }

  async function request(url,options){
    options=options||{};
    options.headers=options.headers||{};
    if(options.method&&options.method!=='GET')options.headers['X-CSRF-Token']=csrf;
    var response=await fetch(url,options);
    var data=await response.json().catch(function(){return {};});
    if(!response.ok)throw new Error(data.error||'The site intro setting could not be updated.');
    return data;
  }

  function showFeedback(kind,title,detail){
    feedback.hidden=false;
    feedback.className='site-intro-feedback is-'+kind;
    feedbackIcon.textContent=kind==='success'?'✓':kind==='error'?'!':'…';
    feedbackTitle.textContent=title;
    feedbackDetail.textContent=detail;
    if(kind==='success'){
      window.clearTimeout(showFeedback._hideTimer);
      showFeedback._hideTimer=window.setTimeout(function(){feedback.hidden=true;},4200);
    }
  }

  function applyState(force,updatedAt){
    currentForce=Boolean(force);
    toggle.checked=currentForce;
    tabState.textContent=currentForce?'FORCED':'1H';
    tabState.classList.toggle('is-off',!currentForce);
    introTab.classList.toggle('is-off',!currentForce);
    statusPill.textContent=currentForce?'Forced':'Once per hour';
    statusPill.classList.toggle('is-forced',currentForce);
    updated.textContent=readableTime(updatedAt);
  }

  function setBusy(busy){
    saving=busy;
    toggle.disabled=busy||!loaded;
    manager.classList.toggle('is-saving',busy);
  }

  function hideIntroView(){
    manager.hidden=true;
    introTab.classList.remove('active');
    introTab.setAttribute('aria-selected','false');
  }

  function activateIntro(updateHash){
    journalTab.classList.remove('active');
    abyssTab.classList.remove('active');
    journalTab.setAttribute('aria-selected','false');
    abyssTab.setAttribute('aria-selected','false');
    introTab.classList.add('active');
    introTab.setAttribute('aria-selected','true');
    dashboard.classList.add('is-abyss-view');
    sidebar.hidden=true;
    workspaceHead.hidden=true;
    postForm.hidden=true;
    if(abyssManager)abyssManager.hidden=true;
    manager.hidden=false;
    window.scrollTo({top:0,behavior:'smooth'});
    if(updateHash!==false)history.replaceState(null,'','#site-intro');
    if(!loaded)load();
  }

  journalTab.addEventListener('click',function(){
    hideIntroView();
  });

  abyssTab.addEventListener('click',function(){
    hideIntroView();
  });

  introTab.addEventListener('click',function(){activateIntro(true);});

  async function load(){
    try{
      setBusy(true);
      var session=await fetch('/api/session').then(function(response){return response.json();});
      csrf=session.csrfToken||'';
      var data=await request('/api/site-intro');
      loaded=true;
      applyState(data.forceSiteIntro,data.updatedAt);
      toggle.disabled=false;
    }catch(error){
      showFeedback('error','Could not load setting',error.message);
      statusPill.textContent='Unavailable';
      updated.textContent='Refresh the dashboard and try again.';
    }finally{
      setBusy(false);
    }
  }

  toggle.addEventListener('change',async function(){
    if(saving||!loaded)return;
    var desired=toggle.checked;
    var previous=currentForce;
    showFeedback('saving',desired?'Turning force mode on':'Turning force mode off',desired?'Applying the override now…':'Restoring the one-hour cooldown now…');
    setBusy(true);
    try{
      var data=await request('/api/site-intro',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({forceSiteIntro:desired})
      });
      applyState(data.forceSiteIntro,data.updatedAt);
      showFeedback('success',data.forceSiteIntro?'Forced intro is ON':'Forced intro is OFF',data.forceSiteIntro?'The Earth loading animation will now play on every eligible page load.':'The normal once-per-hour loading animation rule is active again.');
    }catch(error){
      applyState(previous,null);
      showFeedback('error','Setting was not changed',error.message);
    }finally{
      setBusy(false);
    }
  });

  load();
  if(window.location.hash==='#site-intro')activateIntro(false);
})();
`;
