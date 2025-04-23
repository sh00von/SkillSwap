"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

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
  const { userId } = useParams()          // the person you’re chatting with
  const [msgs, setMsgs] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [me, setMe] = useState<string>("")
  const endRef = useRef<HTMLDivElement>(null)

  // decode my userId once
  useEffect(() => {
    const t = localStorage.getItem("token")
    if (!t) return
    const d = JSON.parse(atob(t.split(".")[1]))
    setMe(d.userId)
  }, [])

  // fetch history & then poll every 3s
  useEffect(() => {
    if (!me || !userId) return

    const load = () => {
      fetch(`http://localhost:5000/api/messages/private/${me}/${userId}`)
        .then((r) => r.json())
        .then((data: RawMsg[]) => {
          const mapped = data.map((m) => ({
            sender: m.sender._id,
            message: m.message,
            timestamp: m.createdAt
          }))
          setMsgs(mapped)
        })
        .catch(console.error)
    }

    load()
    const iv = setInterval(load, 3000)
    return () => clearInterval(iv)
  }, [me, userId])

  // scroll on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [msgs])

  const send = () => {
    if (!input.trim()) return
    fetch(`http://localhost:5000/api/messages/private`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        sender:   me,
        receiver: userId,
        message:  input
      })
    }).then(() => setInput(''))
      .catch(console.error)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-indigo-600 text-white p-4">Chat with {userId}</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.map((m,i) => (
          <div
            key={i}
            className={`max-w-xs p-2 rounded ${
              m.sender === me ? 'bg-indigo-600 text-white ml-auto' : 'bg-white'
            }`}
          >
            {m.message}
            <div className="text-xs text-gray-500 mt-1 text-right">
              {new Date(m.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={endRef}/>
      </div>
      <div className="p-3 bg-white flex">
        <input
          className="flex-1 border p-2 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
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
