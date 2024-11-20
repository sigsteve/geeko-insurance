import { NextResponse } from 'next/server'

const MAX_RETRIES = 3;

async function tryCheckDamage(base64Image: string, attempt: number = 1): Promise<{ 
  hasDamage: boolean, 
  rawResponse: string,
  model: string,
  error?: string
}> {
  console.log(`🔄 API Route: Damage check attempt ${attempt} of ${MAX_RETRIES}`)
  
  const llmPayload = {
    model: "llava:7b",
    prompt: "Is there any visible damage to this vehicle? Answer only 'true' if damage is visible, or 'false' if no damage is visible.",
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

  if (llmData.error) {
    console.error('❌ API Route: LLM Error:', llmData.error)
    return { 
      hasDamage: false,
      rawResponse: `Error: ${llmData.error}`,
      model: llmPayload.model,
      error: "Failed to process image. The AI model encountered an error. Please try a different image format or try again later."
    }
  }

  const hasDamage = llmData.response?.toLowerCase().includes('true') ?? false
  return { 
    hasDamage, 
    rawResponse: llmData.response || 'Error: No response',
    model: llmPayload.model
  }
}

export async function POST(request: Request) {
  try {
    console.log('🚀 API Route: Starting damage check process')
    
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
    
    // Try to check damage with retries
    let attempt = 1
    let result = await tryCheckDamage(base64Image, attempt)

    while (result.hasDamage === undefined && attempt < MAX_RETRIES) {
      attempt++
      console.log(`⚠️ API Route: Invalid response, retrying (attempt ${attempt})`)
      result = await tryCheckDamage(base64Image, attempt)
    }

    console.log('🎯 API Route: Damage check result:', result)
    return NextResponse.json({
      hasDamage: result.hasDamage,
      rawResponse: result.rawResponse,
      model: result.model,
      error: result.error
    })

  } catch (error) {
    console.error('💥 API Route: Error:', error)
    return NextResponse.json({
      hasDamage: false,
      rawResponse: 'Error occurred during damage check',
      model: "llava:7b",
      error: "An unexpected error occurred. Please try again later."
    })
  }
} 