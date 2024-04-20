const { PythonShell } = require('python-shell');

function handleMessage(payload) {
  // Extract script file and arguments from the payload
  const { scriptFile, link } = payload;

  // Options to pass to the PythonShell constructor
  const options = {
    args: [link], // Pass arguments to the Python script
  };

  // Execute the Python script
  PythonShell.run(scriptFile, options, function(err, results) {
    if (err) {
      console.error('Error executing Python script:', err);
    } else {
      console.log('Python script executed successfully.');
      console.log('Python script output:', results);
    }
  });
}

module.exports = { handleMessage };
