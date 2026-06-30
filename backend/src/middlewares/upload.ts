import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '104857600');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.xlsx', '.xls', '.csv', '.ods'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error(`File type ${ext} not supported`));
};

export const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });
