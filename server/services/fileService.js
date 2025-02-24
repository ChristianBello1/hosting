// server/services/fileService.js
const fs = require('fs').promises;
const path = require('path');

class FileService {
  constructor() {
    this.sitesDir = path.join(__dirname, '../sites');
  }

  async listFiles(clientId, dirPath = '') {
    try {
      // Assicuriamoci che il path sia sicuro
      const normalizedPath = path.normalize(dirPath).replace(/^(\.\.[\/\\])+/, '');
      const fullPath = path.join(this.sitesDir, clientId.toString(), normalizedPath);
      
      // Verifica che la directory esista
      try {
        await fs.access(fullPath);
      } catch (error) {
        // Se la directory non esiste, creiamola
        await fs.mkdir(fullPath, { recursive: true });
        return [];
      }

      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      
      // Mappa le entries in oggetti con informazioni sui file
      const files = await Promise.all(entries.map(async (entry) => {
        const entryPath = path.join(fullPath, entry.name);
        const stats = await fs.stat(entryPath);
        
        return {
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modifiedAt: stats.mtime,
          createdAt: stats.ctime
        };
      }));

      // Ordina: prima le directory, poi i file
      return files.sort((a, b) => {
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error(`Error listing files for client ${clientId}:`, error);
      throw error;
    }
  }

  async createDirectory(clientId, dirPath) {
    try {
      const fullPath = path.join(this.sitesDir, clientId.toString(), dirPath);
      await fs.mkdir(fullPath, { recursive: true });
      return true;
    } catch (error) {
      console.error(`Error creating directory for client ${clientId}:`, error);
      throw error;
    }
  }

  async deleteFile(clientId, filePath) {
    try {
      const fullPath = path.join(this.sitesDir, clientId.toString(), filePath);
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        await fs.rm(fullPath, { recursive: true });
      } else {
        await fs.unlink(fullPath);
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting file for client ${clientId}:`, error);
      throw error;
    }
  }

  async readFile(clientId, filePath) {
    try {
      const fullPath = path.join(this.sitesDir, clientId.toString(), filePath);
      const content = await fs.readFile(fullPath, 'utf8');
      return content;
    } catch (error) {
      console.error(`Error reading file for client ${clientId}:`, error);
      throw error;
    }
  }

  async writeFile(clientId, filePath, content) {
    try {
      const fullPath = path.join(this.sitesDir, clientId.toString(), filePath);
      await fs.writeFile(fullPath, content, 'utf8');
      return true;
    } catch (error) {
      console.error(`Error writing file for client ${clientId}:`, error);
      throw error;
    }
  }

  async moveFile(clientId, oldPath, newPath) {
    try {
      const oldFullPath = path.join(this.sitesDir, clientId.toString(), oldPath);
      const newFullPath = path.join(this.sitesDir, clientId.toString(), newPath);
      await fs.rename(oldFullPath, newFullPath);
      return true;
    } catch (error) {
      console.error(`Error moving file for client ${clientId}:`, error);
      throw error;
    }
  }

  async saveUploadedFile(clientId, file, targetPath = '') {
    try {
      const clientDir = path.join(this.sitesDir, clientId.toString(), targetPath);
      
      // Normalizza il nome del file mantenendo gli spazi
      const fileName = path.basename(file.originalname);
      const finalPath = path.join(clientDir, fileName);
      
      console.log('Saving uploaded file:', {
        clientDir,
        fileName,
        finalPath
      });
      
      // Crea la directory del cliente se non esiste
      await fs.mkdir(clientDir, { recursive: true });
      
      // Sposta il file dalla directory temp alla destinazione finale
      await fs.rename(file.path, finalPath);

      console.log('File saved successfully:', {
        path: finalPath,
        size: (await fs.stat(finalPath)).size
      });

      return true;
    } catch (error) {
      console.error(`Error saving uploaded file for client ${clientId}:`, error);
      throw error;
    }
  }

  async createFolder(clientId, currentPath, folderName) {
    try {
      const fullPath = path.join(this.sitesDir, clientId.toString(), currentPath, folderName);
      await fs.mkdir(fullPath, { recursive: true });
      return true;
    } catch (error) {
      console.error(`Error creating folder for client ${clientId}:`, error);
      throw error;
    }
  }

  async getFilePath(clientId, filePath) {
    console.log('Getting file path for:', { clientId, filePath });
    
    // Normalizziamo il path mantenendo gli spazi
    const normalizedPath = path.normalize(filePath)
      .replace(/^\/+/, '')    // Rimuove slash iniziali
      .replace(/\/+/g, '/');  // Normalizza slash multipli

    const fullPath = path.join(this.sitesDir, clientId.toString(), normalizedPath);
    
    console.log('Path processing:', {
      original: filePath,
      normalized: normalizedPath,
      full: fullPath
    });

    // Verifica che il file esista
    try {
      const stats = await fs.stat(fullPath);
      console.log('File stats:', {
        exists: true,
        isFile: stats.isFile(),
        size: stats.size,
        path: fullPath
      });
      return fullPath;
    } catch (error) {
      console.error('File access error:', {
        error: error.message,
        path: fullPath
      });
      throw new Error('File not found or not accessible');
    }
  }

  async downloadFile(clientId, filePath) {
    try {
      console.log('FileService.downloadFile called:', {
        clientId,
        filePath
      });
  
      const fullPath = await this.getFilePath(clientId, filePath);
      const stats = await fs.stat(fullPath);
      
      console.log('File found:', {
        path: fullPath,
        size: stats.size,
        isFile: stats.isFile()
      });
  
      if (!stats.isFile()) {
        throw new Error('Requested path is not a file');
      }
  
      const mimeType = this.getMimeType(fullPath);
      console.log('File details:', {
        mimeType,
        size: stats.size
      });
  
      return {
        path: fullPath,
        stats: stats,
        mimeType
      };
    } catch (error) {
      console.error('Download error in FileService:', {
        clientId,
        filePath,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.csv': 'text/csv'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

module.exports = new FileService();