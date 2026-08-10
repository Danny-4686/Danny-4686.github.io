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

  var games=[
    {id:'breakout',name:'Breakout',category:'Arcade'},
    {id:'connect-four',name:'Connect Four',category:'Strategy'},
    {id:'cloud-hopper',name:'Cloud Hopper',category:'Arcade'},
    {id:'cloudlab-clicker',name:'CloudLab Clicker',category:'Arcade'},
    {id:'launcher',name:'Launcher',category:'Physics'},
    {id:'flappy-cloud',name:'Flappy Cloud',category:'Arcade'},
    {id:'tower-stacker',name:'Tower Stacker',category:'Arcade'},
    {id:'snake',name:'Snake',category:'Arcade'},
    {id:'2048',name:'2048',category:'Puzzle'},
    {id:'memory-match',name:'Memory Match',category:'Memory'},
    {id:'pong',name:'Pong',category:'Arcade'},
    {id:'tic-tac-toe',name:'Tic-Tac-Toe',category:'Strategy'},
    {id:'minesweeper',name:'Minesweeper',category:'Strategy'}
  ];
  var defaults=['cloud-hopper','cloudlab-clicker','launcher'];
  var csrf='';
  var loaded=false;
  var saving=false;
  var currentForce=false;
  var currentFeatured=defaults.slice();
  var draftFeatured=defaults.slice();

  var settingsTab=document.createElement('button');
  settingsTab.id='siteIntroSectionTab';
  settingsTab.className='admin-section-tab';
  settingsTab.type='button';
  settingsTab.setAttribute('aria-selected','false');
  settingsTab.innerHTML=''
    +'<span class="admin-section-tab-icon">⚙</span>'
    +'<span><strong>Settings</strong><small>Loading & featured games</small></span>'
    +'<span id="siteIntroTabState" class="admin-section-tab-state">3/6</span>';
  tabs.appendChild(settingsTab);

  var manager=document.createElement('section');
  manager.id='siteIntroManager';
  manager.className='site-intro-manager';
  manager.hidden=true;
  manager.innerHTML=''
    +'<div class="site-intro-manager-head">'
      +'<div><p class="eyebrow">CLOUDLAB CONTROL</p><h1>Site Settings</h1><p>Manage the loading experience and choose which games visitors see first in the CloudLab Arcade.</p></div>'
      +'<a href="https://danny4686.com/games/" target="_blank" rel="noopener">Open arcade</a>'
    +'</div>'
    +'<div id="siteIntroFeedback" class="site-intro-feedback" hidden role="status" aria-live="polite">'
      +'<span id="siteIntroFeedbackIcon" class="site-intro-feedback-icon">…</span>'
      +'<span><strong id="siteIntroFeedbackTitle">Updating settings</strong><small id="siteIntroFeedbackDetail">Applying the change…</small></span>'
    +'</div>'
    +'<div class="site-intro-layout">'
      +'<section class="site-intro-card">'
        +'<div class="settings-section-label"><span>01</span><div><strong>Loading Experience</strong><small>Control when the animated Earth intro appears.</small></div></div>'
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
        +'<div id="siteIntroUpdated" class="site-intro-preview-updated">Loading current settings…</div>'
      +'</aside>'
    +'</div>'
    +'<section class="featured-settings-card">'
      +'<div class="settings-section-label"><span>02</span><div><strong>Featured Games</strong><small>Choose 1–6 games and arrange the exact order shown on the arcade page.</small></div></div>'
      +'<div class="featured-settings-head">'
        +'<div><p class="eyebrow">ARCADE CURATION</p><h2>Pick the opening lineup</h2><p>Select games below, then use the ordered list to move favorites up or down.</p></div>'
        +'<span id="featuredCount" class="featured-count">3 / 6 selected</span>'
      +'</div>'
      +'<div id="featuredGameOptions" class="feature-game-options" role="group" aria-label="Available games"></div>'
      +'<div class="featured-order-heading"><strong>Display order</strong><small>Number 1 appears first.</small></div>'
      +'<div id="featuredGameOrder" class="selected-feature-list"></div>'
      +'<div class="featured-settings-actions">'
        +'<p id="featuredHelp">Changes appear after the website refreshes its settings.</p>'
        +'<button id="saveFeaturedGames" class="site-settings-save" type="button" disabled>Save featured games</button>'
      +'</div>'
    +'</section>';
  workspace.insertBefore(manager,postForm);

  var toggle=document.getElementById('forceSiteIntroToggle');
  var tabState=document.getElementById('siteIntroTabState');
  var statusPill=document.getElementById('siteIntroStatusPill');
  var feedback=document.getElementById('siteIntroFeedback');
  var feedbackIcon=document.getElementById('siteIntroFeedbackIcon');
  var feedbackTitle=document.getElementById('siteIntroFeedbackTitle');
  var feedbackDetail=document.getElementById('siteIntroFeedbackDetail');
  var updated=document.getElementById('siteIntroUpdated');
  var featureOptions=document.getElementById('featuredGameOptions');
  var featureOrder=document.getElementById('featuredGameOrder');
  var featureCount=document.getElementById('featuredCount');
  var featuredHelp=document.getElementById('featuredHelp');
  var saveFeatured=document.getElementById('saveFeaturedGames');

  function gameById(id){return games.find(function(game){return game.id===id;});}

  function normalizeFeatured(value){
    if(!Array.isArray(value))return defaults.slice();
    var seen={};
    var clean=[];
    value.forEach(function(id){
      if(typeof id==='string'&&!seen[id]&&gameById(id)&&clean.length<6){seen[id]=true;clean.push(id);}
    });
    return clean.length?clean:defaults.slice();
  }

  function sameFeatured(a,b){return JSON.stringify(a)===JSON.stringify(b);}

  function readableTime(value){
    if(!value)return 'No admin change recorded yet';
    var date=new Date(value);
    if(isNaN(date.getTime()))return 'Settings updated';
    return 'Last changed '+date.toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
  }

  async function request(url,options){
    options=options||{};
    options.headers=options.headers||{};
    if(options.method&&options.method!=='GET')options.headers['X-CSRF-Token']=csrf;
    var response=await fetch(url,options);
    var data=await response.json().catch(function(){return {};});
    if(!response.ok)throw new Error(data.error||'The site settings could not be updated.');
    return data;
  }

  function showFeedback(kind,title,detail){
    feedback.hidden=false;
    feedback.className='site-intro-feedback is-'+kind;
    feedbackIcon.textContent=kind==='success'?'✓':kind==='error'?'!':'…';
    feedbackTitle.textContent=title;
    feedbackDetail.textContent=detail;
    window.clearTimeout(showFeedback._hideTimer);
    if(kind==='success'){
      showFeedback._hideTimer=window.setTimeout(function(){feedback.hidden=true;},4200);
    }
  }

  function applyLoadingState(force,updatedAt){
    currentForce=Boolean(force);
    toggle.checked=currentForce;
    statusPill.textContent=currentForce?'Forced':'Once per hour';
    statusPill.classList.toggle('is-forced',currentForce);
    if(updatedAt!==undefined)updated.textContent=readableTime(updatedAt);
  }

  function renderFeaturedControls(){
    featureOptions.replaceChildren();
    games.forEach(function(game){
      var index=draftFeatured.indexOf(game.id);
      var selected=index!==-1;
      var button=document.createElement('button');
      button.type='button';
      button.className='feature-game-option'+(selected?' is-selected':'');
      button.dataset.gameId=game.id;
      button.setAttribute('aria-pressed',String(selected));
      button.setAttribute('aria-disabled',String(saving||!loaded||(!selected&&draftFeatured.length>=6)));
      button.innerHTML='<span class="feature-option-number">'+(selected?String(index+1):'+')+'</span><span><strong></strong><small></small></span>';
      button.querySelector('strong').textContent=game.name;
      button.querySelector('small').textContent=game.category;
      featureOptions.appendChild(button);
    });

    featureOrder.replaceChildren();
    draftFeatured.forEach(function(id,index){
      var game=gameById(id);
      var item=document.createElement('div');
      item.className='feature-order-item';
      item.dataset.gameId=id;
      item.innerHTML=''
        +'<span class="feature-order-rank">'+String(index+1)+'</span>'
        +'<span class="feature-order-name"><strong></strong><small></small></span>'
        +'<span class="feature-order-actions">'
          +'<button type="button" data-move="up" aria-label="Move up">↑</button>'
          +'<button type="button" data-move="down" aria-label="Move down">↓</button>'
          +'<button type="button" data-remove aria-label="Remove">×</button>'
        +'</span>';
      item.querySelector('.feature-order-name strong').textContent=game.name;
      item.querySelector('.feature-order-name small').textContent=game.category;
      var moveUp=item.querySelector('[data-move="up"]');
      var moveDown=item.querySelector('[data-move="down"]');
      moveUp.disabled=saving||!loaded||index===0;
      moveDown.disabled=saving||!loaded||index===draftFeatured.length-1;
      item.querySelector('[data-remove]').disabled=saving||!loaded;
      featureOrder.appendChild(item);
    });

    featureCount.textContent=draftFeatured.length+' / 6 selected';
    featureCount.classList.toggle('is-full',draftFeatured.length===6);
    tabState.textContent=draftFeatured.length+'/6';
    var changed=!sameFeatured(draftFeatured,currentFeatured);
    saveFeatured.disabled=saving||!loaded||draftFeatured.length<1||!changed;
    featuredHelp.textContent=draftFeatured.length<1
      ?'Choose at least one featured game.'
      :changed
        ?'Unsaved lineup changes are ready.'
        :'Featured lineup is saved.';
    manager.classList.toggle('has-unsaved-features',changed);
  }

  function applyFeaturedState(value){
    currentFeatured=normalizeFeatured(value);
    draftFeatured=currentFeatured.slice();
    renderFeaturedControls();
  }

  function applyState(data){
    applyLoadingState(data.forceSiteIntro,data.updatedAt);
    applyFeaturedState(data.featuredGames);
  }

  function setBusy(busy){
    saving=busy;
    toggle.disabled=busy||!loaded;
    manager.classList.toggle('is-saving',busy);
    renderFeaturedControls();
  }

  function hideSettingsView(){
    manager.hidden=true;
    settingsTab.classList.remove('active');
    settingsTab.setAttribute('aria-selected','false');
  }

  function activateSettings(updateHash){
    journalTab.classList.remove('active');
    abyssTab.classList.remove('active');
    journalTab.setAttribute('aria-selected','false');
    abyssTab.setAttribute('aria-selected','false');
    settingsTab.classList.add('active');
    settingsTab.setAttribute('aria-selected','true');
    dashboard.classList.add('is-abyss-view');
    sidebar.hidden=true;
    workspaceHead.hidden=true;
    postForm.hidden=true;
    if(abyssManager)abyssManager.hidden=true;
    manager.hidden=false;
    window.scrollTo({top:0,behavior:'smooth'});
    if(updateHash!==false)history.replaceState(null,'','#settings');
    if(!loaded)load();
  }

  journalTab.addEventListener('click',hideSettingsView);
  abyssTab.addEventListener('click',hideSettingsView);
  settingsTab.addEventListener('click',function(){activateSettings(true);});

  async function load(){
    try{
      setBusy(true);
      var session=await fetch('/api/session').then(function(response){return response.json();});
      csrf=session.csrfToken||'';
      var data=await request('/api/site-intro');
      loaded=true;
      applyState(data);
    }catch(error){
      showFeedback('error','Could not load settings',error.message);
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
      applyLoadingState(data.forceSiteIntro,data.updatedAt);
      showFeedback('success',data.forceSiteIntro?'Forced intro is ON':'Forced intro is OFF',data.forceSiteIntro?'The Earth loading animation will now play on every eligible page load.':'The normal once-per-hour loading animation rule is active again.');
    }catch(error){
      applyLoadingState(previous);
      showFeedback('error','Loading setting was not changed',error.message);
    }finally{
      setBusy(false);
    }
  });

  featureOptions.addEventListener('click',function(event){
    var button=event.target.closest('[data-game-id]');
    if(!button||saving||!loaded)return;
    var id=button.dataset.gameId;
    var index=draftFeatured.indexOf(id);
    if(index!==-1){
      draftFeatured.splice(index,1);
    }else if(draftFeatured.length<6){
      draftFeatured.push(id);
    }else{
      showFeedback('error','Six-game limit reached','Remove one featured game before selecting another.');
      return;
    }
    renderFeaturedControls();
  });

  featureOrder.addEventListener('click',function(event){
    var item=event.target.closest('[data-game-id]');
    var button=event.target.closest('button');
    if(!item||!button||saving||!loaded)return;
    var index=draftFeatured.indexOf(item.dataset.gameId);
    if(index<0)return;
    if(button.hasAttribute('data-remove')){
      draftFeatured.splice(index,1);
    }else if(button.dataset.move==='up'&&index>0){
      var before=draftFeatured[index-1];
      draftFeatured[index-1]=draftFeatured[index];
      draftFeatured[index]=before;
    }else if(button.dataset.move==='down'&&index<draftFeatured.length-1){
      var after=draftFeatured[index+1];
      draftFeatured[index+1]=draftFeatured[index];
      draftFeatured[index]=after;
    }
    renderFeaturedControls();
  });

  saveFeatured.addEventListener('click',async function(){
    if(saving||!loaded||draftFeatured.length<1||sameFeatured(draftFeatured,currentFeatured))return;
    var previous=currentFeatured.slice();
    var desired=draftFeatured.slice();
    showFeedback('saving','Saving featured games','Publishing the new arcade lineup…');
    setBusy(true);
    try{
      var data=await request('/api/site-intro',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({featuredGames:desired})
      });
      applyLoadingState(data.forceSiteIntro,data.updatedAt);
      applyFeaturedState(data.featuredGames);
      showFeedback('success','Featured lineup saved','The arcade will now show '+data.featuredGames.length+' featured games in this order.');
    }catch(error){
      currentFeatured=previous;
      draftFeatured=desired;
      renderFeaturedControls();
      showFeedback('error','Featured games were not changed',error.message);
    }finally{
      setBusy(false);
    }
  });

  renderFeaturedControls();
  if(window.location.hash==='#settings'||window.location.hash==='#site-intro')activateSettings(false);
  else load();
})();
`;
