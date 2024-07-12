// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Strings.sol";

import "@chainlink/contracts/src/v0.8/Chainlink.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";
//import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";

/**
 * Request testnet LINK and ETH here: https://faucets.chain.link/
 * Find information on LINK Token Contracts and get the latest ETH and LINK faucets here: https://docs.chain.link/docs/link-token-contracts/
 * 
 * Example taken from https://docs.chain.link/any-api/get-request/examples/single-word-response
 */
contract Devos_VoterArchive is ChainlinkClient, ConfirmedOwner {
    using Chainlink for Chainlink.Request;

    bytes32 private jobId;
    uint256 private fee;

    string private voter;
    string private nationality;
    mapping(string => string) public voterRegistry;

    event RequestNationalityById(bytes32 indexed requestId, string nationality);

    /**
     * @notice Initialize the link token and target oracle
     *
     * Sepolia Testnet details:
     * Link Token: 0x779877A7B0D9E8603169DdbD7836e478b4624789
     * Oracle: 0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD (Chainlink DevRel)
     * jobId: ca98366cc7314957b8c012c72f05aeeb
     *
     */
    constructor() ConfirmedOwner(msg.sender) {
        setChainlinkToken(0x779877A7B0D9E8603169DdbD7836e478b4624789);
        setChainlinkOracle(0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD);
        jobId = "7d80a6386ef543a3abb52817f6707e3b";
        fee = (1 * LINK_DIVISIBILITY) / 100; // 0,1 * 10**18 (Varies by network and job)
    }

    modifier wasNotChecked(string memory _voter){
        require(bytes(voterRegistry[_voter]).length == 0);
        _;
    }

    /**
     * Create a Chainlink request to retrieve API response, find the target
     * data, then multiply by 1000000000000000000 (to remove decimal places from data).
     */
    function requestVolumeData(string memory _voter) wasNotChecked(_voter) public returns (bytes32 requestId) {
        voter = _voter;

        Chainlink.Request memory req = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfill.selector
        );

        req.add(
            "get",
            string.concat("https://devos-sem-net.vercel.app/api/addresses/", _voter)
        );

        req.add("path", "0,nationality");                   // Chainlink nodes 1.0.0 and later support this format
        return sendChainlinkRequest(req, fee);
    }

    /**
     * @dev Ignore this function.
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
     * Allow withdraw of Link tokens from the contract
     */
    function withdrawLink() public onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
        require(
            link.transfer(msg.sender, link.balanceOf(address(this))),
            "Unable to transfer"
        );
    }
}
