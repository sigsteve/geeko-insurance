'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

const SAMPLE_IMAGES = [
  { 
    id: 1, 
    filename: 'audi-hail.jpg', 
    title: 'Audi Hail Damage',
    description: 'Example of hail damage on an Audi vehicle'
  },
  { 
    id: 2, 
    filename: 'benz-hail.jpg', 
    title: 'Mercedes-Benz Hail Damage',
    description: 'Example of hail damage on a Mercedes-Benz vehicle'
  },
  { 
    id: 3, 
    filename: 'bmw-hail.jpg', 
    title: 'BMW Hail Damage',
    description: 'Example of hail damage on a BMW vehicle'
  },
  { 
    id: 4, 
    filename: 'bode-r8.jpg', 
    title: 'Clean Audi R8',
    description: 'Example of a clean, undamaged Audi R8'
  },
  { 
    id: 5, 
    filename: 'toyota-hail.jpg', 
    title: 'Toyota Hail Damage',
    description: 'Example of hail damage on a Toyota vehicle'
  },
  { 
    id: 6, 
    filename: 'vw-hail.jpg', 
    title: 'Volkswagen Hail Damage',
    description: 'Example of hail damage on a Volkswagen vehicle'
  }
]

export default function ImagesPage() {
  const { logout } = useAuth()
  const router = useRouter()

  const handleDownload = async (filename: string) => {
    try {
      const response = await fetch(`/api/images/${filename}?download=true`)
      if (!response.ok) throw new Error('Failed to download image')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download error:', err)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
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
          <div className="flex-1 flex justify-end gap-3">
            <Button 
              onClick={() => router.push('/')}
              className="bg-[#fe7c3f] hover:bg-[#e56e38]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button 
              onClick={logout}
              className="bg-[#30ba78] hover:bg-[#2da86c]"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-[#f4f4f4] py-8">
        <div className="max-w-screen-xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-[#0c322c] mb-8">Sample Damage Images</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SAMPLE_IMAGES.map((image) => (
              <Card key={image.id} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg">{image.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative h-48 w-full">
                    <img
                      src={`/api/images/${image.filename}`}
                      alt={image.title}
                      className="absolute inset-0 w-full h-full object-contain rounded-md"
                    />
                  </div>
                  <p className="text-sm text-gray-600">{image.description}</p>
                  <Button 
                    onClick={() => handleDownload(image.filename)}
                    variant="outline"
                    className="w-full border-[#30ba78] text-[#30ba78] hover:bg-[#30ba78] hover:text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0c322c] text-white py-4">
        <div className="max-w-screen-xl mx-auto px-4 text-center">
          <p className="text-sm">&copy; 2024 Geeko Insurance, A Damage Inc Company. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
} 