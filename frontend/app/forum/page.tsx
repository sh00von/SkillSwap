"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function ForumPage() {
  const router = useRouter()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")

  useEffect(() => {
    fetch("http://localhost:5000/api/forum")
      .then((res) => res.json())
      .then((res) => {
        setData(res)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error loading forum data:", err)
        setLoading(false)
      })
  }, [])

  const allPosts = data.flatMap((cat) =>
    cat.posts.map((post) => ({
      ...post,
      category: cat.name,
    }))
  )

  const filteredPosts =
    selectedCategory === "all"
      ? allPosts
      : allPosts.filter((p) => p.category.toLowerCase() === selectedCategory)

  const categories = ["all", ...data.map((c) => c.name.toLowerCase())]

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 px-4 py-12 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-700">Community Forum & Discussion</h1>
        <button
          onClick={() => router.push("/forum/new")}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm"
        >
          + New Post
        </button>
      </div>

      <div className="mb-6">
        <label className="text-sm text-gray-600 mr-2">Filter by Category:</label>
        <select
          className="border border-gray-300 px-3 py-2 rounded text-sm"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filteredPosts.length === 0 ? (
        <p className="text-center text-gray-500">No posts found.</p>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post._id}
              className="bg-white p-4 rounded shadow hover:shadow-md transition cursor-pointer"
              onClick={() => router.push(`/forum/${post._id}`)}
            >
              <h2 className="text-lg font-semibold text-indigo-700 mb-1">{post.title}</h2>
              <div className="text-sm text-gray-600">
                <span className="mr-4">By {post.author?.username || "Unknown"}</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="mt-2 text-xs text-gray-400">Category: {post.category}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
