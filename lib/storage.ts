import { put, del, head } from '@vercel/blob'
import fs from 'fs/promises'
import path from 'path'

/**
 * Upload a SOW PDF file to Vercel Blob storage (production) or save locally (development)
 * @param pdfBuffer - Buffer containing the PDF data
 * @param fileName - Name for the file
 * @param sowId - SOW ID for organizing files in storage
 * @returns Object containing the blob URL and file size
 */
export async function uploadSOWPDF(
  pdfBuffer: Buffer,
  fileName: string,
  sowId: string
): Promise<{ url: string; size: number }> {
  // Check if Blob token is available
  const hasToken = process.env.BLOB_READ_WRITE_TOKEN && process.env.BLOB_READ_WRITE_TOKEN.trim() !== ''

  if (hasToken) {
    // Production: Upload to Vercel Blob
    const blob = await put(`sows/${sowId}/${fileName}`, pdfBuffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'application/pdf',
    })

    return {
      url: blob.url,
      size: pdfBuffer.length,
    }
  } else {
    // Development: Save locally to public/sows
    const publicDir = path.join(process.cwd(), 'public', 'sows')
    await fs.mkdir(publicDir, { recursive: true })

    const filePath = path.join(publicDir, `${sowId}_${fileName}`)
    await fs.writeFile(filePath, pdfBuffer)

    // Return local URL
    return {
      url: `/sows/${sowId}_${fileName}`,
      size: pdfBuffer.length,
    }
  }
}

/**
 * Delete a SOW PDF file from Vercel Blob storage
 * @param url - Blob URL of the file to delete
 */
export async function deleteSOWPDF(url: string): Promise<void> {
  await del(url)
}

/**
 * Get file information from Vercel Blob storage
 * @param url - Blob URL of the file
 * @returns File metadata including size, content type, etc.
 */
export async function getSOWFileInfo(url: string) {
  return await head(url)
}
