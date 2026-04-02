import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { Home } from '../Home'

vi.mock('@azure/msal-react', () => ({
  AuthenticatedTemplate: ({ children }: { children: ReactNode }) => (
    <div data-testid="authenticated">{children}</div>
  ),
  UnauthenticatedTemplate: ({ children }: { children: ReactNode }) => (
    <div data-testid="unauthenticated">{children}</div>
  ),
}))

describe('Home', () => {
  it('renders the authenticated template section', () => {
    render(<Home />)
    expect(screen.getByTestId('authenticated')).toBeInTheDocument()
  })

  it('renders the unauthenticated template section', () => {
    render(<Home />)
    expect(screen.getByTestId('unauthenticated')).toBeInTheDocument()
  })

  it('displays "Auht" text inside the authenticated section', () => {
    render(<Home />)
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Auht')
  })

  it('displays "Unauth" text inside the unauthenticated section', () => {
    render(<Home />)
    expect(screen.getByTestId('unauthenticated')).toHaveTextContent('Unauth')
  })
})
