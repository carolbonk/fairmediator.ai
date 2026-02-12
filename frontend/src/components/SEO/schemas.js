/**
 * Schema.org JSON-LD structured data generators
 * These help search engines understand your content for rich snippets
 */

const siteUrl = import.meta.env.VITE_SITE_URL || 'https://fairmediator.ai';

/**
 * Organization Schema - For homepage and site-wide identity
 * Helps Google display your brand info in search results
 */
export const getOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'FairMediator',
  description: 'AI-powered platform for transparent mediator selection and conflict resolution',
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  foundingDate: '2024',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'support@fairmediator.com',
  },
  sameAs: [
    // Add your social media profiles here
    // 'https://twitter.com/fairmediator',
    // 'https://linkedin.com/company/fairmediator',
  ],
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/mediators?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
});

/**
 * WebSite Schema - For site search and branding
 */
export const getWebSiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'FairMediator',
  url: siteUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/mediators?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
});

/**
 * LocalBusiness Schema - For service provider pages
 * Use this on the main mediators page or about page
 */
export const getLocalBusinessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'FairMediator',
  description: 'Professional mediator selection platform using AI to match parties with qualified mediators',
  url: siteUrl,
  telephone: '+1-XXX-XXX-XXXX', // Add your phone number
  email: 'support@fairmediator.com',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'US',
    // Add full address if you have a physical location
  },
  priceRange: '$$',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '127',
  },
  serviceType: 'Mediation Services',
});

/**
 * Person Schema - For individual mediator profiles
 * @param {Object} mediator - Mediator data
 */
export const getMediatorPersonSchema = (mediator) => {
  if (!mediator) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: mediator.name,
    jobTitle: 'Professional Mediator',
    description: mediator.bio || mediator.summary || 'Professional mediator',
    email: mediator.email,
    telephone: mediator.phone,
    url: `${siteUrl}/mediators/${mediator._id || mediator.id}`,
    ...(mediator.image && { image: mediator.image }),
    ...(mediator.yearsExperience && {
      awards: [`${mediator.yearsExperience}+ years of mediation experience`],
    }),
    ...(mediator.specializations && {
      knowsAbout: mediator.specializations,
    }),
    ...(mediator.credentials && mediator.credentials.length > 0 && {
      hasCredential: mediator.credentials.map(cred => ({
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: cred.type || 'certification',
        name: cred.name || cred,
      })),
    }),
  };
};

/**
 * Service Schema - For the mediation service itself
 * @param {Object} mediator - Mediator offering the service
 */
export const getMediationServiceSchema = (mediator) => {
  if (!mediator) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Mediation Services',
    provider: {
      '@type': 'Person',
      name: mediator.name,
      ...(mediator.image && { image: mediator.image }),
    },
    areaServed: mediator.states || mediator.location || 'United States',
    ...(mediator.specializations && {
      category: mediator.specializations,
    }),
    ...(mediator.hourlyRate && {
      offers: {
        '@type': 'Offer',
        price: mediator.hourlyRate,
        priceCurrency: 'USD',
      },
    }),
  };
};

/**
 * Breadcrumb Schema - For navigation breadcrumbs
 * @param {Array} breadcrumbs - Array of {name, url} objects
 */
export const getBreadcrumbSchema = (breadcrumbs) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: `${siteUrl}${crumb.url}`,
  })),
});

/**
 * FAQ Schema - For FAQ sections
 * @param {Array} faqs - Array of {question, answer} objects
 */
export const getFAQSchema = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

/**
 * Article Schema - For blog posts or content pages
 * @param {Object} article - Article data
 */
export const getArticleSchema = (article) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: article.title,
  description: article.description,
  image: article.image || `${siteUrl}/og-image.jpg`,
  datePublished: article.publishedDate,
  dateModified: article.modifiedDate || article.publishedDate,
  author: {
    '@type': 'Organization',
    name: 'FairMediator',
  },
  publisher: {
    '@type': 'Organization',
    name: 'FairMediator',
    logo: {
      '@type': 'ImageObject',
      url: `${siteUrl}/logo.png`,
    },
  },
});

/**
 * Review Schema - For mediator reviews
 * @param {Object} review - Review data
 * @param {Object} mediator - Mediator being reviewed
 */
export const getReviewSchema = (review, mediator) => ({
  '@context': 'https://schema.org',
  '@type': 'Review',
  itemReviewed: {
    '@type': 'Person',
    name: mediator.name,
  },
  author: {
    '@type': 'Person',
    name: review.authorName || 'Anonymous',
  },
  reviewRating: {
    '@type': 'Rating',
    ratingValue: review.rating,
    bestRating: '5',
  },
  reviewBody: review.text,
  datePublished: review.date,
});
