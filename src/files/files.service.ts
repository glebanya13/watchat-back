import { Injectable } from '@nestjs/common';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
  private readonly uploadPath = join(process.cwd(), 'uploads');

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<string> {
    // Декодируем folder (заменяем подчеркивания обратно на слеши)
    const decodedFolder = folder.replace(/_/g, '/');
    
    // Ensure upload directory exists
    const folderPath = join(this.uploadPath, decodedFolder);
    await mkdir(folderPath, { recursive: true });

    // Generate unique filename
    const originalName = file.originalname || 'file';
    const fileExtension = originalName.includes('.') 
      ? originalName.split('.').pop() 
      : 'bin';
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = join(folderPath, fileName);

    // Write file - используем buffer если доступен, иначе пробуем stream
    if (!file.buffer) {
      throw new Error('File buffer is not available');
    }
    
    await writeFile(filePath, file.buffer);

    // Return URL path
    return `/uploads/${decodedFolder}/${fileName}`;
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = 'general',
  ): Promise<string[]> {
    // Декодируем folder (заменяем подчеркивания обратно на слеши)
    const decodedFolder = folder.replace(/_/g, '/');
    const uploadPromises = files.map((file) => this.uploadFile(file, decodedFolder));
    return Promise.all(uploadPromises);
  }
}

