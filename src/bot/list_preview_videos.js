import { readdirSync } from 'fs';

function listPreviewVideos(directoryPath) {
  try {
    const files = readdirSync(directoryPath);

    const compressed_files =
      files
        .filter(file => file.includes("compressed"))
        .map(file => directoryPath + file);

    return compressed_files;
  } catch (error) {
    console.error('Error reading files from directory:', error);
    return [];
  }
}

export default listPreviewVideos;
