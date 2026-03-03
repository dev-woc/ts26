import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function Home() {
  const session = await auth()

  // If user is authenticated, redirect to dashboard
  if (session) {
    redirect('/dashboard')
  }

  // For unauthenticated users, redirect to login
  redirect('/login')
}
