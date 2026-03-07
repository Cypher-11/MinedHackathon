exports.info = (message) => {
  const time = new Date().toISOString();
  console.log(`[INFO] ${time} - ${message}`);
};

exports.error = (message) => {
  const time = new Date().toISOString();
  console.error(`[ERROR] ${time} - ${message}`);
};