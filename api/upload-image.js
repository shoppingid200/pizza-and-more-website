const crypto = require("crypto");

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (c) => (raw += String(c)));
    req.on("end", () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  setCors(res);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ message: "Cloudinary env vars missing" });
  }

  try {
    const body = await readJsonBody(req);
    const image = String(body.image || body.base64 || "").trim();
    if (!image) return res.status(400).json({ message: "Missing image" });

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "mount_parche";
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

    const form = new URLSearchParams();
    form.append("file", image);
    form.append("api_key", apiKey);
    form.append("timestamp", String(timestamp));
    form.append("signature", signature);
    form.append("folder", folder);

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: form,
    });
    const data = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) {
      return res.status(uploadRes.status).json({ message: data?.error?.message || "Upload failed", error: data });
    }
    const url = data.secure_url || data.url;
    if (!url) return res.status(500).json({ message: "No URL returned" });
    return res.status(200).json({ url, secure_url: url, public_id: data.public_id });
  } catch (error) {
    return res.status(500).json({ message: "Upload endpoint failed", error: String(error?.message || error) });
  }
};
