import { Request, Response, NextFunction } from 'express';
import Busboy from 'busboy';

export interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export const upload = {
  single: (fieldName: string) => (req: Request, res: Response, next: NextFunction) => {
    const busboy = Busboy({ headers: req.headers });
    let fileBuffer: Buffer | null = null;
    let fileName = '';
    let mimeType = '';

    busboy.on('file', (name, file, info) => {
      if (name !== fieldName) { file.resume(); return; }
      fileName = info.filename;
      mimeType = info.mimeType;
      const chunks: Buffer[] = [];
      file.on('data', (chunk) => chunks.push(chunk));
      file.on('end', () => { fileBuffer = Buffer.concat(chunks); });
    });

    busboy.on('finish', () => {
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
    const busboy = Busboy({ headers: req.headers });
    const files: { [key: string]: UploadedFile[] } = {};

    busboy.on('file', (name, file, info) => {
      const chunks: Buffer[] = [];
      file.on('data', (chunk) => chunks.push(chunk));
      file.on('end', () => {
        if (!files[name]) files[name] = [];
        files[name].push({
          buffer: Buffer.concat(chunks),
          originalname: info.filename,
          mimetype: info.mimeType,
          size: Buffer.concat(chunks).length,
        });
      });
    });

    busboy.on('finish', () => {
      (req as any).files = files;
      next();
    });

    busboy.on('error', (err) => next(err));
    req.pipe(busboy);
  }
};
