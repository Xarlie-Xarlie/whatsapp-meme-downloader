import child_process from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Get a duration of a video using ffmpeg.
 *
 * @param {string} inputPath - File path of a video.
 * @returns {Promise<float>} Video Duration
 *
 * @example
 * <caption>Get video duration of a file</caption>
 * await getVideoDuration("/path/to/video.mp4");
 * 30.0
 */
async function getVideoDuration(inputPath) {
  return new Promise((resolve, reject) => {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${inputPath}`;

    child_process.exec(command, (error, stdout, stderr) => {
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

/**
 * Segment video at a file path.
 *
 * @param {string} inputPath - File Path.
 * @param {string} outputPath - File destination Path.
 * @param {string} fileName - Name of the file to build the part files.
 * @returns {Promise<string[] | undefined>}
 */
async function segmentVideoIfNeeded(inputPath, outputPath, fileName) {
  try {
    const duration = await getVideoDuration(inputPath);

    if (duration <= 30) {
      console.log(
        `Video ${fileName} is less than or equal to 30 seconds. Skipping segmentation.`
      );
      return;
    }

    const numSegments = Math.ceil(duration / 30);

    const filesSemented = [];
    for (let i = 0; i < numSegments; i++) {
      const segmentFileName = `${fileName}_part_${i}.mp4`;
      const segmentOutputPath = path.join(outputPath, segmentFileName);

      if (fs.existsSync(segmentOutputPath)) {
        console.log(`Segment ${segmentFileName} already exists. Skipping.`);
        continue;
      }

      const startTime = i * 30;
      const endTime = Math.min((i + 1) * 30, duration);

      const command = `ffmpeg -ss ${startTime} -i ${inputPath} -t ${endTime - startTime} -c copy ${segmentOutputPath}`;

      await new Promise((resolve, reject) => {
        child_process.exec(command, (error, _stdout, stderr) => {
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
      filesSemented.push(segmentOutputPath);
    }
    return filesSemented;
  } catch (error) {
    console.error('Error segmenting video:', error);
  }
}

/**
 * Segment a video into parts of 30 seconds.
 *
 * A video with 75 seconds of duration,
 * it will be segmented into 3 videos.
 *
 * A video with less than or equals to 30 seconds,
 * it just skips the segmentation.
 *
 * Also if the file that should be segmented already
 * exists, it will skip segmentation as well.
 *
 * @param {string} filePath - filePath of a video file inside an Object.
 * @returns {Promise<string[] | undefined>}
 *
 * @example
 * <caption>Video with 75 seconds duration.</caption>
 * await segmentVideoAtPath("/path/to/video.mp4");
 * ["video_part_0.mp4", "video_part_1.mp4", "video_part_2.mp4"]
 *
 * @example
 * <caption>Video with 30 seconds duration.</caption>
 * await segmentVideoAtPath("/path/to/my_video.mp4");
 * "Video my_video is less than or equal to 30 seconds. Skipping segmentation."
 *
 * @example
 * <caption>Video is already segmented or already exists.</caption>
 * await segmentVideoAtPath("/path/to/video.mp4");
 * "Segment video_part_0.mp4 already exists. Skipping."
 * "Segment video_part_1.mp4 already exists. Skipping."
 */
async function segmentVideoAtPath({ filePath }) {
  try {
    const outputPath = path.dirname(filePath);
    const fileName = path.parse(filePath).name;
    return segmentVideoIfNeeded(filePath, outputPath, fileName);
  } catch (error) {
    console.error('Error segmenting video:', error);
  }
}

export default segmentVideoAtPath;
