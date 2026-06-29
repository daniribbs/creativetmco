const fs = require("fs");
const path = require("path");

const token = process.env.INSTAGRAM_TOKEN;
const instagramUserId = process.env.INSTAGRAM_USER_ID || "";

if (!token) {
  throw new Error("INSTAGRAM_TOKEN não configurado nos Secrets do GitHub.");
}

const fields = [
  "id",
  "caption",
  "media_type",
  "media_url",
  "permalink",
  "thumbnail_url",
  "timestamp"
].join(",");

/*
  Se você configurou INSTAGRAM_USER_ID, usa Instagram Graph API:
  https://graph.facebook.com/{id}/media

  Se não configurou, tenta Basic Display:
  https://graph.instagram.com/me/media
*/

const apiUrl = instagramUserId
  ? `https://graph.facebook.com/v20.0/${instagramUserId}/media?fields=${fields}&access_token=${token}&limit=12`
  : `https://graph.instagram.com/me/media?fields=${fields}&access_token=${token}&limit=12`;

async function main() {
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
