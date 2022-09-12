const axios = require('axios');
const { execFile } = require('node:child_process');
const fs = require('fs/promises');
const config = require('config');

const join = require('./join');

const note_ids = config.note_ids;

// don't need to change this, cuz it will be in the container only
const server_base_url = `http://localhost:8087`;
const TIME_PADDING_TIME = 1000*60*6; // 7 min

if(!note_ids){
    console.error(`note_ids is ${note_ids}`);
    process.exit();
}

const start_time = new Date();

(async()=>{

    await setupBWServer();

    // await bwSync();

    await Promise.all(note_ids.map(async(note_id)=>{

        if(!note_id){
            throw Error(`note_id is ${note_id}`);
        }

        console.log(note_id);
        const note = await getNotes(note_id);
        const {name} = note.data;
        const obj = JSON.parse(note.data.notes)
        console.log(obj);  

        await checkDevice(name, obj);

    }));

    process.exit();
})();

async function bwSync(){
    const x = await axios.post(
        server_base_url + `/sync`
    )
    .catch((e)=>{
        console.log('axios err');
        console.log(e);
        console.log(Object.keys(e.response));
        console.log(e.response.data);
        throw new Error('axios error')
    })
    .then((x)=>{
        return x;
    });
    return x.data;
}

async function checkDevice(name, obj){

    return await checkTime(name, obj);

    async function checkTime(name, obj){
        console.log(obj.date);

        const report_date = new Date(obj.date);
        const check_date = new Date(report_date.getTime+TIME_PADDING_TIME);

        if(check_date < start_time){
            console.log(`issue; need to report that ${name} isn't up`);
            join.sendToJoin({title:"Device not reporting", deviceId:"group.android", text:`${name}`});
        }else{
            console.log(`g2g; ${name} is up`);
        }
    }
}

// get the note by id
async function getNote(id){
    const x = await axios.get(
        server_base_url + `/object/item/${id}`
    )
    .catch((e)=>{
        console.log('axios err');
        console.log(e);
        console.log(Object.keys(e.response));
        console.log(e.response.data);
        throw new Error('axios error')
    })
    .then((x)=>{
        return x;
    });
    return x.data;
}

async function setupBWServer(){
    const child_process = execFile('./init.sh',(err, stdout, stderr)=>{});

    child_process.stderr.on('data', function (data) {
        const s = data.toString();
        console.log(s);
    });

    child_process.stdout.on('data', function (data) {
        const s = data.toString();
        console.log(s);
    });
    
    await waitForBWServer();
}

function timeoutPromise(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}

async function waitForBWServer(  ){

    let count=0
    const max_tries = 30;

    while( !(await serverUp()) && count < max_tries ){

        count++;
        console.log(`waitForServer ${count}`)

        await timeoutPromise(1000);

        if(count >= max_tries ){
            throw new Error('Break; too many loops before bw server is up');
        }
    }

    async function serverUp(){
        let r = axios.get(`${server_base_url}/status`)
        .then((r)=>{
            return true
        }).catch((r)=>{
            return false;
        });
        return r;
    }
}


