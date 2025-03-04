import { createReadStream } from 'node:fs';
import readline from 'readline';
import { spawn } from 'child_process';

const filePath = '/home/charliecharlie/Downloads/links.txt';
const fileStream = createReadStream(filePath);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

async function processLines() {
  for await (const line of rl) {
    await processLine(line.trim());
    await delay(100);
  }
  console.log('File reading completed.');
}
function processLine(line) {
  return new Promise((resolve, _reject) => {
    console.log('Processing line:', line);
    const openLink = spawn('firefox', ['--new-tab', line]);
    openLink.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    openLink.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
    openLink.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });
    setTimeout(() => {
      console.log('Processed line:', line);
      resolve();
    }, 200);
  });
}
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
processLines().catch((error) => {
  console.error('Error processing file:', error);
});
