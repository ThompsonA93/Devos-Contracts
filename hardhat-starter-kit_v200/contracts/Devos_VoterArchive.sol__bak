// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

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
contract SEMNetRequest is ChainlinkClient, ConfirmedOwner {
    using Chainlink for Chainlink.Request;

    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    // Data to receive
    string public nationality;
    mapping (string => string) nationalities;

    event RequestVolume(bytes32 indexed requestId, string volume);

    /**
     * @notice Initialize the link token and target oracle
     * Sepolia Testnet details:
     * Link Token: 0x779877A7B0D9E8603169DdbD7836e478b4624789
     * Oracle: 0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD (Chainlink DevRel)
     * jobId: ca98366cc7314957b8c012c72f05aeeb
     *
     */
    constructor(address _oracle, bytes32 _jobId, uint256 _fee, address _link) ConfirmedOwner(msg.sender) {
        // setChainlinkToken(0x779877A7B0D9E8603169DdbD7836e478b4624789);      // https://docs.chain.link/resources/link-token-contracts
        // setChainlinkOracle(0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD);     // https://docs.chain.link/any-api/testnet-oracles 
        // jobId = "7d80a6386ef543a3abb52817f6707e3b";                         // https://docs.chain.link/any-api/testnet-oracles#job-ids :: GET>string: 
        // fee = (1 * LINK_DIVISIBILITY) / 10;                                 // 0,1 * 10**18 (Varies by network and job)
    
        if (_link == address(0)) {
            setPublicChainlinkToken();
        } else {
            setChainlinkToken(_link);
        }

        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;
    }

    /**
     * Create a Chainlink request to retrieve API response, find the target
     * data, then multiply by 1000000000000000000 (to remove decimal places from data).
     *
     * @param _userId: string without " ", as passed per URL
     */
    function requestNationalityData(string memory _userId) public returns (bytes32 requestId) {
        Chainlink.Request memory req = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfill.selector
        );

        // Set the URL to perform the GET request on
        req.add(
            "get",
            string(abi.encodePacked("https://devos-sem-net.vercel.app/api/addresses/", _userId))
        );

        /** Devos Testdata-JSON Format
        [
            {
            "_id": "65f8052a2f643f4584cd1f87",
            "id": "2",
            "address": "0x71bE63f3384f5fb98995898A86B02Fb2426c5788",
            "nationality": "Germany",
            "reference": "https://devos-frontend.vercel.app//0x71bE63f3384f5fb98995898A86B02Fb2426c5788"
            }
        ]        
        **/

        // Array-responses: https://docs.chain.link/any-api/get-request/examples/array-response
        // request.add("path", "RAW.ETH.USD.VOLUME24HOUR"); // Chainlink nodes prior to 1.0.0 support this format
        req.add("path", "0,nationality");                   // Chainlink nodes 1.0.0 and later support this format

        return sendChainlinkRequestTo(oracle, req, fee);
    }

    /**
     * Receive the response in the form of string
     */
    function fulfill(
        bytes32 _requestId,
        string memory _nationality
    ) public recordChainlinkFulfillment(_requestId) {
        emit RequestVolume(_requestId, _nationality);
        nationality = _nationality;
    }

    /**
     * Withdraw Link tokens from contract
     */
    function withdrawLinkFromContract() public onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
        require(
            link.transfer(msg.sender, link.balanceOf(address(this))),
            "Unable to transfer LINK from contract to owner"
        );
    }
}
