var earningsChart;
var showLines = true;
var setKey = false;

const PROXY_ADDRESS = "https://api.machandler.com/eps";
const LIMIT_RESPONSE = "Thank you for using Alpha Vantage! Our standard API rate limit is 25 requests per day. Please subscribe to any of the premium plans at https://www.alphavantage.co/premium/ to instantly remove all daily rate limits.";
const LIMIT_ALERT = "The 25 request per day limit has been exceeded. Either try again tomorrow or enter your own AlphaVantage API key at the bottom of the page to continue. Learn more about usage limits in the README found in the source code.";


var apiKey;
if (document.cookie && document.cookie !== "") {
    setKey = true;
    apiKey = document.cookie;
}

var originalDatasets = [];

async function fetchEarnings() {
    var ticker = document.getElementById("ticker").value;

    // if already have personal API key
    if (setKey) {
        var url = `https://www.alphavantage.co/query?function=EARNINGS&symbol=${ticker}&apikey=${apiKey}`;
    }
    // if want to use default API key, goes through proxy server
    else
    {
        var url = `${PROXY_ADDRESS}?function=EARNINGS&symbol=${ticker}`;
    }
    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`HTTP Response invalid. Status ${res.status}`);
        }
        var data = await res.json();

        // handle API overload
        if (data["Information"] === LIMIT_RESPONSE) {
            throw new Error(LIMIT_ALERT);
        }

        var earningsData = data.quarterlyEarnings;

        var endingDates = [];
        var reportDates = [];
        var actualEarnings = [];
        var earningsEstimates = [];
        var surprises = [];
        var surprisePercents = [];

        for (var i = 0; i < earningsData.length; i++) {
            endingDates.push(earningsData[i].fiscalDateEnding);
            reportDates.push(earningsData[i].reportedDate);
            actualEarnings.push(parseFloat(earningsData[i].reportedEPS));
            earningsEstimates.push(parseFloat(earningsData[i].estimatedEPS));
            surprises.push(parseFloat(earningsData[i].surprise));
            surprisePercents.push(parseFloat(earningsData[i].surprisePercentage));
        }

        renderChart(endingDates, actualEarnings, earningsEstimates);
        renderTable(endingDates, reportDates, actualEarnings, earningsEstimates, surprises, surprisePercents);


        // Show the "Toggle Lines" button after fetching earnings data
        document.getElementById("toggleButtonContainer").style.display = "block";

        // Show the table after fetching earnings data
        document.getElementById("earningsTable").style.display = "table";
    } catch (error) {
        alert(`Error: ${error}`);
    }
}

function renderChart(dates, actualEarnings, earningsEstimates) {
    var ctx = document.getElementById("earningsChart").getContext("2d");

    if (earningsChart) {
        earningsChart.destroy();
    }

    earningsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Actual Earnings',
                data: actualEarnings,
                borderColor: 'blue',
                fill: false,
                pointStyle: 'circle',
                pointBackgroundColor: 'blue',
                originalOptions: {
                    borderColor: 'blue',
                    pointBackgroundColor: 'blue'
                }
            }, {
                label: 'Earnings Estimates',
                data: earningsEstimates,
                borderColor: 'green',
                fill: false,
                pointStyle: 'circle',
                pointBackgroundColor: 'green',
                originalOptions: {
                    borderColor: 'green',
                    pointBackgroundColor: 'green'
                }
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Quarter End Date'
                    },
                    reverse: true
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Earnings (in Dollars)'
                    }
                }
            },
            elements: {
                line: {
                    tension: 0,
                    borderWidth: showLines ? 2 : 0
                },
                point: {
                    radius: 4,
                    hitRadius: 10,
                    hoverRadius: 5
                }
            },
            plugins: {
                legend: {
                    labels: {
                        generateLabels: function(chart) {
                            var labels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                            labels.forEach(function(label) {
                                var dataset = chart.data.datasets[label.datasetIndex];
                                if (label.datasetIndex === 0) {
                                    label.fillStyle = dataset.borderColor;
                                } else if (label.datasetIndex === 1) {
                                    label.fillStyle = dataset.borderColor;
                                }
                            });
                            return labels;
                        }
                    }
                }
            }
        }
    });

    originalDatasets = earningsChart.data.datasets.map(dataset => ({
        borderColor: dataset.borderColor,
        pointStyle: dataset.pointStyle,
        pointBackgroundColor: dataset.pointBackgroundColor
    }));
}

const dollarFormat = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',  
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2, 
});

function renderTable(endingDates, reportDates, actualEarnings, earningsEstimates, surprises, surprisePercents) {
    var tableBody = document.getElementById("earningsTable").getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';

    for (var i = 0; i < endingDates.length; i++) {
        var row = tableBody.insertRow(i);
        var endingDateCell = row.insertCell(0);
        var reportDateCell = row.insertCell(1);
        var actualEarningsCell = row.insertCell(2);
        var earningsEstimatesCell = row.insertCell(3);
        var surpriseCell = row.insertCell(4);
        var surprisePercentsCell = row.insertCell(5);

        endingDateCell.innerHTML = endingDates[i];
        reportDateCell.innerHTML = reportDates[i];
        actualEarningsCell.innerHTML = dollarFormat.format(actualEarnings[i]);
        earningsEstimatesCell.innerHTML = dollarFormat.format(earningsEstimates[i]);

        surpriseCell.innerHTML = ((surprises[i] > 0) ? '+' : '') + dollarFormat.format(surprises[i]);
        surprisePercentsCell.innerHTML = ((surprisePercents[i] > 0) ? '+' : '') + surprisePercents[i].toFixed(0) + '%';
    }
}

function toggleLines() {
    showLines = !showLines;

    earningsChart.data.datasets.forEach((dataset, index) => {
        dataset.borderWidth = showLines ? 2 : 0;
        // dataset.radius += showLines ? -5 : 5;
        // dataset.hitRadius += showLines ? -1 : 1;
        // dataset.hoverRadius += showLines ? -1 : 1;
    });

    earningsChart.update();
}

function saveKey() {
    apiKey = document.getElementById("customKey").value;
    setKey = true
    document.cookie = apiKey;  
}

