import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'

/** getUserMedia is only exposed in a secure context. localhost counts, a
 *  plain-HTTP domain does not, so the scanner has to be able to say why it
 *  cannot start rather than failing silently. */
function cameraUnavailableReason(): string | null {
  if (typeof window === 'undefined') return 'Camera is not available here.'
  if (!window.isSecureContext) {
    return 'The camera needs a secure connection. Open the app over HTTPS (or on localhost) to scan.'
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return 'This browser does not expose a camera to web pages.'
  }
  return null
}

export function QrScanner({
  onScan,
  onClose,
}: {
  onScan: (text: string) => void
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [error, setError] = useState<string | null>(cameraUnavailableReason())

  // Parents pass an inline arrow; holding it in a ref keeps the effect from
  // tearing the camera down and back up on every render.
  const onScanRef = useRef(onScan)
  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    if (cameraUnavailableReason() !== null) return

    let cancelled = false
    const reader = new BrowserQRCodeReader()

    reader
      .decodeFromVideoDevice(undefined, videoRef.current ?? undefined, (result, decodeError, controls) => {
        controlsRef.current = controls
        if (cancelled) return
        if (result) {
          controls.stop()
          onScanRef.current(result.getText())
        }
        // decodeError fires on every frame without a code in view, so it is
        // deliberately ignored - only a hard failure surfaces below.
        void decodeError
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const message =
          err instanceof DOMException && err.name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow it in your browser, or paste the code instead.'
            : 'Could not start the camera. Paste the code instead.'
        setError(message)
      })

    return () => {
      cancelled = true
      controlsRef.current?.stop()
    }
  }, [])

  return (
    <div className="mt-3 rounded-lg border border-border bg-surface p-3">
      {error ? (
        <p role="alert" className="text-sm text-muted">
          {error}
        </p>
      ) : (
        <>
          <video
            ref={videoRef}
            className="aspect-square w-full max-w-xs rounded-md bg-black object-cover"
            aria-label="Camera viewfinder for scanning a shift QR code"
          />
          <p className="mt-2 text-sm text-muted">Point the camera at the shift QR code.</p>
        </>
      )}
      <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={onClose}>
        Stop camera
      </Button>
    </div>
  )
}
