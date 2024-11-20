import { NextResponse } from 'next/server'

const MAX_RETRIES = 3;

type RepairItem = {
  part: string;
  cost: number;
  repair: string;
  damage: string;
}

async function tryEstimateLabor(repairItems: RepairItem[], attempt: number = 1): Promise<{ 
  laborEstimate: {
    totalHours: number;
    hourlyRate: number;
    totalLaborCost: number;
    estimatedDays: number;
    details: string;
  },
  rawResponse: string,
  model: string 
}> {
  console.log(`🔄 API Route: Labor estimation attempt ${attempt} of ${MAX_RETRIES}`)
  
  const prompt = `
Given these repair items and their details:
${JSON.stringify(repairItems, null, 2)}

Return a JSON object with labor estimates. Format:
{
  "totalHours": number,
  "hourlyRate": number,
  "totalLaborCost": number,
  "estimatedDays": number,
  "details": "Brief summary of labor requirements for each part, one line per part"
}

Guidelines:
- Labor rates between $85-125/hour
- Include setup and cleanup time
- List labor details part by part
- Keep details concise and professional

Return only the JSON object, no markdown or extra text.`

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
    // Clean the response by removing any markdown code block formatting
    const cleanResponse = llmData.response
      .replace(/```json\n?/g, '')  // Remove opening code block
      .replace(/```\n?/g, '')      // Remove closing code block
      .trim()                      // Remove any extra whitespace

    const laborEstimate = JSON.parse(cleanResponse)
    return { 
      laborEstimate,
      rawResponse: llmData.response,
      model: llmPayload.model 
    }
  } catch (error) {
    console.error('Error parsing LLM response:', error)
    // Fallback calculation
    const totalHours = repairItems.length * 2.5
    return {
      laborEstimate: {
        totalHours,
        hourlyRate: 95,
        totalLaborCost: totalHours * 95,
        estimatedDays: Math.ceil(totalHours / 8),
        details: "Standard labor estimate based on number of repairs"
      },
      rawResponse: llmData.response,
      model: llmPayload.model 
    }
  }
}

export async function POST(request: Request) {
  try {
    console.log('🚀 API Route: Starting labor estimation')
    
    const data = await request.json()
    const { repairItems } = data
    
    if (!repairItems || !Array.isArray(repairItems)) {
      console.error('❌ API Route: No repair items provided')
      return NextResponse.json(
        { error: 'No repair items provided' },
        { status: 400 }
      )
    }

    // Try to estimate labor with retries
    let attempt = 1
    let result = await tryEstimateLabor(repairItems, attempt)

    while ((!result.laborEstimate || !result.laborEstimate.totalHours) && attempt < MAX_RETRIES) {
      attempt++
      console.log(`⚠️ API Route: Invalid response, retrying (attempt ${attempt})`)
      result = await tryEstimateLabor(repairItems, attempt)
    }

    console.log('🎯 API Route: Labor estimation result:', result)
    return NextResponse.json({
      laborEstimate: result.laborEstimate,
      rawResponse: result.rawResponse,
      model: result.model 
    })

  } catch (error) {
    console.error('💥 API Route: Error:', error)
    return NextResponse.json(
      { error: 'Failed to estimate labor' },
      { status: 500 }
    )
  }
} 