import type React from "react"
import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from 'sonner'
import { CartProvider } from '@/hooks/use-shopping-cart'

const SITE_NAME = 'Librás - Loja de Abrasivos e Lixas'
const SITE_DESCRIPTION = 'Soluções abrasivas de alta performance para indústria, marcenaria, marmoraria e construção civil. Precisão e durabilidade em cada grão. Encontre lixas, discos e muito mais.'
const SITE_URL = 'https://loja.libraslixas.com.br'

export const viewport: Viewport = {
  themeColor: '#8B0000', // Deep red matching brand
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'Loja de abrasivos',
    'lixas profissionais',
    'discos de corte',
    'abrasivos para indústria',
    'marcenaria',
    'marmoraria',
    'cutelaria',
    'funilaria',
    'construção civil',
    'Librás lixas',
  ],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    url: SITE_URL,
    images: [
      {
        url: '/logo2.png',
        width: 1200,
        height: 630,
        alt: 'Librás - A Casa das Lixas',
      },
    ],
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ['/logo2.png'],
  },
  icons: {
    icon: '/logo.ico',
    apple: '/apple-touch-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    "name": "Librás - A Casa das Lixas",
    "description": SITE_DESCRIPTION,
    "url": SITE_URL,
    "logo": `${SITE_URL}/logo2.png`,
    "image": `${SITE_URL}/logo2.png`,
    "telephone": "+5562982714849",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Goiânia",
      "addressRegion": "GO",
      "addressCountry": "BR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -16.6869, // Exemplo Goiânia, ajuste se necessário
      "longitude": -49.2648
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "18:00"
      }
    ],
    "sameAs": [
      "https://www.instagram.com/libras.casadaslixas/",
      "https://www.facebook.com/p/Libr%C3%A1s-A-Casa-Das-Lixas-100064505036066/"
    ],
    "priceRange": "$$"
  }

  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased bg-background selection:bg-primary/30 selection:text-white text-foreground flex flex-col min-h-screen">
        <CartProvider>
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <Analytics />
          <Toaster />
          <SonnerToaster richColors position="top-right" />
        </CartProvider>
      </body>
    </html>
  )
}
