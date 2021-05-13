export default class Chart {
    constructor(targetDiv) {
        this.chart = JSC.chart(targetDiv, {
            yAxis_formatString: 'n',
            xAxis_overflow: 'hidden',
            margin_right: 20,
            toolbar: {
                margin: 5                
            },
            xAxis: { scale_type: 'time' },
            series: [
                {
                    name: 'USD',
                    points: []
                },
                {
                    name: 'GBP',
                    points: []
                },
                {
                    name: 'EUR',
                    points: []
                }
            ]
        });
    }

    getChart = () => {
        return this.chart;
    }
}