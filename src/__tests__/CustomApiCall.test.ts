import { callToken } from '../CustomApiCall'

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

describe('callToken', () => {
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
    await expect(callToken()).rejects.toThrow(
      'No active account! Verify a user has been signed in and setActiveAccount has been called.'
    )
  })

  it('calls acquireTokenSilent with forceRefresh:false', async () => {
    const mockAccount = { username: 'user@example.com', homeAccountId: '123' }
    mockGetActiveAccount.mockReturnValue(mockAccount)
    mockAcquireTokenSilent.mockResolvedValue({ accessToken: 'test-token' })
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: 'ok' }),
    })

    await callToken()

    expect(mockAcquireTokenSilent).toHaveBeenCalledWith(
      expect.objectContaining({ account: mockAccount, forceRefresh: false })
    )
  })

  it('makes a GET request to the custom API endpoint', async () => {
    const mockAccount = { username: 'user@example.com' }
    mockGetActiveAccount.mockReturnValue(mockAccount)
    mockAcquireTokenSilent.mockResolvedValue({ accessToken: 'test-token' })
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: 'ok' }),
    })
    global.fetch = mockFetch

    await callToken()

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/data',
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('adds a Bearer token to the Authorization header', async () => {
    const mockAccount = { username: 'user@example.com' }
    mockGetActiveAccount.mockReturnValue(mockAccount)
    mockAcquireTokenSilent.mockResolvedValue({ accessToken: 'my-custom-token' })

    let capturedHeaders: Headers | undefined
    global.fetch = vi.fn().mockImplementation((_url: string, options: RequestInit) => {
      capturedHeaders = options.headers as Headers
      return Promise.resolve({ json: () => Promise.resolve({}) })
    })

    await callToken()

    expect(capturedHeaders?.get('Authorization')).toBe('Bearer my-custom-token')
  })

  it('logs the parsed response data to console', async () => {
    const mockAccount = { username: 'user@example.com' }
    mockGetActiveAccount.mockReturnValue(mockAccount)
    mockAcquireTokenSilent.mockResolvedValue({ accessToken: 'test-token' })
    const responseData = { value: 'some data' }
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(responseData),
    })

    await callToken()

    expect(consoleSpy).toHaveBeenCalledWith(responseData)
  })

  it('logs the error to console when fetch rejects', async () => {
    const mockAccount = { username: 'user@example.com' }
    mockGetActiveAccount.mockReturnValue(mockAccount)
    mockAcquireTokenSilent.mockResolvedValue({ accessToken: 'test-token' })
    const fetchError = new Error('Connection refused')
    global.fetch = vi.fn().mockRejectedValue(fetchError)

    await callToken()

    expect(consoleSpy).toHaveBeenCalledWith(fetchError)
  })
})
