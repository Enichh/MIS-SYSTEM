import type { Metadata, Viewport } from 'next'
import './globals.css'
import { NavigationProvider } from '@/lib/context/NavigationContext'
import { AuthProvider } from '@/lib/context/AuthContext'

export const metadata: Metadata = {
  title: 'Enosoft Project Management System',
  description: 'Enosoft Project Management System - Admin Dashboard',
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
    <html lang="en">
      <body>
        <AuthProvider>
          <NavigationProvider>{children}</NavigationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
