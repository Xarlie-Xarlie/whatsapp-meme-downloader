import { exec } from 'child_process';
import { existsSync } from 'fs';
import { parse, dirname } from 'path';

async function compressVideo(inputPath, outputPath, durationInSeconds = 3) {
  const command = `ffmpeg -i ${inputPath} -t ${durationInSeconds} -vf "scale=640:-1" -c:v libx264 -preset fast -crf 23 -c:a aac ${outputPath}`;

  return new Promise((resolve, reject) => {
    exec(command, (error, _stdout, stderr) => {
      if (error) {
        console.error(`Error compressing video: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`ffmpeg stderr: ${stderr}`);
      }
      console.log(`Compressed video saved to ${outputPath}`);
      resolve(outputPath);
    });
  });
}

async function createPreviewVideoAtPath({ filePath }) {
  try {
    const fileName = parse(filePath).name;
    const outputPath = `${dirname(filePath)}/${fileName}_compressed.mp4`;

    // Check if the output compressed video file already exists
    if (existsSync(outputPath)) {
      console.log(`Compressed video already exists: ${outputPath}. Skipping compression.`);
      return outputPath;
    }

    await compressVideo(filePath, outputPath);
    return outputPath;
  } catch (error) {
    console.error('Error compressing video:', error);
    return null;
  }
}

export default createPreviewVideoAtPath;
