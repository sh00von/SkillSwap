"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Loader2, Send } from "lucide-react"

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
  category?: { name: string }
}

export default function ForumPostPage() {
  const { id } = useParams() as { id: string }
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingPost, setLoadingPost] = useState(true)
  const [loadingComments, setLoadingComments] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  // fetch post
  useEffect(() => {
    if (!id) return
    setLoadingPost(true)
    fetch(`http://localhost:5000/api/forum/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load post")
        return res.json()
      })
      .then((data) => setPost(data.post))
      .catch((e) => setError(e.message))
      .finally(() => setLoadingPost(false))
  }, [id])

  // fetch comments
  useEffect(() => {
    if (!id) return
    setLoadingComments(true)
    fetch(`http://localhost:5000/api/forum/${id}/comments`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load comments")
        return res.json()
      })
      .then((data: Comment[]) => setComments(data))
      .catch((e) => console.error(e))
      .finally(() => setLoadingComments(false))
  }, [id])

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return
    setSubmitting(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Not authenticated")

      const res = await fetch(
        `http://localhost:5000/api/forum/${id}/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: newComment }),
        }
      )
      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.message || "Failed to add comment")
      }
      setComments((prev) => [...prev, result])
      setNewComment("")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  if (loadingPost) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
      </div>
    )
  }
  if (!post) {
    return <div className="p-6 text-center text-red-500">Post not found.</div>
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Post */}
      <article className="prose prose-indigo mx-auto">
        <h1>{post.title}</h1>
        <p className="text-sm text-gray-500">
          By {post.author.username} ·{" "}
          {new Date(post.createdAt).toLocaleDateString()} ·{" "}
          {post.category?.name}
        </p>
        <div className="mt-4 whitespace-pre-line">{post.content}</div>
      </article>

      {/* Comments Section */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Comments</h2>
          <span className="text-sm text-gray-600">
            {loadingComments ? "…" : `${comments.length} comment${comments.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {/* New Comment Form */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your comment..."
            rows={3}
            className="w-full border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 mb-2"
          />
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          <button
            onClick={handleCommentSubmit}
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="animate-spin w-4 h-4 mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            <span>{submitting ? "Posting..." : "Post Comment"}</span>
          </button>
        </div>

        {/* Comments List */}
        {loadingComments ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white p-4 rounded-lg shadow-sm h-24"
              />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-gray-500">Be the first to comment!</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((c) => (
              <li
                key={c._id}
                className="bg-white p-4 rounded-lg shadow-sm flex justify-between"
              >
                <div>
                  <p className="font-medium text-indigo-600">{c.author.username}</p>
                  <p className="mt-1 text-gray-700">{c.content}</p>
                  <p className="mt-2 text-xs text-gray-400">{formatDate(c.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
