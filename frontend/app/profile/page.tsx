"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getToken } from "@/lib/auth"
import { Head } from "react-day-picker"

interface UserProfile {
  _id: string
  username: string
  email: string
  idCardUrl?: string
  isVerified?: boolean
  idCardExpiresAt?: string
  createdAt?: string
  updatedAt?: string
  ip?: string
}

interface Skill {
  _id: string
  title: string
  description: string
  category: string
  experience: string
  location: string
  offeredBy: string
  createdAt: string
  updatedAt: string
  id: string
}

interface Task {
  _id: string
  type: string
  status: string
  pointsAwarded: number
  skill: {
    _id: string
    title: string
    price: number
  }
  createdAt: string
}

interface Milestone {
  _id: string
  type: string
  targetCount: number
  isCompleted: boolean
  pointsAwarded: number
  completedAt?: string
}

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [totalPoints, setTotalPoints] = useState<number>(0)
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewSrc, setPreviewSrc] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [locationName, setLocationName] = useState<string>("")

  const router = useRouter()

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push("/login")
      return
    }

    const fetchUserProfile = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          localStorage.removeItem("token")
          router.push("/login")
          return
        }

        const data = await res.json()
        setUser(data.user)
        if (Array.isArray(data.skills)) setSkills(data.skills)
        if (typeof data.totalPoints === "number") setTotalPoints(data.totalPoints)
        if (Array.isArray(data.tasks)) setTasks(data.tasks)
        if (Array.isArray(data.milestones)) setMilestones(data.milestones)

        if (data.user.ip) {
          const city = await getLocation(data.user.ip)
          setLocationName(city)
        }
      } catch {
        setError("Failed to load profile. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [router])

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
    } else {
      setPreviewSrc("")
    }
  }

  const handleVerify = async () => {
    if (!selectedFile || !user) return
    setUploading(true)
    setError("")

    try {
      // Upload to imgbb
      const form = new FormData()
      form.append("key", process.env.NEXT_PUBLIC_IMGBB_KEY!)
      form.append("image", selectedFile)
      const imgbbRes = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: form,
      })
      const imgbbJson = await imgbbRes.json()
      if (!imgbbRes.ok || !imgbbJson.data?.url) throw new Error("Upload failed")
      const imageUrl = imgbbJson.data.url

      const token = getToken()
      const verifyRes = await fetch("http://localhost:5000/api/auth/verify-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageUrl,
        }),
      })
      if (!verifyRes.ok) {
        const err = await verifyRes.json()
        throw new Error(err.message || "Verification failed")
      }
      const { user: updatedUser } = await verifyRes.json()
      setUser(updatedUser)
      setSelectedFile(null)
      setPreviewSrc("")
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!user) return
    setUploading(true)
    setError("")
    try {
      const token = getToken()
      const res = await fetch("http://localhost:5000/api/auth/verify-profile", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Could not remove verification")
      const { user: updatedUser } = await res.json()
      setUser(updatedUser)
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const getLocation = async (ip: string): Promise<string> => {
    try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`)
      if (!res.ok) throw new Error("Failed to fetch location")
      const data = await res.json()
      return data.city || "Unknown"
    } catch {
      return "Unknown"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  const swapCount = tasks.filter(t => t.type === "swap" && t.status === "completed").length

  return (
    <div className="bg-gray-50 min-h-screen">

      <div className="max-w-4xl mx-auto p-6">
        {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold mb-6">Your Profile</h1>

          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Username</label>
              <p className="mt-1 text-lg">{user?.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <p className="mt-1 text-lg">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Location</label>
              <p className="mt-1 text-lg">{locationName || "Unknown"}</p>
            </div>
          </div>
          <span className="text-xs text-gray-500 mt-1">
            <a href="/profile/edit" className="text-indigo-600 hover:underline">
              Edit Profile
            </a>
          </span>

          {/* Points */}
          <div className="pt-4 border-t mt-6">
            <h2 className="text-xl font-semibold mb-2">Your Points</h2>
            <p className="text-3xl font-bold text-indigo-600">{totalPoints}</p>
          </div>

          {/* Tasks */}
          <div className="pt-4 border-t mt-6">
            <h2 className="text-xl font-semibold mb-4">Your Tasks</h2>
            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map(task => (
                  <div key={task._id} className="p-4 border rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {task.type.toUpperCase()} — <span className="text-gray-600">{task.status}</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        Skill: {task.skill.title} ({task.pointsAwarded} pts)
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(task.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No tasks to show.</p>
            )}
          </div>

          {/* Milestones */}
          <div className="pt-4 border-t mt-6">
            <h2 className="text-xl font-semibold mb-4">Your Milestones</h2>
            {milestones.length > 0 ? (
              <div className="space-y-6">
                {milestones.map(ms => {
                  const progress = Math.min(swapCount / ms.targetCount, 1)
                  const percent = Math.round(progress * 100)
                  return (
                    <div key={ms._id}>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-700 font-medium">
                          Swap Milestone: {swapCount}/{ms.targetCount}
                        </span>
                        <span className="text-sm font-medium text-gray-600">{percent}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-indigo-600 h-3 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      {ms.isCompleted && ms.completedAt && (
                        <p className="text-sm text-green-600 mt-1">
                          Completed on {new Date(ms.completedAt).toLocaleDateString()} — +{ms.pointsAwarded} bonus pts
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-600">No milestones yet.</p>
            )}
          </div>

          {/* Verification Section */}
          <div className="pt-4 border-t mt-6">
            <h2 className="text-xl font-semibold mb-2">Verify Your Profile</h2>
            {user?.isVerified ? (
              <div className="flex flex-col items-start space-y-4">
                <span className="text-green-600 font-medium">Verified</span>
                {user.idCardUrl && (
                  <img
                    src={user.idCardUrl}
                    alt="ID Card"
                    className="w-48 h-48 object-cover rounded border"
                  />
                )}
                {user.idCardExpiresAt && (
                  <p className="text-sm text-gray-500">
                    Expires on {new Date(user.idCardExpiresAt).toLocaleString()}
                  </p>
                )}
                <button
                  onClick={handleRemove}
                  disabled={uploading}
                  className="text-red-600 hover:underline disabled:opacity-50 text-sm"
                >
                  {uploading ? "Removing..." : "Remove Verification"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input type="file" accept="image/*" onChange={handleFileChange} />
                {previewSrc && (
                  <img
                    src={previewSrc}
                    alt="Preview"
                    className="w-48 h-48 object-cover rounded border"
                  />
                )}
                <button
                  onClick={handleVerify}
                  disabled={uploading}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload & Verify"}
                </button>
              </div>
            )}
          </div>

          {/* Skills Section */}
          <div className="pt-4 border-t mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Skills</h2>
              <Link
                href="/skills/new"
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm"
              >
                Add New Skill
              </Link>
            </div>
            {skills.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {skills.map(skill => (
                  <Link
                    key={skill._id}
                    href={`/skills/${skill._id}`}
                    className="block p-4 border rounded-lg hover:border-indigo-300 hover:bg-indigo-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-indigo-700">{skill.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                          {skill.description}
                        </p>
                      </div>
                      <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">
                        {skill.category}
                      </span>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>Experience: {skill.experience}</span>
                      <span>Location: {skill.location}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">You haven't added any skills yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
