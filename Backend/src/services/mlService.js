const { Client } = require("@gradio/client");

let hfClient;

async function initModel() {

  hfClient = await Client.connect("suplex-city/solar-predict");

  console.log("ML Model Connected");
}

async function predict(features) {

  const result = await hfClient.predict("/predict", features);

  const label = String(result.data[0]).toLowerCase();
  const score = parseFloat(result.data[1]);

  return {
    label,
    score,
    raw: result
  };
}

module.exports = {
  initModel,
  predict
};