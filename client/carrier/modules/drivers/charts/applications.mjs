const buildChart = (ctx, chart, data, labels, colors, type = 'doughnut') => {
    if (chart) {
        chart.data.labels = labels
        chart.data.datasets[0].data = data
        chart.data.datasets[0].backgroundColor = colors
        chart.update()
    } else
        chart = new Chart(ctx, {
            type,
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors,
                    borderWidth: 1,
                }],
            },
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
                                    hidden: isNaN(dataset.data[i]) || dataset.data[i] === null,
                                    index: i,
                                }))
                            },
                        },
                    },
                },
            },
        })

    return chart
}


$(() => {
    const canvasId = {
        applications: {
            statuses: '#application-statuses-doughnut-chart',
        },
    }
    const options = {
        applications: {
            statuses: {
                canvasId: '#application-statuses-doughnut-chart',
                labels: { p: 'Pending', c: 'In Review', a: 'Approved', r: 'Waiting List', b: 'Disqualified', h: 'Hired'},
                colors: { p: 'grey', c: 'blue', a: 'green', r: 'orange', b: 'red', h: 'black'},
                ctx: $(canvasId.applications.statuses).length ? $(canvasId.applications.statuses)[0].getContext('2d') : null,
                chart: null,
            },
        },
    }

    const fetchDraw = () => {
        $.post('/api/drivers/charts', null, response => {
            const { applications } = response

            if (options.applications.statuses.ctx) { /* Application Statuses */
                const { statuses } = applications
                const data = [], labels = [], colors = []

                for (const prop in options.applications.statuses.labels) {
                    data.push(statuses[prop] || 0)
                    labels.push(options.applications.statuses.labels[prop])
                    colors.push(options.applications.statuses.colors[prop])
                }
                options.applications.statuses.chart = buildChart(
                    options.applications.statuses.ctx,
                    options.applications.statuses.chart,
                    data, labels, colors
                )
            }
        })
    }

    fetchDraw()
    setInterval(fetchDraw, 30000)
})