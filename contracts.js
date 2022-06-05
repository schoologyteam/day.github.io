require('dotenv').config()
const { ethers } = require("ethers");

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




module.exports = {
    Doomsday:   contractWithSigner.doomsday,
    Viewer:     contractWithSigner.viewer,
}