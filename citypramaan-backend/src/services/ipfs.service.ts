import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env, hasPinataConfig } from '../config/env';

export interface IPFSUploadResult {
  cid: string;
  url: string;
  storage: 'pinata' | 'local';
}

export async function testPinataConnection(): Promise<boolean> {
  if (!hasPinataConfig()) {
    console.warn('Pinata credentials not set. Uploads will use local storage.');
    return false;
  }

  try {
    const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      headers: pinataHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Pinata responded with ${response.status}`);
    }

    console.log('Pinata connected successfully!');
    return true;
  } catch (error: any) {
    console.error('Pinata connection failed:', error.message || error);
    return false;
  }
}

export async function uploadImageToIPFS(
  fileBuffer: Buffer,
  fileName: string,
  contentType = 'image/jpeg'
): Promise<IPFSUploadResult> {
  if (!hasPinataConfig()) {
    return storeLocalFile(fileBuffer, fileName);
  }

  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer], { type: contentType }), sanitizeFileName(fileName));

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: pinataHeaders(),
    body: formData as any,
  });

  if (!response.ok) {
    throw new Error(`Pinata upload failed with status ${response.status}`);
  }

  const data = (await response.json()) as { IpfsHash: string };

  return {
    cid: data.IpfsHash,
    url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
    storage: 'pinata',
  };
}

export async function uploadProofBundle(
  beforeBuffer: Buffer,
  afterBuffer: Buffer,
  issueId: string
): Promise<{ cid: string; url: string; proofHash: string; storage: 'pinata' | 'local' }> {
  const beforeResult = await uploadImageToIPFS(beforeBuffer, `${issueId}_before.jpg`);
  const afterResult = await uploadImageToIPFS(afterBuffer, `${issueId}_after.jpg`);

  const metadata = {
    issueId,
    beforeCID: beforeResult.cid,
    afterCID: afterResult.cid,
    timestamp: new Date().toISOString(),
    platform: 'CityPramaan',
  };

  if (!hasPinataConfig()) {
    const metadataBuffer = Buffer.from(JSON.stringify(metadata, null, 2), 'utf8');
    const bundle = storeLocalFile(metadataBuffer, `proof_bundle_${issueId}.json`);
    const proofHash = '0x' + crypto
      .createHash('sha256')
      .update(`${bundle.cid}:${issueId}`)
      .digest('hex');

    return {
      cid: bundle.cid,
      url: bundle.url,
      proofHash,
      storage: 'local',
    };
  }

  const bundleResult = await pinJsonToIPFS(metadata, `proof_bundle_${issueId}`);
  const proofHash = '0x' + crypto
    .createHash('sha256')
    .update(`${bundleResult.IpfsHash}:${issueId}`)
    .digest('hex');

  return {
    cid: bundleResult.IpfsHash,
    url: `https://gateway.pinata.cloud/ipfs/${bundleResult.IpfsHash}`,
    proofHash,
    storage: 'pinata',
  };
}

async function pinJsonToIPFS(content: unknown, name: string): Promise<{ IpfsHash: string }> {
  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      ...pinataHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pinataMetadata: { name },
      pinataContent: content,
    }),
  });

  if (!response.ok) {
    throw new Error(`Pinata JSON upload failed with status ${response.status}`);
  }

  return response.json() as Promise<{ IpfsHash: string }>;
}

function pinataHeaders(): Record<string, string> {
  return {
    pinata_api_key: env.pinataApiKey,
    pinata_secret_api_key: env.pinataSecretKey,
  };
}

function storeLocalFile(fileBuffer: Buffer, fileName: string): IPFSUploadResult {
  const safeName = sanitizeFileName(fileName);
  const cid = crypto
    .createHash('sha256')
    .update(fileBuffer)
    .update(String(Date.now()))
    .digest('hex');
  const dir = path.join(env.uploadsDir, cid);

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, safeName), fileBuffer);

  return {
    cid,
    url: `/uploads/${cid}/${safeName}`,
    storage: 'local',
  };
}

function sanitizeFileName(fileName: string): string {
  const parsed = path.parse(fileName || 'upload.bin');
  const base = parsed.name.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80) || 'upload';
  const ext = parsed.ext.replace(/[^a-zA-Z0-9.]/g, '').slice(0, 12) || '.bin';
  return `${base}${ext}`;
}
