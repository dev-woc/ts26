import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import AppLayout from '@/components/layout/AppLayout'

export const metadata: Metadata = {
  title: 'USHER - Government Bid Management System',
  description: 'Automated government contracting and bid management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  )
}
