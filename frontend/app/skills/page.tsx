"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

interface Skill {
  _id: string
  title: string
  description: string
  category: string
  experience: string
  location: string
  user?: {
    _id: string
    username: string
  }
  reviews?: {
    rating: number
    comment: string
    user: { username: string }
  }[]
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [userCategories, setUserCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  // Filter states
  const [category, setCategory] = useState(searchParams.get("category") || "")
  const [experience, setExperience] = useState(searchParams.get("experience") || "")
  const [location, setLocation] = useState(searchParams.get("location") || "")
  const [keyword, setKeyword] = useState(searchParams.get("keyword") || "")

  const categories = ["Programming", "Design", "Marketing", "Language", "Music", "Cooking", "Sports", "Other"]
  const experienceLevels = ["Beginner", "Intermediate", "Advanced", "Expert"]

  useEffect(() => {
    const fetchSkills = async () => {
      setIsLoading(true)
      setError("")

      try {
        // 1. Load my profile to get the list of categories I've created skills in
        const token = localStorage.getItem("token")
        let myCats: string[] = []

        if (token) {
          const profileRes = await fetch("http://localhost:5000/api/auth/profile", {
            headers: { Authorization: `Bearer ${token}` },
          })

          if (profileRes.ok) {
            const profileData = await profileRes.json()
            myCats = Array.from(new Set(profileData.skills.map((s: any) => s.category)))
            setUserCategories(myCats)
          }
        }

        // 2. Build query string & fetch all skills
        const params = new URLSearchParams()
        if (category)   params.append("category", category)
        if (experience) params.append("experience", experience)
        if (location)   params.append("location", location)
        if (keyword)    params.append("keyword", keyword)

        const skillsRes = await fetch(`http://localhost:5000/api/skills?${params.toString()}`)
        if (!skillsRes.ok) throw new Error("Failed to load skills")

        const data: Skill[] = await skillsRes.json()

        // 3. Sort: put skills in myCats first
        const sorted = data.sort((a, b) => {
          const aPri = myCats.includes(a.category) ? 0 : 1
          const bPri = myCats.includes(b.category) ? 0 : 1
          return aPri - bPri
        })

        setSkills(sorted)
      } catch (err: any) {
        console.error(err)
        setError(err.message || "An error occurred while fetching skills.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSkills()
  }, [category, experience, location, keyword])

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (category)   params.append("category", category)
    if (experience) params.append("experience", experience)
    if (location)   params.append("location", location)
    if (keyword)    params.append("keyword", keyword)
    router.push(`/skills?${params.toString()}`)
  }

  const clearFilters = () => {
    setCategory("")
    setExperience("")
    setLocation("")
    setKeyword("")
    router.push("/skills")
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    router.push("/")
  }

  const getAverageRating = (reviews: any[] = []) => {
    if (!reviews.length) return "0.0"
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return (sum / reviews.length).toFixed(1)
  }

  return (
    <div className="bg-gray-50 min-h-screen">

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Browse Skills</h1>
          <Link href="/skills/new" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Add New Skill</Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">All Levels</option>
                {experienceLevels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Any location"
                className="w-full p-2 border rounded"
              />
            </div>

            {/* Keyword */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search skills..."
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4 space-x-2">
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Skills List */}
        {isLoading ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading skills...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
        ) : skills.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg shadow-md">
            <p className="text-gray-600">No skills found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill) => (
              <Link key={skill._id} href={`/skills/${skill._id}`} className="block">
                <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <h2 className="text-xl font-semibold mb-2 text-indigo-700">{skill.title}</h2>
                      <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">{skill.category}</span>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2">{skill.description}</p>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span>{getAverageRating(skill.reviews)}</span>
                        <span className="text-gray-500 ml-1">({skill.reviews?.length || 0} reviews)</span>
                      </div>
                      <div className="text-gray-500">{skill.location}</div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                      <div className="text-sm text-gray-500">Experience: {skill.experience}</div>
                      <div className="text-sm text-gray-500">By: {skill.user?.username || "Unknown"}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}