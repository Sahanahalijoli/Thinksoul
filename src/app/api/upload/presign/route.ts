export const dynamic = 'force-static'

import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from '@/utils/supabase/server'

// Server-only S3 client — credentials never leave the server
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'thinksoul-lms-assets'

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check — only logged-in users can upload
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validate request body
    const { fileName, contentType } = await req.json()

    if (!fileName || !contentType) {
      return NextResponse.json({ error: 'fileName and contentType are required' }, { status: 400 })
    }

    // 3. Credentials check
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('AWS S3 credentials not configured on server.')
      return NextResponse.json({ error: 'Storage not configured.' }, { status: 500 })
    }

    // 4. Security: Obfuscate filename to prevent URL guessing
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 10)
    const safeName = fileName.replace(/[^a-z0-9.]/gi, '_').toLowerCase()
    const fileKey = `uploads/${timestamp}-${randomSuffix}-${safeName}`

    // 5. Generate presigned URL (valid for 1 hour)
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    })

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

    // 6. Build the final public URL for the uploaded file
    const region = process.env.AWS_REGION || 'eu-north-1'
    const publicUrl = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${fileKey}`

    return NextResponse.json({ presignedUrl, publicUrl })

  } catch (err: any) {
    console.error('Presign API Error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
