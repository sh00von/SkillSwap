// app/layout.tsx
"use client"

import React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Header from "@/components/Header"
import { usePathname } from "next/navigation"

const inter = Inter({ subsets: ["latin"] })


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const hideHeaderPaths = ["/", "/login", "/signup","/admin"]
  const showHeader = !hideHeaderPaths.includes(pathname)

  return (
    <html lang="en">
      <body className={inter.className}>
        {showHeader && <Header />}
        <main>{children}</main>
      </body>
    </html>
  )
}
