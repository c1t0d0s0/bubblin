import QRCode from 'qrcode';

/**
 * Renders a scannable QR code onto a canvas, themed to sit inside Bubblin's dark UI
 * (a near-navy ink on a white backing plate keeps the code reliably scannable —
 * inverting a QR to light-on-dark makes many phone cameras fail to read it).
 */
export async function renderInviteQr(canvas: HTMLCanvasElement, url: string, size: number = 132): Promise<void> {
  await QRCode.toCanvas(canvas, url, {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#0b1020',
      light: '#ffffff'
    }
  });
}
