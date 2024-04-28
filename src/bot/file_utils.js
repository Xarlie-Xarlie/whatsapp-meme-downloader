import fs from 'fs';
import path from 'path';

function naturalSort(a, b) {
  const extractNumber = str => {
    const num = str.match(/\d+/);
    return num ? parseInt(num[0]) : NaN;
  };

  const numA = extractNumber(a);
  const numB = extractNumber(b);

  if (numA < numB) return -1;
  if (numA > numB) return 1;
  return 0;
}

// Function to list all segmented files without their original file
function listSegmentedFiles(directory) {
  const files = fs.readdirSync(directory);
  let segmentedFiles = [];

  const originalFiles = {}; // Object to store original file names

  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      const subFiles = listSegmentedFiles(filePath);
      segmentedFiles = segmentedFiles.concat(subFiles);
    } else {
      const fileName = path.parse(file).name;
      const fileParts = fileName.split('_part_');

      // Check if the file is segmented
      if (fileParts.length > 1) {
        // Extract the base name and add segments to the list
        const baseName = fileParts[0] + path.extname(file);
        if (!originalFiles[baseName]) {
          originalFiles[baseName] = true; // Store the original file name
          segmentedFiles.push(baseName);
        }
        segmentedFiles.push(file);
      } else {
        // If the file is not segmented, add it directly to the list
        segmentedFiles.push(file);
      }
    }
  })

  segmentedFiles = segmentedFiles.filter(file => !originalFiles[file]).map(file => directory + file);

  // Sort the segmented files list
  segmentedFiles.sort(naturalSort);
  return segmentedFiles;
}

export default listSegmentedFiles;
