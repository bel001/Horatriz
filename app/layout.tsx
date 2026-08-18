import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Horatriz - Generador Inteligente de Horarios Universitarios",
  description:
    "Crea y optimiza tu horario universitario sin cruces de forma automática. Simula combinaciones, evita horas muertas y elige a tus profesores preferidos.",
  keywords: [
    "Horatriz",
    "Horarios UPAO",
    "Generador de horarios universitarios",
    "Simulador de horario",
    "Horario universitario sin cruces",
    "Optimizar horario universidad",
    "Armar horario academico",
    "UPAO",
  ],
  authors: [{ name: "Horatriz Team" }],
  creator: "Horatriz",
  publisher: "Horatriz",
  openGraph: {
    title: "Horatriz - Tu Horario Universitario Ideal Sin Cruces",
    description:
      "Genera e inspecciona las mejores combinaciones de horario universitario en segundos. 100% gratis.",
    siteName: "Horatriz",
    locale: "es_PE",
    type: "website",
    images: [
      {
        url: "https://horatriz.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Horatriz - Generador de Horarios Universitarios",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Horatriz - Generador de Horarios Universitarios",
    description:
      "Genera y optimiza tus horarios universitarios sin cruces de forma automática.",
    images: ["https://horatriz.vercel.app/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "CfUsVkrx4_vci3jprwAB1ITx8F4LU7YelD6W4kqkJ9k",
  },
};

const temaScript = `(function(){try{var t=localStorage.getItem("horatriz-theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark")}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaScript }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}