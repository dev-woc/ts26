import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // In development, this will call the Python function directly
    // In production on Vercel, this will call the serverless Python function
    const pythonUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${pythonUrl}/api/python/test`, {
      method: 'GET',
    })

    const data = await response.json()

    return NextResponse.json({
      success: true,
      python_response: data,
      note: "Python serverless function called successfully from Next.js API route"
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        note: "Python function may not be available in development mode. Deploy to Vercel to test."
      },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const pythonUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const response = await fetch(`${pythonUrl}/api/python/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    return NextResponse.json({
      success: true,
      python_response: data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
