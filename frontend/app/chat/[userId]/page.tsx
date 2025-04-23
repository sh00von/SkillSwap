"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"

interface RawMsg {
  sender: { _id: string }
  message: string
  createdAt: string
}

interface Message {
  sender: string
  message: string
  timestamp: string
}

export default function PrivateChatPage() {
  const { userId } = useParams()
  const router = useRouter()           // ← pull in router
  const [msgs, setMsgs] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [me, setMe] = useState<string>("")
  const [chatWithName, setChatWithName] = useState<string>("")
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = localStorage.getItem("token")
    if (!t) return
    const d = JSON.parse(atob(t.split(".")[1]))
    setMe(d.userId)
  }, [])

  useEffect(() => {
    if (!userId) return
    fetch(`http://localhost:5000/api/auth/users/${userId}`)
      .then(res => res.json())
      .then((data: { username?: string }) =>
        setChatWithName(data.username || "")
      )
      .catch(console.error)
  }, [userId])

  useEffect(() => {
    if (!me || !userId) return
    const load = () => {
      fetch(`http://localhost:5000/api/messages/private/${me}/${userId}`)
        .then(r => r.json())
        .then((data: RawMsg[]) =>
          setMsgs(
            data.map(m => ({
              sender: m.sender._id,
              message: m.message,
              timestamp: m.createdAt
            }))
          )
        )
        .catch(console.error)
    }
    load()
    const iv = setInterval(load, 3000)
    return () => clearInterval(iv)
  }, [me, userId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [msgs])

  const send = () => {
    if (!input.trim()) return
    fetch(`http://localhost:5000/api/messages/private`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: me, receiver: userId, message: input })
    })
      .then(() => setInput(""))
      .catch(console.error)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header with Back button */}
      <div className="bg-indigo-600 text-white p-4 flex items-center">
        <button
          onClick={() => router.back()}
          className="mr-4 p-1 rounded hover:bg-indigo-500"
        >
          ← Back
        </button>
        <span className="font-semibold">
          Chat with {chatWithName || userId}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`max-w-xs p-2 rounded ${
              m.sender === me
                ? "bg-indigo-600 text-white ml-auto"
                : "bg-white"
            }`}
          >
            {m.message}
            <div className="text-xs text-gray-500 mt-1 text-right">
              {new Date(m.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white flex">
        <input
          className="flex-1 border p-2 rounded"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
        />
        <button
          onClick={send}
          className="ml-2 bg-indigo-600 text-white px-4 rounded"
        >
          Send
        </button>
      </div>
    </div>
  )
}
