/**
 * Stele Level Distribution Analysis - Modular JS
 * This script is loaded only when the Stele calculator is shown.
 * All DOM queries are scoped to #steleCalculator.
 */

let steleChart = null;

const STELE_REQUIREMENTS = {
  5: 1000,
  8: 2000,
  10: 3000,
  12: 4000,
  15: 6000
};

const TOKEN_OUTCOMES = [
  { energy: 0, probability: 0.537 }, // 53.7% chance for 0 energy
  { energy: 15, probability: 0.331 },
  { energy: 30, probability: 0.075 },
  { energy: 50, probability: 0.057 }
];

function simulateToken() {
  const rand = Math.random();
  let cumulative = 0;
  for (const outcome of TOKEN_OUTCOMES) {
    cumulative += outcome.probability;
    if (rand <= cumulative) {
      return outcome.energy;
    }
  }
  return 0;
}

function simulateTokensForTarget(targetEnergy) {
  let totalEnergy = 0;
  let tokensUsed = 0;
  while (totalEnergy < targetEnergy) {
    totalEnergy += simulateToken();
    tokensUsed++;
    if (tokensUsed > 10000) break;
  }
  return tokensUsed;
}

function calculateStats(data) {
  const sorted = [...data].sort((a, b) => a - b);
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  return {
    mean: mean,
    stdDev: stdDev,
    median: sorted[Math.floor(sorted.length / 2)],
    min: sorted[0],
    max: sorted[sorted.length - 1]
  };
}

function createHistogram(data, binCount = 50) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binSize = (max - min) / binCount;
  const bins = Array(binCount).fill(0);
  const binLabels = [];
  for (let i = 0; i < binCount; i++) {
    binLabels.push(Math.round(min + i * binSize));
  }
  data.forEach(value => {
    const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
    bins[binIndex]++;
  });
  return { bins, binLabels, binSize };
}

function generateNormalCurve(mean, stdDev, binLabels) {
  const curve = [];
  for (const binLabel of binLabels) {
    const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
      Math.exp(-0.5 * Math.pow((binLabel - mean) / stdDev, 2));
    curve.push(y);
  }
  return curve;
}

function updateStatsDisplay(stats, root) {
  root.querySelector('#meanStat').textContent = Math.round(stats.mean);
  root.querySelector('#stdDevStat').textContent = Math.round(stats.stdDev);
  root.querySelector('#medianStat').textContent = stats.median;
  root.querySelector('#minStat').textContent = stats.min;
  root.querySelector('#maxStat').textContent = stats.max;
  root.querySelector('#statsGrid').style.display = 'grid';
}

function updateChart(histogramData, normalCurve, stats, steleLevel, root) {
  const ctx = root.querySelector('#distributionChart').getContext('2d');
  if (steleChart) {
    steleChart.destroy();
  }
  const maxBinValue = Math.max(...histogramData.bins);
  const maxNormalValue = Math.max(...normalCurve);
  const scaleFactor = maxBinValue / maxNormalValue * 0.8;
  steleChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: histogramData.binLabels,
      datasets: [{
        label: 'Simulation Results',
        data: histogramData.bins,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        type: 'bar'
      }, {
        label: 'Normal Distribution',
        data: normalCurve.map(y => y * scaleFactor),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        borderWidth: 3,
        fill: false,
        type: 'line',
        pointRadius: 0,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `Distribution of Tokens Needed for Stele ${steleLevel}`,
          font: {
            size: 18,
            weight: 'bold'
          }
        },
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Tokens Required',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        y: {
          title: {
            display: true,
            text: 'Frequency',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          beginAtZero: true
        }
      }
    }
  });
}

async function runSteleSimulation(root) {
  const simCount = 10000; // Always use 10,000 simulations
  // Use selected Stele from button row logic if available
  let selectedStele = 5;
  if (typeof root._getSelectedStele === "function") {
    selectedStele = root._getSelectedStele();
  } else {
    // fallback for legacy: try select
    const select = root.querySelector('#steleSelect');
    if (select) selectedStele = parseInt(select.value);
  }
  const targetEnergy = STELE_REQUIREMENTS[selectedStele];
  // Always show stat cards, but do not update values until calculation is done
  root.querySelector('#statsGrid').style.display = 'grid';
  await new Promise(resolve => setTimeout(resolve, 100));
  const tokensNeeded = [];
  for (let i = 0; i < simCount; i++) {
    tokensNeeded.push(simulateTokensForTarget(targetEnergy));
    if (i % 1000 === 0) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }
  const stats = calculateStats(tokensNeeded);
  const histogramData = createHistogram(tokensNeeded);
  const normalCurve = generateNormalCurve(
    stats.mean,
    stats.stdDev,
    histogramData.binLabels
  );
  updateStatsDisplay(stats, root);
  updateChart(histogramData, normalCurve, stats, selectedStele, root);
  // No loading/progress text
}

export function initSteleCalculator() {
  const root = document.getElementById('steleCalculator');
  if (!root) return;
  if (root.dataset.initialized) return;
  root.dataset.initialized = "true";

  // Stele level button logic
  const btnRow = root.querySelector('.stele-level-btn-row');
  let selectedStele = 5; // default

  function selectStele(level) {
    selectedStele = level;
    btnRow.querySelectorAll('.stele-level-btn').forEach(btn => {
      if (parseInt(btn.dataset.stele) === level) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
    runSteleSimulation(root);
  }

  btnRow.querySelectorAll('.stele-level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectStele(parseInt(btn.dataset.stele));
    });
  });

  // Patch runSteleSimulation to use selectedStele
  root._getSelectedStele = () => selectedStele;

  // Initial selection
  selectStele(selectedStele);
}
