// script.js
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');

let saleModel, growthModel;
let saleInputMin, saleInputMax;
let growthInputMin, growthInputMax, growthOutputMin, growthOutputMax;

// 정규화된 데이터를 Tensor로 변환하는 함수
function arrayToTensor(array) {
  return tf.tensor(array);
}

// 데이터 정규화를 위한 함수
function normalizeTensor(tensor, min, max) {
  return tensor.sub(min).div(max.sub(min));
}

// 데이터 역정규화를 위한 함수
function denormalizeTensor(tensor, min, max) {
  return tensor.mul(max.sub(min)).add(min);
}

// 모델 및 정규화 데이터 로드 함수
async function loadModelsAndData() {
  try {
    // 모델 로드
    saleModel = await tf.loadLayersModel('file://models/sale-model/model.json');
    growthModel = await tf.loadLayersModel('file://models/growth-model/model.json');

    // 정규화 데이터 로드
    const normalizationDataRaw = fs.readFileSync('models/normalizationData.json', 'utf8');
    const normalizationData = JSON.parse(normalizationDataRaw);

    saleInputMin = arrayToTensor(normalizationData.saleInputMin);
    saleInputMax = arrayToTensor(normalizationData.saleInputMax);

    growthInputMin = arrayToTensor(normalizationData.growthInputMin);
    growthInputMax = arrayToTensor(normalizationData.growthInputMax);
    growthOutputMin = tf.scalar(normalizationData.growthOutputMin);
    growthOutputMax = tf.scalar(normalizationData.growthOutputMax);

    console.log('모델 및 정규화 데이터 로드 완료');
  } catch (error) {
    console.error('모델 또는 정규화 데이터 로드 중 오류 발생:', error);
  }
}

// 예측 함수
function predict(temperature, humidity, plantArea) {
  return new Promise((resolve, reject) => {
    if (isNaN(temperature) || isNaN(humidity) || isNaN(plantArea)) {
      reject('모든 입력 값을 올바르게 입력해주세요.');
      return;
    }

    // 판매 가능성 예측
    const saleInput = tf.tensor2d([[temperature, humidity, plantArea]]);
    const saleInputNormalized = normalizeTensor(saleInput, saleInputMin, saleInputMax);
    const salePrediction = saleModel.predict(saleInputNormalized);

    // 성장일 예측
    const growthInput = tf.tensor2d([[temperature, humidity, plantArea]]);
    const growthInputNormalized = normalizeTensor(growthInput, growthInputMin, growthInputMax);
    const growthPredictionNormalized = growthModel.predict(growthInputNormalized);

    // 예측 결과 처리
    Promise.all([
      salePrediction.array(),
      growthPredictionNormalized.array()
    ]).then(([saleArray, growthArray]) => {
      const saleProbability = saleArray[0][0];
      const predictedDaysNormalized = growthArray[0][0];
      const predictedDays = predictedDaysNormalized * (growthOutputMax.dataSync()[0] - growthOutputMin.dataSync()[0]) + growthOutputMin.dataSync()[0];

      resolve({
        saleProbability,
        predictedDays
      });
    }).catch(reject);
  });
}
module.exports = {
  loadModelsAndData,
  predict,
};