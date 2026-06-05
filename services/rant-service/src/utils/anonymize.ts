export function anonymizeAuthor(
  userId: string,
  userMap: Record<string, any>,
  isAnonymous: boolean,
  requestingUser: { userId: string; role: string } | null
) {
  const authorInfo = userMap[userId] || {
    username: "unknown",
    displayName: "Pengguna Tidak Dikenal",
  }

  if (isAnonymous) {
    const anonResult: Record<string, any> = {
      displayName: "Anonim",
      username: null,
      isAnonymous: true,
    }
    // If user is admin, append real details prefixed for safety
    if (requestingUser && requestingUser.role === "admin") {
      anonResult._adminUserId = userId
      anonResult._adminUsername = authorInfo.username
      anonResult._adminDisplayName = authorInfo.displayName
    }
    return anonResult
  }

  return {
    id: userId,
    username: authorInfo.username,
    displayName: authorInfo.displayName,
    isAnonymous: false,
  }
}
