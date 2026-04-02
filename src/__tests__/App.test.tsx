import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { IPublicClientApplication } from '@azure/msal-browser'
import App from '../App'

vi.mock('@azure/msal-react', () => ({
  MsalProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('../Profile', () => ({
  Profile: () => <div data-testid="profile-component">Profile</div>,
}))

vi.mock('../NavigationClient', () => ({
  CustomNavigationClient: class {
    // mock constructor for use with `new` in App.tsx
  },
}))

describe('App', () => {
  const mockPca = {
    setNavigationClient: vi.fn(),
  } as unknown as IPublicClientApplication

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the Profile component on the root route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App pca={mockPca} />
      </MemoryRouter>
    )
    expect(screen.getByTestId('profile-component')).toBeInTheDocument()
  })

  it('calls setNavigationClient on the pca instance', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App pca={mockPca} />
      </MemoryRouter>
    )
    expect(mockPca.setNavigationClient).toHaveBeenCalledOnce()
  })

  it('does not render Profile on an unknown route', () => {
    render(
      <MemoryRouter initialEntries={['/unknown']}>
        <App pca={mockPca} />
      </MemoryRouter>
    )
    expect(screen.queryByTestId('profile-component')).not.toBeInTheDocument()
  })
})
