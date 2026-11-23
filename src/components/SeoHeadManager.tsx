import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useShop } from '../context/ShopContext';
import { WebmasterConfig, WebmasterRedirect } from '../types';

type PublicWebmasterPayload = {
  siteTitle: string;
  siteDescription: string;
  canonicalBaseUrl: string;
  ogImageUrl: string;
  googleSiteVerification: string;
  bingSiteVerification: string;
  gaMeasurementId: string;
  enablePharmacyJsonLd: boolean;
  enableProductJsonLd: boolean;
  redirects: WebmasterRedirect[];
};

const ROUTE_SEO_META: Record<string, { title: string; description: string }> = {
  '/diagnostic': {
    title: 'Diagnostic Routine Peau & Santé Sur-Mesure | Myrlan',
    description: 'Répondez à 4 questions cliniques et obtenez votre routine dermo-cosmétique et bien-être vérifiée par nos pharmaciens.'
  },
  '/rendez-vous': {
    title: 'Prendre Rendez-vous en Officine ou Visio | Pharmacie Myrlan',
    description: 'Réservez votre créneau en ligne pour vaccination, test rapide angine, bilan de médication ou conseil dermo-cosmétique.'
  },
  '/marques': {
    title: 'Nos Marques & Laboratoires Partenaires | Myrlan',
    description: 'Découvrez tous les laboratoires dermatologiques et marques expertes sélectionnés par nos pharmaciens Myrlan.'
  },
  '/promotions': {
    title: 'Promotions & Codes Promo Parapharmacie | Myrlan',
    description: 'Profitez des offres spéciales, remises immédiates et codes promo exclusifs sur vos soins de parapharmacie.'
  },
  '/ordonnance': {
    title: 'Envoyer une Ordonnance en Ligne | Pharmacie Myrlan',
    description: 'Transmettez votre ordonnance médicale en ligne de façon sécurisée pour un retrait prioritaire Click & Collect ou une livraison.'
  },
  '/conseils': {
    title: 'Conseils Santé & Dermo-Cosmétique | Myrlan',
    description: 'Guides pratiques, routines de soins et recommandations rédigés par nos docteurs en pharmacie.'
  },
  '/a-propos': {
    title: 'L’Officine Myrlan & Agréments | Pharmacie en Ligne',
    description: 'Découvrez l’officine Myrlan, notre équipe de pharmaciens diplômés et nos agréments officiels.'
  },
  '/contact': {
    title: 'Contact & Retrait Click & Collect | Pharmacie Myrlan',
    description: 'Contactez nos pharmaciens par message ou tchat en direct, consultez nos horaires et notre comptoir Click & Collect à Lyon.'
  },
  '/cgv': {
    title: 'Conditions Générales de Vente | Myrlan',
    description: 'Consultez les conditions générales de vente applicables aux commandes passées sur la parapharmacie Myrlan.'
  },
  '/livraison-retours': {
    title: 'Livraison & Retours | Myrlan Parapharmacie',
    description: 'Informations sur nos modes de livraison Colissimo, Chronopost, Mondial Relay, Click & Collect et retours sous 14 jours.'
  },
  '/confidentialite': {
    title: 'Politique de Confidentialité | Myrlan',
    description: 'Protection de vos données personnelles et secret médical sur la parapharmacie en ligne Myrlan.'
  },
  '/mentions-legales': {
    title: 'Mentions Légales | Pharmacie Myrlan',
    description: 'Mentions légales, informations réglementaires et coordonnées de la Pharmacie Myrlan.'
  }
};

function upsertMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!content) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLinkCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(id: string, payload: object | null) {
  const existing = document.getElementById(id);
  if (!payload) {
    if (existing) existing.remove();
    return;
  }
  const script = existing || document.createElement('script');
  script.id = id;
  script.setAttribute('type', 'application/ld+json');
  script.textContent = JSON.stringify(payload);
  if (!existing) {
    document.head.appendChild(script);
  }
}

