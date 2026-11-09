import "server-only";
export const authorizeUrl = (state: string) =>
  "https://discord.com/oauth2/authorize?" + new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!, response_type: "code",
    redirect_uri: process.env.DISCORD_REDIRECT_URI!, scope: "identify", state,
  });

export async function exchangeAndFetchUser(code: string) {
  const tr = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!, client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: "authorization_code", code, redirect_uri: process.env.DISCORD_REDIRECT_URI!,
    }),
  });
  if (!tr.ok) throw new Error("token_exchange_failed");
  const { access_token } = await tr.json();
  const ur = await fetch("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${access_token}` } });
  if (!ur.ok) throw new Error("user_fetch_failed");
  // access_token живёт только внутри этой функции и нигде не сохраняется
  return (await ur.json()) as { id: string; username: string; global_name: string | null; avatar: string | null };
}
export const avatarUrl = (id: string, hash: string | null, size = 128) =>
  hash ? `https://cdn.discordapp.com/avatars/${id}/${hash}.png?size=${size}`
       : `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(id) >> BigInt(22)) % BigInt(6))}.png`;
