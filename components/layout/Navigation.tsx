'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

interface DropdownItem {
  label: string
  href: string
  adminOnly?: boolean
}

interface NavItem {
  label: string
  href?: string
  items?: DropdownItem[]
}

export default function Navigation() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isAdmin = session?.user?.role === 'ADMIN'

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
    },
    {
      label: 'Opportunities',
      items: [
        { label: 'All Opportunities', href: '/opportunities' },
        { label: 'Active', href: '/opportunities?status=ACTIVE' },
        { label: 'Archived', href: '/opportunities?status=ARCHIVED' },
      ],
    },
    {
      label: 'SOWs',
      items: [
        { label: 'All SOWs', href: '/sows' },
        { label: 'Pending Approval', href: '/sows?status=PENDING_REVIEW' },
        { label: 'Approved', href: '/sows?status=APPROVED' },
        { label: 'Sent', href: '/sows?status=SENT' },
      ],
    },
    {
      label: 'Bids',
      items: [
        { label: 'All Bids', href: '/bids' },
        { label: 'In Progress', href: '/bids?status=DRAFT' },
        { label: 'Submitted', href: '/bids?status=SUBMITTED' },
      ],
    },
    {
      label: 'Vendors',
      items: [
        { label: 'All Vendors', href: '/vendors' },
        { label: 'Subcontractors', href: '/vendors?type=SUBCONTRACTOR' },
        { label: 'Partners', href: '/vendors?type=PARTNER' },
        { label: 'Active', href: '/vendors?status=ACTIVE' },
      ],
    },
    {
      label: 'Reports',
      items: [
        { label: 'Pipeline Report', href: '/reports/pipeline' },
        { label: 'Margin Analysis', href: '/reports/margins' },
        { label: 'Win Rate', href: '/reports/win-rate' },
      ],
    },
  ]

  // Add admin menu if user is admin
  if (isAdmin) {
    navItems.push({
      label: 'Admin',
      items: [
        { label: 'Users', href: '/admin/users', adminOnly: true },
        { label: 'Settings', href: '/admin/settings', adminOnly: true },
        { label: 'Backfill SOWs', href: '/admin/backfill', adminOnly: true },
        { label: 'System Logs', href: '/admin/logs', adminOnly: true },
      ],
    })
  }

  const isActivePath = (href: string) => {
    if (href === '/dashboard') return pathname === href
    return pathname.startsWith(href)
  }

  const handleDropdownToggle = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null)
    if (openDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdown])

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center px-2 py-2">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-blue-600">USHER</span>
              </div>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-1">
              {navItems.map((item) => {
                if (item.href) {
                  // Simple link
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`inline-flex items-center px-4 py-2 text-sm font-medium transition-colors ${
                        isActivePath(item.href)
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                } else if (item.items) {
                  // Dropdown
                  return (
                    <div key={item.label} className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDropdownToggle(item.label)
                        }}
                        className={`inline-flex items-center px-4 py-2 text-sm font-medium transition-colors ${
                          item.items.some((i) => isActivePath(i.href))
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        {item.label}
                        <svg
                          className="ml-1 h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {/* Dropdown menu */}
                      {openDropdown === item.label && (
                        <div className="absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                          <div className="py-1">
                            {item.items.map((subItem) => (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                className={`block px-4 py-2 text-sm transition-colors ${
                                  isActivePath(subItem.href)
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                                }`}
                                onClick={() => setOpenDropdown(null)}
                              >
                                {subItem.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                }
                return null
              })}
            </div>
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center">
            {session && (
              <div className="relative ml-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDropdownToggle('user')
                  }}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                    {session.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="ml-2 text-gray-700 hidden md:block">
                    {session.user?.name}
                  </span>
                  <svg
                    className="ml-1 h-4 w-4 text-gray-500 hidden md:block"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* User dropdown */}
                {openDropdown === 'user' && (
                  <div className="absolute right-0 z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <div className="px-4 py-2 text-xs text-gray-500 border-b">
                        {session.user?.email}
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setOpenDropdown(null)}
                      >
                        Your Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setOpenDropdown(null)}
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => signOut()}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden ml-2 inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              if (item.href) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActivePath(item.href)
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              } else if (item.items) {
                return (
                  <div key={item.label}>
                    <div className="px-3 py-2 text-base font-semibold text-gray-900">
                      {item.label}
                    </div>
                    {item.items.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={`block pl-6 pr-3 py-2 rounded-md text-sm ${
                          isActivePath(subItem.href)
                            ? 'text-blue-600 bg-blue-50'
                            : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )
              }
              return null
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
