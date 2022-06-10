require('dotenv').config()
const { ethers } = require("ethers");
const assert = require("assert");
const {run, artifacts} = require("hardhat");

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ALCHEMY_KEY = process.env.ALCHEMY_KEY;


const address =  {
    doomsday:       "0x2a1BABF79436d8aE047089719116f4EFDfce0E8F",
    viewer:         "0xA85542Eafe474A055E22CdD1F0c06c64EdA5865f",
}

const abi = {
    doomsday: [
        "function isVulnerable(uint _tokenId)  view returns(bool)",
        "function confirmHit(uint _tokenId)",
        "function totalSupply() view returns(uint256)",
        "function destroyed() view returns(uint)",
        "function ownerOf(uint _tokenId) view returns(address)",
        "function evacuate(uint _tokenId)",
    ],
    viewer: [
        "function nextImpactIn() view returns(uint)",
        "function vulnerableCities(uint startId, uint limit) view returns(uint[])",
    ]
}

let contract = {
    doomsday:       null,
    viewer:         null,
}
let contractWithSigner = {
    doomsday:       null,
    viewer:         null,
}

const provider = new ethers.providers.AlchemyProvider( "matic" ,  ALCHEMY_KEY )

const signer = new ethers.Wallet(`0x${PRIVATE_KEY}`, provider);


for(let c in address){
    contract[c] = new ethers.Contract(address[c],abi[c],provider);
    contractWithSigner[c] = contract[c].connect(signer);
}

function createDoomsdayQuery() {

    let doomsdayQuery, doomsdayQueryBytecode;

    const init = async () => {
        if (!doomsdayQuery) {
            await run("compile");

            const {abi: queryAbi, deployedBytecode} = await artifacts.readArtifact("DoomsdayQuery");
            const contract = new ethers.Contract(address.doomsday, queryAbi, provider);
            doomsdayQuery = contract.connect(signer);
            doomsdayQueryBytecode = deployedBytecode;
        }
    }

    const willBecomeVulnerable = async (tokenToHit, tokenToEvacuate) => {
        await init()
        const tx = await doomsdayQuery.populateTransaction.willBecomeVulnerable(tokenToHit, tokenToEvacuate);
        const callResult = await provider.send("eth_call", [tx, {blockNumber: 'latest'}, {
            [address.doomsday]: {
                code: doomsdayQueryBytecode
            }
        }])
        const result = doomsdayQuery.interface.decodeFunctionResult('willBecomeVulnerable', callResult)[0];
        assert(isFinite(result));
        assert(result >= 0);
        return result;
    }

    return {
        willBecomeVulnerable,
        init,
    }
}


module.exports = {
    Doomsday:   contractWithSigner.doomsday,
    Viewer:     contractWithSigner.viewer,
    DoomsdayQuery: createDoomsdayQuery(),
}
