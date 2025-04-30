"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getToken } from "@/lib/auth"

interface Swap {
  _id: string
  user: { _id: string; username: string }
  skill: { _id: string; title: string }
  amount: number
  method: string
  status: "pending" | "swapped" | "failed"
  slotDate?: string
  createdAt: string
}

interface UserProfile {
  _id: string
  username: string
  email: string
  studentId?: string
  bio?: string
  phone?: string
  dob?: string
  idCardUrl?: string
  idCardExpiresAt?: string
  verificationStatus: "unverified" | "pending" | "approved" | "rejected"
  ip?: string
  createdAt?: string
}

interface Skill {
  _id: string
  title: string
  description: string
  category: string
  experience: string
  location: string
  createdAt: string
}

interface Task {
  _id: string
  type: string
  status: string
  pointsAwarded: number
  skill: { title: string }
  createdAt: string
}

interface Milestone {
  _id: string
  targetCount: number
  isCompleted: boolean
  pointsAwarded: number
  completedAt?: string
}

export default function Profile() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [pendingSwaps, setPendingSwaps] = useState<Swap[]>([])
  const [approvedSwaps, setApprovedSwaps] = useState<Swap[]>([])
  const [locationName, setLocationName] = useState("Unknown")
  const [loading, setLoading] = useState(true)
  const [swapLoading, setSwapLoading] = useState(true)
  const [error, setError] = useState("")
  const [swapError, setSwapError] = useState("")
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewSrc, setPreviewSrc] = useState("")

  // Fetch profile, skills, points, tasks, milestones
  useEffect(() => {
    const token = getToken()
    if (!token) return router.push("/login")

    ;(async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error("Unauthorized")
        const data = await res.json()
        setUser(data.user)
        setSkills(data.skills || [])
        setTotalPoints(data.totalPoints || 0)
        setTasks(data.tasks || [])
        setMilestones(data.milestones || [])
        if (data.user.ip) {
          const city = await getLocation(data.user.ip)
          setLocationName(city)
        }
      } catch {
        setError("Failed to load profile")
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  // Fetch swaps
  useEffect(() => {
    const token = getToken()
    if (!token) return
    ;(async () => {
      setSwapLoading(true)
      try {
        const res = await fetch("http://localhost:5000/api/payments/swaps", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error("Failed to load swap requests")
        const { pending, approved } = await res.json()
        setPendingSwaps(pending)
        setApprovedSwaps(approved)
      } catch (e: any) {
        setSwapError(e.message)
      } finally {
        setSwapLoading(false)
      }
    })()
  }, [])

  const handleApprove = async (swap: Swap) => {
    const token = getToken()
    if (!token) return router.push("/login")
    try {
      const res = await fetch(
        `http://localhost:5000/api/payments/${swap._id}/confirm`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ slotDate: swap.slotDate }),
        }
      )
      if (!res.ok) throw new Error("Approve failed")
      const updated: Swap = await res.json()
      setPendingSwaps(ps => ps.filter(s => s._id !== swap._id))
      setApprovedSwaps(as => [updated, ...as])
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setPreviewSrc(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleVerify = async () => {
    if (!selectedFile || !user) return
    setUploading(true)
    setError("")
  
    try {
      // 1) Upload file to your proxy endpoint
      const form = new FormData()
      form.append("image", selectedFile)
  
      const uploadRes = await fetch("/api/upload-id", {
        method: "POST",
        body: form,
      })
      if (!uploadRes.ok) throw new Error("Image upload failed")
      const { url } = await uploadRes.json()
  
      // 2) Send the resulting URL to your backend for verification
      const token = getToken()
      const verifyRes = await fetch("http://localhost:5000/api/auth/verify-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageUrl: url }),
      })
      if (!verifyRes.ok) {
        const err = await verifyRes.json()
        throw new Error(err.message || "Verification failed")
      }
  
      // 3) Update local state
      const { user: updated } = await verifyRes.json()
      setUser(updated)
      setPreviewSrc("")
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }
  

  const handleRemove = async () => {
    if (!user) return
    setUploading(true)
    try {
      const token = getToken()
      const res = await fetch("http://localhost:5000/api/auth/verify-profile", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const { user: updated } = await res.json()
      setUser(updated)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  const getLocation = async (ip: string) => {
    try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`)
      const data = await res.json()
      return data.city || "Unknown"
    } catch {
      return "Unknown"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        {/* Profile Card */}
        <div className="bg-white p-6 rounded-lg shadow flex flex-col md:flex-row items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{user?.username}</h2>
            {user?.bio && <p className="mt-2 text-gray-600">{user.bio}</p>}
            <div className="mt-4 space-y-1 text-gray-700">
              {user?.studentId && (
                <div>
                  <span className="font-medium">Student ID:</span>{" "}
                  {user.studentId}
                </div>
              )}
              {user?.email && (
                <div>
                  <span className="font-medium">Email:</span> {user.email}
                </div>
              )}
              {user?.phone && (
                <div>
                  <span className="font-medium">Phone:</span> {user.phone}
                </div>
              )}
              {user?.dob && (
                <div>
                  <span className="font-medium">DOB:</span>{" "}
                  {new Date(user.dob).toLocaleDateString()}
                </div>
              )}
              <div>
                <span className="font-medium">Location:</span> {locationName}
              </div>
            </div>
          </div>

          <div className="mt-6 md:mt-0 md:ml-6 flex-shrink-0 space-y-2">
            <Link
              href="/profile/edit"
              className="block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-center"
            >
              Edit Profile
            </Link>
            <button
              onClick={handleLogout}
              className="block px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 w-full"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-md shadow text-center">
            <div className="text-sm text-gray-500">Points</div>
            <div className="text-3xl font-bold text-indigo-600">
              {totalPoints}
            </div>
          </div>
          <div className="bg-white p-4 rounded-md shadow text-center">
            <div className="text-sm text-gray-500">Tasks</div>
            <div className="text-3xl font-bold text-indigo-600">
              {tasks.length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-md shadow text-center">
            <div className="text-sm text-gray-500">Skills</div>
            <div className="text-3xl font-bold text-indigo-600">
              {skills.length}
            </div>
          </div>
        </div>

        {/* Swap Requests */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Swap Requests</h3>
          {swapLoading ? (
            <p className="text-gray-500">Loading…</p>
          ) : swapError ? (
            <p className="text-red-600">{swapError}</p>
          ) : (
            <>
              {pendingSwaps.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Pending</h4>
                  <div className="space-y-4">
                    {pendingSwaps.map(s => (
                      <div
                        key={s._id}
                        className="p-4 border rounded-md flex justify-between items-center"
                      >
                        <div>
                          <p>
                            <strong>{s.user.username}</strong> wants{" "}
                            <strong>{s.skill.title}</strong>
                          </p>
                          <p className="text-sm text-gray-500">
                            ₹{s.amount} via {s.method} —{" "}
                            {s.slotDate
                              ? new Date(s.slotDate).toLocaleString()
                              : "No slot"}
                          </p>
                        </div>
                        <button
                          onClick={() => handleApprove(s)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Approve
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {approvedSwaps.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Approved</h4>
                  <div className="space-y-4">
                    {approvedSwaps.map(s => (
                      <div
                        key={s._id}
                        className="p-4 border rounded-md bg-green-50 flex justify-between items-center"
                      >
                        <div>
                          <p>
                            Swap approved for{" "}
                            <strong>{s.skill.title}</strong>
                          </p>
                          <p className="text-sm text-gray-500">
                            ₹{s.amount} —{" "}
                            {s.slotDate
                              ? new Date(s.slotDate).toLocaleString()
                              : "No slot"}
                          </p>
                        </div>
                        <span className="text-green-700 font-bold">&#10003;</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingSwaps.length === 0 &&
                approvedSwaps.length === 0 && (
                  <p className="text-gray-500">No swap requests yet.</p>
                )}
            </>
          )}
        </section>

        {/* Tasks */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Your Tasks</h3>
          {tasks.length ? (
            <div className="space-y-4">
              {tasks.map(t => (
                <div
                  key={t._id}
                  className="p-4 border rounded-md flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">
                      {t.type.toUpperCase()} — {t.status}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t.skill.title} (+{t.pointsAwarded} pts)
                    </p>
                  </div>
                  <span className="text-gray-400 text-sm">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No tasks yet.</p>
          )}
        </section>

        {/* Milestones */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Milestones</h3>
          {milestones.length ? (
            <div className="space-y-6">
              {milestones.map(ms => {
                const completedSwaps = tasks.filter(
                  t => t.type === "swap" && t.status === "completed"
                ).length
                const pct = Math.min(
                  (completedSwaps / ms.targetCount) * 100,
                  100
                )
                return (
                  <div key={ms._id}>
                    <div className="flex justify-between mb-1">
                      <span>
                        Swap Milestone {completedSwaps}/
                        {ms.targetCount}
                      </span>
                      <span className="text-sm">{Math.round(pct)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {ms.isCompleted && ms.completedAt && (
                      <p className="text-green-600 text-sm mt-1">
                        Completed on{" "}
                        {new Date(ms.completedAt).toLocaleDateString()} — +
                        {ms.pointsAwarded} pts
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500">No milestones yet.</p>
          )}
        </section>

        {/* Verification */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">ID Verification</h3>

          {user?.verificationStatus === "pending" ? (
            <div className="space-y-2">
              <span className="text-yellow-600 font-medium">
                Verification pending admin approval…
              </span>
              {user.idCardUrl && (
                <img
                  src={user.idCardUrl}
                  alt="Uploaded ID"
                  className="w-40 h-40 object-cover rounded border"
                />
              )}
            </div>
          ) : user?.verificationStatus === "approved" ? (
            <div className="space-y-2">
              <span className="text-green-600 font-medium">Verified ✅</span>
              {user.idCardUrl && (
                <img
                  src={user.idCardUrl}
                  alt="Approved ID"
                  className="w-40 h-40 object-cover rounded border"
                />
              )}
              {user.idCardExpiresAt && (
                <p className="text-sm text-gray-500">
                  Expires on{" "}
                  {new Date(user.idCardExpiresAt).toLocaleDateString()}
                </p>
              )}
              <button
                onClick={handleRemove}
                disabled={uploading}
                className="text-red-600 hover:underline disabled:opacity-50"
              >
                {uploading ? "Removing..." : "Remove Verification"}
              </button>
            </div>
          ) : user?.verificationStatus === "rejected" ? (
            <div className="space-y-2">
              <span className="text-red-600 font-medium">
                Verification rejected. Please re-upload.
              </span>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {previewSrc && (
                <img
                  src={previewSrc}
                  alt="Preview"
                  className="w-40 h-40 object-cover rounded border"
                />
              )}
              <button
                onClick={handleVerify}
                disabled={uploading}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Re-upload ID"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {previewSrc && (
                <img
                  src={previewSrc}
                  alt="Preview"
                  className="w-40 h-40 object-cover rounded border"
                />
              )}
              <button
                onClick={handleVerify}
                disabled={uploading}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload & Verify"}
              </button>
            </div>
          )}
        </section>

        {/* Skills */}
        <section className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Your Skills</h3>
            <Link
              href="/skills/new"
              className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
            >
              + Add Skill
            </Link>
          </div>
          {skills.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills.map(s => (
                <Link
                  key={s._id}
                  href={`/skills/${s._id}`}
                  className="block p-4 border rounded-lg hover:shadow-lg transition"
                >
                  <h4 className="font-medium text-indigo-700">{s.title}</h4>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {s.description}
                  </p>
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>{s.category}</span>
                    <span>{s.experience}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No skills added yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}