export const SeoHeadManager: React.FC = () => {
  const { currentPath, selectedProductForDetail, navigate } = useShop();
  const [config, setConfig] = useState<PublicWebmasterPayload | null>(null);

  useEffect(() => {
    fetch('/api/webmaster/public')
      .then(res => res.json())
      .then((data: PublicWebmasterPayload) => {
        if (data && data.siteTitle) setConfig(data);
      })
      .catch(() => {});

    const socket = io();
    socket.on('webmaster-updated', (updated: WebmasterConfig) => {
      if (updated && updated.siteTitle) {
        setConfig({
          siteTitle: updated.siteTitle,
          siteDescription: updated.siteDescription,
          canonicalBaseUrl: updated.canonicalBaseUrl,
          ogImageUrl: updated.ogImageUrl,
          googleSiteVerification: updated.googleSiteVerification,
          bingSiteVerification: updated.bingSiteVerification,
          gaMeasurementId: updated.gaMeasurementId,
          enablePharmacyJsonLd: updated.enablePharmacyJsonLd,
          enableProductJsonLd: updated.enableProductJsonLd,
          redirects: (updated.redirects || []).filter(r => r.active)
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Client-side SPA redirect enforcement (never intercept /admin)
  useEffect(() => {
    if (currentPath === '/admin' || !config?.redirects?.length) return;
    const match = config.redirects.find(r => r.active && r.fromPath === currentPath);
    if (match && match.toPath.startsWith('/') && !match.toPath.startsWith('//') && match.toPath !== currentPath) {
      navigate(match.toPath);
    }
  }, [currentPath, config, navigate]);

  // Update <head> metadata, OpenGraph, Verification tags, GA4, and Schema.org JSON-LD
  useEffect(() => {
    if (currentPath === '/admin') {
      document.title = 'Espace Pharmacien Admin | Myrlan';
      upsertJsonLd('myrlan-jsonld-product', null);
      return;
    }
    if (!config) return;

    const baseOrigin =
      config.canonicalBaseUrl && /^https?:\/\//.test(config.canonicalBaseUrl)
        ? config.canonicalBaseUrl.replace(/\/+$/, '')
        : window.location.origin;

    const canonicalUrl = `${baseOrigin}${currentPath === '/' ? '/' : currentPath}`;
    const routeMeta = ROUTE_SEO_META[currentPath];

    let pageTitle = config.siteTitle;
    let pageDescription = config.siteDescription;
    let ogType = 'website';
    let ogImage = config.ogImageUrl
      ? (config.ogImageUrl.startsWith('/') ? `${baseOrigin}${config.ogImageUrl}` : config.ogImageUrl)
      : '';

    if (currentPath.startsWith('/produit/') && selectedProductForDetail) {
      pageTitle = `${selectedProductForDetail.name} · ${selectedProductForDetail.brand} | Myrlan`;
      pageDescription = selectedProductForDetail.description.slice(0, 160);
      ogType = 'product';
      if (selectedProductForDetail.image) {
        ogImage = selectedProductForDetail.image.startsWith('/')
          ? `${baseOrigin}${selectedProductForDetail.image}`
          : selectedProductForDetail.image;
      }
    } else if (routeMeta) {
      pageTitle = routeMeta.title;
      pageDescription = routeMeta.description;
    }

    document.title = pageTitle;
    upsertMetaTag('name', 'description', pageDescription);
    upsertMetaTag('property', 'og:type', ogType);
    upsertMetaTag('property', 'og:title', pageTitle);
    upsertMetaTag('property', 'og:description', pageDescription);
    upsertMetaTag('property', 'og:url', canonicalUrl);
    upsertMetaTag('property', 'og:site_name', 'Myrlan Parapharmacie');
    upsertMetaTag('property', 'og:image', ogImage);
    upsertMetaTag('name', 'twitter:title', pageTitle);
    upsertMetaTag('name', 'twitter:description', pageDescription);
    upsertMetaTag('name', 'twitter:image', ogImage);
    upsertLinkCanonical(canonicalUrl);

    // Search engine verification meta tags
    upsertMetaTag('name', 'google-site-verification', config.googleSiteVerification);
    upsertMetaTag('name', 'msvalidate.01', config.bingSiteVerification);

    // Schema.org Pharmacy JSON-LD
    if (config.enablePharmacyJsonLd) {
      upsertJsonLd('myrlan-jsonld-pharmacy', {
        '@context': 'https://schema.org',
        '@type': 'Pharmacy',
        name: 'Pharmacie & Parapharmacie Myrlan',
        description: config.siteDescription,
        url: baseOrigin,
        address: {
          '@type': 'PostalAddress',
          streetAddress: '15 rue de la République',
          addressLocality: 'Lyon',
          postalCode: '69002',
          addressCountry: 'FR'
        },
        telephone: '+33478004218'
      });
    } else {
      upsertJsonLd('myrlan-jsonld-pharmacy', null);
    }

    // Schema.org Product JSON-LD on product detail route
    if (config.enableProductJsonLd && currentPath.startsWith('/produit/') && selectedProductForDetail) {
      upsertJsonLd('myrlan-jsonld-product', {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: selectedProductForDetail.name,
        image: ogImage || undefined,
        description: selectedProductForDetail.description,
        sku: selectedProductForDetail.id,
        gtin13: selectedProductForDetail.ean,
        brand: {
          '@type': 'Brand',
          name: selectedProductForDetail.brand
        },
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: 'EUR',
          price: selectedProductForDetail.price.toFixed(2),
          availability: selectedProductForDetail.stock > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock'
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: selectedProductForDetail.rating,
          reviewCount: selectedProductForDetail.reviewsCount
        }
      });
    } else {
      upsertJsonLd('myrlan-jsonld-product', null);
    }
  }, [config, currentPath, selectedProductForDetail]);

  // Optional Google Analytics / Tag Manager injection (strict ID validation, skipped on /admin)
  useEffect(() => {
    const gaId = currentPath === '/admin' ? '' : (config?.gaMeasurementId?.trim() || '');
    const existingScript = document.getElementById('myrlan-ga-script');
    const existingInit = document.getElementById('myrlan-ga-init');

    if (!gaId || !/^(G|GT|GTM)-[A-Z0-9]{4,16}$/.test(gaId)) {
      if (existingScript) existingScript.remove();
      if (existingInit) existingInit.remove();
      return;
    }

    if (!existingScript || existingScript.getAttribute('data-ga-id') !== gaId) {
      if (existingScript) existingScript.remove();
      if (existingInit) existingInit.remove();

      if (gaId.startsWith('GTM-')) {
        const initScript = document.createElement('script');
        initScript.id = 'myrlan-ga-init';
        initScript.setAttribute('data-ga-id', gaId);
        initScript.textContent = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.id='myrlan-ga-script';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+encodeURIComponent(i);j.setAttribute('data-ga-id',i);f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(gaId)});`;
        document.head.appendChild(initScript);
      } else {
        const script = document.createElement('script');
        script.id = 'myrlan-ga-script';
        script.async = true;
        script.setAttribute('data-ga-id', gaId);
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
        document.head.appendChild(script);

        const initScript = document.createElement('script');
        initScript.id = 'myrlan-ga-init';
        initScript.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(gaId)});`;
        document.head.appendChild(initScript);
      }
    }
  }, [config?.gaMeasurementId, currentPath]);

  return null;
};
