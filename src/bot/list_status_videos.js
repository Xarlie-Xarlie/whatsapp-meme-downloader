import { readdirSync as fsReadDirSync } from 'node:fs';
import { parse, extname } from 'node:path';

/**
  * Sorts the video parts by comparing them.
  *
  * @param {string} a - video filePath.
  * @param {string} b - video filePath.
  * @returns {string[]} Videos parts sorted.
  *
  * @example
  * <caption>Sorting videos parts.</caption>
  * const array = [
  *   'video2_part_1.mp4',
  *   'video1_part_1.mp4',
  *   'video2_part_0.mp4',
  *   'video1_part_0.mp4'
  * ]
  * array.sort(naturalSort);
  * [
      'video1_part_0.mp4',
      'video1_part_1.mp4',
      'video2_part_0.mp4',
      'video2_part_1.mp4'
    ]
  */
function naturalSort(a, b) {
  const extractPartNumber = str => {
    // Match the part number using regex
    const matchA = str.match(/_part_(\d+)/);
    if (!matchA) return null;

    return parseInt(matchA[1]);
  };

  const partNumberA = extractPartNumber(a);
  const partNumberB = extractPartNumber(b);

  if (partNumberA === null || partNumberB === null) {
    // If extraction fails, use default string comparison
    return a.localeCompare(b);
  }

  const fileNameA = a.replace(/_part_\d\.mp4/, "");
  const fileNameB = b.replace(/_part_\d\.mp4/, "");

  // Compare by partNumber and fileName
  if (partNumberA < partNumberB && fileNameA === fileNameB) return -1;
  if (partNumberA > partNumberB && fileNameA === fileNameB) return 1;

  return 0; // Equal
}

/**
 * Lists all Status Videos from a directory.
 * Status Videos are the videos that has segments of 30s.
 *
 * If a file is has less than 30s. It also is returned.
 * No segmantation was needed.
 *
 * @param {string} directoryPath - The directory where the status videos are.
 * @param {function} readdirSync - The callback to read the directory. default is the readdirSync from "node:fs". Also used to mock unit tests.
 * @return {string[]} - Status Videos.
 *
 * @example
 * <caption>Listing status videos from a directory</caption>
 * listStatusVideos("./videos/")
 * ['./videos/video1.mp4', './videos/video2.mp4', './videos/video3.mp4']
 *
 * @example
 * <caption>Listing status videos from a directory with segments.</caption>
 * listStatusVideos("./videos/")
 * ['./videos/video1.mp4', './videos/video2_part_0.mp4', './videos/video2_part_1.mp4']
 *
 * @example
 * <caption>Listing status videos from a wrong directory.</caption>
 * listStatusVideos("/path/to/unexistent/directory")
 * []
 */
function listStatusVideos(directory, readdirSync = fsReadDirSync) {
  try {
    const files = readdirSync(directory);
    let segmentedFiles = [];

    const originalFiles = {}; // Object to store original file names

    files.forEach(file => {
      const fileName = parse(file).name;
      const fileParts = fileName.split('_part_');

      // Check if the file is segmented
      if (fileParts.length > 1) {
        // Extract the base name and add segments to the list
        const baseName = fileParts[0] + extname(file);
        if (!originalFiles[baseName]) {
          originalFiles[baseName] = true; // Store the original file name
          segmentedFiles.push(baseName);
        }
        segmentedFiles.push(file);
      } else {
        // If the file is not segmented, add it directly to the list
        segmentedFiles.push(file);
      }
    });

    return segmentedFiles
      .filter(file => !originalFiles[file] && !file.includes("_compressed"))
      .map(file => directory + file)
      .sort(naturalSort);
  } catch (_e) {
    return [];
  }
}

export default listStatusVideos;
