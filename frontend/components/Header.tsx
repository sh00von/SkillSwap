"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  Fragment
} from "react"
import { getToken } from "@/lib/auth"

// lucide-react icons
import {
  Bell,
  CheckCircle,
  MessageSquare,
  Info,
  RefreshCw
} from "lucide-react"

interface Notification {
  _id: string
  type: "swap_request" | "swap_approved" | "review" | "system"
  message: string
  isRead: boolean
  createdAt: string
}

export default function Header() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const token = getToken()

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Fetch notifications
  useEffect(() => {
    if (!token) return
    fetch("http://localhost:5000/api/notifications", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: Notification[]) => setNotifications(data))
      .catch(console.error)
  }, [token])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAsRead = async (id: string) => {
    if (!token) return router.push("/login")
    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to mark read")
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      )
    } catch (err) {
      console.error(err)
    }
  }

  const markAllAsRead = async () => {
    if (!token) return router.push("/login")
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to mark all read")
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (err) {
      console.error(err)
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token")
    router.push("/")
  }, [router])

  // Map type → lucide icon
  const renderIcon = (type: Notification["type"]) => {
    const props = { className: "w-5 h-5 flex-shrink-0" }
    switch (type) {
      case "swap_request":
        return <MessageSquare {...props} />
      case "swap_approved":
        return <CheckCircle {...props} />
      case "review":
        return <RefreshCw {...props} />
      default:
        return <Info {...props} />
    }
  }

  return (
    <header className="bg-white shadow-md">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link
            href="/"
            className="text-xl font-bold text-indigo-600 hover:text-indigo-700"
          >
            SkillSwap
          </Link>
          <Link
            href="/skills"
            className="text-sm text-gray-600 hover:text-indigo-600"
          >
            Browse Skills
          </Link>
          <Link
            href="/users"
            className="text-sm text-gray-600 hover:text-indigo-600"
          >
            Users
          </Link>
          <Link
            href="/forum"
            className="text-sm text-gray-600 hover:text-indigo-600"
          >
            Forum
          </Link>
          <Link
            href="/map"
            className="text-sm text-gray-600 hover:text-indigo-600">
              Nearby Users
            </Link>
          <Link
            href="/admin"
            className="text-sm text-gray-600 hover:text-indigo-600"
          >
            Admin
          </Link>
        </div>

        <div className="flex items-center space-x-6 relative">
          {/* Notification Bell */}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Notifications"
            className="relative p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Bell className="w-6 h-6 text-gray-600 hover:text-indigo-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {open && (
            <div
              ref={dropdownRef}
              className="absolute right-0 pt-48 w-80 bg-white border rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 transition ease-out duration-200 origin-top-right"
            >
              <div className="flex justify-between items-center px-4 py-2 border-b">
                <h3 className="text-gray-800 font-medium">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-indigo-600 hover:underline focus:outline-none"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="p-4 text-gray-500 text-sm">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n._id}
                      onClick={() => markAsRead(n._id)}
                      className={`w-full flex space-x-3 px-4 py-3 hover:bg-gray-50 focus:outline-none ${
                        n.isRead ? "bg-white" : "bg-indigo-50"
                      }`}
                    >
                      {renderIcon(n.type)}
                      <div className="flex-1 text-left">
                        <p
                          className={`text-sm ${
                            n.isRead
                              ? "text-gray-700"
                              : "font-medium text-gray-900"
                          }`}
                        >
                          {n.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(n.createdAt)}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <Link
            href="/profile"
            className="text-sm text-gray-600 hover:text-indigo-600"
          >
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
