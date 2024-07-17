// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Strings.sol";

import "@chainlink/contracts/src/v0.8/Chainlink.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";
//import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";

/**
 * @dev
 * Request testnet LINK and ETH here: https://faucets.chain.link/
 * Find information on LINK Token Contracts and get the latest ETH and LINK faucets here: https://docs.chain.link/docs/link-token-contracts/
 * Example taken from https://docs.chain.link/any-api/get-request/examples/single-word-response
 */


/**
 * @title Devos_VoterArchive
 * @author ThompsonA93
 * @notice Smart contract handling decentralized authorization procedures for the devos-project
 */
contract Devos_VoterArchive is ChainlinkClient, ConfirmedOwner {
    using Chainlink for Chainlink.Request;


    address private oracle;
    address private link;
    bytes32 private jobId;
    uint256 private fee;


    address public voter;
    string public nationality;
    mapping(address => string) public voterRegistry;

    event RequestNationalityById(bytes32 indexed requestId, string nationality);

    /**
     * @notice Initialize the link token and target oracle
     *
     * Sepolia Testnet details:
     * Link Token: 0x779877A7B0D9E8603169DdbD7836e478b4624789
     * Oracle: 0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD (Chainlink DevRel)
     * jobId: 7d80a6386ef543a3abb52817f6707e3b
     * fee: (1 * LINK_DIVISIBILITY) / 100
     *
     */
    constructor(address _oracle, address _link, bytes32 _jobId, uint256 _fee) ConfirmedOwner(msg.sender) {
        if(_oracle == address(0)){
            setChainlinkOracle(0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD);
        }else{
            setChainlinkOracle(_oracle);
        }
        oracle = _oracle;

        if (_link == address(0)) {
            setChainlinkToken(0x779877A7B0D9E8603169DdbD7836e478b4624789);
        } else {
            setChainlinkToken(_link);
        }
        link = _link;

        if(_jobId.length == 0){
            jobId = "7d80a6386ef543a3abb52817f6707e3b";
        } else  {
            jobId = _jobId;
        }

        if(_fee == 0){
            fee = (1 * LINK_DIVISIBILITY) / 100; // 0,1 * 10**18 (Varies by network and job)
        } else {
            fee = _fee;
        }


        //setChainlinkToken(0x779877A7B0D9E8603169DdbD7836e478b4624789);
        //setChainlinkOracle(0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD);
        //jobId = "7d80a6386ef543a3abb52817f6707e3b";
        //fee = (1 * LINK_DIVISIBILITY) / 100; // 0,1 * 10**18 (Varies by network and job)
    }
    
    /**
     * @dev modifier enforcing single check of an voter. Disregards later re-checking
     * @param _voter as address to check
     */
    modifier wasNotChecked(address _voter){
        require(bytes(voterRegistry[_voter]).length == 0);
        _;
    }

    /**
     * @notice Sends request as ChainlinkClient to fetch HTTP-API from backend
     * @param _voter as address to check
     */
    function requestNationalityData(address _voter) wasNotChecked(_voter) public returns (bytes32 requestId) {
        voter = _voter;

        Chainlink.Request memory req = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfill.selector
        );

        req.add(
            "get",
            string.concat("https://devos-sem-net.vercel.app/api/addresses/", Strings.toHexString(uint256(uint160(_voter)), 20))
        );

        req.add("path", "0,nationality");                   // Chainlink nodes 1.0.0 and later support this format
        return sendChainlinkRequest(req, fee);
    }

    /**
     * @notice Requests nationality data on given address
     * @param _voter as address whose data will be returned
     * @return nationality as string from mapping
     */
    function getNationalityData(address _voter) external view returns (string memory) {
        return voterRegistry[_voter];
    }

    /**
     * @notice Procedure solely for quick demonstration and debugging purposes. For the actual workflow, use requestNationalityData(address)
     * @dev Additionally if addresses not native to the devos-project need to be added, this can be done here
     * @param _voter as address to map a nationality to
     * @param _nationality as string of a nationality mapped to the _voter
     */
    function DEBUG_setNationalityData(address _voter, string memory _nationality) public {
        voterRegistry[_voter] = _nationality;
    }

    /**
     * @notice Automatic callback procedure for requestNationalityData(address). Finishes up the asynchronous chainlink call and writes data to structures.
     */
    function fulfill(
        bytes32 _requestId,
        string memory _nationality
    ) public recordChainlinkFulfillment(_requestId) {
        emit RequestNationalityById(_requestId, _nationality);
        nationality = _nationality;
        voterRegistry[voter] = nationality;
    }

    /**
     * @notice allow withdrawal of Link tokens from the contract. Only allowed to be executed by the owner.
     */
    function withdrawLink() public onlyOwner {
        LinkTokenInterface lti = LinkTokenInterface(chainlinkTokenAddress());
        require(
            lti.transfer(msg.sender, lti.balanceOf(address(this))),
            "Unable to transfer"
        );
    }
}
