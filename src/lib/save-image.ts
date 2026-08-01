import { isTouchDevice } from './utils'

export type SaveAs = (source: string | Blob, name?: string) => void

export type PreparedImage = {
  blob: Blob
  file: File
  filename: string
}

export async function prepareImageForSave(
  url: string,
  signal?: AbortSignal
): Promise<PreparedImage> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`)

  const blob = await response.blob()
  const filename = getImageFilename(url, blob.type)
  return {
    blob,
    file: new File([blob], filename, { type: blob.type }),
    filename
  }
}

export function shouldPrepareImageForShare() {
  return isMobileDevice() && typeof navigator.share === 'function'
}

export function saveImage(url: string, preparedImage: PreparedImage | undefined, saveAs: SaveAs) {
  const fallbackFilename = getImageFilename(url)
  const isMobile = isMobileDevice()

  const download = () => {
    if (preparedImage) {
      saveAs(preparedImage.blob, preparedImage.filename)
    } else {
      saveAs(url, fallbackFilename)
    }
  }

  if (!isMobile) {
    download()
    return
  }

  if (typeof navigator.share !== 'function' || !preparedImage) {
    download()
    return
  }

  try {
    const shareData = { files: [preparedImage.file] }

    if (typeof navigator.canShare === 'function' && !navigator.canShare(shareData)) {
      throw new Error('File sharing is not supported')
    }

    void navigator.share(shareData).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.warn('Failed to share image with the system', error)
      download()
    })
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    console.warn('Failed to share image with the system', error)
    download()
  }
}

function isMobileDevice() {
  const userAgent = navigator.userAgent
  const isMobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)
  const isIPadDesktopMode = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return isMobileUserAgent || isIPadDesktopMode || isTouchDevice()
}

function getImageFilename(url: string, mimeType?: string) {
  try {
    const pathname = new URL(url, window.location.href).pathname
    const filename = decodeURIComponent(pathname.split('/').pop() || '')
    if (/\.[a-z0-9]+$/i.test(filename)) return filename

    const extension = getImageExtension(mimeType)
    return `${filename || 'image'}${extension ? `.${extension}` : ''}`
  } catch {
    const extension = getImageExtension(mimeType)
    return `image${extension ? `.${extension}` : ''}`
  }
}

function getImageExtension(mimeType?: string) {
  const extensions: Record<string, string> = {
    'image/avif': 'avif',
    'image/gif': 'gif',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/svg+xml': 'svg',
    'image/webp': 'webp'
  }
  return mimeType ? extensions[mimeType.toLowerCase()] : undefined
}
