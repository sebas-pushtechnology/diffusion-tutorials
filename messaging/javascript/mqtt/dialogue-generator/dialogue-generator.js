import Mosquitto from './mqtt-clients/Mosquitto.js';
import DialogueReader from './DialogueReader.js';

class Main {
    constructor() {
        console.log('Starting dialogue producer...');                
        this.client = new Mosquitto('StarWars', this.onServerConnected);
        this.client.connect();        
    }    

    /**
     * This function is the callback that's called when the connection to the MQTT server succeded
     */
    onServerConnected = () => {
        console.log('Beginning Transmission. Stick to the right side of the Force');
        this.dialogueReader = new DialogueReader(
            {
                onLineCallback: dialogue => this.sendDialogueLine(dialogue),
                onCloseCallback: () => this.onFinishedReadingDialogueFile()
            }
        );
        this.dialogueReader.readFile('./dialogues/episode_iv');
    }

    /**
     * When a Line of the file was read, this callback is called.
     * This function sends the message to the MQTT server, using the client previusly instanciated.
     * @param {*} dialogLine The dialog object from the DialogReader
     */
    sendDialogueLine = dialogLine => {
        this.client.sendDialogue(dialogLine);
    }

    /**
     * This callback function is called when the DialogReader has finished reading the while dialogues file.
     */
    onFinishedReadingDialogueFile = () => {
        console.log('Dialog file read. Ending Transmission. May the Force Be With you...');
    }

}

const main = new Main();