import { render, screen } from '@testing-library/react'
import { AuthError } from '@azure/msal-browser'
import type { MsalAuthenticationResult } from '@azure/msal-react'
import { ErrorComponent } from '../ErrorComponent'

const makeProps = (error: AuthError | null): MsalAuthenticationResult => ({
  error,
  result: null,
  login: vi.fn() as unknown as MsalAuthenticationResult['login'],
})

describe('ErrorComponent', () => {
  it('displays the error code when an error is provided', () => {
    const error = new AuthError('invalid_client', 'The client is invalid')
    render(<ErrorComponent {...makeProps(error)} />)
    expect(screen.getByText('An Error Occurred: invalid_client')).toBeInTheDocument()
  })

  it('displays "unknown error" when error is null', () => {
    render(<ErrorComponent {...makeProps(null)} />)
    expect(screen.getByText('An Error Occurred: unknown error')).toBeInTheDocument()
  })

  it('renders an outer div element', () => {
    render(<ErrorComponent {...makeProps(null)} />)
    const el = screen.getByText(/An Error Occurred/)
    expect(el.tagName).toBe('DIV')
  })
})
