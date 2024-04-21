import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

async function getVideoDuration(inputPath) {
  return new Promise((resolve, reject) => {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${inputPath}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error getting video duration: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`ffprobe stderr: ${stderr}`);
        reject(new Error(stderr));
        return;
      }
      const duration = parseFloat(stdout.trim());
      resolve(duration);
    });
  });
}

async function segmentVideoIfNeeded(inputPath, outputPath, fileName) {
  try {
    const duration = await getVideoDuration(inputPath);

    if (duration <= 30) {
      console.log(`Video ${fileName} is less than or equal to 30 seconds. Skipping segmentation.`);
      return;
    }

    const numSegments = Math.ceil(duration / 30); // Calculate the number of segments needed

    for (let i = 0; i < numSegments; i++) {
      const segmentFileName = `${fileName}_part_${i}.mp4`; // Output file name for the segment
      const segmentOutputPath = path.join(outputPath, segmentFileName);

      // Check if the output file already exists
      if (fs.existsSync(segmentOutputPath)) {
        console.log(`Segment ${segmentFileName} already exists. Skipping.`);
        continue;
      }

      const startTime = i * 30; // Start time for the segment
      const endTime = Math.min((i + 1) * 30, duration); // End time for the segment (not exceeding video duration)

      const command = `ffmpeg -ss ${startTime} -i ${inputPath} -t ${endTime - startTime} -c copy ${segmentOutputPath}`;

      await new Promise((resolve, reject) => {
        exec(command, (error, _stdout, stderr) => {
          if (error) {
            console.error(`Error segmenting video: ${error.message}`);
            reject(error);
            return;
          }
          if (stderr) {
            console.error(`ffmpeg stderr: ${stderr}`);
          }
          console.log(`Segmented ${fileName} into 30-second parts.`);
          resolve();
        });
      });
    }
  } catch (error) {
    console.error('Error segmenting video:', error);
  }
}

async function segmentVideoAtPath(filePath) {
  try {
    const outputPath = path.dirname(filePath);
    const fileName = path.parse(filePath).name;
    await segmentVideoIfNeeded(filePath, outputPath, fileName);
  } catch (error) {
    console.error('Error segmenting video:', error);
  }
}

export default segmentVideoAtPath;
