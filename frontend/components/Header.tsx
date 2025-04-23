// components/Header.tsx
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

export default function Header() {
  const router = useRouter()

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token")
    router.push("/")
  }, [router])

  return (
    <header className="bg-white shadow-md">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-xl font-bold text-indigo-600 hover:text-indigo-700">
            SkillSwap
          </Link>
          <Link href="/skills" className="text-sm text-gray-600 hover:text-indigo-600">
            Browse Skills
          </Link>
          <Link href="/users" className="text-sm text-gray-600 hover:text-indigo-600">
            Users
          </Link>
          <Link href="/forum" className="text-sm text-gray-600 hover:text-indigo-600">
            Forum
          </Link>
          <Link href="/admin" className="text-sm text-gray-600 hover:text-indigo-600">
            Admin
          </Link>
          
        </div>
        <div className="flex items-center space-x-6">
          <Link href="/profile" className="text-sm text-gray-600 hover:text-indigo-600">
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-indigo-600"
          >
            Log Out
          </button>
        </div>
      </nav>
    </header>
  )
}
