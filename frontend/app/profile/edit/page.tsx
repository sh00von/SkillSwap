"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getToken } from "@/lib/auth"

export default function EditProfilePage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const token = getToken()
    if (!token) return router.push("/login")

    fetch("http://localhost:5000/api/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setUsername(data.user?.username || "")
        setEmail(data.user?.email || "")
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setIsLoading(false))
  }, [router])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    const token = getToken()

    try {
      const res = await fetch("http://localhost:5000/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, email }),
      })

      const data = await res.json()
      if (!res.ok) return setError(data.message || "Failed to update profile")

      setSuccess("Profile updated successfully!")
    } catch (err) {
      setError("Something went wrong.")
    }
  }

  if (isLoading) return <div className="p-6">Loading...</div>

  return (
    <div className="max-w-xl mx-auto p-6 mt-8 bg-white rounded shadow">
      <h1 className="text-xl font-semibold mb-4">Edit Profile</h1>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      {success && <p className="text-green-600 text-sm mb-2">{success}</p>}

      <form onSubmit={handleUpdate} className="space-y-4">
        <input
          className="w-full p-2 border rounded"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <input
          className="w-full p-2 border rounded"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Update Profile
        </button>
      </form>
    </div>
  )
}
