import { poll } from "./poller.js";

export default class CoindeskPoller {
    constructor() {
        this.apiUrl = 'https://api.coindesk.com/v1/bpi/currentprice.json';
        this.polling = false;
        this.redisService = null;
    }

    // Sets the API URL
    setApiUrl = apiUrl => this.apiUrl = apiUrl;

    setRedisService = redisService => this.redisService = redisService;

    /**
     * Start polling, when the start polling button was clicked
     * @param {*} evt 
     */
    onStartPolling = evt => {
        evt.preventDefault();
        this.polling = true;
        this.startPolling();
    }    

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
     * Stop Polling
     * @returns 
     */
    stopPolling = () => {
        if (!this.polling) {
            console.log('Stop polling');
        }
        return this.polling ? false : true;
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
        
        // Publish polled data to Redis
        this.redisService.publish(data);
    }
}