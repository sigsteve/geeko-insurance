import { NextResponse } from 'next/server'

const MAX_RETRIES = 3;

async function tryAnalyzeDamage(base64Image: string, attempt: number = 1): Promise<{ 
  damagedParts: string[],
  rawResponse: string 
}> {
  console.log(`🔄 API Route: Damage analysis attempt ${attempt} of ${MAX_RETRIES}`)
  
  const llmPayload = {
    model: "llava:7b",
    prompt: "List the damaged parts of this vehicle. Return only a comma-separated list of specific parts. Use standard automotive part names (e.g., front bumper, hood, left fender). Do not include descriptions or additional text.",
    images: [base64Image],
    stream: false
  }

  const llmResponse = await fetch(process.env.OLLAMA_API_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(llmPayload)
  })

  const llmData = await llmResponse.json()
  console.log(`✨ API Route: Raw LLM Response (attempt ${attempt}):`, llmData)

  const damagedParts = llmData.response
    .split(',')
    .map((part: string) => part.trim())
    .filter((part: string) => part.length > 0)

  return { 
    damagedParts,
    rawResponse: llmData.response 
  }
}

export async function POST(request: Request) {
  try {
    console.log('🚀 API Route: Starting damage analysis')
    
    const data = await request.formData()
    const file = data.get('image') as File
    
    if (!file) {
      console.error('❌ API Route: No image file provided')
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Convert the file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')
    
    // Try to analyze damage with retries
    let attempt = 1
    let result = await tryAnalyzeDamage(base64Image, attempt)

    while ((!result.damagedParts || result.damagedParts.length === 0) && attempt < MAX_RETRIES) {
      attempt++
      console.log(`⚠️ API Route: Invalid response, retrying (attempt ${attempt})`)
      result = await tryAnalyzeDamage(base64Image, attempt)
    }

    console.log('🎯 API Route: Damage analysis result:', result)
    return NextResponse.json(result)

  } catch (error) {
    console.error('💥 API Route: Error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze damage' },
      { status: 500 }
    )
  }
} 