import Chart from "../components/Chart.js";
import Diffusion from "../services/Diffusion.js";
import { poll } from "../services/poller.js";

export default class RedisConsumer {
    constructor() {
        // Lets create a Socket to interact with Redis
        this.ws = new WebSocket("ws://127.0.0.1:3000/");        

        // Redis / API Section elements
        this.apiResponseBodyEl = document.getElementById('responseValue'); // The Bitcoin API response
        this.startPollBtn = document.getElementById('startPolling'); // The button to start polling from the API

        // Diffusion Section elements
        this.connectBtn = document.getElementById('connectToDiffusion');
        this.hostEl = document.getElementById('host');
        this.userEl = document.getElementById('user');
        this.passwordEl = document.getElementById('password');
        this.topic = 'redis/bitcoin';


        // Lets instantiate the charts we are going to feed with the API data.
        this.chart = new Chart('chartDiv');
        this.diffusionChart = new Chart('diffusionChartDiv');
        
        this.polling = false; // We are not polling at the beginning
        // Add event listeners
        this.setEvents(); 
    }

    /**
     * Create the event listeners
     */
    setEvents = () => {
        // Start polling from API into Redis
        this.startPollBtn.addEventListener('click', evt => this.onStartPolling(evt));

        // Connect to Diffusion Service
        this.connectBtn.addEventListener('click', evt => this.onDiffusionConnectBtnClicked(evt));
    }

    /**
     * Start polling, when the start polling button was clicked
     * @param {*} evt 
     */
    onStartPolling = evt => {
        evt.preventDefault();
        this.setApi('https://api.coindesk.com/v1/bpi/currentprice.json');
        this.polling = true;
        this.startPolling();
    }

    /**
     * Stop Polling
     * @returns 
     */
    stopPolling = () => {        
        if (!this.polling) {
            console.log('Stop polling');
        }
        return this.polling ? false : true;
    }

    // Sets the API URL
    setApi = apiUrl => this.apiUrl = apiUrl;

    /**
     * Start Polling function. Here is where the interaction with the external API is handled
     */
    startPolling = () => {
        // When we start polling we start listening for the websocket where Redis Data will come in
        this.startListeningWs();

        // We instantiate and start the poller
        const poller = poll({
            fn: this.callEndpoint, // This is the function that will handle data from the API
            validate: this.stopPolling, // This is where we define the exit condition for the polling
            interval: 5000, // 5 seconds
        })
        .then(response => {
            this.apiResponseBodyEl.value = response;
        })
        .catch(err => console.error(err));
    }

    /**
     * Add the websocket listener to listen for Redis Messages
     */
    startListeningWs = () => {
        this.ws.onmessage = ({ data }) => {
            this.message = JSON.parse(data); // Parse the data from Redis
            console.log('Data received from Redis: ', this.message);
            this.updateChart(this.message); // Feed the Redis graph with it
        }
    }

    /**
     * The function that handles the call to the API when polling
     */
    callEndpoint = async () => {
        const response = await fetch(this.apiUrl);
        const contentLength = response.headers.get("content-length");
        const data = await response.json();
        // Show the data from the API in the response element
        const formatter = new JSONFormatter(data);
        this.apiResponseBodyEl.innerHTML = '';
        this.apiResponseBodyEl.appendChild(formatter.render());

        // Post retrieved data to Redis and Diffusion if connected to it
        this.postToServer(data);        
    }

    /**
     * Sends data to the Redis Server
     * @param {*} data 
     */
    postToServer = data => {
        // Post to Redis Server through web sockets
        this.ws.send(JSON.stringify(data));

        // If we're connected to diffusion, send received data to diffusion
        if (this.diffusionClient) {
            this.diffusionClient.publishData(data);
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

    // Diffusion Section specific methods -------------------------------------------------------

    /**
     * This is the event handler when the Connect to Diffusion button is clicked
     * @param {*} evt 
     */
    onDiffusionConnectBtnClicked = evt => {
        console.log('Connecting to Diffusion');
        evt.preventDefault();

        // Instatiate Diffusion's Client
        // We send the connect and on message callbacks to handle those events
        this.diffusionClient = new Diffusion(this.onConnectedToDiffusion, this.onDiffusionMessage);
        
        // Set diffusion config
        this.diffusionClient.setConfig({
            host: this.hostEl.value,
            user: this.userEl.value,
            password: this.passwordEl.value,
            topic: this.topic
        });

        // And connect to it
        this.diffusionClient.connect();
    }

    /**
     * This is the callback, Diffusion client calls after connection
     */
    onConnectedToDiffusion = () => {
        console.log('connected to diffusion');
        // Once we're connected, subscribe to the topic we specified when connecting to Diffusion service
        // We're not sending any parameters because we already set those when calling the setConfig function in the previous method.
        this.diffusionClient.subscribe({}); //Subscribe to Diffusion's topic
    }

    /**
     * This is the callback the Diffusion Client calls when a message is received
     * We update the Client Tier chart with this info
     * @param {*} message 
     */
    onDiffusionMessage = message => {
        console.log('on Diffusion message', message);
        // This message came from Diffusion! Feed Diffusion's Chart
        this.updateChart(message, this.diffusionChart);
    }
}

window.onload = function () {
    let redisConsumer = new RedisConsumer();
};