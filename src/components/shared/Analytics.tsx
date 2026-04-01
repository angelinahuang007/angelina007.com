'use client';

import Script from 'next/script';
import { useEffect } from 'react';

export function Analytics() {
  // Only load analytics in production
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  const analyticsId = process.env.NEXT_PUBLIC_ANALYTICS_ID;

  if (!analyticsId) {
    return null;
  }

  // Umami Analytics Implementation
  // Uncomment the return statement below to use Umami
  // Replace 'YOUR_UMAMI_DOMAIN' with your actual Umami instance domain
  return (
    <Script
      src="https://analytics.umami.is/script.js"
      data-website-id={analyticsId}
      strategy="afterInteractive"
      onError={(e) => {
        console.error('Failed to load analytics script:', e);
      }}
    />
  );

  // Plausible Analytics Implementation
  // Uncomment the return statement below and comment out the Umami section above to use Plausible
  // This implementation uses your domain as the data-domain attribute
  /*
  return (
    <Script
      src="https://plausible.io/js/script.js"
      data-domain="angelina007.com"
      strategy="afterInteractive"
      onError={(e) => {
        console.error('Failed to load analytics script:', e);
      }}
    />
  );
  */

  // Google Analytics Implementation
  // Uncomment the return statement below and comment out other sections to use Google Analytics
  // Replace 'G-XXXXXXXXXX' with your actual Google Analytics measurement ID
  /*
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`}
        strategy="afterInteractive"
        onError={(e) => {
          console.error('Failed to load Google Analytics script:', e);
        }}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${analyticsId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
  */
}
