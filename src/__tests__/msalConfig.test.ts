import { msalConfig, meRequest, tokenRequest, graphConfig } from '../msalConfig'

describe('msalConfig', () => {
  describe('auth configuration', () => {
    it('has the correct client ID', () => {
      expect(msalConfig.auth.clientId).toBe('6db23449-b145-4b3e-bcba-1612151adddb')
    })

    it('has the correct authority URL', () => {
      expect(msalConfig.auth.authority).toBe(
        'https://login.microsoftonline.com/72d74aa2-ffea-4854-b246-6241845ee5ff'
      )
    })
  })

  describe('cache configuration', () => {
    it('uses sessionStorage as cache location', () => {
      expect(msalConfig.cache?.cacheLocation).toBe('sessionStorage')
    })

    it('does not store auth state in cookie', () => {
      expect(msalConfig.cache?.storeAuthStateInCookie).toBe(false)
    })
  })

  describe('system / logger configuration', () => {
    it('has a logger callback defined', () => {
      expect(msalConfig.system?.loggerOptions?.loggerCallback).toBeDefined()
    })

    it('logger callback logs level and message to console', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
      msalConfig.system?.loggerOptions?.loggerCallback?.(0, 'test message', true)
      expect(consoleSpy).toHaveBeenCalledWith(0, 'test message')
      consoleSpy.mockRestore()
    })
  })
})

describe('meRequest', () => {
  it('has exactly one scope', () => {
    expect(meRequest.scopes).toHaveLength(1)
  })

  it('includes the User.Read scope', () => {
    expect(meRequest.scopes).toContain('User.Read')
  })
})

describe('tokenRequest', () => {
  it('has exactly two API scopes', () => {
    expect(tokenRequest.scopes).toHaveLength(2)
  })

  it('includes the remu.read scope', () => {
    expect(tokenRequest.scopes.some((s) => s.includes('remu.read'))).toBe(true)
  })

  it('includes the archicon.read scope', () => {
    expect(tokenRequest.scopes.some((s) => s.includes('archicon.read'))).toBe(true)
  })
})

describe('graphConfig', () => {
  it('has the correct Microsoft Graph Me endpoint', () => {
    expect(graphConfig.graphMeEndpoint).toBe('https://graph.microsoft.com/v1.0/me')
  })
})
