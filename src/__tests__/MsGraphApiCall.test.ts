import { callMsGraph } from '../MsGraphApiCall'

const { mockGetActiveAccount, mockAcquireTokenSilent } = vi.hoisted(() => ({
  mockGetActiveAccount: vi.fn(),
  mockAcquireTokenSilent: vi.fn(),
}))

vi.mock('../main', () => ({
  msalInstance: {
    getActiveAccount: mockGetActiveAccount,
    acquireTokenSilent: mockAcquireTokenSilent,
  },
}))

describe('callMsGraph', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throws when there is no active account', async () => {
    mockGetActiveAccount.mockReturnValue(null)
    await expect(callMsGraph()).rejects.toThrow(
      'No active account! Verify a user has been signed in and setActiveAccount has been called.'
    )
  })

  it('calls acquireTokenSilent with the active account', async () => {
    const mockAccount = { username: 'user@example.com', homeAccountId: '123' }
    mockGetActiveAccount.mockReturnValue(mockAccount)
    mockAcquireTokenSilent.mockResolvedValue({ accessToken: 'test-token' })
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ displayName: 'Test User' }),
    })

    await callMsGraph()

    expect(mockAcquireTokenSilent).toHaveBeenCalledWith(
      expect.objectContaining({ account: mockAccount })
    )
  })

  it('makes a GET request to the Microsoft Graph Me endpoint', async () => {
    const mockAccount = { username: 'user@example.com', homeAccountId: '123' }
    mockGetActiveAccount.mockReturnValue(mockAccount)
    mockAcquireTokenSilent.mockResolvedValue({ accessToken: 'test-token' })
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ displayName: 'Test User' }),
    })
    global.fetch = mockFetch

    await callMsGraph()

    expect(mockFetch).toHaveBeenCalledWith(
      'https://graph.microsoft.com/v1.0/me',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('adds a Bearer token to the Authorization header', async () => {
    const mockAccount = { username: 'user@example.com' }
    mockGetActiveAccount.mockReturnValue(mockAccount)
    mockAcquireTokenSilent.mockResolvedValue({ accessToken: 'my-access-token' })

    let capturedHeaders: Headers | undefined
    global.fetch = vi.fn().mockImplementation((_url: string, options: RequestInit) => {
      capturedHeaders = options.headers as Headers
      return Promise.resolve({ json: () => Promise.resolve({}) })
    })

    await callMsGraph()

    expect(capturedHeaders?.get('Authorization')).toBe('Bearer my-access-token')
  })

  it('returns the parsed JSON response', async () => {
    const mockAccount = { username: 'user@example.com' }
    mockGetActiveAccount.mockReturnValue(mockAccount)
    mockAcquireTokenSilent.mockResolvedValue({ accessToken: 'test-token' })
    const graphData = { displayName: 'John Doe', mail: 'john@example.com' }
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(graphData),
    })

    const result = await callMsGraph()

    expect(result).toEqual(graphData)
  })

  it('logs the error to console when fetch rejects', async () => {
    const mockAccount = { username: 'user@example.com' }
    mockGetActiveAccount.mockReturnValue(mockAccount)
    mockAcquireTokenSilent.mockResolvedValue({ accessToken: 'test-token' })
    const fetchError = new Error('Network error')
    global.fetch = vi.fn().mockRejectedValue(fetchError)

    await callMsGraph()

    expect(consoleSpy).toHaveBeenCalledWith(fetchError)
  })
})
