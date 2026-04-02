import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { InteractionStatus, InteractionRequiredAuthError } from '@azure/msal-browser'
import { Profile } from '../Profile'
import { callMsGraph } from '../MsGraphApiCall'
import { callToken } from '../CustomApiCall'
import { useMsal } from '@azure/msal-react'
import type { IMsalContext } from '@azure/msal-react'

vi.mock('@azure/msal-react', () => ({
  MsalAuthenticationTemplate: ({ children }: { children: ReactNode }) => <>{children}</>,
  useMsal: vi.fn(),
}))

vi.mock('../MsGraphApiCall', () => ({
  callMsGraph: vi.fn(),
}))

vi.mock('../CustomApiCall', () => ({
  callToken: vi.fn(),
}))

const mockAcquireTokenRedirect = vi.fn()
const mockGetActiveAccount = vi.fn()

const mockInstance = {
  acquireTokenRedirect: mockAcquireTokenRedirect,
  getActiveAccount: mockGetActiveAccount,
} as unknown as IMsalContext['instance']

function setupUseMsal(inProgress: InteractionStatus = InteractionStatus.None) {
  vi.mocked(useMsal).mockReturnValue({
    instance: mockInstance,
    inProgress,
    accounts: [],
  } as unknown as IMsalContext)
}

describe('Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
    setupUseMsal()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the "Test token" button', () => {
    vi.mocked(callMsGraph).mockResolvedValue(null)
    render(<Profile />)
    expect(screen.getByRole('button', { name: 'Test token' })).toBeInTheDocument()
  })

  it('calls callMsGraph when inProgress is None and graphData is not loaded', async () => {
    vi.mocked(callMsGraph).mockResolvedValue({ displayName: 'Jane Doe' })
    render(<Profile />)
    await waitFor(() => expect(callMsGraph).toHaveBeenCalledOnce())
  })

  it('does not call callMsGraph when authentication is in progress', () => {
    setupUseMsal(InteractionStatus.Login)
    vi.mocked(callMsGraph).mockResolvedValue(null)
    render(<Profile />)
    expect(callMsGraph).not.toHaveBeenCalled()
  })

  it('displays the graph data as JSON after a successful fetch', async () => {
    const graphData = { displayName: 'Jane Doe', mail: 'jane@example.com' }
    vi.mocked(callMsGraph).mockResolvedValue(graphData)
    render(<Profile />)
    await waitFor(() =>
      expect(screen.getByText(JSON.stringify(graphData))).toBeInTheDocument()
    )
  })

  it('calls acquireTokenRedirect when an InteractionRequiredAuthError is thrown', async () => {
    const error = new InteractionRequiredAuthError('interaction_required')
    vi.mocked(callMsGraph).mockRejectedValue(error)
    mockGetActiveAccount.mockReturnValue({ username: 'user@example.com' })
    render(<Profile />)
    await waitFor(() => expect(mockAcquireTokenRedirect).toHaveBeenCalledOnce())
  })

  it('does not call acquireTokenRedirect for non-interaction errors', async () => {
    vi.mocked(callMsGraph).mockRejectedValue(new Error('Generic error'))
    render(<Profile />)
    await waitFor(() => expect(callMsGraph).toHaveBeenCalled())
    expect(mockAcquireTokenRedirect).not.toHaveBeenCalled()
  })

  it('calls callToken when the "Test token" button is clicked', async () => {
    vi.mocked(callMsGraph).mockResolvedValue(null)
    vi.mocked(callToken).mockResolvedValue(undefined)
    render(<Profile />)
    await userEvent.click(screen.getByRole('button', { name: 'Test token' }))
    expect(callToken).toHaveBeenCalledOnce()
  })

  it('does not call callMsGraph a second time once graphData is loaded', async () => {
    const graphData = { displayName: 'Jane Doe' }
    vi.mocked(callMsGraph).mockResolvedValue(graphData)
    render(<Profile />)
    await waitFor(() =>
      expect(screen.getByText(JSON.stringify(graphData))).toBeInTheDocument()
    )
    expect(callMsGraph).toHaveBeenCalledOnce()
  })
})
