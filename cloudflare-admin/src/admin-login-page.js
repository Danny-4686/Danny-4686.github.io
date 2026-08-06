const LOGIN_CSS = `
:root{color-scheme:dark;--bg:#041016;--panel:#0b1e27;--text:#f4fafb;--muted:#9bb0b8;--line:rgba(145,190,202,.2);--cyan:#68d0df;--mint:#8bcf9b;--danger:#ef7b76}*{box-sizing:border-box}html{min-height:100%;background:var(--bg)}body{min-height:100vh;margin:0;color:var(--text);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:radial-gradient(circle at 8% 4%,rgba(104,208,223,.13),transparent 31%),radial-gradient(circle at 91% 90%,rgba(139,207,155,.07),transparent 30%),linear-gradient(180deg,#06141b,#02080b 72%);overflow-x:hidden}body:before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.075;background-image:linear-gradient(rgba(104,208,223,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(104,208,223,.08) 1px,transparent 1px);background-size:54px 54px;mask-image:linear-gradient(to bottom,black,transparent 62%)}a{color:inherit;text-decoration:none;-webkit-tap-highlight-color:transparent}:focus-visible{outline:3px solid rgba(104,208,223,.55);outline-offset:3px}.account-header{position:relative;z-index:3;width:min(900px,calc(100% - 28px));min-height:66px;margin:14px auto 0;padding:11px 13px;display:flex;align-items:center;justify-content:space-between;gap:18px;border:1px solid var(--line);border-radius:18px;background:rgba(4,14,19,.78);box-shadow:0 14px 42px rgba(0,0,0,.2);backdrop-filter:blur(18px)}.account-brand{display:flex;align-items:center;gap:11px}.account-brand img{width:42px;height:42px;object-fit:contain}.account-brand span{display:flex;flex-direction:column;gap:2px}.account-brand strong{font-size:.96rem}.account-brand small{color:var(--muted);font-size:.72rem}.home-link{min-height:42px;padding:10px 13px;display:inline-flex;align-items:center;justify-content:center;border:1px solid transparent;border-radius:12px;color:var(--muted);font-size:.83rem;font-weight:800}.home-link:hover{color:var(--text);border-color:var(--line);background:rgba(255,255,255,.025)}.account-shell{position:relative;z-index:1;width:min(520px,calc(100% - 28px));min-height:calc(100vh - 164px);margin:0 auto;padding:54px 0 70px;display:flex;align-items:center;justify-content:center}.account-card{position:relative;width:100%;overflow:hidden;padding:28px;border:1px solid rgba(145,190,202,.23);border-radius:24px;background:linear-gradient(180deg,rgba(255,255,255,.035),transparent 25%),rgba(7,21,28,.97);box-shadow:0 30px 90px rgba(0,0,0,.38),0 0 0 1px rgba(255,255,255,.015) inset}.account-card:before{content:"";position:absolute;right:-25%;top:-35%;width:360px;height:360px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,rgba(104,208,223,.09),transparent 68%)}.account-card>*{position:relative;z-index:1}.eyebrow{margin:0 0 13px;color:var(--cyan);font-size:.7rem;font-weight:900;letter-spacing:.15em}.account-card h1{margin:0;font-size:clamp(2.15rem,7vw,3rem);line-height:1.02;letter-spacing:-.055em}.description{max-width:390px;margin:11px 0 0;color:var(--muted);font-size:.86rem;line-height:1.58}.notice{margin:20px 0 0;padding:12px 14px;border:1px solid rgba(239,123,118,.38);border-radius:13px;color:#ffb7b3;background:rgba(239,123,118,.055);font-size:.78rem;line-height:1.5}.login-button{min-height:54px;margin-top:24px;padding:12px 16px;display:flex;align-items:center;justify-content:center;gap:10px;border:1px solid rgba(104,208,223,.55);border-radius:13px;color:#041016;background:linear-gradient(145deg,#84e0e9,#54bfd1);box-shadow:0 14px 30px rgba(72,186,208,.2);font-weight:900;transition:transform .18s ease,filter .18s ease,box-shadow .18s ease}.login-button:hover{transform:translateY(-2px);filter:brightness(1.04);box-shadow:0 18px 36px rgba(72,186,208,.25)}.github-mark{width:23px;height:23px;display:grid;place-items:center;border-radius:50%;color:#fff;background:#07151b;font-size:.69rem;font-weight:900}.assurance{margin-top:16px;padding-top:15px;display:flex;align-items:center;justify-content:center;gap:8px;border-top:1px solid rgba(145,190,202,.13);color:#7f969f;font-size:.67rem;line-height:1.45;text-align:center}.assurance:before{content:"✓";width:20px;height:20px;flex:0 0 auto;display:grid;place-items:center;border:1px solid rgba(139,207,155,.25);border-radius:50%;color:#a9e8b5;background:rgba(139,207,155,.055);font-size:.64rem;font-weight:950}.return-link{display:block;margin-top:16px;color:var(--muted);font-size:.82rem;text-align:center}.return-link strong{color:var(--cyan)}.account-footer{position:relative;z-index:1;width:min(900px,calc(100% - 28px));margin:0 auto;padding:23px 0 36px;display:flex;justify-content:space-between;gap:20px;border-top:1px solid var(--line);color:var(--muted);font-size:.76rem}.account-footer a{color:var(--text);font-weight:800}@media(max-width:620px){.account-header,.account-shell,.account-footer{width:calc(100% - 20px)}.account-header{margin-top:7px}.account-brand small{display:none}.account-shell{min-height:calc(100vh - 145px);padding:30px 0 48px}.account-card{padding:20px;border-radius:20px}.account-footer{align-items:flex-start;flex-direction:column}}@media(prefers-reduced-motion:reduce){.login-button{transition:none}}
`;

export function loginPage(message = '') {
  const notice = message
    ? '<div class="notice" role="alert">Sign-in was not completed. Please try again with the approved GitHub account.</div>'
    : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <meta name="theme-color" content="#061117">
  <title>CloudLab Admin | Danny4686</title>
  <style>${LOGIN_CSS}</style>
</head>
<body>
  <header class="account-header">
    <a class="account-brand" href="https://danny4686.com" aria-label="Danny4686.com home">
      <img src="https://danny4686.com/assets/images/cloudlab-logo.png" alt="CloudLab logo">
      <span><strong>Danny4686</strong><small>CloudLab Admin</small></span>
    </a>
    <a class="home-link" href="https://danny4686.com">Home</a>
  </header>

  <main class="account-shell">
    <section class="account-card" aria-labelledby="adminLoginTitle">
      <p class="eyebrow">CLOUDLAB ADMIN</p>
      <h1 id="adminLoginTitle">Sign in to Admin</h1>
      <p class="description">Continue with the approved GitHub account to access the private dashboard.</p>
      ${notice}
      <a class="login-button" href="/auth/login"><span class="github-mark">GH</span><span>Continue with GitHub</span></a>
      <div class="assurance">Private access is limited to the approved owner account.</div>
      <a class="return-link" href="https://danny4686.com">Return to <strong>Danny4686.com</strong></a>
    </section>
  </main>

  <footer class="account-footer"><span>© ${new Date().getFullYear()} Danny4686.</span><a href="https://danny4686.com">Back to Danny4686.com</a></footer>
</body>
</html>`;
}
