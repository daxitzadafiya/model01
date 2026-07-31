const FALLBACK_ACCENT = '#755b00'

function toAbsoluteUrl(path: string): string {
  if (!path || path.startsWith('http')) return path

  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
  }

  return path
}

function getThemeTertiaryColor(): string {
  if (typeof window === 'undefined') return FALLBACK_ACCENT

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-tertiary')
    .trim()

  return value || FALLBACK_ACCENT
}

function colorToRgba(color: string, alpha: number): string {
  const trimmed = color.trim()

  if (trimmed.startsWith('rgba(') || trimmed.startsWith('rgb(')) {
    const parts = trimmed
      .replace(/^rgba?\(/, '')
      .replace(/\)$/, '')
      .split(',')
      .map((part) => part.trim())
    const [r = '0', g = '0', b = '0'] = parts
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const hex = trimmed.replace('#', '')
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((char) => char + char)
          .join('')
      : hex

  if (full.length !== 6 || Number.isNaN(Number.parseInt(full, 16))) {
    return colorToRgba(FALLBACK_ACCENT, alpha)
  }

  const r = Number.parseInt(full.slice(0, 2), 16)
  const g = Number.parseInt(full.slice(2, 4), 16)
  const b = Number.parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function drawMarkerIcon(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  width: number,
  height: number,
  hovered: boolean,
  accent: string,
): void {
  const centerX = width / 2
  const headRadius = hovered ? 21 : 18
  const headCenterY = headRadius + (hovered ? 7 : 6)
  const accentSoft = colorToRgba(accent, hovered ? 0.34 : 0.28)

  ctx.clearRect(0, 0, width, height)

  ctx.save()
  ctx.beginPath()
  ctx.ellipse(centerX, height - 4, hovered ? 14 : 11, hovered ? 4 : 3, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.18)'
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.arc(centerX, headCenterY, headRadius + (hovered ? 7 : 5), 0, Math.PI * 2)
  ctx.fillStyle = accentSoft
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.arc(centerX, headCenterY, headRadius + 3, 0, Math.PI * 2)
  ctx.strokeStyle = accent
  ctx.lineWidth = hovered ? 3 : 2
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.arc(centerX, headCenterY, headRadius, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'rgba(15, 23, 42, 0.22)'
  ctx.shadowBlur = hovered ? 16 : 10
  ctx.shadowOffsetY = 4
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(centerX - 10, headCenterY + headRadius - 2)
  ctx.lineTo(centerX, height - 8)
  ctx.lineTo(centerX + 10, headCenterY + headRadius - 2)
  ctx.closePath()
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = 'transparent'
  ctx.fill()
  ctx.strokeStyle = accent
  ctx.lineWidth = hovered ? 2 : 1.5
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.arc(centerX, headCenterY, headRadius - 5, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(
    image,
    centerX - (headRadius - 5),
    headCenterY - (headRadius - 5),
    (headRadius - 5) * 2,
    (headRadius - 5) * 2,
  )
  ctx.restore()
}

export function loadOfficeLocationMarkerIcons(
  faviconUrl: string,
): Promise<{ defaultIcon: google.maps.Icon; hoverIcon: google.maps.Icon }> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const accent = getThemeTertiaryColor()
      const defaultSize = { width: 56, height: 64 }
      const hoverSize = { width: 64, height: 72 }

      const defaultCanvas = document.createElement('canvas')
      defaultCanvas.width = defaultSize.width
      defaultCanvas.height = defaultSize.height
      const defaultCtx = defaultCanvas.getContext('2d')
      if (!defaultCtx) {
        reject(new Error('Could not create marker canvas'))
        return
      }
      drawMarkerIcon(defaultCtx, image, defaultSize.width, defaultSize.height, false, accent)

      const hoverCanvas = document.createElement('canvas')
      hoverCanvas.width = hoverSize.width
      hoverCanvas.height = hoverSize.height
      const hoverCtx = hoverCanvas.getContext('2d')
      if (!hoverCtx) {
        reject(new Error('Could not create marker canvas'))
        return
      }
      drawMarkerIcon(hoverCtx, image, hoverSize.width, hoverSize.height, true, accent)

      resolve({
        defaultIcon: {
          url: defaultCanvas.toDataURL('image/png'),
          scaledSize: new google.maps.Size(defaultSize.width, defaultSize.height),
          anchor: new google.maps.Point(defaultSize.width / 2, defaultSize.height - 6),
        },
        hoverIcon: {
          url: hoverCanvas.toDataURL('image/png'),
          scaledSize: new google.maps.Size(hoverSize.width, hoverSize.height),
          anchor: new google.maps.Point(hoverSize.width / 2, hoverSize.height - 6),
        },
      })
    }
    image.onerror = () => reject(new Error('Could not load favicon for map marker'))
    image.src = toAbsoluteUrl(faviconUrl)
  })
}
