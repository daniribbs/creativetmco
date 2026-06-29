const fs = require("fs");
const path = require("path");

const rawToken = process.env.INSTAGRAM_TOKEN || "";
const instagramUserId = process.env.INSTAGRAM_USER_ID || "";

const token = rawToken
  .trim()
  .replace(/^Bearer\s+/i, "")
  .replace(/^access_token=/i, "")
  .replace(/^["']|["']$/g, "");

if (!token) {
  throw new Error("INSTAGRAM_TOKEN não configurado nos Secrets do GitHub.");
}

console.log(`Token carregado com ${token.length} caracteres.`);
console.log(instagramUserId ? "Usando Instagram Graph API com INSTAGRAM_USER_ID." : "Usando Instagram Basic Display API com /me/media.");

const fields = [
  "id",
  "caption",
  "media_type",
  "media_url",
  "permalink",
  "thumbnail_url",
  "timestamp"
].join(",");

function buildApiUrl() {
  if (instagramUserId) {
    const url = new URL(`https://graph.facebook.com/v20.0/${instagramUserId}/media`);

    url.searchParams.set("fields", fields);
    url.searchParams.set("access_token", token);
    url.searchParams.set("limit", "12");

    return url.toString();
  }

  const url = new URL("https://graph.instagram.com/me/media");

  url.searchParams.set("fields", fields);
  url.searchParams.set("access_token", token);
  url.searchParams.set("limit", "12");

  return url.toString();
}

async function main() {
  const apiUrl = buildApiUrl();

  const response = await fetch(apiUrl);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro na API do Instagram: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  const posts = (data.data || [])
    .filter((post) => {
      return (
        post.media_type === "IMAGE" ||
        post.media_type === "CAROUSEL_ALBUM" ||
        post.media_type === "VIDEO"
      );
    })
    .map((post) => {
      return {
        id: post.id,
        caption: post.caption || "",
        media_type: post.media_type,
        image: post.media_type === "VIDEO" ? post.thumbnail_url : post.media_url,
        permalink: post.permalink,
        timestamp: post.timestamp
      };
    })
    .filter((post) => post.image && post.permalink);

  const outputPath = path.join(process.cwd(), "instagram-posts.json");

  fs.writeFileSync(outputPath, JSON.stringify(posts, null, 2));

  console.log(`instagram-posts.json gerado com ${posts.length} posts.`);
}

main();
