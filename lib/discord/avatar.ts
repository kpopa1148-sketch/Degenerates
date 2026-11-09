export const avatarUrl = (id: string, hash: string | null, size = 128) =>
  hash ? `https://cdn.discordapp.com/avatars/${id}/${hash}.png?size=${size}`
       : `https://cdn.discordapp.com/embed/avatars/${/^\d+$/.test(id) ? Number((BigInt(id) >> BigInt(22)) % BigInt(6)) : 0}.png`;
