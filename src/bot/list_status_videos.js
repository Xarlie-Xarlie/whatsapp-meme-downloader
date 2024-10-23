import fs from 'node:fs';
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
  const extractPartNumber = (str) => {
    const matchA = str.match(/_part_(\d+)/);
    if (!matchA) return null;

    return parseInt(matchA[1]);
  };

  const partNumberA = extractPartNumber(a);
  const partNumberB = extractPartNumber(b);

  const fileNameA = a.replace(/_part_\d\.mp4/, '');
  const fileNameB = b.replace(/_part_\d\.mp4/, '');

  if (partNumberA < partNumberB && fileNameA === fileNameB) return -1;
  if (partNumberA > partNumberB && fileNameA === fileNameB) return 1;

  return 0;
}

/**
 * Lists all Status Videos from a directory.
 * Status Videos are the videos that has segments of 30s.
 *
 * If a file is has less than 30s. It also is returned.
 * No segmantation was needed.
 *
 * @param {string} directoryPath - The directory where the status videos are.
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
function listStatusVideos(directory) {
  try {
    const files = fs.readdirSync(directory);
    let segmentedFiles = [];

    const originalFiles = {};

    files.forEach((file) => {
      const fileName = parse(file).name;
      const fileParts = fileName.split('_part_');

      if (fileParts.length > 1) {
        const baseName = fileParts[0] + extname(file);
        if (!originalFiles[baseName]) {
          originalFiles[baseName] = true;
          segmentedFiles.push(baseName);
        }
        segmentedFiles.push(file);
      } else {
        segmentedFiles.push(file);
      }
    });

    return segmentedFiles
      .filter((file) => !originalFiles[file] && !file.includes('_compressed'))
      .map((file) => directory + file)
      .sort(naturalSort);
  } catch (_e) {
    return [];
  }
}

export default listStatusVideos;
