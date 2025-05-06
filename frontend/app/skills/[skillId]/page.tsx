"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getToken } from "@/lib/auth";

interface Review {
  _id: string;
  rating: number;
  comment: string;
  user: {
    _id: string;
    username: string;
  };
  createdAt: string;
}

interface Skill {
  _id: string;
  title: string;
  description: string;
  category: string;
  experience: string;
  location: string;
  price: number;
  offeredBy?: {
    _id: string;
    username: string;
  };
  createdAt: string;
  reviews: Review[];
}

export default function SkillDetailPage() {
  const { skillId } = useParams() as { skillId: string };
  const router = useRouter();

  // Skill & reviews
  const [skill, setSkill] = useState<Skill | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Swap request state
  const [pendingSwap, setPendingSwap] = useState(false);
  const [approvedSwap, setApprovedSwap] = useState(false);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("sslcommerz");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [slotDate, setSlotDate] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState("");

  const API_BASE = "http://localhost:5000/api";

  // Format date helper
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // Average rating
  const getAverageRating = () => {
    if (!reviews.length) return "0.0";
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  // Initial fetch: skill, reviews, swap status
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Skill details
        const r1 = await fetch(`${API_BASE}/skills/${skillId}`);
        if (!r1.ok) throw new Error("Failed to load skill");
        const skillData: Skill = await r1.json();
        setSkill(skillData);
        setPaymentAmount(skillData.price);
        console.log(skillData);

        // Reviews
        const r2 = await fetch(`${API_BASE}/skills/${skillId}/reviews`);
        if (r2.ok) {
          const revs: Review[] = await r2.json();
          setReviews(revs);
        }

        // Swap status
        const token = getToken();
        if (token) {
          const r3 = await fetch(`${API_BASE}/payments/swaps`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (r3.ok) {
            const { pending, approved }: { pending: { skill: { _id: string } }[]; approved: { skill: { _id: string } }[] } = await r3.json();
            setPendingSwap(pending.some(p => p.skill._id === skillId));
            setApprovedSwap(approved.some(a => a.skill._id === skillId));
          }
        }
      } catch (e: any) {
        console.error(e);
        setError("Failed to load data.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [skillId]);

  // Submit a new review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError("");
    setIsSubmitting(true);
    const token = getToken();
    if (!token) return router.push("/login");

    try {
      const res = await fetch(`${API_BASE}/skills/${skillId}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to submit review");
      }
      const newRev: Review = await res.json();
      setReviews(prev => [...prev, newRev]);
      setReviewRating(5);
      setReviewComment("");
    } catch (e: any) {
      console.error(e);
      setReviewError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle swap/payment
  const confirmPayment = async () => {
    setPayError("");
    setPaySuccess("");
    setIsPaying(true);
    const token = getToken();
    if (!token) return router.push("/login");

    try {
      if (paymentMethod === "sslcommerz") {
        // Initiate SSLCommerz
        const res = await fetch(`${API_BASE}/payments/initiate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ skillId }),
        });
        const body = await res.json();
        if (!res.ok || !body.url) {
          throw new Error(body.message || "Failed to start SSLCommerz");
        }
        window.location.href = body.url;
        return;
      }

      // Legacy swap request
      const res = await fetch(`${API_BASE}/payments`, {
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
      });
      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.message || "Swap request failed");
      }
      setPaySuccess("Swap requested! Awaiting approval.");
      setPendingSwap(true);
      setShowPaymentModal(false);
    } catch (e: any) {
      console.error(e);
      setPayError(e.message);
    } finally {
      setIsPaying(false);
    }
  };

  // Render states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }
  if (error || !skill) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-6 rounded shadow text-center">
          <p className="text-red-600 mb-4">{error || "Skill not found"}</p>
          <Link href="/skills" className="text-indigo-600 hover:underline">
            ← Back to Skills
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/skills" className="text-indigo-600 hover:underline">
          ← Back to Skills
        </Link>

        {/* Skill Details */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-indigo-700">{skill.title}</h1>
            <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
              {skill.category}
            </span>
          </div>
          <div className="flex items-center mb-4 text-gray-600">
            <span className="mr-4">★ {getAverageRating()} ({reviews.length})</span>
            <span>Exp: {skill.experience}</span>
          </div>
          <p className="text-gray-700 mb-6">{skill.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-gray-700">
            <div>
              <h3 className="font-semibold">Location</h3>
              <p>{skill.location}</p>
            </div>
            <div>
              <h3 className="font-semibold">Offered By</h3>
              <p>{skill.offeredBy?.username ?? "Unknown"}</p>
            </div>
          </div>

          {/* Swap / Pay */}
          <div className="space-y-2">
            {payError && <p className="text-red-600">{payError}</p>}
            {paySuccess && <p className="text-green-600">{paySuccess}</p>}

            {approvedSwap ? (
              <button className="w-full bg-gray-400 text-white py-2 rounded" disabled>
                Already Swapped
              </button>
            ) : pendingSwap ? (
              <button className="w-full bg-yellow-500 text-white py-2 rounded" disabled>
                Swap Pending
              </button>
            ) : (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded"
              >
                Swap for ₹{skill.price}
              </button>
            )}
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-80 space-y-4">
              <h2 className="text-lg font-semibold">Request Swap / Pay</h2>

              <div>
                <label className="block text-sm font-medium mb-1">Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="sslcommerz">SSLCommerz</option>
                  <option value="bKash">bKash</option>
                </select>
              </div>

              {paymentMethod !== "sslcommerz" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(+e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Slot Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={slotDate}
                      onChange={e => setSlotDate(e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </>
              )}

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
                  className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                  disabled={isPaying}
                >
                  {isPaying
                    ? paymentMethod === "sslcommerz"
                      ? "Redirecting…"
                      : "Processing…"
                    : paymentMethod === "sslcommerz"
                    ? "Pay via SSLCommerz"
                    : "Request Swap"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold">Reviews</h2>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            {reviewError && (
              <div className="text-red-600 text-sm">{reviewError}</div>
            )}
            <div>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className={`text-2xl ${
                      star <= reviewRating ? "text-yellow-500" : "text-gray-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="Write your review..."
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {isSubmitting ? "Submitting…" : "Submit Review"}
            </button>
          </form>

          {reviews.length === 0 ? (
            <p className="text-gray-500 italic">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r._id} className="border-b pb-4">
                  <div className="flex justify-between">
                    <div>
                      <strong>{r.user.username}</strong>
                      <span className="ml-2 text-gray-500 text-sm">
                        {formatDate(r.createdAt)}
                      </span>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < r.rating ? "text-yellow-500" : "text-gray-300"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="mt-1 text-gray-700">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
