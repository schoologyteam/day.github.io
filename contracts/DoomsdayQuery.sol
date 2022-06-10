// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

contract DoomsdayQuery {
    address public owner; // slot 0
    address collectibles;
    address access;

    mapping(address => uint256) internal balances;
    mapping (uint256 => address) internal allowance;
    mapping (address => mapping (address => bool)) internal authorised;

    uint16[] tokenIndexToCity;  // slot 6
    mapping(uint256 => address) owners;

    string private __name = "Doomsday NFT (Season 2)";
    string private __symbol = "BUNKER2";
    bytes private __uriBase;
    bytes private __uriSuffix;

    uint constant MAX_CITIES = 38611;

    int64 constant MAP_WIDTH         = 4320000;
    int64 constant MAP_HEIGHT        = 2588795;

    uint public startTime;  // SLOT 12
    uint SALE_TIME = 14 days;
    uint EARLY_ACCESS_TIME = 2 days;

    mapping(uint16 => uint) public cityToToken;
    mapping(uint16 => int64[2]) coordinates;
    bytes32 cityRoot;   // SLOT 17
    bytes32 accessRoot;
    address impacts;

    mapping(uint => bytes32) structuralData;
    mapping(address => uint) lastConfirmedHit;

    uint public reinforcements; // SLOT 22
    uint public destroyed;
    uint public evacuatedFunds;
    uint ownerWithdrawn;
    bool winnerWithdrawn;

    mapping (bytes4 => bool) internal supportedInterfaces;

    // end of data

    uint constant IMPACT_BLOCK_INTERVAL = 255;

    int64 constant BASE_BLAST_RADIUS = 80000;   //map units

    enum Stage {Initial,PreApocalypse,Apocalypse,PostApocalypse}
    function stage() private view returns(Stage){
        if (startTime == 0) {
            return Stage.Initial;
        }
        if (block.timestamp < startTime + SALE_TIME && tokenIndexToCity.length < MAX_CITIES) {
            return Stage.PreApocalypse;
        }
        if (destroyed < tokenIndexToCity.length - 1) {
            return Stage.Apocalypse;
        }
        return Stage.PostApocalypse;
    }

    function totalSupply() private view returns (uint256){
        return tokenIndexToCity.length - destroyed;
    }

    function currentImpact() private view returns (int64[2] memory _coordinates, int64 _radius, bytes32 impactId) {
        uint eliminationBlock = block.number - (block.number % IMPACT_BLOCK_INTERVAL) + 1;
        int hash = int(uint(blockhash(eliminationBlock))%uint(type(int).max) );

        uint _totalSupply = totalSupply();

        //Min radius is half map height divided by num
        int o = MAP_HEIGHT/2/int(_totalSupply+1);

        //Limited in smallness to about 3% of map height
        if(o < BASE_BLAST_RADIUS){
            o = BASE_BLAST_RADIUS;
        }
        //Max radius is twice this
        _coordinates[0] = int64(hash%MAP_WIDTH - MAP_WIDTH/2);
        _coordinates[1] = int64((hash/MAP_WIDTH)%MAP_HEIGHT - MAP_HEIGHT/2);
        _radius = int64((hash/MAP_WIDTH/MAP_HEIGHT)%o + o);

        return(_coordinates,_radius, blockhash(eliminationBlock));
    }

    function getStructuralData(uint _tokenId) private view returns (uint8 reinforcement, uint8 damage, bytes32 lastImpact) {
        bytes32 _data = structuralData[_tokenId];

        reinforcement = uint8(uint(((_data << 248) >> 248)));
        damage = uint8(uint(((_data << 240) >> 240) >> 8));
        lastImpact = (_data >> 16);

        return (reinforcement, damage, lastImpact);
    }

    function encodeImpact(bytes32 _impact) private pure returns (bytes32) {
        return (_impact << 16) >> 16;
    }

    function tokenToCity(uint _tokenId) private view returns (uint16) {
        return tokenIndexToCity[_tokenId - 1];
    }

    function checkVulnerable(uint _tokenId, bytes32 _lastImpact) private view returns (bool) {
        (int64[2] memory _coordinates, int64 _radius, bytes32 _impactId) = currentImpact();

        if (_lastImpact == encodeImpact(_impactId)) return false;

        uint16 _cityId = tokenToCity(_tokenId);

        int64 dx = coordinates[_cityId][0] - _coordinates[0];
        int64 dy = coordinates[_cityId][1] - _coordinates[1];

        return (dx**2 + dy**2 < _radius**2) ||
                ((dx + MAP_WIDTH )**2 + dy**2 < _radius**2) ||
                ((dx - MAP_WIDTH )**2 + dy**2 < _radius**2);
    }

    function isVulnerable(uint _tokenId) private view returns (bool) {
        (uint8 _reinforcement, uint8 _damage, bytes32 _lastImpact) = getStructuralData(_tokenId);
        _reinforcement;_damage;
        return checkVulnerable(_tokenId,_lastImpact);
    }

    function isValidToken(uint256 _tokenId) private view returns (bool) {
        if(_tokenId == 0) return false;
        return cityToToken[tokenToCity(_tokenId)] != 0;
    }

    function ownerOf(uint256 _tokenId) private view returns (address) {
        require(isValidToken(_tokenId), "invalid");
        return owners[_tokenId];
    }

    ///

    function canEvacuate(uint tokenToEvacuate) private view returns (bool) {
        if (!isValidToken(tokenToEvacuate)) {
            return false;
        }
        if (ownerOf(tokenToEvacuate) != msg.sender) {
            return false;
        }
        if (isVulnerable(tokenToEvacuate)) {
            // cannot evacuate vulnerable bunker
            return false;
        }
        return true;
    }

    function canConfirmHit(uint tokenToHit) private view returns (bool) {
        if (!isValidToken(tokenToHit)) {
            return false;
        }
        return isVulnerable(tokenToHit);
    }

    function evacuate(uint tokenToEvacuate) private {
        balances[owners[tokenToEvacuate]]--;
        delete cityToToken[tokenToCity(tokenToEvacuate)];
        destroyed++;
    }

    struct TokenAndOwner {
        uint32 tokenId;
        address tokenOwner;
    }

    function willBecomeVulnerable(uint tokenToEvacuate) public returns (TokenAndOwner[] memory) {
        TokenAndOwner[] memory empty = new TokenAndOwner[](0);
        if (stage() != Stage.Apocalypse) {
            return empty;
        }
        if (!canEvacuate(tokenToEvacuate)) {
            return empty;
        }
        uint maxTokenId = tokenIndexToCity.length;
        for (uint tokenId = 1; tokenId <= maxTokenId; tokenId += 1) {
            if (canConfirmHit(tokenId)) {
                // if hit can be confirmed before evacuation then confirm it without evacuation
                return empty;
            }
        }

        evacuate(tokenToEvacuate);

        TokenAndOwner[] memory tmp = new TokenAndOwner[](maxTokenId);
        uint tmpIndex = 0;
        for (uint tokenId = 1; tokenId <= maxTokenId; tokenId += 1) {
            if (canConfirmHit(tokenId)) {
                address tokenOwner = owners[tokenId];
                tmp[tmpIndex] = TokenAndOwner({
                    tokenId: uint32(tokenId),
                    tokenOwner: tokenOwner
                });
                tmpIndex += 1;
            }
        }

        TokenAndOwner[] memory result = new TokenAndOwner[](tmpIndex);
        for (uint i = 0; i < tmpIndex; i += 1) {
            result[i] = tmp[i];
        }

        return result;
    }
}
