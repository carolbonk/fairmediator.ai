import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

/**
 * SEO Component - Manages meta tags, Open Graph, Twitter Cards, and structured data
 *
 * @param {Object} props
 * @param {string} props.title - Page title (will be appended with site name)
 * @param {string} props.description - Page description for meta tags
 * @param {string} [props.canonical] - Canonical URL (defaults to current page)
 * @param {string} [props.image] - Open Graph image URL
 * @param {string} [props.type='website'] - Open Graph type
 * @param {Object} [props.jsonLd] - Schema.org JSON-LD structured data
 * @param {string[]} [props.keywords] - SEO keywords
 * @param {string} [props.author] - Page author
 * @param {boolean} [props.noindex=false] - Prevent search engine indexing
 */
const SEO = ({
  title,
  description,
  canonical,
  image = '/og-image.jpg',
  type = 'website',
  jsonLd,
  keywords = [],
  author = 'FairMediator',
  noindex = false,
}) => {
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://fairmediator.ai';
  const siteName = 'FairMediator';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const canonicalUrl = canonical || `${siteUrl}${window.location.pathname}`;
  const imageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      {author && <meta name="author" content={author} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Structured Data (JSON-LD) */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

SEO.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  canonical: PropTypes.string,
  image: PropTypes.string,
  type: PropTypes.string,
  jsonLd: PropTypes.object,
  keywords: PropTypes.arrayOf(PropTypes.string),
  author: PropTypes.string,
  noindex: PropTypes.bool,
};

export default SEO;
