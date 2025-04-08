// Sample data - In a real application, this would come from your backend
const medicines = [
    {
        name: "Paracetamol",
        batch_no: "B123",
        temperature: 25,
        humidity: 50,
        quality_status: "Good"
    },
    {
        name: "Ibuprofen",
        batch_no: "B456",
        temperature: 32,
        humidity: 75,
        quality_status: "Poor"
    }
];

// Initialize charts
let temperatureChart, humidityChart, supplyChainChart;

// Enhanced chart configurations
const chartConfig = {
    type: 'line',
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 2000,
            easing: 'easeInOutQuart'
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.8)'
                }
            },
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: 'rgba(255, 255, 255, 0.8)'
                }
            }
        },
        plugins: {
            legend: {
                labels: {
                    color: 'rgba(255, 255, 255, 0.8)'
                }
            }
        }
    }
};

// Initialize the monitoring system
function initializeMonitoring() {
    // Temperature Chart
    const tempCtx = document.getElementById('temperatureChart').getContext('2d');
    const tempGradient = tempCtx.createLinearGradient(0, 0, 0, 200);
    tempGradient.addColorStop(0, 'rgba(255, 99, 132, 0.5)');
    tempGradient.addColorStop(1, 'rgba(255, 99, 132, 0)');

    temperatureChart = new Chart(tempCtx, {
        ...chartConfig,
        data: {
            labels: [],
            datasets: [{
                label: 'Temperature (°C)',
                data: [],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: tempGradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        }
    });

    // Humidity Chart
    const humidityCtx = document.getElementById('humidityChart').getContext('2d');
    const humidityGradient = humidityCtx.createLinearGradient(0, 0, 0, 200);
    humidityGradient.addColorStop(0, 'rgba(54, 162, 235, 0.5)');
    humidityGradient.addColorStop(1, 'rgba(54, 162, 235, 0)');

    humidityChart = new Chart(humidityCtx, {
        ...chartConfig,
        data: {
            labels: [],
            datasets: [{
                label: 'Humidity (%)',
                data: [],
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: humidityGradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        }
    });

    // Supply Chain Chart
    const supplyCtx = document.getElementById('supplyChainChart').getContext('2d');
    supplyChainChart = new Chart(supplyCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Supply Chain Movement',
                data: [65, 59, 80, 81, 56, 55],
                backgroundColor: 'rgba(75, 192, 192, 0.4)',
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 2,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    }
                }
            }
        }
    });

    updateInventoryList();
    startMonitoring();
    initializeBackgroundEffects();
}

// Update inventory list with animation
function updateInventoryList() {
    const inventoryList = document.getElementById('inventoryList');
    inventoryList.innerHTML = medicines.map(medicine => `
        <div class="inventory-item">
            <h6>${medicine.name}</h6>
            <p class="mb-1">Batch: ${medicine.batch_no}</p>
            <span class="status-badge status-${medicine.quality_status.toLowerCase()}">
                ${medicine.quality_status}
            </span>
        </div>
    `).join('');
}

// Check medicine quality
function checkQuality(medicine) {
    if (medicine.temperature > 30 || medicine.humidity > 70) {
        medicine.quality_status = "Poor";
    } else if (medicine.temperature < 15 || medicine.humidity < 20) {
        medicine.quality_status = "Critical";
    } else {
        medicine.quality_status = "Good";
    }
    return medicine.quality_status;
}

// Enhanced alert display with animation
function displayAlert(medicine) {
    const alertsContainer = document.getElementById('monitoringAlerts');
    const alert = document.createElement('div');
    alert.className = `alert alert-${medicine.quality_status.toLowerCase()}`;
    alert.style.opacity = '0';
    alert.style.transform = 'translateX(-20px)';
    alert.textContent = `ALERT: ${medicine.name} (Batch ${medicine.batch_no}) is in ${medicine.quality_status} condition!`;
    
    alertsContainer.insertBefore(alert, alertsContainer.firstChild);
    
    // Trigger animation
    setTimeout(() => {
        alert.style.opacity = '1';
        alert.style.transform = 'translateX(0)';
    }, 50);

    if (alertsContainer.children.length > 5) {
        const lastAlert = alertsContainer.lastChild;
        lastAlert.style.opacity = '0';
        lastAlert.style.transform = 'translateX(20px)';
        setTimeout(() => {
            alertsContainer.removeChild(lastAlert);
        }, 300);
    }
}

// Update charts with new data
function updateCharts(medicine) {
    const timestamp = new Date().toLocaleTimeString();
    
    // Update temperature chart
    temperatureChart.data.labels.push(timestamp);
    temperatureChart.data.datasets[0].data.push(medicine.temperature);
    if (temperatureChart.data.labels.length > 10) {
        temperatureChart.data.labels.shift();
        temperatureChart.data.datasets[0].data.shift();
    }
    temperatureChart.update();

    // Update humidity chart
    humidityChart.data.labels.push(timestamp);
    humidityChart.data.datasets[0].data.push(medicine.humidity);
    if (humidityChart.data.labels.length > 10) {
        humidityChart.data.labels.shift();
        humidityChart.data.datasets[0].data.shift();
    }
    humidityChart.update();
}

// Start monitoring cycle
function startMonitoring() {
    setInterval(() => {
        medicines.forEach(medicine => {
            // Simulate random changes in temperature and humidity
            medicine.temperature = Math.random() * (40 - 10) + 10;
            medicine.humidity = Math.random() * (80 - 10) + 10;
            
            const status = checkQuality(medicine);
            if (status !== "Good") {
                displayAlert(medicine);
            }
            updateCharts(medicine);
        });
        updateInventoryList();
    }, 5000); // Update every 5 seconds
}

// Background effects
function initializeBackgroundEffects() {
    const lightning = document.querySelector('.lightning');
    
    function triggerLightning() {
        lightning.style.opacity = '0.1';
        setTimeout(() => {
            lightning.style.opacity = '0';
        }, 50);
        setTimeout(() => {
            lightning.style.opacity = '0.1';
        }, 100);
        setTimeout(() => {
            lightning.style.opacity = '0';
        }, 150);
    }

    setInterval(triggerLightning, Math.random() * 10000 + 5000);
}

// Initialize the system when the page loads
document.addEventListener('DOMContentLoaded', initializeMonitoring); 