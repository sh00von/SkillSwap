"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function Signup() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [studentId, setStudentId] = useState("")
  const [phone, setPhone] = useState("")
  const [dob, setDob] = useState("")
  const [bio, setBio] = useState("")
  const [acceptLocation, setAcceptLocation] = useState(false)
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // When user accepts, attempt to get geolocation
  useEffect(() => {
    if (!acceptLocation) return
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude)
        setLongitude(pos.coords.longitude)
      },
      (err) => {
        setError("Unable to retrieve location")
        setAcceptLocation(false)
      }
    )
  }, [acceptLocation])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (!acceptLocation) {
      setError("You must allow location access")
      return
    }
    if (latitude === null || longitude === null) {
      setError("Waiting for location…")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          studentId,
          phone,
          dob,
          bio,
          latitude,
          longitude,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        router.push("/login?registered=true")
      } else {
        setError(data.message || "Registration failed. Please try again.")
      }
    } catch (err) {
      setError("An error occurred. Please try again later.")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-1 text-center">Create an account</h2>
        <p className="text-sm text-center mb-6">Join SkillSwap to start sharing and learning skills</p>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label htmlFor="studentId" className="block text-sm font-medium mb-1">Student ID</label>
            <input
              id="studentId"
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label htmlFor="dob" className="block text-sm font-medium mb-1">Date of Birth</label>
            <input
              id="dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium mb-1">Bio (optional)</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-2 border rounded"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="acceptLocation"
              checked={acceptLocation}
              onChange={(e) => setAcceptLocation(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="acceptLocation" className="text-sm">
              I allow Geo-location (latitude & longitude)
            </label>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>
        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-600 hover:underline">
            Log in
          </Link>
        </p>
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
