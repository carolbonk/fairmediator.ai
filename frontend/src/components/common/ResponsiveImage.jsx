/**
 * ResponsiveImage Component
 * Modern <picture> element for responsive images
 *
 * Features:
 * - Multiple image sources for different screen sizes
 * - WebP format with fallback to PNG/JPG
 * - Lazy loading with loading="lazy"
 * - Aspect ratio preservation
 */

const ResponsiveImage = ({
  src,
  srcWebP,
  srcMobile,
  srcMobileWebP,
  alt,
  className = "",
  aspectRatio = "auto",
  loading = "lazy"
}) => {
  return (
    <picture className={`block ${className}`}>
      {/* Mobile WebP */}
      {srcMobileWebP && (
        <source
          media="(max-width: 768px)"
          srcSet={srcMobileWebP}
          type="image/webp"
        />
      )}

      {/* Mobile fallback */}
      {srcMobile && (
        <source
          media="(max-width: 768px)"
          srcSet={srcMobile}
        />
      )}

      {/* Desktop WebP */}
      {srcWebP && (
        <source
          srcSet={srcWebP}
          type="image/webp"
        />
      )}

      {/* Fallback image */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        className={`w-full h-auto object-cover ${className}`}
        style={{ aspectRatio }}
      />
    </picture>
  );
};

export default ResponsiveImage;
