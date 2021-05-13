export default class Diffusion {
    constructor(onConnectedCallback, onReceiveMessageCallback ) {
        this.topic = 'default-topic';
        this.host = '127.0.0.1';
        this.user = 'admin';
        this.password = 'password';
        this.client = null;
        this.session = null;
        this.onConnectedCallback = onConnectedCallback || null;
        this.onReceiveMessageCallback = onReceiveMessageCallback || null;
    }

    setConfig = ({ host, user, password, topic }) => {         
        this.host = host || '127.0.0.1';
        this.user = user || 'admin';
        this.password = password || 'password';
        this.topic = topic || 'default-topic';
        this.subscribedTopic = topic || 'default-topic';
    }

    connect = () => {
        diffusion.connect({
            host: this.host,            
            principal: this.user,
            credentials: this.password,                       
            port: 443,
            secure: true
        }).then((session) => {
            this.session = session;
            this.session.topics.add(this.topic, diffusion.topics.TopicType.JSON)            
            console.log(`Connected: `, this.session.sessionId);
            if (this.onConnectedCallback) {
                this.onConnectedCallback();
            }            
        });
    }

    setTopic = topic => { this.topic = topic; }

    subscribe = ({ session = undefined, topicPath = '', onValueCallback = null }) => {
        const currentSession = session || this.session;
        const currentTopic = topicPath || this.topic;
        console.log(`subscribing to: ${currentTopic}`);
        
        currentSession.addStream(
            currentTopic,
            diffusion.datatypes.json()).on('value',
                onValueCallback || this.onReceiveMessage
            );

        currentSession.select(currentTopic);
    }

    onReceiveMessage = (topic, specification, newValue, oldValue) => {
        let message = newValue.get();
        message.receiveTime = new Date();
        console.log(`TOPIC - Receiving message for topic: ${topic}`, specification, newValue.get(), oldValue.get());
        if (this.onReceiveMessageCallback) {
            this.onReceiveMessageCallback(message, topic);
        }
    }

    // Interface Functions
    publishData(data) {        
        if (this.session) {
            this.session.topicUpdate.set(this.topic, diffusion.datatypes.json(), data);
        }
    }

    closeConnection = () => {
        diffusion.close();
    }
    
    createTopicView = async (topicViewName, specification) => {
        if (this.session) {
            console.log('Creating TopicView: ', topicViewName, specification);
            await this.session.topicViews.createTopicView(topicViewName, specification);
        } else {
            console.log('Session not available when trying to create TopicView: ', topicViewName, specification);
        }
    }
}