import 'dotenv/config';
import pinataSDK from '@pinata/sdk';
import { Readable } from 'stream';
import crypto from 'crypto';

const pinata = new pinataSDK(
  process.env.PINATA_API_KEY!,
  process.env.PINATA_SECRET_KEY!
);

export interface IPFSUploadResult {
  cid: string;
  url: string;
}

export async function testPinataConnection(): Promise<boolean> {
  try {
    await pinata.testAuthentication();
    console.log('Pinata connected successfully!');
    return true;
  } catch (error: any) {
    console.error('Pinata connection failed:', error.message || error);
    return false;
  }
}

export async function uploadImageToIPFS(
  fileBuffer: Buffer,
  fileName: string
): Promise<IPFSUploadResult> {
  const stream = Readable.from(fileBuffer);
  (stream as any).path = fileName;

  const result = await pinata.pinFileToIPFS(stream, {
    pinataMetadata: { name: fileName },
    pinataOptions: { cidVersion: 0 }
  });

  return {
    cid: result.IpfsHash,
    url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
  };
}

export async function uploadProofBundle(
  beforeBuffer: Buffer,
  afterBuffer: Buffer,
  issueId: string
): Promise<{ cid: string; url: string; proofHash: string }> {

  const beforeResult = await uploadImageToIPFS(beforeBuffer, `${issueId}_before.jpg`);
  const afterResult = await uploadImageToIPFS(afterBuffer, `${issueId}_after.jpg`);

  const metadata = {
    issueId,
    beforeCID: beforeResult.cid,
    afterCID: afterResult.cid,
    timestamp: new Date().toISOString(),
    platform: 'CityPramaan'
  };

  const bundleResult = await pinata.pinJSONToIPFS(metadata, {
    pinataMetadata: { name: `proof_bundle_${issueId}` }
  });

  const proofHash = '0x' + crypto
    .createHash('sha256')
    .update(`${bundleResult.IpfsHash}:${issueId}`)
    .digest('hex');

  return {
    cid: bundleResult.IpfsHash,
    url: `https://gateway.pinata.cloud/ipfs/${bundleResult.IpfsHash}`,
    proofHash
  };
}