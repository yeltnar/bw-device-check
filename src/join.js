const config = require('config');
const axios = require('axios');

module.exports = (() => {

    async function sendToPhone(url) {

        const deviceId = "group.android";
        const title = document.title;

        return await sendToJoin({ url, title, deviceId });
    }

    async function sendToJoin({ url, title = "default title", deviceId = "group.android", text }) {
        const apikey = getJoinApiKey();
        let req_url = `https://joinjoaomgcd.appspot.com/_ah/api/messaging/v1/sendPush?apikey=${apikey}&title=${title}&deviceId=${deviceId}`
        req_url += text !== undefined ? `&text=${text}` : "";
        req_url += url !== undefined ? `&url=${url}` : "";
        console.log({ req_url });
        const reply = await axios.get(req_url);
        console.log("called send to join");
        return reply;
    }

    function getJoinApiKey() {
        if(!config.join_api_key){
            throw Error('havent set up join key');
        }
        return config.join_api_key;
    }

    return { sendToPhone, sendToJoin };

})();
