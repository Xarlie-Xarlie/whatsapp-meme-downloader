const fs = require('fs');
const path = require('path');

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
};

// Function to list all files in a directory recursively
function listFiles(directory) {
  const files = fs.readdirSync(directory);
  let fileList = [];
  files.forEach(file => {
    const filePath = path.join(directory, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      fileList = fileList.concat(listFiles(filePath));
    } else {
      fileList.push(filePath);
    }
  });
  return fileList.sort(naturalSort);
}

module.exports = { listFiles };
