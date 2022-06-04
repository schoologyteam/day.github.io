const { Doomsday, Viewer } = require("./contracts");

const col = require('./console.colour');
const log = col.colour;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const totalSupply = async() =>{
    return await Doomsday.totalSupply();
}
const destroyed = async() =>{
    return await Doomsday.destroyed();
}
const vulnerableCities = async(startId,limit) =>{
    return await Viewer.vulnerableCities(startId,limit);
}

const nextImpactIn = async() =>{
    return await Viewer.nextImpactIn();
}

const isVulnerable = async(_tokenId) =>{
    return await Doomsday.isVulnerable(_tokenId);
}

const confirmHit = async(_tokenId) =>{
    try{
        let tx = await Doomsday.confirmHit(_tokenId);
        await tx.wait();
    }catch(e){
        console.log(e);
        col.red(" execution failed.");
        process.exit();
    }
}

async function getVulnerable(){
    let _cities = [];
    let _limit = 5000;
    let _tokenIdMax = parseInt(await totalSupply()) + parseInt(await destroyed());

    for(let i = 1; i <= _tokenIdMax; i += _limit){
        let chunk  = await vulnerableCities(i,_limit);
        if(chunk.length === 0) break;
        for(let j = 0; j < chunk.length; j++){
            let tokenId = parseInt(chunk[j]);
            if( tokenId !== 0){
                _cities.push(tokenId);
            }
        }
    }
    return _cities;
}

async function doTheThing() {
    col.yellow("=== Doomsday Season 2 Hit Confirm Bot ===");
    while (true) {
        if (parseInt(await totalSupply()) < 2) {
            col.green("     Game over.");
            process.exit();
        }

        let _nextImpact = parseInt(await nextImpactIn());

        if (_nextImpact < 20) {
            col.red("NEXT IMPACT TOO SOON");
            col.red("  > waiting...");
            await sleep(1000 * _nextImpact * 2.3);
        } else if (_nextImpact > 250) {
            col.red("NEXT IMPACT NOT SOON ENOUGH", `(${_nextImpact} blocks)`);
            col.red("  > waiting...");
            await sleep(5000);
        } else {
            let vulnerable = await getVulnerable();

            if (vulnerable.length === 0) {
                col.cyan(" >> NO VULNERABLE BUNKERS");
                await sleep(1000 * (_nextImpact + 5) * 2.3);
            } else {
                col.yellow(" > Vulnerable bunkers found");
                for (let i = 0; i < vulnerable.length; i++) {
                    let _tokenId = vulnerable[i];
                    col.yellow(" > Confirm hit on",_tokenId);
                    let lastVulnerableCheck = Boolean(await isVulnerable(_tokenId));

                    if (!lastVulnerableCheck) {
                        col.blue("No longer vulnerable, skip.");
                    } else {
                        //execute
                        col.yellow("confirming hit:", _tokenId);
                        await confirmHit(_tokenId);
                        col.green("     done.");
                    }

                }
            }
        }
    }
}

doTheThing();