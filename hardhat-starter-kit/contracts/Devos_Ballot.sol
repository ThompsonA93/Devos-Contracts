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
 * Contract resembling a voting ballot for the Devos-Project.
 * Asynchronously fetches any interactive information during contract activation, from Web3 and blockchain
 * Aggregation over all given votings after 
 *
 * Chainlink HTTP-GET Request https://docs.chain.link/any-api/get-request/examples/single-word-response
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


    string public nationality; // TODO :: Eliminate after testing
    address[] public voters;
    mapping(address => string) public nationalities;
    mapping(address => uint8) public votes;

    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    event FulfilledDataRequest(bytes32 indexed requestId, string volume);

    /**
     * @dev Sepolia-Testnet details:
     * Oracle: 0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD (Chainlink DevRel)
     * JobId: ca98366cc7314957b8c012c72f05aeeb
     * Link Token: 0x779877A7B0D9E8603169DdbD7836e478b4624789
     */
    constructor(
        address _archiveAddress,
        string memory _title,
        string memory _metainfo,
        uint256 _votingDays,
        string memory _allowedNationality,
        address _oracle, 
        bytes32 _jobId, 
        uint256 _fee, 
        address _link
    ) ConfirmedOwner(msg.sender) {
        // Initialise Ballot
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

        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;
        
        // Oracles
        if (_oracle==address(0)){
            setChainlinkOracle(0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD); // https://docs.chain.link/any-api/testnet-oracles
        } else {
            setChainlinkOracle(_oracle);
        }
        
        // Link-Token
        if (_link == address(0)) {
            setPublicChainlinkToken();
        } else {
            setChainlinkToken(_link);
        }
        
        // Job-Id
        if (_jobId.length == 0){
            jobId = "7d80a6386ef543a3abb52817f6707e3b";
        } else {
            jobId = _jobId;
        }

        // Fee
        if (_fee == 0){
            _fee = (1 * LINK_DIVISIBILITY) / 10;
        } else {
            fee = _fee;
        }

        // setChainlinkToken(0x779877A7B0D9E8603169DdbD7836e478b4624789);   // https://docs.chain.link/resources/link-token-contracts
        // setChainlinkOracle(0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD);  // https://docs.chain.link/any-api/testnet-oracles
        // jobId = "7d80a6386ef543a3abb52817f6707e3b";                      // https://docs.chain.link/any-api/testnet-oracles#job-ids :: GET>string:
        // fee = (1 * LINK_DIVISIBILITY) / 10;                              // 0,1 * 10**18 (Varies by network and job)

        // Linking contract within Archive
        Devos_ArchiveInterface(ballot.archiveAddress).createNewBallot(
            ballot.creator,
            ballot.ballotAddress
        );
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
     * Cast a vote. 
     * Asynchronously collects the voting input and the voters nationality from the semantic web backend.
     */
    function vote(uint8 _choice)
        public
        validVotingTime
        //hasNotVoted(msg.sender)   // TODO :: Removed to simplify complexity on performance testing
        returns (bytes32 requestId)
    {
        votes[msg.sender] = _choice;
        voters.push(msg.sender);

        Chainlink.Request memory req = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfill.selector
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
        req.add(
            "get",
            string.concat(
                "https://devos-sem-net.vercel.app/api/addresses/",
                Strings.toHexString(uint160(msg.sender), 20)
            )
        );

        req.add("path", "0,nationality"); // Chainlink nodes 1.0.0 and later support this format
        // request.add("path", "0.nationality"); // Chainlink nodes prior to 1.0.0 support this format

        return sendChainlinkRequestTo(oracle, req, fee);

        //return sendChainlinkRequest(req, fee);
    }

    /**
     * Receive consented oracle response and store data 
     */
    function fulfill(bytes32 _requestId, string memory _nationality)
        public
        recordChainlinkFulfillment(_requestId)
    {
        nationality = _nationality;
        nationalities[msg.sender] = _nationality;
        emit FulfilledDataRequest(_requestId, _nationality);
    }



    /**
     * Finalize the voting. No requirements during testing environment 
     */
    function finalizeVoting() public onlyOwner {
        for (uint256 i = 0; i < voters.length; i++) {
            if (
                bytes(nationalities[voters[i]]).length ==
                bytes(ballot.allowedNationality).length &&
                keccak256(bytes(nationalities[voters[i]])) ==
                keccak256(bytes(ballot.allowedNationality))
            ){
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
     * Withdraw Link tokens from contract
     */
    function withdrawLinkFromContract() public onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
        require(
            link.transfer(msg.sender, link.balanceOf(address(this))),
            "Unable to transfer LINK from contract to owner"
        );
    }

    /**
     * @return Every field of the Struct as object value
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
