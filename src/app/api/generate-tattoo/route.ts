/**
 * Copyright (c) 2026 Tattoo Ideas Generator
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || '',
})

export async function POST(req: NextRequest) {
  try {
    const { prompt, style, category } = await req.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Enhanced prompt for tattoo generation
    const enhancedPrompt = `${prompt}, ${style} tattoo style, ${category} theme, highly detailed, flash sheet style, black and white lineart, tattoo design, professional tattoo art, clean lines, bold contrast, suitable for skin application`

    const result = await replicate.run(
      "black-forest-labs/flux-schnell",
      {
        input: {
          prompt: enhancedPrompt,
          disable_safety_checker: false,
          go_fast: true,
          megapixels: "1",
          num_outputs: 1,
          aspect_ratio: "1:1",
          output_format: "webp",
          output_quality: 80,
        }
      }
    )

    if (!result || !Array.isArray(result) || result.length === 0) {
      throw new Error('No image generated')
    }

    const imageUrl = result[0]

    return NextResponse.json({
      success: true,
      imageUrl,
      prompt: enhancedPrompt,
      style,
      category,
    })

  } catch (error) {
    console.error('Error generating tattoo:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate tattoo design',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Tattoo generation API endpoint. Use POST to generate designs.' },
    { status: 200 }
  )
}