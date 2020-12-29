# watch-extract

A simple nodejs application that watches a specific folder for added files and extracts them if possible.

## Installation

- Make sure Node version 12.10.0 or later is installed
- Clone this repository
- Nagivate into repository folder and run `npm install`
- Done!

## Usage

Navigate to where you cloned the respority and run the application by doing this:

    node index.js

If all is well you should see this printed:

    Watching directory '.' for added files
    Found supported archive file archive.rar
    ...

By default the application will watch for new files in the current folder (`.`) and extract to a folder named `extracted` that is created in the same directory as the found archive. This behaviour can be changed by passing these optional parameters:

    node index.js --path downloads --extractFolder unarchived

## Run as systemd service on Linux

- Copy the [watch-extract.service](watch-extract.service) file to `/etc/system/system/` folder
- Edit the capitalized parts to fit your setup
- Run `sudo systemctl enable watch-extract` and `sudo systemctl start watch-extract`

## Notes

- Currently only a single archive within one folder level is extracted.
  This is because I check for the presence of the `extracted` folder to
  see if an archive has already been extracted or not. Could be improved in the future by keeping track of what has been extracted and what not in a seperate file.
- On application start: all files will also be checked and extracted if possible and not already extracted
- This was tested on Raspbian Linux using Node 12.20.0 and on windows using Node 12.18.0. Other platforms and node version should work but are not guaranteed.
