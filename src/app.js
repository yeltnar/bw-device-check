const axios = require('axios');
const { execFile } = require('node:child_process');
const fs = require('fs/promises');
const {existsSync} = require('fs');
const config = require('config');

const join = require('./join');

const note_ids = config.note_ids;
const last_check_file = 'config/last_check.json';

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

    const checks_obj={};
    const last_check = await getLastCheck();

    await Promise.all(note_ids.map(async(note_id)=>{

        if(!note_id){
            throw Error(`note_id is ${note_id}`);
        }

        // console.log(note_id);
        const note = await getNote(note_id);
        const {name} = note.data;
        const note_obj = JSON.parse(note.data.notes)
        // console.log(obj);  

        const check = await checkDevice(name, note_obj, last_check[name]);
        
        checks_obj[name] = check;
    }));

    console.log(checks_obj);

    await fs.writeFile(last_check_file, JSON.stringify(checks_obj));

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

async function checkDevice(name, obj, last_check){

    const time_check = await checkTime(name, obj);

    let notified = false;

    console.log({time_check});

    if (!time_check.pass) {
        if (last_check.notified === false) {
            const r = await join.sendToJoin({
                title: "Device not reporting",
                deviceId: "group.android",
                text: `${name}`
            });
        }else{
            console.log(`Not notifying again about ${name}`);
        }
        notified = true;
    }

    if(last_check.notified===true && time_check.pass===true){
        const r = await join.sendToJoin({
            title: "Device back up",
            deviceId: "group.android",
            text: `${name}`
        });
    }

    return {
        time_check,
        notified
    };

    async function checkTime(name, obj){

        console.log(obj.date);

        const report_date = new Date(obj.date);
        const check_time = new Date(report_date.getTime()+TIME_PADDING_TIME);

        console.log(check_time);

        let pass=false;

        if(check_time < start_time){
            console.log(`issue; need to report that ${name} isn't up`);
            // console.log(r);
        }else{
            console.log(`g2g; ${name} is up`);
            pass = true;
        }

        return {
            pass,
            time_checked: start_time.toString(),
            report_date:report_date.toString(),
        };
    }
}

async function getLastCheck(file=last_check_file){
    let last_check;
    if(!existsSync(last_check_file)){
        throw new Error(`${last_check_file} does not exist`);
    }
    else{
        const x = (await fs.readFile(last_check_file)).toString();
        console.log(x);
        last_check = JSON.parse(x);
    }
    return last_check;
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
        throw new Error('axios error w/ getNote id:'+id)
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
    const max_tries = 10;

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


