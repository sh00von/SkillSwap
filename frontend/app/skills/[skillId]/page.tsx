"use client"

import React, { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getToken } from "@/lib/auth"

interface Review {
  _id: string
  rating: number
  comment: string
  user: {
    _id: string
    username: string
  }
  createdAt: string
}

interface Skill {
  _id: string
  title: string
  description: string
  category: string
  experience: string
  location: string
  price: number
  user?: {
    _id: string
    username: string
  }
  createdAt: string
  reviews: Review[]
}

export default function SkillDetailPage({
  params,
}: {
  params: Promise<{ skillId: string }>
}) {
  const { skillId } = use(params)

  const [skill, setSkill] = useState<Skill | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState("")

  // track swap request state
  const [pendingSwap, setPendingSwap] = useState(false)
  const [approvedSwap, setApprovedSwap] = useState(false)

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState("bKash")
  const [slotDate, setSlotDate] = useState("")            // new: slot date input
  const [isPaying, setIsPaying] = useState(false)
  const [payError, setPayError] = useState("")
  const [paySuccess, setPaySuccess] = useState("")

  const router = useRouter()

  useEffect(() => {
    const fetchSkillAndData = async () => {
      setIsLoading(true)
      try {
        // 1. Load skill details
        const skillRes = await fetch(`http://localhost:5000/api/skills/${skillId}`)
        if (!skillRes.ok) throw new Error("Failed to load skill details")
        const skillData: Skill = await skillRes.json()
        setSkill(skillData)
        setPaymentAmount(skillData.price)

        // 2. Load reviews
        const reviewsRes = await fetch(
          `http://localhost:5000/api/skills/${skillId}/reviews`
        )
        if (reviewsRes.ok) {
          const reviewsData: Review[] = await reviewsRes.json()
          setReviews(reviewsData)
        }

        // 3. Load swap statuses for this user & filter by this skill
        const token = getToken()
        if (token) {
          const swapRes = await fetch(`http://localhost:5000/api/payments/swaps`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (swapRes.ok) {
            const { pending, approved }: {
              pending: { skill: { _id: string } }[]
              approved: { skill: { _id: string } }[]
            } = await swapRes.json()

            // check if there's a pending swap for this skill
            setPendingSwap(pending.some(p => p.skill._id === skillId))
            // check if there's an approved swap for this skill
            setApprovedSwap(approved.some(a => a.skill._id === skillId))
          }
        }
      } catch (err: any) {
        console.error(err)
        setError("Failed to load skill details. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSkillAndData()
  }, [skillId])

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setReviewError("")
    setIsSubmitting(true)

    const token = getToken()
    if (!token) {
      router.push("/login")
      return
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/skills/${skillId}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating: reviewRating,
            comment: reviewComment,
          }),
        }
      )

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to submit review")
      }

      const newReview: Review = await res.json()
      setReviews(prev => [...prev, newReview])
      setReviewRating(5)
      setReviewComment("")
    } catch (err: any) {
      console.error(err)
      setReviewError(err.message || "An error occurred while submitting your review")
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmPayment = async () => {
    setPayError("")
    setPaySuccess("")
    setIsPaying(true)

    const token = getToken()
    if (!token) {
      router.push("/login")
      return
    }

    try {
      const res = await fetch(`http://localhost:5000/api/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          skillId,
          amount: paymentAmount,
          method: paymentMethod,
          slotDate: slotDate ? new Date(slotDate).toISOString() : undefined,
        }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload.message || "Swap request failed")
      }

      setPaySuccess("Swap requested! Waiting for owner approval.")
      setShowPaymentModal(false)
      setPendingSwap(true)
    } catch (err: any) {
      console.error(err)
      setPayError(err.message || "An error occurred during swap request")
    } finally {
      setIsPaying(false)
    }
  }

  const getAverageRating = () => {
    if (!reviews.length) return 0
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    return (sum / reviews.length).toFixed(1)
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading skill details...</p>
        </div>
      </div>
    )
  }

  if (error || !skill) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <p className="text-red-600 mb-4">{error || "Skill not found"}</p>
          <Link href="/skills" className="text-indigo-600 hover:underline">
            Back to Skills
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto p-6">
        <Link
          href="/skills"
          className="text-indigo-600 hover:underline flex items-center mb-4"
        >
          ← Back to Skills
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold text-indigo-700">{skill.title}</h1>
              <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                {skill.category}
              </span>
            </div>

            <div className="flex items-center mb-4">
              <div className="flex items-center mr-4">
                <span className="text-yellow-500 mr-1 text-xl">★</span>
                <span className="font-semibold">{getAverageRating()}</span>
                <span className="text-gray-500 ml-1">({reviews.length} reviews)</span>
              </div>
              <div className="text-gray-500">Experience: {skill.experience}</div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-gray-700">{skill.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Location</h2>
                <p className="text-gray-700">{skill.location}</p>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-2">Offered By</h2>
                <p className="text-gray-700">{skill.user?.username || "Unknown User"}</p>
              </div>
            </div>

            {/* Swap Button & Status */}
            <div className="mt-6">
              {payError && <p className="text-red-600 mb-2">{payError}</p>}
              {paySuccess && <p className="text-green-600 mb-2">{paySuccess}</p>}

              {approvedSwap ? (
                <button
                  disabled
                  className="bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed"
                >
                  Already Swapped
                </button>
              ) : pendingSwap ? (
                <button
                  disabled
                  className="bg-yellow-500 text-white px-4 py-2 rounded cursor-not-allowed"
                >
                  Swap Pending
                </button>
              ) : (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                >
                  Swap for ₹{skill.price}
                </button>
              )}
            </div>

            {/* —— Payment Modal —— */}
            {showPaymentModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-80">
                  <h2 className="text-lg font-semibold mb-4">Request Swap & Slot</h2>

                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      min={0}
                      className="w-full p-2 border rounded"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Method</label>
                    <select
                      className="w-full p-2 border rounded"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Select Slot Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full p-2 border rounded"
                      value={slotDate}
                      onChange={(e) => setSlotDate(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="px-4 py-2 bg-gray-200 rounded"
                      disabled={isPaying}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmPayment}
                      disabled={isPaying}
                      className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                    >
                      {isPaying ? "Requesting…" : "Request Swap"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="border-t pt-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">Reviews</h2>

              {/* Add Review Form */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-medium mb-3">Add Your Review</h3>
                {reviewError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded mb-3 text-sm">
                    {reviewError}
                  </div>
                )}
                <form onSubmit={handleSubmitReview}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rating
                    </label>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className={`text-2xl ${
                            star <= reviewRating ? "text-yellow-500" : "text-gray-300"
                          } focus:outline-none`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comment
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      required
                      rows={3}
                      className="w-full p-2 border rounded"
                      placeholder="Share your experience..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              </div>

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <p className="text-gray-500 italic">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review._id} className="border-b pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <span className="font-medium">
                              {review.user?.username || "Anonymous"}
                            </span>
                            <span className="mx-2 text-gray-300">•</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-sm ${
                                    i < review.rating ? "text-yellow-500" : "text-gray-300"
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700 mt-1">{review.comment}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
