"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"

export default function Home() {
  const router = useRouter()

  return (
    <div className="bg-gray-50 text-gray-800">
      {/* Navbar */}
      <nav className="bg-white shadow p-4 flex justify-between items-center px-8">
        <h1 className="text-xl font-bold text-indigo-600">SkillSwap</h1>
        <div className="space-x-4">
          <button onClick={() => router.push("/admin")} className="text-sm text-gray-600">
            Admin</button>
          <button onClick={() => router.push("/login")} className="text-sm text-gray-600">
            Log In
          </button>
          <button
            onClick={() => router.push("/signup")}
            className="text-sm bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col-reverse md:flex-row items-center justify-between px-8 py-16 bg-white">
        <div className="md:w-1/2 text-center md:text-left">
          <h2 className="text-4xl font-extrabold mb-4">Share Skills, Grow Together</h2>
          <p className="text-lg mb-6">
            SkillSwap connects people who want to learn with those who can teach. Exchange your knowledge with others
            and grow together in a collaborative community.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => router.push("/login")}
              className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
            >
              Get Started
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="border border-indigo-600 text-indigo-600 px-6 py-2 rounded hover:bg-indigo-50"
            >
              Explore Skills
            </button>
          </div>
        </div>
        <div className="md:w-1/2 grid grid-cols-2 gap-4 mt-8 md:mt-0">
          <div className="rounded-lg shadow overflow-hidden">
            <Image
              src="/placeholder.svg?height=300&width=300"
              alt="Person teaching"
              width={300}
              height={300}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="rounded-lg shadow overflow-hidden">
            <Image
              src="/placeholder.svg?height=300&width=300"
              alt="Person learning"
              width={300}
              height={300}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-100 text-center">
        <h3 className="text-2xl font-bold mb-2">Everything You Need to Share Skills</h3>
        <p className="mb-10 text-gray-600">
          Our platform makes it easy to connect with others, share knowledge, and grow your skills in a supportive
          community environment.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            "Skill Matching",
            "Easy Scheduling",
            "Secure Messaging",
            "Ratings & Reviews",
            "Location-Based",
            "Point System",
          ].map((feature, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-md">
              <h4 className="font-semibold text-lg mb-2">{feature}</h4>
              <p className="text-sm text-gray-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 text-center bg-white">
        <h3 className="text-2xl font-bold mb-6">How SkillSwap Works</h3>
        <p className="mb-10 text-gray-600">
          Our simple 5-step process makes it easy to connect with others and share skills.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {["Create Your Profile", "Discover Matches", "Connect & Discuss", "Book Sessions", "Exchange & Rate"].map(
            (step, i) => (
              <div key={i} className="p-4">
                <div className="text-indigo-600 text-3xl font-bold mb-2">{i + 1}</div>
                <p className="font-medium">{step}</p>
              </div>
            ),
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 text-center bg-gray-100">
        <h3 className="text-2xl font-bold mb-4">What Our Users Say</h3>
        <blockquote className="max-w-xl mx-auto text-lg text-gray-700 italic">
          "SkillSwap helped me find someone to teach me guitar while I taught them Spanish. It's been amazing to learn
          and share skills at the same time!"
        </blockquote>
        <p className="mt-4 text-sm font-semibold">— Rafia Islam, Guitar Student & Spanish Teacher</p>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 text-center bg-indigo-600 text-white">
        <h3 className="text-3xl font-bold mb-4">Ready to Start Sharing Skills?</h3>
        <p className="mb-6 text-lg">
          Join our growing community of skill sharers today and unlock your learning potential.
        </p>
        <button
          onClick={() => router.push("/signup")}
          className="bg-white text-indigo-600 px-6 py-2 rounded hover:bg-indigo-100 font-semibold"
        >
          Create Your Profile
        </button>
      </section>

      {/* Footer */}
      <footer className="text-sm text-center p-4 text-gray-500 bg-white">
        &copy; {new Date().getFullYear()} SkillSwap. All rights reserved.
      </footer>
    </div>
  )
}
