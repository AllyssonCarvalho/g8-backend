let appToken: string | null = null

export const setAppToken = (token: string) => {
  appToken = token
}

export const getAppTokenValue = () => appToken