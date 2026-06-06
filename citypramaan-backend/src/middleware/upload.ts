import { Request, Response, NextFunction } from 'express';
import Busboy from 'busboy';
import { env } from '../config/env';

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

type UploadFields = Record<string, UploadedFile[]>;

const acceptedImageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export const upload = {
  single: (fieldName: string) => (req: Request, res: Response, next: NextFunction) => {
    const busboy = Busboy({
      headers: req.headers,
      limits: { fileSize: env.maxUploadBytes, files: 1 },
    });
    const body: Record<string, string> = {};
    let fileBuffer: Buffer | null = null;
    let fileName = '';
    let mimeType = '';
    let rejected = '';

    busboy.on('field', (name, value) => {
      body[name] = value;
    });

    busboy.on('file', (name, file, info) => {
      if (name !== fieldName) {
        file.resume();
        return;
      }

      if (!acceptedImageTypes.has(info.mimeType)) {
        rejected = 'Only image uploads are supported.';
        file.resume();
        return;
      }

      fileName = info.filename;
      mimeType = info.mimeType;
      const chunks: Buffer[] = [];
      file.on('data', (chunk) => chunks.push(chunk));
      file.on('limit', () => {
        rejected = `File exceeds ${env.maxUploadBytes} bytes.`;
      });
      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on('finish', () => {
      req.body = { ...(req.body || {}), ...body };

      if (rejected) {
        res.status(rejected.startsWith('File exceeds') ? 413 : 400).json({
          success: false,
          error: rejected,
        });
        return;
      }

      if (fileBuffer) {
        (req as any).file = {
          buffer: fileBuffer,
          originalname: fileName,
          mimetype: mimeType,
          size: fileBuffer.length,
        };
      }

      next();
    });

    busboy.on('error', (err) => next(err));
    req.pipe(busboy);
  },

  fields: (fields: { name: string; maxCount: number }[]) => (req: Request, res: Response, next: NextFunction) => {
    const allowed = new Map(fields.map((field) => [field.name, field.maxCount]));
    const busboy = Busboy({
      headers: req.headers,
      limits: { fileSize: env.maxUploadBytes, files: fields.reduce((sum, field) => sum + field.maxCount, 0) },
    });
    const body: Record<string, string> = {};
    const files: UploadFields = {};
    let rejected = '';

    busboy.on('field', (name, value) => {
      body[name] = value;
    });

    busboy.on('file', (name, file, info) => {
      const maxCount = allowed.get(name);
      if (!maxCount) {
        file.resume();
        return;
      }

      if ((files[name]?.length || 0) >= maxCount) {
        file.resume();
        return;
      }

      if (!acceptedImageTypes.has(info.mimeType)) {
        rejected = 'Only image uploads are supported.';
        file.resume();
        return;
      }

      const chunks: Buffer[] = [];
      file.on('data', (chunk) => chunks.push(chunk));
      file.on('limit', () => {
        rejected = `File exceeds ${env.maxUploadBytes} bytes.`;
      });
      file.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (!files[name]) files[name] = [];
        files[name].push({
          buffer,
          originalname: info.filename,
          mimetype: info.mimeType,
          size: buffer.length,
        });
      });
    });

    busboy.on('finish', () => {
      req.body = { ...(req.body || {}), ...body };

      if (rejected) {
        res.status(rejected.startsWith('File exceeds') ? 413 : 400).json({
          success: false,
          error: rejected,
        });
        return;
      }

      (req as any).files = files;
      next();
    });

    busboy.on('error', (err) => next(err));
    req.pipe(busboy);
  },
};
