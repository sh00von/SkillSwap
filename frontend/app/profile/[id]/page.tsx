"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

interface UserProfile {
  _id: string
  username: string
  email: string
  createdAt?: string
}

export default function PublicProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    fetch(`http://localhost:5000/api/auth/users/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data || !data.username) throw new Error()
        setUser(data)
      })
      .catch(() => setError("User not found"))
      .finally(() => setLoading(false))
  }, [id])

  const startChat = () => {
    const token = localStorage.getItem("token")
    if (!token) return router.push("/login")

    setIsConnecting(true)
    router.push(`/chat/${id}`)
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (error || !user) return <div className="p-6 text-red-500">{error || "User not found"}</div>

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-2">{user.username}</h1>
      <p className="text-sm text-gray-500">Email: {user.email}</p>
      <p className="text-xs text-gray-400 mt-1">Joined: {new Date(user.createdAt!).toLocaleDateString()}</p>

      <button
        onClick={startChat}
        disabled={isConnecting}
        className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
      >
        {isConnecting ? "Connecting..." : "Chat Now 💬"}
      </button>
    </div>
  )
}
