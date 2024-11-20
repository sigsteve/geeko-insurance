'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        router.push('/')
        router.refresh() // Force a refresh to update the middleware state
      } else {
        setError("Invalid credentials")
      }
    } catch (err) {
      setError("An error occurred")
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-[#0c322c] text-white">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex-1">
            <Image
              src="/suse-white-logo-green.svg"
              alt="SUSE Logo"
              width={120}
              height={36}
              priority
            />
          </div>
          <div className="flex-1 text-center">
            <span className="text-2xl font-bold font-['SUSE']">Geeko Insurance</span>
          </div>
          <div className="flex-1"></div>
        </div>
      </header>

      <main className="flex-grow bg-[#f4f4f4] py-8">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Enter your credentials to continue</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#30ba78] hover:bg-[#2da86c]"
                  >
                    Sign In
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </main>

      <footer className="bg-[#0c322c] text-white py-4">
        <div className="max-w-screen-xl mx-auto px-4 text-center">
          <p className="text-sm">© 2024 SUSE. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
} 