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
interface Verification {
  _id: string
  username: string
  email: string
  studentId?: string
  idCardUrl?: string
  createdAt: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [forumCount, setForumCount] = useState(0)
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [verLoading, setVerLoading] = useState(false)

  const token =
    typeof window !== "undefined" ? localStorage.getItem("admin-token") : null

  // logout handler
  const handleLogout = () => {
    localStorage.removeItem("admin-token")
    router.push("/")
  }

  useEffect(() => {
    if (!token) {
      router.push("/admin/login")
      return
    }
    ;(async () => {
      try {
        setLoading(true)
        const [uRes, sRes, fRes, vRes] = await Promise.all([
          fetch("http://localhost:5000/api/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/admin/skills", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/forum"),
          fetch("http://localhost:5000/api/admin/verifications/pending", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        if (!uRes.ok || !sRes.ok || !fRes.ok || !vRes.ok) {
          throw new Error("Failed to fetch dashboard data")
        }
        const [uJson, sJson, fJson, vJson]: [
          User[],
          Skill[],
          ForumCategory[],
          Verification[]
        ] = await Promise.all([
          uRes.json(),
          sRes.json(),
          fRes.json(),
          vRes.json(),
        ])

        setUsers(uJson)
        setSkills(sJson)
        setForumCount(
          fJson.reduce(
            (sum, cat) => sum + (Array.isArray(cat.posts) ? cat.posts.length : 0),
            0
          )
        )
        setVerifications(vJson)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [token, router])

  const handleAction = async (
    id: string,
    action: "approve" | "reject"
  ) => {
    if (!token) return router.push("/admin/login")
    setVerLoading(true)
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/verifications/${id}/${action}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (!res.ok) throw new Error("Action failed")
      setVerifications(vs => vs.filter(v => v._id !== id))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setVerLoading(false)
    }
  }

  // redirect if no token
  if (typeof window !== "undefined" && !token) {
    router.push("/admin/login")
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-sm text-gray-500">Users</p>
          <p className="text-3xl font-bold">{users.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-sm text-gray-500">Skills</p>
          <p className="text-3xl font-bold">{skills.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-sm text-gray-500">Forum Posts</p>
          <p className="text-3xl font-bold">{forumCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-sm text-gray-500">Pending Verifications</p>
          <p className="text-3xl font-bold">{verifications.length}</p>
        </div>
      </div>

      {/* Pending Verifications */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Pending Verifications</h2>
        {verifications.length === 0 ? (
          <p className="text-gray-600">No pending requests.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Username</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Student ID</th>
                  <th className="px-4 py-2">ID Preview</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {verifications.map(v => (
                  <tr key={v._id} className="border-t">
                    <td className="px-4 py-2">{v.username}</td>
                    <td className="px-4 py-2">{v.email}</td>
                    <td className="px-4 py-2">{v.studentId || "—"}</td>
                    <td className="px-4 py-2">
                      {v.idCardUrl ? (
                        <img
                          src={v.idCardUrl}
                          alt="ID"
                          className="h-10 w-16 object-cover rounded"
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2 space-x-2 text-center">
                      <button
                        disabled={verLoading}
                        onClick={() => handleAction(v._id, "approve")}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        disabled={verLoading}
                        onClick={() => handleAction(v._id, "reject")}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Users & Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Users</h2>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Username</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-center">Verified</th>
                  <th className="px-4 py-2">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-t">
                    <td className="px-4 py-2">{u.username}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2 text-center">{u.isVerified ? "✅" : "❌"}</td>
                    <td className="px-4 py-2">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Skills</h2>
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Offered By</th>
                </tr>
              </thead>
              <tbody>
                {skills.map(s => (
                  <tr key={s._id} className="border-t">
                    <td className="px-4 py-2">{s.title}</td>
                    <td className="px-4 py-2">{s.offeredBy.username}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}