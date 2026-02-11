const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "menu-pic";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false }
      })
    : null;

const EXT_MAP = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== "string") return null;
  const normalized = dataUrl.trim().replace(/\s+/g, "");
  const match = /^data:(.*?);base64,(.*)$/.exec(normalized);
  if (!match) return null;
  const mime = match[1];
  const base64 = match[2];
  if (!mime || !base64) return null;
  return { mime, buffer: Buffer.from(base64, "base64") };
}

async function uploadDataUrl(dataUrl, folder = "dishes") {
  if (!supabase) {
    throw new Error("Supabase storage 未配置");
  }
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    throw new Error("图片格式不正确");
  }
  const ext = EXT_MAP[parsed.mime] || "jpg";
  const safeFolder = folder?.trim() || "dishes";
  const fileName = `${safeFolder}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(fileName, parsed.buffer, {
      contentType: parsed.mime,
      upsert: true
    });
  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(fileName);
  if (!data?.publicUrl) {
    throw new Error("获取图片地址失败");
  }
  return data.publicUrl;
}

module.exports = { uploadDataUrl };
