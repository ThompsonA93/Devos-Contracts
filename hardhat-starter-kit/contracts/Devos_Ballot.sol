// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "@openzeppelin/contracts/utils/Strings.sol";

import "@chainlink/contracts/src/v0.8/Chainlink.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";

//import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";

/**
 * @dev Interface to call functionality of archive smart contract
 */
interface Devos_ArchiveInterface {
    function createNewBallot(address _creator, address _ballot) external;
}

/**
 * Request testnet LINK and ETH here: https://faucets.chain.link/
 * Find information on LINK Token Contracts and get the latest ETH and LINK faucets here: https://docs.chain.link/docs/link-token-contracts/
 *
 * Asynchronously fetches data from Web3 and smart contract interaction
 * Final aggregation over all given data after initialization
 *
 * TODO :: Code correction on address & strings
 *
 * Example taken from https://docs.chain.link/any-api/get-request/examples/single-word-response
 */
contract Devos_Ballot is ChainlinkClient, ConfirmedOwner {
    using Chainlink for Chainlink.Request;

    struct Ballot {
        address archiveAddress;
        address creator;
        address ballotAddress;
        string title;
        string metainfo;
        string allowedNationality;
        uint256 startTime;
        uint256 endTime;
        uint256 totalVotes;
        uint256 proVotes;
    }
    Ballot ballot;
    address[] voters;
    mapping(address => string) nationalities;
    mapping(address => uint8) votes;

    bytes32 private jobId;
    uint256 private fee;
    string public nationality; // TODO :: Eliminate after testing

    event RequestVolume(bytes32 indexed requestId, string volume);

    /**
     * @notice Initialize the link token and target oracle
     * Sepolia Testnet details:
     * Link Token: 0x779877A7B0D9E8603169DdbD7836e478b4624789
     * Oracle: 0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD (Chainlink DevRel)
     * jobId: ca98366cc7314957b8c012c72f05aeeb
     */
    constructor(
        address _archiveAddress,
        string memory _title,
        string memory _metainfo,
        uint256 _votingDays,
        string memory _allowedNationality
    ) ConfirmedOwner(msg.sender) {
        ballot = Ballot(
            _archiveAddress,
            msg.sender,
            address(this),
            _title,
            _metainfo,
            _allowedNationality,
            block.timestamp,
            block.timestamp + (_votingDays * 1 days),
            0,
            0
        );

        Devos_ArchiveInterface(ballot.archiveAddress).createNewBallot(
            ballot.creator,
            ballot.ballotAddress
        );

        setChainlinkToken(0x779877A7B0D9E8603169DdbD7836e478b4624789); // https://docs.chain.link/resources/link-token-contracts
        setChainlinkOracle(0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD); // https://docs.chain.link/any-api/testnet-oracles
        jobId = "7d80a6386ef543a3abb52817f6707e3b"; // https://docs.chain.link/any-api/testnet-oracles#job-ids :: GET>string:
        fee = (1 * LINK_DIVISIBILITY) / 10; // 0,1 * 10**18 (Varies by network and job)
    }

    /**
     * @dev modifier requiring that given address has not passed any votes yet
     */
    modifier hasNotVoted(address _voter) {
        require(votes[_voter] != 1 && votes[_voter] != 2);
        _;
    }

    /**
     * @dev modifier requiring that following code is only executed within given time limit
     */
    modifier validVotingTime() {
        require(block.timestamp < ballot.endTime);
        _;
    }

    /**
     * Create a Chainlink request to retrieve API response, find the target
     * data, then multiply by 1000000000000000000 (to remove decimal places from data).
     *
     */
    function vote(uint8 _choice)
        public
        validVotingTime
        hasNotVoted(msg.sender)
        returns (bytes32 requestId)
    {
        voters.push(msg.sender);
        votes[msg.sender] = _choice;

        Chainlink.Request memory req = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfill.selector
        );

        // Set the URL to perform the GET request on
        req.add(
            "get",
            string.concat(
                "https://devos-sem-net.vercel.app/api/addresses/",
                Strings.toHexString(uint160(msg.sender), 20)
            )
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
        req.add("path", "0,nationality"); // Chainlink nodes 1.0.0 and later support this format

        return sendChainlinkRequest(req, fee);
    }

    /**
     * Receive the response in the form of string
     */
    function fulfill(bytes32 _requestId, string memory _nationality)
        public
        recordChainlinkFulfillment(_requestId)
    {
        emit RequestVolume(_requestId, _nationality);
        nationality = _nationality; // TODO :: Eliminate after testing
        nationalities[msg.sender] = _nationality;
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

    function finalizeVoting() public onlyOwner {
        for (uint256 i = 0; i < voters.length; i++) {
            if (
                bytes(nationalities[voters[i]]).length ==
                bytes(ballot.allowedNationality).length &&
                keccak256(bytes(nationalities[voters[i]])) ==
                keccak256(bytes(ballot.allowedNationality))
            ) {
                if (votes[voters[i]] == 1) {
                    // 1, voted No
                    ballot.totalVotes += 1;
                } else {
                    // 2, Voted Yes
                    ballot.totalVotes += 1;
                    ballot.proVotes += 1;
                }
            } // else wrong nationality, ignore
        }
    }

    /**
     * @return Every field of the Struct as object value
     * @dev To replace oneday to return struct
     */
    function getFullBallotInformation()
        public
        view
        returns (
            address,
            address,
            address,
            string memory,
            string memory,
            string memory,
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        return (
            ballot.archiveAddress,
            ballot.creator,
            ballot.ballotAddress,
            ballot.title,
            ballot.metainfo,
            ballot.allowedNationality,
            ballot.startTime,
            ballot.endTime,
            ballot.totalVotes,
            ballot.proVotes
        );
    }
}
