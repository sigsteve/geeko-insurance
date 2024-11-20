import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    ollamaApiUrl: process.env.OLLAMA_API_URL
  })
} 