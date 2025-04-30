"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface User {
  _id: string
  username: string
  email: string
  createdAt: string
  latitude?: number
  longitude?: number
}

export default function AllUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("http://localhost:5000/api/auth/users")
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-indigo-700">All Users</h1>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <ul className="space-y-4">
          {users.map((user) => (
            <li key={user._id} className="bg-white p-4 rounded shadow hover:bg-indigo-50">
              <Link href={`/profile/${user._id}`}>
                <div className="text-lg font-semibold text-indigo-700 hover:underline">{user.username}</div>
              </Link>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500">Location: {user.latitude}, {user.longitude}</p>
              <p className="text-xs text-gray-400">Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
