const LOGIN_CSS = `
:root{color-scheme:dark;--text:#f4fafb;--muted:#9aafb7;--line:rgba(145,190,202,.2);--cyan:#68d0df;--mint:#8bcf9b;--gold:#f2c75c}*{box-sizing:border-box}html,body{min-height:100%;margin:0}body{display:grid;place-items:center;padding:24px;color:var(--text);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:radial-gradient(circle at 10% 0,rgba(104,208,223,.15),transparent 33%),radial-gradient(circle at 92% 78%,rgba(139,207,155,.07),transparent 27%),linear-gradient(180deg,#061117,#02070a);overflow-x:hidden}body:before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.12;background-image:linear-gradient(rgba(104,208,223,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(104,208,223,.08) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(to bottom,black,transparent 78%)}main{position:relative;z-index:1;width:min(930px,100%);display:grid;grid-template-columns:minmax(0,1.05fr) minmax(340px,.72fr);overflow:hidden;border:1px solid var(--line);border-radius:30px;background:rgba(7,21,28,.95);box-shadow:0 32px 90px rgba(0,0,0,.46)}.intro{padding:48px;background:radial-gradient(circle at 12% 10%,rgba(104,208,223,.1),transparent 40%),linear-gradient(160deg,rgba(255,255,255,.025),transparent 55%)}.brand{display:flex;align-items:center;gap:13px;margin-bottom:56px}.brand img{width:50px;height:50px;object-fit:contain}.brand span{display:flex;flex-direction:column;gap:3px}.brand strong{font-size:1rem}.brand small{color:var(--muted);font-size:.73rem}.eyebrow{margin:0 0 12px;color:var(--cyan);font-size:.69rem;font-weight:900;letter-spacing:.15em}.intro h1{max-width:570px;margin:0;font-size:clamp(3rem,6vw,5.4rem);line-height:.96;letter-spacing:-.065em}.intro>p:last-of-type{max-width:560px;margin:20px 0 0;color:var(--muted);font-size:1rem;line-height:1.72}.feature-row{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:34px}.feature{min-height:116px;padding:14px;display:flex;flex-direction:column;justify-content:flex-end;border:1px solid var(--line);border-radius:16px;background:rgba(255,255,255,.02)}.feature i{width:31px;height:31px;margin-bottom:auto;display:grid;place-items:center;border:1px solid rgba(104,208,223,.25);border-radius:10px;color:var(--cyan);background:rgba(104,208,223,.065);font-style:normal;font-weight:900}.feature strong{font-size:.8rem}.feature small{margin-top:4px;color:var(--muted);font-size:.66rem;line-height:1.4}.signin{position:relative;display:flex;flex-direction:column;justify-content:center;padding:42px;border-left:1px solid var(--line);background:rgba(2,11,15,.46)}.private-badge{width:max-content;padding:6px 9px;border:1px solid rgba(139,207,155,.28);border-radius:999px;color:#afe9bb;background:rgba(139,207,155,.055);font-size:.61rem;font-weight:900;letter-spacing:.08em}.signin h2{margin:17px 0 9px;font-size:2rem;letter-spacing:-.045em}.signin>p{margin:0;color:var(--muted);line-height:1.62}.notice{margin-top:17px;padding:12px 13px;border:1px solid rgba(242,199,92,.28);border-radius:13px;color:#efd991;background:rgba(242,199,92,.05);font-size:.73rem;line-height:1.5}.login-button{min-height:52px;margin-top:23px;padding:12px 16px;display:flex;align-items:center;justify-content:center;gap:10px;border:1px solid rgba(104,208,223,.52);border-radius:14px;color:#041116;background:linear-gradient(145deg,#83dfe8,#55bfd0);box-shadow:0 15px 32px rgba(72,186,208,.2);font-weight:900;text-decoration:none;transition:transform .18s ease,filter .18s ease,box-shadow .18s ease}.login-button:hover{transform:translateY(-2px);filter:brightness(1.04);box-shadow:0 19px 38px rgba(72,186,208,.26)}.github-mark{width:22px;height:22px;display:grid;place-items:center;border-radius:50%;color:#fff;background:#07151b;font-size:.78rem}.owner-note{margin-top:17px!important;color:#718892!important;font-size:.68rem!important;line-height:1.52!important}.home-link{margin-top:16px;color:var(--muted);font-size:.72rem;font-weight:800;text-align:center;text-decoration:none}.home-link:hover{color:var(--text)}@media(max-width:800px){main{grid-template-columns:1fr;max-width:620px}.intro{padding:30px}.brand{margin-bottom:38px}.feature-row{grid-template-columns:1fr}.feature{min-height:86px}.signin{padding:30px;border-top:1px solid var(--line);border-left:0}}@media(max-width:480px){body{padding:10px}main{border-radius:22px}.intro,.signin{padding:23px}.intro h1{font-size:clamp(2.7rem,15vw,4rem)}.brand img{width:44px;height:44px}}@media(prefers-reduced-motion:reduce){.login-button{transition:none}}
`;

export function loginPage(message = '') {
  const notice = message
    ? '<div class="notice"><strong>Sign-in needs another try.</strong><br>Return to this page and continue with GitHub again.</div>'
    : '';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <meta name="theme-color" content="#061117">
  <title>CloudLab Owner Workspace</title>
  <style>${LOGIN_CSS}</style>
</head>
<body>
  <main>
    <section class="intro">
      <a class="brand" href="https://danny4686.com" aria-label="Danny4686.com home"><img src="https://danny4686.com/assets/images/cloudlab-logo.png" alt="CloudLab logo"><span><strong>Danny4686</strong><small>CloudLab Studio</small></span></a>
      <p class="eyebrow">OWNER WORKSPACE</p>
      <h1>Manage the site without touching the code.</h1>
      <p>Publish Journal posts, manage Fresh Abyss, and keep private website tools together in one secure place.</p>
      <div class="feature-row">
        <article class="feature"><i>✦</i><strong>Journal publishing</strong><small>Create cards and complete articles.</small></article>
        <article class="feature"><i>◉</i><strong>Fresh Abyss</strong><small>Control the secret page and media.</small></article>
        <article class="feature"><i>✓</i><strong>Private access</strong><small>Limited to the approved owner account.</small></article>
      </div>
    </section>
    <section class="signin">
      <span class="private-badge">PRIVATE ACCESS</span>
      <h2>Continue to the dashboard</h2>
      <p>Use the approved GitHub account to verify ownership and open the workspace.</p>
      ${notice}
      <a class="login-button" href="/auth/login"><span class="github-mark">GH</span><span>Continue with GitHub</span></a>
      <p class="owner-note">This sign-in is only for the private site owner dashboard. Public CloudLab player accounts use the separate Sign In and Sign Up pages on Danny4686.com.</p>
      <a class="home-link" href="https://danny4686.com">Return to Danny4686.com</a>
    </section>
  </main>
</body>
</html>`;
}
