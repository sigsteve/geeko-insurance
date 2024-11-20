import { NextResponse } from 'next/server'

const MAX_RETRIES = 3;

async function tryPriceParts(parts: string[], attempt: number = 1): Promise<{ 
  pricedParts: Array<{
    part: string;
    cost: number;
    repair: string;
    damage: string;
  }>,
  rawResponse: string,
  model: string
}> {
  console.log(`🔄 API Route: Parts pricing attempt ${attempt} of ${MAX_RETRIES}`)
  
  const prompt = `
Given these damaged car parts: ${parts.join(', ')}

Return a JSON array of objects with repair details. For each part:
- Use the exact part name from the input
- Keep damage descriptions brief and specific
- Use standard repair methods
- Provide realistic costs

Return format:
[
  {
    "part": "Front Bumper",
    "damage": "Deep impact damage",
    "repair": "Replace and paint",
    "cost": 850
  }
]

Guidelines:
- Damage descriptions should be 2-4 words
- Repair methods: "Replace and paint", "Repair and paint", "PDR", or "Replace"
- Costs should be between $200-2000
- Capitalize part names properly

Only return the JSON array, no other text.`

  const llmPayload = {
    model: "llama3.1:8b",
    prompt,
    response_format: "json",
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

  try {
    const pricedParts = JSON.parse(llmData.response)
    return { 
      pricedParts,
      rawResponse: llmData.response,
      model: llmPayload.model
    }
  } catch (error) {
    console.error('Error parsing LLM response:', error)
    return {
      pricedParts: parts.map(part => ({
        part,
        cost: Math.floor(Math.random() * 1800) + 200,
        repair: "Replace and paint",
        damage: "Visible damage"
      })),
      rawResponse: llmData.response,
      model: llmPayload.model
    }
  }
}

export async function POST(request: Request) {
  try {
    console.log('🚀 API Route: Starting parts pricing')
    
    const data = await request.json()
    const { parts } = data
    
    if (!parts || !Array.isArray(parts)) {
      console.error('❌ API Route: No parts list provided')
      return NextResponse.json(
        { error: 'No parts list provided' },
        { status: 400 }
      )
    }

    // Try to price parts with retries
    let attempt = 1
    let result = await tryPriceParts(parts, attempt)

    while ((!result.pricedParts || result.pricedParts.length === 0) && attempt < MAX_RETRIES) {
      attempt++
      console.log(`⚠️ API Route: Invalid response, retrying (attempt ${attempt})`)
      result = await tryPriceParts(parts, attempt)
    }

    console.log('🎯 API Route: Parts pricing result:', result)
    return NextResponse.json({
      pricedParts: result.pricedParts,
      rawResponse: result.rawResponse,
      model: result.model
    })

  } catch (error) {
    console.error('💥 API Route: Error:', error)
    return NextResponse.json(
      { error: 'Failed to price parts' },
      { status: 500 }
    )
  }
} 