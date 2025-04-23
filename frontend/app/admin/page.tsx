"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  _id: string
  username: string
  email: string
  isVerified: boolean
  createdAt: string
}
interface Skill {
  _id: string
  title: string
  offeredBy: { username: string }
}
interface ForumCategory {
  _id: string
  posts?: any[]
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [forumCount, setForumCount] = useState(0)
  const [error, setError] = useState("")
  const router = useRouter()

  const token =
    typeof window !== "undefined" ? localStorage.getItem("admin-token") : null

  useEffect(() => {
    if (!token) {
      router.push("/admin/login")
      return
    }

    const fetchData = async () => {
      try {
        // Fetch users, skills, and forum categories in parallel
        const [uRes, sRes, fRes] = await Promise.all([
          fetch("http://localhost:5000/api/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/admin/skills", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/forum"), // your getAllForumData route
        ])

        if (!uRes.ok || !sRes.ok || !fRes.ok) {
          throw new Error("Failed to fetch dashboard data")
        }

        const [uJson, sJson, fJson]: [
          User[],
          Skill[],
          ForumCategory[]
        ] = await Promise.all([uRes.json(), sRes.json(), fRes.json()])

        setUsers(uJson)
        setSkills(sJson)

        // Sum up posts across all categories
        const totalPosts = fJson.reduce(
          (sum, cat) => sum + (Array.isArray(cat.posts) ? cat.posts.length : 0),
          0
        )
        setForumCount(totalPosts)
      } catch (err: any) {
        setError(err.message)
      }
    }

    fetchData()
  }, [token, router])

  if (error) {
    return <p className="p-6 text-red-500">Error: {error}</p>
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-3xl font-semibold">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500">Total Skills</p>
          <p className="text-3xl font-semibold">{skills.length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow text-center">
          <p className="text-sm text-gray-500">Total Forum Posts</p>
          <p className="text-3xl font-semibold">{forumCount}</p>
        </div>
      </div>

      {/* Users Table */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Users</h2>
        <table className="w-full bg-white shadow rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Username</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-center">Verified</th>
              <th className="p-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t">
                <td className="p-2">{u.username}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2 text-center">{u.isVerified ? "✅" : "❌"}</td>
                <td className="p-2">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Skills Table */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Skills</h2>
        <table className="w-full bg-white shadow rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Title</th>
              <th className="p-2 text-left">Offered By</th>
            </tr>
          </thead>
          <tbody>
            {skills.map((s) => (
              <tr key={s._id} className="border-t">
                <td className="p-2">{s.title}</td>
                <td className="p-2">{s.offeredBy.username}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
