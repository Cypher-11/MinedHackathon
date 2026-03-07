const fs = require("fs");
const csv = require("csv-parser");

const inverterData = {};
const inverterPointers = {};

function loadCSVData() {

  return new Promise((resolve, reject) => {

    const file = "src/services/cleaned_dataset.csv";

    if (!fs.existsSync(file)) {
      return reject("CSV file missing");
    }

    fs.createReadStream(file)
      .pipe(csv())
      .on("data", (row) => {

        const id = row.inverter_id;

        if (!inverterData[id]) {
          inverterData[id] = [];
          inverterPointers[id] = 0;
        }

        inverterData[id].push(row);

      })
      .on("end", () => {

        console.log("CSV loaded successfully");
        resolve();

      })
      .on("error", reject);
  });
}

module.exports = {
  inverterData,
  inverterPointers,
  loadCSVData
};