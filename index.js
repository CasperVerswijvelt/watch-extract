import chokidar from "chokidar";
import fs from "fs";
import path from "path";

import decompress from "decompress";
import decompressBzip2 from "decompress-bzip2";
import decompressCrx from "decompress-crx";
import decompressGz from "decompress-gz";
import decompressTar from "decompress-tar";
import decompressTarbz2 from "decompress-tarbz2";
import decompressTargz from "decompress-targz";
import decompressTarxz from "decompress-tarxz";
import decompressUnzip from "decompress-unzip";
import unrar from "node-unrar-js";

// Process arguments

const args = process.argv.slice(2);

// Directory to watch, default to current directory
let watchDirectory = ".";
if (args.length > 0 && typeof args[0] === "string") watchDirectory = args[0];

// Name of folder to extract to, default to 'extracted'
let extractedFolderName = "extracted";
if (args.length > 1 && typeof args[1] === "string")
  extractedFolderName = args[1];

// Filetypes

// Map of all filetypes, order is important!
//  In case of overlap such as .tar.gz and .gz, the more specific case should
//  be higher up in the list than the less specific case.
const FILE_EXTENSION = {
  RAR: ".rar",
  ZIP: ".zip",
  TAR: ".tar",
  TAR_GZ: ".tar.gz",
  TAR_BZ2: ".tar.bz2",
  TAR_XZ: ".tar.xz",
  BZIP2: ".bz2",
  GZ: ".gz",
  CRX: ".crx",
};

// Watch added files
chokidar.watch(watchDirectory).on("add", onFileAdded);

async function onFileAdded(filePath) {
  // Ignore root directory
  if (filePath === watchDirectory) return;

  // Determine file extension
  const fileExtension = getSupportedFileExtension(filePath);

  // Only continue for valid file extensions
  if (fileExtension.length === 0) return;

  const parentFolder = path.dirname(filePath);
  const extractedFolder = path.join(parentFolder, extractedFolderName);
  const exists = fs.existsSync(extractedFolder);

  console.log(`Found supported archive file ${filePath}`);
  console.log(
    `Extracted folder ${
      exists ? "already exists, ignoring" : "does not exist yet"
    }`
  );

  // If extracted folder already exists, return
  if (exists) return;

  const onSuccess = () =>
    console.log(`Succesfully extracted ${filePath} to ${extractedFolder}`);
  const onError = (error) => {
    console.error(`Error while extracting ${filePath}: ${error}`);
    console.error(`Removing '${extractedFolder}' folder`);
    fs.rmdirSync(extractedFolder, { recursive: true });
  };

  // Make sure extracted folder is created before extracting
  fs.mkdirSync(extractedFolder);

  console.log(`Extracting ${fileExtension} archive`);

  // Type dependent extracting
  if (fileExtension === FILE_EXTENSION.RAR) {
    // Use 'node-unrar-js' library for '.rar' files

    const extractor = unrar.createExtractorFromFile(filePath, extractedFolder);

    const extractResult = extractor.extractAll();
    if (extractResult[0].state === "ERROR") {
      onError(extractResult[0].reason);
    } else {
      onSuccess();
    }
  } else {
    // Use 'decompress' library for other supported files

    // Get file name without extension, needed for decompressBzip2
    const basename = path.basename(filePath);
    const originalFileName = basename.slice(
      0,
      basename.length - fileExtension.length
    );

    const decompressPlugin = getDecompressPlugin(
      fileExtension,
      // Options with path parameter for decompressBzip2
      {
        path: originalFileName,
      }
    );

    if (!decompressPlugin) {
      onError(
        `Could not find decompression plugin for file extension '${fileExtension}'`
      );
      return;
    }

    try {
      await decompress(filePath, extractedFolder, {
        plugins: [decompressPlugin],
        // Undocumented extra inputfile parameter needed for decompressGz
        //  See: https://github.com/CarlosCarmona/decompress-gz/issues/1
        inputFile: filePath,
      });
      onSuccess();
    } catch (e) {
      onError(e);
    }
  }
}

function getSupportedFileExtension(filePath) {
  for (const type of Object.values(FILE_EXTENSION)) {
    if (filePath.endsWith(type)) return type;
  }

  return "";
}

function getDecompressPlugin(fileExtension, options) {
  switch (fileExtension) {
    case FILE_EXTENSION.ZIP:
      return decompressUnzip();
    case FILE_EXTENSION.TAR:
      return decompressTar();
    case FILE_EXTENSION.TAR_GZ:
      return decompressTargz();
    case FILE_EXTENSION.TAR_BZ2:
      return decompressTarbz2();
    case FILE_EXTENSION.TAR_XZ:
      return decompressTarxz();
    case FILE_EXTENSION.BZIP2:
      return decompressBzip2(options);
    case FILE_EXTENSION.GZ:
      return decompressGz();
    case FILE_EXTENSION.CRX:
      return decompressCrx();
    default:
      return null;
  }
}
