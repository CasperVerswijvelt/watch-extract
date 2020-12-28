import chokidar from "chokidar";
import fs from "fs";
import path from "path";
import Seven from "node-7z";
import unrar from "@zhangfuxing/unrar";
import ConsoleStamp from "console-stamp";

ConsoleStamp(console);

// Process arguments

const args = process.argv.slice(2);

let watchDirectory = ".";

if (args.length > 0 && typeof args[0] === "string") watchDirectory = args[0];

// Filetypes

const TYPE_ZIP = ".zip";
const TYPE_RAR = ".rar";

const EXTRACTED = "extracted";

chokidar.watch(watchDirectory).on("add", async (filePath) => {
  if (filePath === watchDirectory) return;

  const isZip = filePath.endsWith(TYPE_ZIP);
  const isRar = filePath.endsWith(TYPE_RAR);

  if (isZip || isRar) {
    const parentFolder = path.dirname(filePath);
    const extractedFolder = path.join(parentFolder, EXTRACTED);
    const exists = fs.existsSync(extractedFolder);

    console.log(`Found supported archive file ${filePath}`);
    console.log(`Extracted folder exists: ${exists}`);

    if (exists) return;

    const logProgressZip = (progress) =>
      console.log(`Extracting ${filePath} progress: ${progress.percent}%`);
    const logDataZip = (data) =>
      console.log(`Extracted data: ${data.file}: ${data.status}`);

    const logProgressRar = (percent) => {
      console.log(`Extracting ${filePath} progress: ${percent}`);
    };

    const logEnd = () =>
      console.log(`Succesfully extracted ${filePath} to ${extractedFolder}`);
    const logError = (error) => {
      console.error(`Error while extracting ${filePath}: ${error}`);
    };

    if (isRar) {
      console.log(`Extracting archive using unrar`);
      fs.mkdirSync(extractedFolder);

      unrar.on("progress", logProgressRar);
      unrar
        .uncompress({
          src: filePath,
          dest: extractedFolder,
          command: "e",
        })
        .then(logEnd, logError);
    } else if (isZip) {
      console.log(`Extracting archive using 7zip`);
      try {
        const stream = Seven.extractFull(filePath, extractedFolder, {
          $progress: true,
        });
        stream.on("end", logEnd);
        stream.on("progress", logProgressZip);
        stream.on("data", logDataZip);
      } catch (e) {
        logError(e);
      }
    }
  }
});
