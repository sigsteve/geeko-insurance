import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import path from 'path'
import fs from 'fs/promises'

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  // Check authentication
  const cookieStore = cookies()
  const isAuthenticated = cookieStore.get('isAuthenticated')

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Sanitize filename to prevent directory traversal
    const filename = path.basename(params.filename)
    
    // Define the protected images directory - now pointing to project root
    const imagePath = path.join(process.cwd(), 'protected-images', filename)
    
    // Log the path we're trying to access (for debugging)
    console.log('Attempting to read image from:', imagePath)
    
    // Read the image file
    const imageBuffer = await fs.readFile(imagePath)
    
    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase()
    const contentType = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
    }[ext] || 'application/octet-stream'

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
        ...(request.url.includes('download=true') ? {
          'Content-Disposition': `attachment; filename="${filename}"`,
        } : {}),
      },
    })
  } catch (error) {
    console.error('Error serving image:', error)
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }
} 