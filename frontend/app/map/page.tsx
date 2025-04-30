"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import "leaflet/dist/leaflet.css"
import { getToken } from "@/lib/auth"

interface User {
  _id: string
  username: string
  email: string
  createdAt: string
  latitude?: number
  longitude?: number
}

// Dynamically load React-Leaflet components (client-side only)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
)

export default function MapPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [markerIcon, setMarkerIcon] = useState<any>(null)

  // Fetch users
  useEffect(() => {
    const token = getToken()
    fetch("http://localhost:5000/api/auth/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch users")
        return res.json() as Promise<User[]>
      })
      .then(data => setUsers(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // Create custom SVG icon once in client
  useEffect(() => {
    import("leaflet").then(L => {
      const icon = L.icon({
        iconUrl: "/marker.svg",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      })
      setMarkerIcon(icon)
    })
  }, [])

  if (loading || !markerIcon) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return <p className="p-6 text-center text-red-600">{error}</p>
  }

  // Filter out users without valid coordinates
  const validUsers = users.filter(
    u =>
      typeof u.latitude === "number" &&
      typeof u.longitude === "number" &&
      !isNaN(u.latitude) &&
      !isNaN(u.longitude)
  )

  if (!validUsers.length) {
    return <p className="p-6 text-center">No users with valid location data.</p>
  }

  // Center on first valid user
  const center: [number, number] = [
    validUsers[0].latitude!,
    validUsers[0].longitude!,
  ]

  return (
    <div className="h-screen w-full">
      <MapContainer
        center={center}
        zoom={3}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://osm.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validUsers.map(u => (
          <Marker
            key={u._id}
            position={[u.latitude!, u.longitude!]}
            icon={markerIcon}
          >
            <Popup>
              <strong>{u.username}</strong>
              <br />
              {u.email}
              <br />
              Joined: {new Date(u.createdAt).toLocaleDateString()}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
