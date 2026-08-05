import { bytesToBase64, decodeBase64Utf8, encodePath } from './utils.js';

function api(env, path, options = {}) {
  return fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'CloudLab-Journal-Admin',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {})
    }
  });
}

export async function readJsonFile(env, path, fallback = null) {
  const owner = encodeURIComponent(env.GITHUB_OWNER);
  const repo = encodeURIComponent(env.GITHUB_REPO);
  const branch = encodeURIComponent(env.GITHUB_BRANCH || 'main');
  const response = await api(env, `/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${branch}`);
  if (response.status === 404) return fallback;
  const data = await response.json();
  if (!response.ok) throw new Error(`GitHub read failed: ${data.message || response.status}`);
  return JSON.parse(decodeBase64Utf8(data.content));
}

export async function commitFiles(env, files, message) {
  const owner = encodeURIComponent(env.GITHUB_OWNER);
  const repo = encodeURIComponent(env.GITHUB_REPO);
  const branchName = env.GITHUB_BRANCH || 'main';
  const branch = encodeURIComponent(branchName);
  const prefix = `/repos/${owner}/${repo}`;

  const refResponse = await api(env, `${prefix}/git/ref/heads/${branch}`);
  const ref = await refResponse.json();
  if (!refResponse.ok) throw new Error(`Could not read branch: ${ref.message || refResponse.status}`);

  const parentSha = ref.object.sha;
  const parentResponse = await api(env, `${prefix}/git/commits/${parentSha}`);
  const parent = await parentResponse.json();
  if (!parentResponse.ok) throw new Error(`Could not read current commit: ${parent.message || parentResponse.status}`);

  const tree = [];
  for (const file of files) {
    const path = String(file.path || '').replace(/^\/+/, '');
    if (!path || path.includes('..')) throw new Error('Invalid repository path.');

    if (file.delete) {
      tree.push({ path, mode: '100644', type: 'blob', sha: null });
      continue;
    }

    const bytes = file.bytes || new TextEncoder().encode(file.text || '');
    const blobResponse = await api(env, `${prefix}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({ content: bytesToBase64(bytes), encoding: 'base64' })
    });
    const blob = await blobResponse.json();
    if (!blobResponse.ok) throw new Error(`Could not create ${path}: ${blob.message || blobResponse.status}`);
    tree.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  const treeResponse = await api(env, `${prefix}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: parent.tree.sha, tree })
  });
  const newTree = await treeResponse.json();
  if (!treeResponse.ok) throw new Error(`Could not build publish tree: ${newTree.message || treeResponse.status}`);

  const commitResponse = await api(env, `${prefix}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: newTree.sha, parents: [parentSha] })
  });
  const commit = await commitResponse.json();
  if (!commitResponse.ok) throw new Error(`Could not create commit: ${commit.message || commitResponse.status}`);

  const updateResponse = await api(env, `${prefix}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: false })
  });
  const update = await updateResponse.json();
  if (!updateResponse.ok) throw new Error(`Could not update branch: ${update.message || updateResponse.status}`);

  return {
    sha: commit.sha,
    url: `https://github.com/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/commit/${commit.sha}`
  };
}
