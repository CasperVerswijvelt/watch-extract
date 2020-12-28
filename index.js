import chokidar from "chokidar";
import fs from "fs";
import path from "path";

import extract from "extract-zip";
import unrar from "node-unrar-js";

import ConsoleStamp from "console-stamp";

ConsoleStamp(console);

// Process arguments

const args = process.argv.slice(2);

// Default to current directory
let watchDirectory = ".";

if (args.length > 0 && typeof args[0] === "string") watchDirectory = args[0];

// Filetypes

const TYPE_ZIP = ".zip";
const TYPE_RAR = ".rar";
const TYPE_TAR_GZ = ".tar.gz";
const TYPE_GZ = ".gz";

// Name of folder to extract to

const EXTRACTED = "extracted";

// Watch added files
chokidar.watch(watchDirectory).on("add", async (filePath) => {
  // Ignore root directory
  if (filePath === watchDirectory) return;

  const isZip = filePath.endsWith(TYPE_ZIP);
  const isRar = filePath.endsWith(TYPE_RAR);
  const isTarGz = filePath.endsWith(TYPE_TAR_GZ);
  const isGz = filePath.endsWith(TYPE_GZ) && !isTarGz;

  if (isZip || isRar) {
    const parentFolder = path.dirname(filePath);
    const extractedFolder = path.join(parentFolder, EXTRACTED);
    const exists = fs.existsSync(extractedFolder);

    console.log(`Found supported archive file ${filePath}`);
    console.log(`Extracted folder exists: ${exists}`);

    // If extracted folder already exists, return
    if (exists) return;

    const logProgressZip = (progress) =>
      console.log(`Extracting ${filePath} progress: ${progress.percent}%`);
    const logDataZip = (data) =>
      console.log(`Extracted data: ${data.file}: ${data.status}`);

    const logEnd = () =>
      console.log(`Succesfully extracted ${filePath} to ${extractedFolder}`);
    const logError = (error) => {
      console.error(`Error while extracting ${filePath}: ${error}`);
    };

    // Make sure extracted folder is created before extracting
    fs.mkdirSync(extractedFolder);

    // Type dependent extracting
    if (isRar) {
      console.log(`Extracting .rar archive`);

      const extractor = unrar.createExtractorFromFile(
        filePath,
        extractedFolder
      );

      const extractResult = extractor.extractAll();
      if (extractResult[0].state === "ERROR") {
        logError(extractResult[0].reason);
      } else {
        logEnd();
      }
    } else if (isZip) {
      console.log(`Extracting .zip archive`);

      try {
        await extract(filePath, { dir: path.resolve(extractedFolder) });
        logEnd();
      } catch (e) {
        logError(e);
      }
    } else if (isTarGz) {
      logError("Not yet implemented");
    } else if (isGz) {
      logError("Not yet implemented");
    }
  }
});
