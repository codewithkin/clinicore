import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Check if S3 is properly configured
const isS3Configured = 
  process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID && 
  process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID !== 'AKIAIOSFODNN7EXAMPLE' &&
  process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY &&
  process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY !== 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';

// S3 Configuration
const s3Config = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  },
};

const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME || 'clinicore-files';

// Create S3 client instance
const s3Client = new S3Client(s3Config);

// Convert file to base64 data URL (fallback for development)
async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Upload file to S3
export async function uploadFileToS3(
  file: File,
  folder: string = 'uploads',
  customFileName?: string
): Promise<{ url: string; key: string }> {
  
  // If S3 is not configured, use base64 data URL (development only)
  if (!isS3Configured) {
    console.warn('⚠️  S3 not configured. Using base64 data URL for development. Configure AWS credentials for production.');
    
    const dataUrl = await fileToDataURL(file);
    const timestamp = Date.now();
    const key = `${folder}/${timestamp}-${file.name}`;
    
    return { url: dataUrl, key };
  }

  try {
    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const key = `${folder}/${fileName}`;

    // Convert File to Uint8Array for browser compatibility
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Create upload command (without ACL - use bucket policy instead)
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: uint8Array,
      ContentType: file.type,
    });

    // Execute upload
    await s3Client.send(command);

    // Return public URL
    const url = `https://${BUCKET_NAME}.s3.${s3Config.region}.amazonaws.com/${key}`;
    
    return { url, key };
  } catch (error: any) {
    console.error('S3 upload error:', error);
    
    // If CORS or other S3 error, fall back to base64 for development
    if (error?.message?.includes('Failed to fetch') || error?.message?.includes('CORS')) {
      console.warn('⚠️  S3 CORS error detected. Falling back to base64 data URL for development.');
      console.warn('📝 To fix: Configure CORS on your S3 bucket (see documentation)');
      
      const dataUrl = await fileToDataURL(file);
      const timestamp = Date.now();
      const key = `${folder}/${timestamp}-${file.name}`;
      
      return { url: dataUrl, key };
    }

    throw new Error('Failed to upload file to S3');
  }
}

// Delete file from S3
export async function deleteFileFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error('Failed to delete file from S3');
  }
}

// Upload logo specifically (with proper folder structure)
export async function uploadLogo(
  file: File,
  organizationId?: string,
  options?: { keepFixedName?: boolean }
): Promise<{ url: string; key: string }> {
  try {
    const folder = organizationId ? `logos/${organizationId}` : 'logos';

    // By default create a unique filename to avoid overwriting previous uploads.
    // If `keepFixedName` is true and an organizationId is provided, the file will be
    // uploaded as `logo.<ext>` which will overwrite the existing logo.jpg in that folder.
    const keepFixed = !!options?.keepFixedName && !!organizationId;
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const customName = keepFixed ? `logo` : `${timestamp}-logo`;

    return await uploadFileToS3(file, folder, customName);
  } catch (error) {
    console.log('S3 uploadLogo error:', error);

    throw new Error('Failed to upload logo to S3');
  }
}

// Upload general images
export async function uploadImage(
  file: File,
  folder: string = 'images'
): Promise<{ url: string; key: string }> {
  return uploadFileToS3(file, folder);
}

// Upload documents
export async function uploadDocument(
  file: File,
  folder: string = 'documents'
): Promise<{ url: string; key: string }> {
  return uploadFileToS3(file, folder);
}

export { s3Client };