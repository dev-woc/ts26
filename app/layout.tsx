import type { Metadata } from 'next'
import './globals.css'

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
      <body>{children}</body>
    </html>
  )
}
