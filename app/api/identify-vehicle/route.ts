import { NextResponse } from 'next/server'

const MAX_RETRIES = 3;

async function tryIdentifyVehicle(base64Image: string, attempt: number = 1): Promise<{ 
  make: string | null, 
  model: string | null,
  rawResponse: string,
  error?: string
}> {
  console.log(`🔄 API Route: Attempt ${attempt} of ${MAX_RETRIES}`)
  
  const llmPayload = {
    model: "llava:7b",
    prompt: "Identify the make and model of this vehicle. Return EXACTLY in this format - make: <make>, model: <model>. For example 'make: Toyota, model: Camry'. Nothing else.",
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
      make: null,
      model: null,
      rawResponse: `Error: ${llmData.error}`,
      error: llmData.error
    }
  }

  const responseText = llmData.response || ''

  let make = null
  let model = null

  const makeMatch = responseText.match(/make:\s*([^,]+)/i)
  const modelMatch = responseText.match(/model:\s*([^,\n]+)/i)

  if (makeMatch && modelMatch) {
    make = makeMatch[1].trim()
    model = modelMatch[1].trim()
  } else {
    const colonSplit = responseText.split(':')
    if (colonSplit.length === 2) {
      make = colonSplit[0].trim()
      model = colonSplit[1].trim()
    }
  }

  return { 
    make, 
    model,
    rawResponse: llmData.response 
  }
}

export async function POST(request: Request) {
  try {
    console.log('🚀 API Route: Starting vehicle identification process')
    
    const data = await request.formData()
    const file = data.get('image') as File
    
    if (!file) {
      console.error('❌ API Route: No image file provided')
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    console.log('📸 API Route: Image received:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })

    // Convert the file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')
    console.log('🔄 API Route: Image converted to base64')

    // Try to identify the vehicle with retries
    let attempt = 1
    let result = await tryIdentifyVehicle(base64Image, attempt)

    // Retry if we don't have both make and model
    while ((!result.make || !result.model) && attempt < MAX_RETRIES) {
      attempt++
      console.log(`⚠️ API Route: Invalid response, retrying (attempt ${attempt})`)
      result = await tryIdentifyVehicle(base64Image, attempt)
    }

    if (!result.make || !result.model) {
      console.log('❌ API Route: Failed to identify vehicle after all attempts')
      return NextResponse.json(
        { error: 'Failed to identify vehicle' },
        { status: 422 }
      )
    }

    console.log('🎯 API Route: Successfully identified vehicle:', result)
    return NextResponse.json({
      make: result.make,
      model: result.model,
      rawResponse: result.rawResponse
    })

  } catch (error) {
    console.error('💥 API Route Error:', error)
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    )
  }
} 