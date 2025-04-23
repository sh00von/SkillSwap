"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"



export default function CreatePostPage() {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")



  useEffect(() => {
    fetch("http://localhost:5000/api/forum/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data)
        if (data.length > 0) setCategoryId(data[0]._id)
      })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const token = localStorage.getItem("token")

    const res = await fetch("http://localhost:5000/api/forum/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content, categoryId }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.message || "Something went wrong")
      setLoading(false)
      return
    }

    router.push(`/forum/${data._id}`)
  }

  const selectedCategory = categories.find((cat) => cat._id === categoryId)

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow-md mt-8">
      <h1 className="text-2xl font-bold mb-4 text-indigo-700">Create New Forum Post</h1>

      {/* Selected Category Info */}
      {selectedCategory && (
        <div className="mb-6 border-l-4 border-indigo-500 pl-4 bg-indigo-50 py-2">
          <h2 className="text-lg font-semibold">{selectedCategory.name}</h2>
          <p className="text-sm text-gray-600">{selectedCategory.description}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded"
          ></textarea>
        </div>

        <div>
          <label className="block mb-1 font-medium">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded"
          >
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
        >
          {loading ? "Posting..." : "Submit Post"}
        </button>
      </form>
    </div>
  )
}
