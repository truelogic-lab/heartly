import { useState } from 'react';

/**
 * SafeImage — renders an image with a graceful fallback.
 *
 * If the src fails to load, shows a pink-gradient placeholder
 * with the provided initials (or a heart icon).
 */
export default function SafeImage({
  src,
  alt = '',
  initials = '',
  className = '',
  ...rest
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`safe-image-fallback ${className}`} aria-label={alt}>
        {initials ? (
          <span className="safe-image-fallback__initials">{initials}</span>
        ) : (
          <span className="safe-image-fallback__heart" aria-hidden="true">♥</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
