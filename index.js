const { Doomsday, Viewer } = require("./contracts");

const col = require('./console.colour');
const {getAddress} = require("ethers/lib/utils");
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
    try{
        return await Viewer.nextImpactIn();
    }catch(e){
        return 1;
    }

}

const isVulnerable = async(_tokenId) =>{
    try{
        return await Doomsday.isVulnerable(_tokenId);
    }catch(e){
        return false;
    }

}

const confirmHit = async(_tokenId) =>{
    try{
        let tx = await Doomsday.confirmHit(_tokenId,{
            gasPrice: 50000000000
        });
        await tx.wait();
    }catch(e){
        console.log(e);
        col.red(" execution failed.");
        // process.exit();
    }
}

async function getVulnerable(){
    let _cities = [];
    try{
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
    }catch(e){

    }
    return _cities;
}

const getBunkerOwner = async (_tokenId) => {
    try {
        return await Doomsday.ownerOf(_tokenId);
    }catch(e){
        return "0x" + "0".repeat(40);
    }
}

let addressToSkip = ''

const isMyself = (bunkerOwner) => {
    return addressToSkip ? bunkerOwner.toLowerCase() === addressToSkip.toLowerCase() : false;
}

async function doTheThing() {
    col.yellow("=== Doomsday Season 2 Hit Confirm Bot ===");
    if (process.env.OWNER_OF_MY_BUNKERS) {
        try {
            addressToSkip = getAddress(process.env.OWNER_OF_MY_BUNKERS);
        } catch (e) {
            col.red(process.env.OWNER_OF_MY_BUNKERS, "is not an address");
        }
    }
    if (addressToSkip) {
        col.yellow("This bot will skip bunkers owned by", addressToSkip);
    } else {
        col.red("This bot will hit all bunkers even your own");
    }
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
                    let _tokenOwner = await getBunkerOwner(_tokenId);
                    if (isMyself(_tokenOwner)) {
                        col.blue(` > ${_tokenId} owned by me, skip.`);
                        continue;
                    } else {
                        col.yellow(" > Confirm hit on",_tokenId);
                    }
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