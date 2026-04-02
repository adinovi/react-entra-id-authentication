import { CustomNavigationClient } from '../NavigationClient'
import type { NavigationOptions } from '@azure/msal-browser'

describe('CustomNavigationClient', () => {
  let mockNavigate: ReturnType<typeof vi.fn>
  let client: CustomNavigationClient

  beforeEach(() => {
    mockNavigate = vi.fn()
    client = new CustomNavigationClient(mockNavigate)
  })

  describe('navigateInternal', () => {
    it('navigates to relative path when noHistory is false', async () => {
      const options: NavigationOptions = { noHistory: false }
      const result = await client.navigateInternal(
        `${window.location.origin}/some/path`,
        options
      )
      expect(mockNavigate).toHaveBeenCalledWith('/some/path')
      expect(result).toBe(false)
    })

    it('navigates with replace:true when noHistory is true', async () => {
      const options: NavigationOptions = { noHistory: true }
      const result = await client.navigateInternal(
        `${window.location.origin}/some/path`,
        options
      )
      expect(mockNavigate).toHaveBeenCalledWith('/some/path', { replace: true })
      expect(result).toBe(false)
    })

    it('strips the origin from the URL to form a relative path', async () => {
      const options: NavigationOptions = { noHistory: false }
      await client.navigateInternal(
        `${window.location.origin}/auth/callback?code=abc123`,
        options
      )
      expect(mockNavigate).toHaveBeenCalledWith('/auth/callback?code=abc123')
    })

    it('always returns false to hand control back to MSAL', async () => {
      const result1 = await client.navigateInternal(
        `${window.location.origin}/`,
        { noHistory: false }
      )
      const result2 = await client.navigateInternal(
        `${window.location.origin}/`,
        { noHistory: true }
      )
      expect(result1).toBe(false)
      expect(result2).toBe(false)
    })
  })
})
