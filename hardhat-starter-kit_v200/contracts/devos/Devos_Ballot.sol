// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;



//import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";

/**
 * @dev Interface to call functionality of archive smart contract
 */
interface Devos_BallotArchiveInterface {
    function createNewBallot(address _creator, address _ballot) external;
}

interface Devos_VoterArchiveInterface{
    function requestNationalityData(address _voter) external;
    function getNationalityData(address _voter) external returns (string memory _nationality);
}

contract Devos_Ballot  {
    address public ballotArchiveAddress;
    address public voterArchiveAddress;

    mapping(address => uint8) public voters;

    struct Ballot {
        address creator;
        string title;
        string metainfo;
        string nationality;
        uint256 startTime;
        uint256 endTime;
        uint256 totalVotes;
        uint256 proVotes;
    }
    Ballot public ballot;

    constructor(
        address _ballotArchiveAddress,
        address _voterArchiveAddress,
        string memory _title,
        string memory _metainfo,
        string memory _nationality,
        uint256 _votingDays
    ) {
        ballotArchiveAddress = _ballotArchiveAddress;
        voterArchiveAddress = _voterArchiveAddress;
        ballot = Ballot(
            msg.sender,
            _title,
            _metainfo,
            _nationality,
            block.timestamp,
            block.timestamp + (_votingDays * 1 days),
            0,
            0 
        );

        Devos_BallotArchiveInterface(ballotArchiveAddress).createNewBallot(msg.sender, address(this));
        
    }


    /**
     * @dev modifier requiring that given address has not passed any votes yet
     */
    modifier hasNotVoted(address _voter) {
        require(voters[_voter] != 1 && voters[_voter] != 2);
        _;
    }

    modifier validVotingTime() {
        require(block.timestamp < ballot.endTime);
        _;
    }

    modifier validVoteChoice(uint _vote){
        require(_vote == 1 || _vote == 2);
        _;
    }


    modifier hasValidNationality(address _voter){
        string memory _voterNationality = Devos_VoterArchiveInterface(voterArchiveAddress).getNationalityData(_voter);
        require(keccak256(abi.encodePacked(_voterNationality)) == keccak256(abi.encodePacked(ballot.nationality)));
        _;
    }

    function callVote(uint8 _vote) public 
        hasNotVoted(msg.sender) 
        hasValidNationality(msg.sender) 
        validVotingTime 
        validVoteChoice(_vote) 
    {
        voters[msg.sender] = _vote;
        
        if(_vote == 2){
            ballot.proVotes += 1;
        }
        ballot.totalVotes += 1;

    }


}
