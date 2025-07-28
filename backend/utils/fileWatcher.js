const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const processCSVFile = require('./enhancedCSVProcessor');
const getCSVFiles = require('./getCSVFiles');
const logger = require('./logger');

class FileWatcher {
  constructor(db) {
    this.db = db;
    this.watchedDir = path.join(__dirname, '../data_csv');
    this.processedFiles = new Set();
    this.isWatching = false;
  }

  // Initialize file watcher
  async startWatching() {
    try {
      // Ensure the directory exists
      if (!fs.existsSync(this.watchedDir)) {
        fs.mkdirSync(this.watchedDir, { recursive: true });
        logger.info(`Created directory: ${this.watchedDir}`, 'fileWatcher');
      }

      // Process existing files first
      await this.processExistingFiles();

      // Start watching for new files
      this.watcher = chokidar.watch(this.watchedDir, {
        ignored: [
          /(^|[\/\\])\../, // ignore dotfiles
          /processed/, // ignore processed folder
          /.*_processed_.*\.csv$/ // ignore already processed files
        ],
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 100
        }
      });

      this.watcher
        .on('add', async (filePath) => {
          logger.info(`New file detected: ${path.basename(filePath)}`, 'fileWatcher');
          await this.processNewFile(filePath);
        })
        .on('change', async (filePath) => {
          logger.info(`File modified: ${path.basename(filePath)}`, 'fileWatcher');
          await this.processNewFile(filePath);
        })
        .on('unlink', (filePath) => {
          logger.info(`File removed: ${path.basename(filePath)}`, 'fileWatcher');
          this.processedFiles.delete(filePath);
        })
        .on('error', (error) => {
          logger.error(`File watcher error: ${error.message}\n${error.stack}`, 'fileWatcher');
        })
        .on('ready', () => {
          logger.info('File watcher is ready and monitoring for new CSV files...', 'fileWatcher');
          this.isWatching = true;
        });

    } catch (error) {
      logger.error(`Error starting file watcher: ${error.message}\n${error.stack}`, 'fileWatcher');
    }
  }

  // Process existing CSV files in the directory
  async processExistingFiles() {
    try {
      logger.info('Scanning for existing CSV files...', 'fileWatcher');
      const files = getCSVFiles(this.watchedDir);
      if (files.length === 0) {
        logger.info('No existing CSV files found in directory', 'fileWatcher');
        return;
      }
      logger.info(`Found ${files.length} existing CSV file(s)`, 'fileWatcher');
      for (const file of files) {
        const filePath = path.join(this.watchedDir, file);
        if (!this.processedFiles.has(filePath)) {
          await this.processNewFile(filePath);
        }
      }
    } catch (error) {
      logger.error(`Error processing existing files: ${error.message}\n${error.stack}`, 'fileWatcher');
    }
  }

  // Process a new or modified CSV file
  async processNewFile(filePath) {
    try {
      // Check if file is CSV
      if (!filePath.toLowerCase().endsWith('.csv')) {
        logger.info(`Skipping non-CSV file: ${path.basename(filePath)}`, 'fileWatcher');
        return;
      }
      // Skip files that are already in the processed folder
      if (filePath.includes('processed')) {
        logger.info(`Skipping already processed file: ${path.basename(filePath)}`, 'fileWatcher');
        return;
      }
      // Check if file is still being written (size is changing)
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        logger.info(`File is empty, waiting for content: ${path.basename(filePath)}`, 'fileWatcher');
        return;
      }
      // Wait a bit to ensure file is completely written
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Check if file was already processed
      if (this.processedFiles.has(filePath)) {
        logger.info(`File already processed: ${path.basename(filePath)}`, 'fileWatcher');
        return;
      }
      logger.info(`Processing file: ${path.basename(filePath)}`, 'fileWatcher');
      // Process the CSV file
      const collectedByUserId = 1; // Default admin user
      const result = await processCSVFile(filePath, collectedByUserId);
      logger.info(`Processing result: ${JSON.stringify(result)}`, 'fileWatcher');
      this.processedFiles.add(filePath);
      // Move processed file to archive folder
      await this.archiveFile(filePath);
    } catch (error) {
      logger.error(`Error processing file ${path.basename(filePath)}: ${error.message}\n${error.stack}`, 'fileWatcher');
    }
  }

  // Archive processed files
  async archiveFile(filePath) {
    try {
      const archiveDir = path.join(this.watchedDir, 'processed');
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }
      const fileName = path.basename(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      // Create a clean archived name without multiple "processed" suffixes
      let cleanFileName = fileName;
      if (cleanFileName.includes('_processed_')) {
        cleanFileName = cleanFileName.split('_processed_')[0];
      }
      const archivedName = `${cleanFileName}_processed_${timestamp}.csv`;
      const archivedPath = path.join(archiveDir, archivedName);
      // Check if file exists before trying to rename
      if (fs.existsSync(filePath)) {
        fs.renameSync(filePath, archivedPath);
        logger.info(`Archived: ${fileName} → ${archivedName}`, 'fileWatcher');
      } else {
        logger.warn(`File no longer exists: ${fileName}`, 'fileWatcher');
      }
    } catch (error) {
      logger.error('Error archiving file', 'fileWatcher', { error: error.message });
    }
  }

  // Stop watching (returns a promise)
  async stopWatching() {
    if (this.watcher) {
      await this.watcher.close();
      this.isWatching = false;
      logger.info('File watcher stopped', 'fileWatcher');
    }
  }

  // Get watcher status
  getStatus() {
    return {
      isWatching: this.isWatching,
      watchedDirectory: this.watchedDir,
      processedFilesCount: this.processedFiles.size
    };
  }

  // Get list of processed files
  getProcessedFiles() {
    return Array.from(this.processedFiles);
  }
}

module.exports = FileWatcher; 