import longWhite from '../assets/brand/long_w.png'
import longBlack from '../assets/brand/long_b.png'
import compactWhite from '../assets/brand/compact_w.png'
import compactBlack from '../assets/brand/compact_b.png'

// variant: "long" for the top bar, "compact" where the logo is shown large.
// tone: "light" artwork for dark backgrounds, "dark" artwork for light backgrounds.
const SOURCES = {
  long: { light: longWhite, dark: longBlack },
  compact: { light: compactWhite, dark: compactBlack },
}

export default function Logo({ variant = 'long', tone = 'light', className = '' }) {
  return (
    <img
      className={`logo logo-${variant} ${className}`}
      src={SOURCES[variant][tone]}
      alt="Uber Castagne"
      decoding="async"
    />
  )
}
