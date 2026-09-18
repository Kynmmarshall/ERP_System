import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { QrScanner } from '@/features/hr/QrScanner'

describe('QrScanner', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('explains that the camera needs a secure connection instead of failing silently', () => {
    vi.stubGlobal('isSecureContext', false)

    render(<QrScanner onScan={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByRole('alert')).toHaveTextContent(/secure connection/i)
    expect(screen.queryByLabelText(/camera viewfinder/i)).not.toBeInTheDocument()
  })

  it('still offers a way out when the camera cannot start', () => {
    vi.stubGlobal('isSecureContext', false)
    const onClose = vi.fn()

    render(<QrScanner onScan={vi.fn()} onClose={onClose} />)

    expect(screen.getByRole('button', { name: /stop camera/i })).toBeEnabled()
  })
})
