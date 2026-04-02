import { render, screen } from '@testing-library/react'
import { Loading } from '../Loading'

describe('Loading', () => {
  it('renders the authentication in progress message', () => {
    render(<Loading />)
    expect(screen.getByText('Authentication in progress...')).toBeInTheDocument()
  })

  it('renders inside a div element', () => {
    render(<Loading />)
    const el = screen.getByText('Authentication in progress...')
    expect(el.tagName).toBe('DIV')
  })
})
