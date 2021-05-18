import Chart from "../components/Chart.js";
import CoindeskPoller from "../services/CoindeskPoller.js";
import RedisService from "../services/RedisService.js";
import DiffusionService from "../services/DiffusionService.js";

export default class RedisDiffusion {
    constructor() {               
        this.initUiElements();

        // This is the topic name we are using everywhere
        this.topic = 'redis/bitcoin';

        // Instantiate Redis Service (Data Tier)
        this.redisService = new RedisService();
        this.redisService.setTargetChart(new Chart('chartDiv'));
        
        // Instantiate Coindesk Poller (Market Data)
        this.coindeskPoller = new CoindeskPoller();
        this.coindeskPoller.setRedisService(this.redisService);

        // Instantiate Diffusion Service (Aplication Tier)
        this.diffusionService = new DiffusionService();
        this.diffusionService.setTargetChart(new Chart('diffusionChartDiv'));

        // We set diffusion service into redis service for publishing data.
        this.redisService.setDiffusionService(this.diffusionService);
                
        // Data tier is represented by the Diffusion Chart

        // Add Buttons event listeners
        this.setEvents(); 
    }

    initUiElements = () => {
        // Redis / API Section elements
        this.apiResponseBodyEl = document.getElementById('responseValue'); // The Bitcoin API response
        this.startPollBtn = document.getElementById('startPolling'); // The button to start polling from the API

        // Diffusion Section elements
        this.connectBtn = document.getElementById('connectToDiffusion');
        this.hostEl = document.getElementById('host');
        this.userEl = document.getElementById('user');
        this.passwordEl = document.getElementById('password');        
    }

    /**
     * Create the event listeners
     */
    setEvents = () => {
        // Start polling from API into Redis
        this.startPollBtn.addEventListener('click', evt => {
            evt.preventDefault();
            this.coindeskPoller.onStartPolling(evt)
            this.redisService.startListeningRedisWebSocket();
        });

        // Connect to Diffusion Service
        this.connectBtn.addEventListener('click', evt => this.onDiffusionConnectBtnClicked(evt));
    }
    
    onDiffusionConnectBtnClicked = evt => {
        evt.preventDefault();
        this.diffusionService.connect(
            this.hostEl.value,
            this.userEl.value,
            this.passwordEl.value,
            this.topic
        );
    }

}

window.onload = function () {
    let redisDiffusion = new RedisDiffusion();
};