import { BadRequestException } from '@nestjs/common';

const ALLOWED_EXCEL_MIMES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
];

const ALLOWED_EXCEL_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const ALLOWED_DOCUMENT_MIMES = [
  ...ALLOWED_EXCEL_MIMES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const ALLOWED_DOCUMENT_EXTENSIONS = [
  ...ALLOWED_EXCEL_EXTENSIONS,
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
];

export function excelFileFilter(
  req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  const ext = file.originalname.toLowerCase().split('.').pop();
  if (
    ALLOWED_EXCEL_MIMES.includes(file.mimetype) ||
    ALLOWED_EXCEL_EXTENSIONS.includes(`.${ext}`)
  ) {
    callback(null, true);
  } else {
    callback(
      new BadRequestException(
        `نوع الملف غير مسموح. الأنواع المسموحة: ${ALLOWED_EXCEL_EXTENSIONS.join(', ')}`,
      ),
      false,
    );
  }
}

export function imageFileFilter(
  req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  const ext = file.originalname.toLowerCase().split('.').pop();
  if (
    ALLOWED_IMAGE_MIMES.includes(file.mimetype) ||
    ALLOWED_IMAGE_EXTENSIONS.includes(`.${ext}`)
  ) {
    callback(null, true);
  } else {
    callback(
      new BadRequestException(
        `نوع الصورة غير مسموح. الأنواع المسموحة: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`,
      ),
      false,
    );
  }
}

export function documentFileFilter(
  req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  const ext = file.originalname.toLowerCase().split('.').pop();
  if (
    ALLOWED_DOCUMENT_MIMES.includes(file.mimetype) ||
    ALLOWED_DOCUMENT_EXTENSIONS.includes(`.${ext}`)
  ) {
    callback(null, true);
  } else {
    callback(
      new BadRequestException(
        `نوع الملف غير مسموح. الأنواع المسموحة: ${ALLOWED_DOCUMENT_EXTENSIONS.join(', ')}`,
      ),
      false,
    );
  }
}
