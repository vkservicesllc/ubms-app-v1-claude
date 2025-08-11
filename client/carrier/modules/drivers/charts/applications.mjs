$(() => {
    const data = [5, 2, 7, 0, 3, 0]
    const chartData = {
        applications: {
            labels: ['Pending', 'In review', 'Approved', 'Waiting List', 'Disqualified', 'Hired'],
            datasets: [
                {
                    data,
                    backgroundColor: ['grey', 'blue', 'green', 'orange', 'red', 'black'],
                    borderWidth: 1,
                },
            ],
        },
    }

    const ctx = {
        applications: $('#application-doughnut-chart')[0].getContext('2d'),
    }

    const chart = {
        applications: new Chart(ctx.applications, {
            type: 'doughnut',
            data: chartData.applications,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            generateLabels(chart) {
                                const dataset = chart.data.datasets[0]

                                return chart.data.labels.map((label, i) => ({
                                    text: `${label} (${dataset.data[i]})`,
                                    fillStyle: dataset.backgroundColor[i],
                                    hidden: isNaN(dataset.data[i]) || dataset.data === null,
                                    index: i,
                                }))
                            },
                        },
                    },
                },
            },
        }),
    }
})