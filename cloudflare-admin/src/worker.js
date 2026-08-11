import app from './index.js';
import { handleCommunityApi } from './community-api-runtime.js';
import { handleFreshAbyss } from './fresh-abyss.js';
import { loginPage } from './admin-login-page.js';
import { commitFiles, readJsonFile } from './github.js';
import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  cleanMultiline,
  cleanText,
  html,
  json,
  parseCookies,
  safeStringEqual,
  slugify,
  verifySession
} from './utils.js';

const SITE_SETTINGS_PATH = 'site-settings.json';
const PROJECTS_PATH = 'projects/projects.json';
export const DEFAULT_PROFILE_IMAGE = '/assets/images/optimized/profile-600.webp';
const MAX_MANAGED_IMAGE_BYTES = 8 * 1024 * 1024;
const MANAGED_IMAGE_TYPES = new Map([['image/png', 'png'], ['image/jpeg', 'jpg'], ['image/webp', 'webp']]);
const PROJECT_ACCENTS = new Set(['cyan', 'gold', 'mint', 'orange']);
const PROJECT_LAYOUTS = new Set(['media-left', 'media-top', 'compact']);
const PROJECT_FITS = new Set(['cover', 'contain']);

export const FEATURED_GAME_IDS = Object.freeze(['breakout','connect-four','cloud-hopper','cloudlab-clicker','launcher','flappy-cloud','tower-stacker','snake','2048','memory-match','pong','tic-tac-toe','minesweeper']);
export const DEFAULT_FEATURED_GAMES = Object.freeze(['cloud-hopper', 'cloudlab-clicker', 'launcher']);
const FEATURED_GAME_ID_SET = new Set(FEATURED_GAME_IDS);
let siteSettingsCache = null;
let siteSettingsCacheUntil = 0;

function missingSettings(env, names) { return names.filter((name) => !env[name]); }
function configurationStatus(env) { return { oauthConfigured:Boolean(env.GITHUB_CLIENT_ID&&env.GITHUB_CLIENT_SECRET), sessionConfigured:Boolean(env.SESSION_SECRET), publisherConfigured:Boolean(env.GITHUB_TOKEN&&env.GITHUB_OWNER&&env.GITHUB_REPO), accountRestrictionConfigured:Boolean(env.ALLOWED_GITHUB_LOGIN&&env.ALLOWED_GITHUB_ID), communityConfigured:Boolean(env.COMMUNITY&&env.SESSION_SECRET) }; }
function loginNoticePage(status = 500, requestId = '') { return html(loginPage('retry'), status, {'X-CloudLab-Request-ID':requestId||'not-generated'}); }

async function getSession(request, env) {
  if (!env.SESSION_SECRET || !env.ALLOWED_GITHUB_LOGIN || !env.ALLOWED_GITHUB_ID) return null;
  const token = parseCookies(request.headers.get('Cookie'))[SESSION_COOKIE];
  if (!token) return null;
  try {
    const session = await verifySession(token, env.SESSION_SECRET);
    const allowedLogin = String(env.ALLOWED_GITHUB_LOGIN).trim().toLowerCase();
    const allowedId = String(env.ALLOWED_GITHUB_ID).trim();
    if (!session || String(session.login).toLowerCase() !== allowedLogin || String(session.githubId) !== allowedId) return null;
    return session;
  } catch { return null; }
}

function validCsrf(request, session) {
  const cookies = parseCookies(request.headers.get('Cookie'));
  const header = request.headers.get('X-CSRF-Token') || '';
  return Boolean(header && cookies[CSRF_COOKIE] && safeStringEqual(header, session.csrf) && safeStringEqual(cookies[CSRF_COOKIE], session.csrf));
}

