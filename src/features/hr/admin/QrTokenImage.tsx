import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

/** Renders the check-in token as a scannable QR image. The token text stays
 *  visible underneath so a device without a camera can still be used. */
export function QrTokenImage({ value }: { value: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    // The check-in token is a ~330-character JWT, which needs a high QR
    // version. At 220px the modules were roughly 3px wide and phones
    // struggled; 320px puts them back over 4px. Error correction stays at the
    // default M so a little glare or a fingerprint does not kill the scan.
    QRCode.toDataURL(value, { margin: 2, width: 320, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (!cancelled) setDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [value])

  if (failed) {
    return <p className="mt-2 text-sm text-muted">Could not render a QR image; use the code below.</p>
  }
  if (!dataUrl) {
    return <p className="mt-2 text-sm text-muted">Rendering QR code…</p>
  }
  return (
    <img
      src={dataUrl}
      alt="QR code containing the shift check-in token"
      className="mt-2 h-auto w-full max-w-[320px] rounded-md bg-white p-2"
      width={320}
      height={320}
    />
  )
}
