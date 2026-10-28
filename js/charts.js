/**
 * Smart Waste Segregation Assistant - Interactive Chart.js Visualizations
 * Renders real verified data from the World Bank, UN E-Waste Monitor, and EPA.
 * Styled in the "Deep Earth" twilight theme.
 */

let compositionChartInstance = null;
let ewasteChartInstance = null;
let energySavingsChartInstance = null;
let ghgChartInstance = null;

// Global Chart.js Defaults for Twilight / Deep Earth Aesthetic
function applyChartDefaults() {
  if (typeof Chart === 'undefined') return;

  Chart.defaults.color = '#9BA098';
  Chart.defaults.font.family = "'Quicksand', 'Nunito', sans-serif";
  Chart.defaults.font.weight = '600';
  Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.08)';
  Chart.defaults.plugins.tooltip.backgroundColor = '#1E211E';
  Chart.defaults.plugins.tooltip.titleColor = '#E2E1D8';
  Chart.defaults.plugins.tooltip.bodyColor = '#9BA098';
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.16)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
}

// 1. Global Municipal Waste Composition (World Bank)
function initCompositionChart() {
  const canvas = document.getElementById('chart-composition');
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');
  const data = REAL_WORLD_DATA.globalWasteComposition;

  if (compositionChartInstance) compositionChartInstance.destroy();

  compositionChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.labels,
      datasets: [{
        data: data.shares,
        backgroundColor: [
          '#4E6E4C', // Organics (Green)
          '#4A6B82', // Paper (Blue)
          '#3D5A73', // Plastics (Ocean Blue)
          '#5F8265', // Glass (Sage)
          '#A68B6D', // Metal (Bronze)
          '#7D6656', // Rubber (Taupe)
          '#8A6B52', // Wood
          '#8C4337'  // Hazardous / Other (Terracotta)
        ],
        borderColor: '#242724',
        borderWidth: 2,
        hoverOffset: 12
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '66%',
      animation: {
        animateScale: true,
        animateRotate: true,
        duration: 1200
      },
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            padding: 12,
            color: '#E2E1D8',
            font: { size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const val = context.raw || 0;
              return ` ${label}: ${val}% of global MSW`;
            }
          }
        }
      }
    }
  });
}

// 2. Global E-Waste Crisis Trajectory (UN Global E-Waste Monitor 2024)
function initEWasteChart() {
  const canvas = document.getElementById('chart-ewaste');
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');
  const data = REAL_WORLD_DATA.globalEWasteTrajectory;

  if (ewasteChartInstance) ewasteChartInstance.destroy();

  ewasteChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.years,
      datasets: [
        {
          label: 'Formally Recycled (Mt)',
          data: data.recycledMt,
          backgroundColor: '#4E6E4C',
          borderRadius: 6,
          stack: 'combined'
        },
        {
          label: 'Unmanaged / Landfilled (Mt)',
          data: data.unmanagedMt,
          backgroundColor: '#8C4337',
          borderRadius: 6,
          stack: 'combined'
        },
        {
          type: 'line',
          label: 'Total Generated (Mt)',
          data: data.generatedMt,
          borderColor: '#CADBE8',
          borderWidth: 2.5,
          pointBackgroundColor: '#CADBE8',
          pointBorderColor: '#1E211E',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1400
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#9BA098' }
        },
        y: {
          title: {
            display: true,
            text: 'Million Metric Tonnes (Mt)',
            color: '#9BA098',
            font: { size: 11 }
          },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9BA098' }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            padding: 14,
            color: '#E2E1D8'
          }
        },
        tooltip: {
          callbacks: {
            afterBody: function(items) {
              const yearIndex = items[0].dataIndex;
              const gen = data.generatedMt[yearIndex];
              const rec = data.recycledMt[yearIndex];
              const rate = ((rec / gen) * 100).toFixed(1);
              return `Documented Recycling Rate: ${rate}%`;
            }
          }
        }
      }
    }
  });
}

// 3. Primary Energy Savings by Material (EPA)
function initEnergySavingsChart() {
  const canvas = document.getElementById('chart-energy');
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');
  const data = REAL_WORLD_DATA.recyclingEnergySavings;

  if (energySavingsChartInstance) energySavingsChartInstance.destroy();

  energySavingsChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.materials,
      datasets: [{
        label: '% Energy Conserved vs Virgin Raw Extraction',
        data: data.energySavedPercent,
        backgroundColor: [
          '#5F8E60', // Aluminum (Highest)
          '#4A6B82', // Plastics
          '#7D6656', // Copper / E-Waste
          '#6A7B8C', // Steel
          '#8C997F', // Paper
          '#5C7865'  // Glass
        ],
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)'
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1200
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          ticks: {
            callback: value => `${value}%`,
            color: '#9BA098'
          },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#E2E1D8', font: { weight: '600' } }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => ` ${context.raw}% energy saved vs virgin material`,
            afterLabel: context => ` ${data.description[context.dataIndex]}`
          }
        }
      }
    }
  });
}

// 4. GHG Abatement (MTCO2e avoided per ton recycled)
function initGHGChart() {
  const canvas = document.getElementById('chart-ghg');
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');
  const data = REAL_WORLD_DATA.recyclingEnergySavings;

  if (ghgChartInstance) ghgChartInstance.destroy();

  ghgChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.materials,
      datasets: [{
        label: 'Metric Tons CO2 Equivalent Avoided / Ton Recycled',
        data: data.ghgAvoidedPerTonMTCO2e,
        backgroundColor: '#4E6E4C',
        hoverBackgroundColor: '#639260',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1200 },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#9BA098', maxRotation: 30 }
        },
        y: {
          title: {
            display: true,
            text: 'MTCO2e / Ton Recycled',
            color: '#9BA098'
          },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9BA098' }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => ` ${context.raw} MTCO2e avoided per ton`
          }
        }
      }
    }
  });
}

// Initialize all charts when the analytics tab or page loads
function initializeAllCharts() {
  applyChartDefaults();
  initCompositionChart();
  initEWasteChart();
  initEnergySavingsChart();
  initGHGChart();
}
