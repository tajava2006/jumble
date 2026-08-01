import { afterEach, describe, expect, it, vi } from 'vitest'
import { saveImage, type PreparedImage } from './save-image'

const preparedImage: PreparedImage = {
  blob: new Blob(['image'], { type: 'image/png' }),
  file: new File(['image'], 'image.png', { type: 'image/png' }),
  filename: 'image.png'
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('saveImage', () => {
  it('opens the mobile share sheet synchronously with a prepared image', () => {
    const share = vi.fn(() => new Promise<void>(() => undefined))
    vi.stubGlobal('navigator', createMobileNavigator(share))
    const saveAs = vi.fn()

    saveImage('https://example.com/image.png', preparedImage, saveAs)

    expect(share).toHaveBeenCalledWith({ files: [preparedImage.file] })
    expect(saveAs).not.toHaveBeenCalled()
  })

  it('reuses the prepared blob when sharing fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const share = vi.fn(() => Promise.reject(new Error('Share failed')))
    vi.stubGlobal('navigator', createMobileNavigator(share))
    const saveAs = vi.fn()

    saveImage('https://example.com/image.png', preparedImage, saveAs)
    await vi.waitFor(() => expect(saveAs).toHaveBeenCalled())

    expect(saveAs).toHaveBeenCalledWith(preparedImage.blob, preparedImage.filename)
  })
})

function createMobileNavigator(share: (data?: ShareData) => Promise<void>) {
  return {
    canShare: () => true,
    maxTouchPoints: 1,
    platform: 'iPhone',
    share,
    userAgent: 'iPhone'
  }
}