function normalizeLocalAssetPath(value) {
  const path = String(value || '').trim();
  if (!path || path.includes('..') || /[<>"'`\\]/.test(path)) return '';
  const normalized = `/${path.replace(/^\/+/, '')}`;
  return /^\/assets\/[A-Za-z0-9_./-]+$/.test(normalized) ? normalized : '';
}

function normalizeExternalOrLocalUrl(value) {
  const url = cleanText(value, 600);
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) {
    try { const parsed = new URL(url); return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : ''; }
    catch { return ''; }
  }
  if (/^\/(?!\/)/.test(url) && !url.includes('..') && !/[<>"'`\\]/.test(url)) return url;
  return '';
}

function validateManagedImage(file) {
  if (!(file instanceof File) || file.size <= 0) return { error: 'Choose an image to upload.' };
  const extension = MANAGED_IMAGE_TYPES.get(String(file.type || '').toLowerCase());
  if (!extension) return { error: 'Use a PNG, JPG, or WebP image.' };
  if (file.size > MAX_MANAGED_IMAGE_BYTES) return { error: 'Images must be 8 MB or smaller.' };
  return { extension };
}

export function normalizeFeaturedGames(value) {
  if (!Array.isArray(value)) return [...DEFAULT_FEATURED_GAMES];
  const seen = new Set(), normalized = [];
  for (const gameId of value) {
    if (typeof gameId !== 'string' || !FEATURED_GAME_ID_SET.has(gameId) || seen.has(gameId)) continue;
    seen.add(gameId); normalized.push(gameId); if (normalized.length === 6) break;
  }
  return normalized.length ? normalized : [...DEFAULT_FEATURED_GAMES];
}

export function isValidFeaturedGameSelection(value) { return Array.isArray(value) && value.length>=1 && value.length<=6 && new Set(value).size===value.length && value.every((gameId)=>typeof gameId==='string'&&FEATURED_GAME_ID_SET.has(gameId)); }
export function normalizeSiteSettings(value) { return { forceSiteIntro:Boolean(value?.forceSiteIntro), featuredGames:normalizeFeaturedGames(value?.featuredGames), profileImage:normalizeLocalAssetPath(value?.profileImage)||DEFAULT_PROFILE_IMAGE, updatedAt:typeof value?.updatedAt==='string'?value.updatedAt:'', updatedBy:typeof value?.updatedBy==='string'?value.updatedBy:'' }; }

async function readSiteSettings(env, forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && siteSettingsCache && now < siteSettingsCacheUntil) return siteSettingsCache;
  const value = await readJsonFile(env, SITE_SETTINGS_PATH, {forceSiteIntro:false,featuredGames:[...DEFAULT_FEATURED_GAMES],profileImage:DEFAULT_PROFILE_IMAGE});
  siteSettingsCache = normalizeSiteSettings(value); siteSettingsCacheUntil = now + 5000; return siteSettingsCache;
}

function publicSiteSettingsJson(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*','X-Content-Type-Options':'nosniff'}});}
async function publicSiteSettings(env){try{const settings=await readSiteSettings(env);return publicSiteSettingsJson({ok:true,forceSiteIntro:settings.forceSiteIntro,featuredGames:settings.featuredGames,profileImage:settings.profileImage,updatedAt:settings.updatedAt||null});}catch(error){console.error('Could not read public site settings',error);return publicSiteSettingsJson({ok:false,forceSiteIntro:false,featuredGames:[...DEFAULT_FEATURED_GAMES],profileImage:DEFAULT_PROFILE_IMAGE,updatedAt:null});}}

async function writeSiteSettings(env, settings, message, additionalFiles = []) {
  const normalized = normalizeSiteSettings(settings);
  const commit = await commitFiles(env,[...additionalFiles,{path:SITE_SETTINGS_PATH,text:`${JSON.stringify(normalized,null,2)}\n`}],message);
  siteSettingsCache=normalized;siteSettingsCacheUntil=Date.now()+5000;return {settings:normalized,commit};
}

async function handleSiteIntroAdmin(request, env, session) {
  if (request.method === 'GET') { const settings=await readSiteSettings(env,true); return json({ok:true,...settings}); }
  if (request.method !== 'POST') return json({error:'Method not allowed.'},405);
  const parsedBody=await request.json().catch(()=>({}));const body=parsedBody&&typeof parsedBody==='object'&&!Array.isArray(parsedBody)?parsedBody:{};
  const hasForceSetting=Object.prototype.hasOwnProperty.call(body,'forceSiteIntro');const hasFeaturedSetting=Object.prototype.hasOwnProperty.call(body,'featuredGames');
  if(!hasForceSetting&&!hasFeaturedSetting)return json({error:'No site setting was provided.'},400);
  if(hasForceSetting&&typeof body.forceSiteIntro!=='boolean')return json({error:'The loading setting must be true or false.'},400);
  if(hasFeaturedSetting&&!isValidFeaturedGameSelection(body.featuredGames))return json({error:'Choose between 1 and 6 unique games from the arcade.'},400);
  const current=await readSiteSettings(env,true);const settings={...current,forceSiteIntro:hasForceSetting?body.forceSiteIntro:current.forceSiteIntro,featuredGames:hasFeaturedSetting?normalizeFeaturedGames(body.featuredGames):current.featuredGames,updatedAt:new Date().toISOString(),updatedBy:session.login};
  const message=hasForceSetting&&hasFeaturedSetting?'Update site settings':hasFeaturedSetting?'Update featured arcade games':settings.forceSiteIntro?'Site intro: force animation on':'Site intro: restore hourly animation';
  const saved=await writeSiteSettings(env,settings,message);return json({ok:true,...saved.settings,commit:saved.commit});
}

async function handleProfileArtAdmin(request, env, session) {
  if(request.method==='GET'){const settings=await readSiteSettings(env,true);return json({ok:true,profileImage:settings.profileImage,updatedAt:settings.updatedAt||null});}
  if(request.method!=='POST')return json({error:'Method not allowed.'},405);
  const current=await readSiteSettings(env,true);const contentType=request.headers.get('Content-Type')||'';const additionalFiles=[];let profileImage=current.profileImage;let message='Update profile artwork';
  if(contentType.includes('application/json')){const body=await request.json().catch(()=>({}));if(body?.reset!==true)return json({error:'No profile artwork change was provided.'},400);profileImage=DEFAULT_PROFILE_IMAGE;message='Restore original profile artwork';}
  else if(contentType.includes('multipart/form-data')){const form=await request.formData();const image=form.get('image');const validation=validateManagedImage(image);if(validation.error)return json({error:validation.error},400);const path=`assets/images/profile-managed/profile-${Date.now()}.${validation.extension}`;additionalFiles.push({path,bytes:new Uint8Array(await image.arrayBuffer())});profileImage=`/${path}`;}
  else return json({error:'Upload an image or restore the original artwork.'},415);
  if(current.profileImage.startsWith('/assets/images/profile-managed/')&&current.profileImage!==profileImage)additionalFiles.push({path:current.profileImage.replace(/^\//,''),delete:true});
  const saved=await writeSiteSettings(env,{...current,profileImage,updatedAt:new Date().toISOString(),updatedBy:session.login},message,additionalFiles);return json({ok:true,profileImage:saved.settings.profileImage,updatedAt:saved.settings.updatedAt,commit:saved.commit});
}

function normalizeProjectRecord(value, fallbackId = '') {
  const title=cleanText(value?.title,90),id=slugify(value?.id||fallbackId||title),description=cleanMultiline(value?.description,1200);if(!id||!title||!description)return null;
  return {id,title,kicker:cleanText(value?.kicker,40),badge:cleanText(value?.badge,28),description,url:normalizeExternalOrLocalUrl(value?.url),buttonLabel:cleanText(value?.buttonLabel,40)||'Open project',showButton:value?.showButton!==false,clickable:Boolean(value?.clickable),newTab:value?.newTab!==false,image:normalizeLocalAssetPath(value?.image),imageAlt:cleanText(value?.imageAlt,160),fit:PROJECT_FITS.has(value?.fit)?value.fit:'cover',accent:PROJECT_ACCENTS.has(value?.accent)?value.accent:'cyan',layout:PROJECT_LAYOUTS.has(value?.layout)?value.layout:'media-left',draft:Boolean(value?.draft),updatedAt:typeof value?.updatedAt==='string'?value.updatedAt:'',updatedBy:typeof value?.updatedBy==='string'?value.updatedBy:''};
}
export function normalizeProjects(value){if(!Array.isArray(value))return[];const seen=new Set(),projects=[];for(const raw of value.slice(0,50)){const project=normalizeProjectRecord(raw);if(!project||seen.has(project.id))continue;seen.add(project.id);projects.push(project);}return projects;}
async function readProjects(env){return normalizeProjects(await readJsonFile(env,PROJECTS_PATH,[]));}
function projectsFile(projects){return{path:PROJECTS_PATH,text:`${JSON.stringify(projects,null,2)}\n`};}
async function saveProjects(env,projects,files,message){const commit=await commitFiles(env,[...files,projectsFile(projects)],message);return{projects,commit};}

async function handleProjectsAdmin(request, env, session) {
  if(request.method==='GET')return json({ok:true,projects:await readProjects(env)});if(request.method!=='POST')return json({error:'Method not allowed.'},405);
  const contentType=request.headers.get('Content-Type')||'',existing=await readProjects(env);
  if(contentType.includes('application/json')){
    const body=await request.json().catch(()=>({})),action=cleanText(body?.action,30),id=slugify(body?.id||'');
    if(action==='delete'){const project=existing.find((item)=>item.id===id);if(!project)return json({error:'Project not found.'},404);const files=[];if(project.image.startsWith('/assets/images/projects/'))files.push({path:project.image.replace(/^\//,''),delete:true});const projects=existing.filter((item)=>item.id!==id),saved=await saveProjects(env,projects,files,`Remove project: ${project.title}`);return json({ok:true,projects:saved.projects,commit:saved.commit});}
    if(action==='toggle'){const index=existing.findIndex((item)=>item.id===id);if(index<0)return json({error:'Project not found.'},404);const projects=existing.map((item,itemIndex)=>itemIndex===index?{...item,draft:!item.draft,updatedAt:new Date().toISOString(),updatedBy:session.login}:item),saved=await saveProjects(env,projects,[],`${projects[index].draft?'Draft':'Publish'} project: ${projects[index].title}`);return json({ok:true,project:projects[index],projects:saved.projects,commit:saved.commit});}
    if(action==='reorder'){const ids=Array.isArray(body?.ids)?body.ids.map((value)=>slugify(value)).filter(Boolean):[];if(ids.length!==existing.length||new Set(ids).size!==ids.length)return json({error:'Project order is incomplete.'},400);const currentIds=new Set(existing.map((item)=>item.id));if(ids.some((projectId)=>!currentIds.has(projectId)))return json({error:'Project order contains an unknown project.'},400);const byId=new Map(existing.map((item)=>[item.id,item])),projects=ids.map((projectId)=>byId.get(projectId)),saved=await saveProjects(env,projects,[],'Reorder homepage projects');return json({ok:true,projects:saved.projects,commit:saved.commit});}
    return json({error:'Unknown project action.'},400);
  }
  if(!contentType.includes('multipart/form-data'))return json({error:'Project data must be form data.'},415);
  const form=await request.formData(),raw=form.get('metadata');if(typeof raw!=='string')return json({error:'Project information is missing.'},400);let input;try{input=JSON.parse(raw);}catch{return json({error:'Project information is invalid.'},400);}
  const title=cleanText(input?.title,90),description=cleanMultiline(input?.description,1200),requestedId=slugify(input?.id||title);if(!title||!description||!requestedId)return json({error:'Project name and description are required.'},400);
  const current=existing.find((item)=>item.id===requestedId)||null;if(!current&&existing.length>=50)return json({error:'The project list is full.'},400);
  const imageFile=form.get('image'),files=[];let image=normalizeLocalAssetPath(input?.existingImage);
  if(imageFile instanceof File&&imageFile.size>0){const validation=validateManagedImage(imageFile);if(validation.error)return json({error:validation.error},400);const path=`assets/images/projects/${requestedId}/project-${Date.now()}.${validation.extension}`;files.push({path,bytes:new Uint8Array(await imageFile.arrayBuffer())});image=`/${path}`;}
  if(current?.image?.startsWith('/assets/images/projects/')&&current.image!==image)files.push({path:current.image.replace(/^\//,''),delete:true});
  const project=normalizeProjectRecord({...input,id:requestedId,image,imageAlt:cleanText(input?.imageAlt,160)||`${title} project artwork`,updatedAt:new Date().toISOString(),updatedBy:session.login});if(!project)return json({error:'Project information is invalid.'},400);
  const projects=current?existing.map((item)=>item.id===current.id?project:item):[...existing,project],saved=await saveProjects(env,projects,files,`${current?'Update':'Add'} project: ${title}`);return json({ok:true,project,projects:saved.projects,commit:saved.commit});
}

function allowExternalImagePreviews(response,path){if(path!=='/'&&path!=='/admin')return response;const contentType=response.headers.get('Content-Type')||'';if(!contentType.includes('text/html'))return response;const headers=new Headers(response.headers),csp=headers.get('Content-Security-Policy');if(csp)headers.set('Content-Security-Policy',csp.replace('img-src https://danny4686.com data: blob:','img-src https: data: blob:'));return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
async function replaceAdminAuthFailure(response,path){if(!path.startsWith('/auth/')||response.status<400)return response;const contentType=response.headers.get('Content-Type')||'';if(!contentType.includes('text/html'))return response;return loginNoticePage(response.status,response.headers.get('X-CloudLab-Request-ID')||'');}

export default { async fetch(request, env, ctx) {
  const url=new URL(request.url),path=url.pathname.length>1&&url.pathname.endsWith('/')?url.pathname.slice(0,-1):url.pathname,requestId=crypto.randomUUID(),communityHost=url.hostname.toLowerCase()==='api.danny4686.com';
  if(communityHost){if(path==='/v1/site-settings'&&request.method==='GET')return publicSiteSettings(env);if(path==='/')return Response.redirect('https://danny4686.com/account/',302);if(!path.startsWith('/v1'))return json({error:'Community API route not found.'},404);return handleCommunityApi(request,env);}
  if(path==='/health')return json({ok:true,service:'cloudlab-journal-admin',...configurationStatus(env)});
  if(path==='/auth/login'&&missingSettings(env,['GITHUB_CLIENT_ID']).length)return loginNoticePage(503,requestId);
  if(path==='/auth/callback'&&missingSettings(env,['GITHUB_CLIENT_ID','GITHUB_CLIENT_SECRET','SESSION_SECRET','ALLOWED_GITHUB_LOGIN','ALLOWED_GITHUB_ID']).length)return loginNoticePage(503,requestId);
  try {
    if(path==='/'||path==='/admin'){const session=await getSession(request,env);if(!session){const csp="default-src 'none'; style-src 'unsafe-inline'; img-src https://danny4686.com; form-action 'self' https://github.com; frame-ancestors 'none'; base-uri 'none'";return html(loginPage(),200,{'Content-Security-Policy':csp});}}
    if(path==='/api/fresh-abyss'||path==='/api/site-intro'||path==='/api/profile-art'||path==='/api/projects'){
      const session=await getSession(request,env);if(!session)return json({error:'Authentication required.'},401);if(request.method!=='GET'&&!validCsrf(request,session))return json({error:'Security token expired. Refresh the dashboard and try again.'},403);
      if(path==='/api/fresh-abyss')return handleFreshAbyss(request,env,session);if(path==='/api/site-intro')return handleSiteIntroAdmin(request,env,session);if(path==='/api/profile-art')return handleProfileArtAdmin(request,env,session);return handleProjectsAdmin(request,env,session);
    }
    const rawResponse=await app.fetch(request,env,ctx),replacedResponse=await replaceAdminAuthFailure(rawResponse,path),response=allowExternalImagePreviews(replacedResponse,path);if(response.status<500)return response;
    if(path==='/'||path==='/admin'||path.startsWith('/auth/'))return loginNoticePage(500,requestId);return response;
  } catch(error){console.error('Unhandled CloudLab admin error',requestId,error);if(path==='/'||path==='/admin'||path.startsWith('/auth/'))return loginNoticePage(500,requestId);return json({error:'Unexpected server error.',requestId},500);}
}};
