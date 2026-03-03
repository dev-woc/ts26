import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        communications: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      vendor,
    })
  } catch (error) {
    console.error('Error fetching vendor:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const {
      name,
      email,
      phone,
      website,
      address,
      type,
      status,
      naicsCodes,
      certifications,
      notes,
    } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email || null
    if (phone !== undefined) updateData.phone = phone || null
    if (website !== undefined) updateData.website = website || null
    if (address !== undefined) updateData.address = address || null
    if (type !== undefined) updateData.type = type
    if (status !== undefined) updateData.status = status
    if (naicsCodes !== undefined) updateData.naicsCodes = naicsCodes
    if (certifications !== undefined) updateData.certifications = certifications
    if (notes !== undefined) updateData.notes = notes || null

    const vendor = await prisma.vendor.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      vendor,
    })
  } catch (error) {
    console.error('Error updating vendor:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.vendor.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Error deleting vendor:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
