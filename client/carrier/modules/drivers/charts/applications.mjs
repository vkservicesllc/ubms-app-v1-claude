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
    const id = {
        conditions: '#application-conditions-doughnut-chart',
    }
    const canvasId = {
        applications: {
            conditions: id.conditions,
        },
    }
    const options = {
        applications: {
            conditions: {
                canvasId: id.conditions,
                labels: { p: 'Pending', c: 'In Review', a: 'Approved', r: 'Waiting List', b: 'Disqualified', h: 'Hired'},
                colors: { p: 'grey', c: 'blue', a: 'green', r: 'orange', b: 'red', h: 'black'},
                ctx: $(canvasId.applications.conditions).length ? $(canvasId.applications.conditions)[0].getContext('2d') : null,
                chart: null,
            },
        },
    }

    const fetchDraw = () => {
        $.post('/api/charts/drivers/applications', null, response => {
            const { applications } = response

            if (options.applications.conditions.ctx) { /* Application Conditions */
                const { conditions } = applications
                const data = [], labels = [], colors = []

                for (const prop in options.applications.conditions.labels) {
                    data.push(conditions[prop] || 0)
                    labels.push(options.applications.conditions.labels[prop])
                    colors.push(options.applications.conditions.colors[prop])
                }
                options.applications.conditions.chart = buildChart(
                    options.applications.conditions.ctx,
                    options.applications.conditions.chart,
                    data, labels, colors
                )
            }
        })
    }

    fetchDraw()
    setInterval(fetchDraw, 30000)
})