"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getToken } from "@/lib/auth"

export default function NewSkillPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [experience, setExperience] = useState("")
  const [location, setLocation] = useState("")
  const [price, setPrice] = useState<number | "">("")         // ← new price state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const categories = ["Programming", "Design", "Marketing", "Language", "Music", "Cooking", "Sports", "Other"]
  const experienceLevels = ["Beginner", "Intermediate", "Advanced", "Expert"]

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push("/login")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    const token = getToken()
    if (!token) {
      router.push("/login")
      return
    }

    // Validate price
    if (price === "" || Number(price) < 0) {
      setError("Please enter a valid non-negative price.")
      setIsSubmitting(false)
      return
    }

    const payload = {
      title,
      description,
      category,
      experience,
      location,
      price: Number(price),                           // ← include price
    }

    try {
      const res = await fetch("http://localhost:5000/api/skills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok) {
        router.push("/skills")
      } else {
        setError(data.message || data.error || "Failed to create skill. Please check your input.")
      }
    } catch (err) {
      console.error(err)
      setError("An error occurred while connecting to the server. Please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navbar */}
      <nav className="bg-white shadow p-4 flex justify-between items-center px-8">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          SkillSwap
        </Link>
        <div className="flex items-center space-x-6">
          <Link href="/profile" className="text-sm text-gray-600 hover:text-indigo-600">
            Profile
          </Link>
          <Link href="/skills" className="text-sm text-gray-600 hover:text-indigo-600">
            Browse Skills
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-4">
          <Link href="/skills" className="text-indigo-600 hover:underline flex items-center">
            ← Back to Skills
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">Add a New Skill</h1>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full p-2 border rounded"
                placeholder="e.g., JavaScript Programming"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="w-full p-2 border rounded"
                placeholder="Describe what you can teach or share..."
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full p-2 border rounded"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                required
                className="w-full p-2 border rounded"
              >
                <option value="">Select your experience level</option>
                {experienceLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
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
                required
                className="w-full p-2 border rounded"
                placeholder="e.g., Remote, New York, Online"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                required
                min={0}
                className="w-full p-2 border rounded"
                placeholder="e.g., 500"
              />
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Skill"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
