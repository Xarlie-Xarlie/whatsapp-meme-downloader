import fs from 'node:fs';

/**
 * Lists all preview videos from a directory.
 * A preview video is a video that has "\_compressed" in it's name.
 *
 * @param {string} directoryPath - The directory where the preview files are.
 * @returns {string[]} An string array with the path of the compressed files.
 *
 * @example
 * <caption>Listing compressed files from a folder.</caption>
 * listPreviewVideos("./videos/");
 * ["./videos/video1_compressed.mp4", "./videos/video2_compressed.mp4"]
 *
 * @example
 * <caption>Listing a folder that doesn't have any compressed files.</caption>
 * listPreviewVideos("./not_compressed/");
 * []
 *
 * @example
 * <caption>Listing unexistent path/directory.</caption>
 * listPreviewVideos("/path/to/unexistent/directory/");
 * []
 */
function listPreviewVideos(directoryPath) {
  try {
    const files = fs.readdirSync(directoryPath);

    return files
      .filter(file => file.includes("compressed"))
      .map(file => directoryPath + file);
  } catch (_error) {
    return [];
  }
}

export default listPreviewVideos;
