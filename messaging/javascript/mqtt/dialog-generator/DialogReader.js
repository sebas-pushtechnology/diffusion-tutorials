import readLine from 'readline'
import fs from 'fs';

export default class FileReader {
    /**
     * 
     * @param {*} config 
     * config is an object containing the callback functions to be used by the LineReader,
     * one for each Line (onLineCallback), and one for on Close (onCloseCallback)
     */
    constructor(config) {        
        this.onLineCallback = config.onLineCallback;
        this.onCloseCallback = config.onCloseCallback;
    }

    /**
     * 
     * @param {*} filename The full path to the file to be read
     */
    readFile = (filename) => {                 
        const lineReader = readLine.createInterface({
            input: fs.createReadStream(filename)
        });
        
        lineReader.on('line', this.onLine);
        
        lineReader.on('close', this.onCloseReader);
    }
    
    /**
     * This function is called by the lineReader each time a line of the file is read
     * @param {*} newData the line read
     */
    onLine = (newData) => { 
        this.onLineCallback(this.getDialogueJson(newData));
    }

    /**
     * This function is called when the lineReader finished reading all lines in the file and closed it
     */
    onCloseReader = () => {        
        if (typeof (this.onCloseCallback) === 'function') {
            this.onCloseCallback();
        }
    }

    /**
     * This function converts the text line into a json object
     * @param {*} newData The text line read
     */
    getDialogueJson = newData => {                
        const lineArray = newData.split('" "');        
        if (lineArray[2]) {
            return {
                character: lineArray[1].replace('"', ''),
                text: lineArray[2] ? lineArray[2].replace('"', '') : ''
            };
        }
        return {
            character: '',
            text: ''
        };
    }
}