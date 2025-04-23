"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

interface Author {
  _id: string
  username: string
}

interface Comment {
  _id: string
  content: string
  author: Author
  createdAt: string
}

interface Post {
  _id: string
  title: string
  content: string
  author: Author
  createdAt: string
  category?: {
    name: string
  }
}

export default function ForumPostPage() {
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : ""

  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) return

    fetch(`http://localhost:5000/api/forum/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setPost(data.post)
        setComments(Array.isArray(data.comments) ? data.comments : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return
    setSubmitting(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`http://localhost:5000/api/forum/${id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      })

      const result = await res.json()
      if (!res.ok) {
        setError(result.message || "Failed to add comment")
        setSubmitting(false)
        return
      }

      // Refetch comments
      setComments([...comments, {
        _id: `${Math.random()}`, // temporary ID until refresh
        content: newComment,
        author: { _id: "you", username: "You" }, // optional improvement: decode user from token
        createdAt: new Date().toISOString(),
      }])
      setNewComment("")
    } catch (err) {
      setError("Something went wrong.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-6">Loading...</div>
  if (!post) return <div className="p-6 text-red-500">Post not found.</div>

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-50 min-h-screen text-gray-800">
      <h1 className="text-2xl font-bold text-indigo-700 mb-2">{post.title}</h1>
      <div className="text-sm text-gray-500 mb-4">
        By {post.author?.username} · {new Date(post.createdAt).toLocaleDateString()} · {post.category?.name}
      </div>
      <p className="mb-8">{post.content}</p>

      <h2 className="text-lg font-semibold mb-3">Comments</h2>

      <div className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write your comment..."
          rows={3}
          className="w-full border border-gray-300 rounded p-3 mb-2"
        ></textarea>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <button
          onClick={handleCommentSubmit}
          disabled={submitting}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Post Comment"}
        </button>
      </div>

      {!Array.isArray(comments) || comments.length === 0 ? (
        <p className="text-sm text-gray-500">No comments yet.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c._id} className="border border-gray-200 p-3 rounded bg-white">
              <div className="text-sm font-medium text-indigo-600">{c.author?.username}</div>
              <div className="text-sm text-gray-700">{c.content}</div>
              <div className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
