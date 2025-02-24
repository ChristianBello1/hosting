const express = require('express');
const router = express.Router();
const fileService = require('../services/fileService');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;

// Crea la directory temp se non esiste
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configurazione di multer
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, tempDir);
  },
  filename: (req, file, callback) => {
    callback(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// List files in directory
router.get('/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { path = '' } = req.query;
    const files = await fileService.listFiles(clientId, path);
    res.json(files);
  } catch (error) {
    console.error('Error handling file request:', error);
    res.status(500).json({ message: 'Error listing files' });
  }
});

// Create directory
router.post('/:clientId/directory', auth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { path } = req.body;
    await fileService.createDirectory(clientId, path);
    res.json({ message: 'Directory created successfully' });
  } catch (error) {
    console.error('Error creating directory:', error);
    res.status(500).json({ message: 'Error creating directory' });
  }
});

// Delete file or directory
router.delete('/:clientId', auth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { path } = req.body;
    await fileService.deleteFile(clientId, path);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Error deleting file' });
  }
});

// Read file content
router.get('/:clientId/content', auth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { path } = req.query;
    const content = await fileService.readFile(clientId, path);
    res.json({ content });
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ message: 'Error reading file' });
  }
});

// Update file content
router.put('/:clientId/content', auth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { path, content } = req.body;
    await fileService.writeFile(clientId, path, content);
    res.json({ message: 'File updated successfully' });
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({ message: 'Error updating file' });
  }
});

// Move/rename file
router.post('/:clientId/move', auth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { oldPath, newPath } = req.body;
    await fileService.moveFile(clientId, oldPath, newPath);
    res.json({ message: 'File moved successfully' });
  } catch (error) {
    console.error('Error moving file:', error);
    res.status(500).json({ message: 'Error moving file' });
  }
});

// Upload file
router.post('/:clientId/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const { clientId } = req.params;
    const { file } = req;
    const { path = '' } = req.query;
    
    console.log('Upload request received:', {
      clientId,
      file: file ? {
        originalname: file.originalname,
        size: file.size,
        path: path
      } : 'No file'
    });

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    await fileService.saveUploadedFile(clientId, file, path);
    
    console.log('File uploaded successfully');
    res.json({ message: 'File uploaded successfully' });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Error uploading file',
      error: error.message 
    });
  }
});

// Crea cartella
router.post('/:clientId/folder', auth, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { path, folderName } = req.body;
    
    await fileService.createFolder(clientId, path, folderName);
    res.json({ message: 'Folder created successfully' });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ message: 'Error creating folder' });
  }
});

// Prendi file
router.get('/:clientId/download', auth, async (req, res) => {
  console.log('\n=== DOWNLOAD ROUTE HIT ===');
  console.log('Auth header:', req.headers.authorization ? 'Present' : 'Missing');
  
  try {
    const { clientId } = req.params;
    const { path: filePath } = req.query;

    if (!filePath) {
      console.error('No file path provided');
      return res.status(400).json({ message: 'File path is required' });
    }

    console.log('Download request details:', {
      clientId,
      filePath,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    // Costruisci il percorso del file
    const sitesDir = path.join(__dirname, '../sites');
    const fullPath = path.join(sitesDir, clientId, filePath);
    
    console.log('File paths:', {
      sitesDir,
      fullPath,
      exists: fs.existsSync(fullPath)
    });

    // Verifica l'esistenza del file
    if (!fs.existsSync(fullPath)) {
      console.error('File not found:', fullPath);
      return res.status(404).json({ message: 'File not found' });
    }

    // Ottieni le statistiche del file
    const stats = fs.statSync(fullPath);
    if (!stats.isFile()) {
      console.error('Not a file:', fullPath);
      return res.status(400).json({ message: 'Not a file' });
    }

    console.log('File stats:', {
      size: stats.size,
      modified: stats.mtime
    });

    // Determina il content type
    const ext = path.extname(fullPath).toLowerCase();
    const mimeType = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif'
    }[ext] || 'application/octet-stream';

    // Imposta gli headers
    res.set({
      'Content-Type': mimeType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type'
    });

    console.log('Starting file transfer...');

    // Invia il file
    const stream = fs.createReadStream(fullPath);
    stream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming file' });
      }
    });

    stream.on('end', () => {
      console.log('File transfer completed successfully');
    });

    stream.pipe(res);

  } catch (error) {
    console.error('Download error:', {
      error: error.message,
      stack: error.stack
    });
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error processing request' });
    }
  }
});

router.options('/:clientId/download', (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400' // 24 ore
  }).status(200).end();
});

module.exports = router;