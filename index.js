import chokidar from "chokidar";
import fs from "fs";
import path from "path";
import Seven from "node-7z";
import Unrar from "unrar";
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

    const logEnd = () =>
      console.log(`Succesfully unzipped ${filePath} to ${extractedFolder}`);
    const logProgress = (progress) =>
      console.log(`Extracting progress: ${progress.percent}%`);
    const logData = (data) =>
      console.log(`Extracted data: ${data.file}: ${data.status}`);

    if (isRar) {
      console.log(`Extracting archive using unrar`);
      fs.mkdirSync(extractedFolder);
      const archive = new Unrar(filePath);
      archive.list((err, entries) => {
        for (let entry of entries) {
          const stream = archive.stream(entry.name);
          stream.on("error", (e) => {
            console.error(`Error while extracting ${filePath}: ${e}`);
          });
          stream.on("end", (e) => {
            console.log(
              `Succesfully extracted ${entry.name}to ${extractedFolder}`
            );
          });
          stream.pipe(
            fs.createWriteStream(path.join(extractedFolder, entry.name))
          );
        }
      });
    } else if (isZip) {
      console.log(`Extracting archive using 7zip`);
      try {
        const stream = Seven.extractFull(filePath, extractedFolder, {
          $progress: true,
        });
        stream.on("end", logEnd);
        stream.on("progress", logProgress);
        stream.on("data", logData);
      } catch (e) {
        console.error(`Error while extracting ${filePath}: ${e}`);
      }
    }
  }
});
