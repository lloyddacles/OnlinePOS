const path = require("path");
const os = require("os");
const fs = require("fs");
const db = require("../db");

const API = "https://api.github.com";

function pad(n) {
  return String(n).padStart(2, "0");
}

async function getFileSha(repo, filePath, token) {
  const res = await fetch(`${API}/repos/${repo}/contents/${filePath}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "rocks-teas-pos"
    }
  });
  if (!res.ok) return null;
  const body = await res.json();
  return body.sha || null;
}

async function pushBackup() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) {
    return { skipped: true, message: "GITHUB_TOKEN / GITHUB_REPO not set" };
  }

  const now = new Date();
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const filePath = `backups/pos-${stamp}.db`;

  const tmpPath = path.join(os.tmpdir(), `pos-backup-${Date.now()}.db`);
  await db.backup(tmpPath);
  const content = fs.readFileSync(tmpPath, "base64");
  fs.unlink(tmpPath, () => {});

  const sha = await getFileSha(repo, filePath, token);
  const res = await fetch(`${API}/repos/${repo}/contents/${filePath}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "rocks-teas-pos"
    },
    body: JSON.stringify({
      message: `Auto backup ${stamp}`,
      content,
      sha: sha || undefined
    })
  });

  return { status: res.status, ok: res.ok };
}

module.exports = { pushBackup };
