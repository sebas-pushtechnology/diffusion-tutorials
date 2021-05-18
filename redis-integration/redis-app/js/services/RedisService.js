export default class RedisService {
    constructor() {
        // Lets create a Socket to interact with Redis
        this.redisWebSocket = new WebSocket("ws://127.0.0.1:3000/");
        this.chart = null;
        this.diffusionService = null;
    }

    setTargetChart = chart => this.chart = chart;

    setDiffusionService = diffusionService => this.diffusionService = diffusionService;

    /**
     * Add the websocket listener to listen for Redis Messages
     */
    startListeningRedisWebSocket = () => {
        this.redisWebSocket.onmessage = ({ data }) => {
            this.message = JSON.parse(data); // Parse the data from Redis
            console.log('Data received from Redis: ', this.message);
            this.updateChart(this.message); // Feed the Redis graph with it
            
            // Publish received data to Diffusion
            this.publishToDiffusion(this.message);
        }
    }

    /**
     * Updates chart with data from the external API
     * @param {*} data 
     */
    updateChart = (data, targetChart) => {
        // If no chart specified, use the default chart (redis chart)
        const destChart = targetChart || this.chart;

        // Feed values into the chart
        destChart.getChart().series(0).points.add({ y: parseFloat(data.bpi.USD.rate_float), x: data.time.updated });
        destChart.getChart().series(1).points.add({ y: parseFloat(data.bpi.GBP.rate_float), x: data.time.updated });
        destChart.getChart().series(2).points.add({ y: parseFloat(data.bpi.EUR.rate_float), x: data.time.updated });
    }

    /**
     * Sends data to the Redis Server
     * @param {*} data 
     */
    publish = data => {
        // Post to Redis Server through web sockets
        this.redisWebSocket.send(JSON.stringify(data));
    }

    /**
     * Publish data received from socket to Diffusion
     * @param {*} data 
     */
    publishToDiffusion = data => {
        if (this.diffusionService && this.diffusionService.diffusionClient) {
            this.diffusionService.publish(data);
        }
    }
}