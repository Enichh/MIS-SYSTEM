import type { Metadata, Viewport } from 'next'
import { Inter, Source_Code_Pro } from 'next/font/google'
import './globals.css'
import { NavigationProvider } from '@/lib/context/NavigationContext'
import { AuthProvider } from '@/lib/context/AuthContext'
import { ConfirmationProvider } from '@/lib/context/ConfirmationContext'
import GlobalConfirmationModal from '@/app/components/confirmation/GlobalConfirmationModal/GlobalConfirmationModal'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-mono-source',
})

export const metadata: Metadata = {
  title: 'Enosoft | Intelligent Management System',
  description: 'Next-generation management information system for modern workforces.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceCodePro.variable}`}>
      <body>
        <AuthProvider>
          <ConfirmationProvider>
            <NavigationProvider>{children}</NavigationProvider>
            <GlobalConfirmationModal />
          </ConfirmationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

