/**
 * Discord アバターURL を取得する composable
 */
export function useDiscordAvatar() {
  const getAvatarUrl = (user) => {
    if (!user) return null
    if (user.avatar) {
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    }
    return `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 5}.png`
  }

  return {
    getAvatarUrl
  }
}
