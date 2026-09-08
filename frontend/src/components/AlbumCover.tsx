import type { ImgHTMLAttributes } from 'react'

// Keep the frame full-size; crop only the border baked into Electric Shock.
export default function AlbumCover({ className = '', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  return <span className={`album-cover-frame ${className}`}><img {...props} /></span>
}
