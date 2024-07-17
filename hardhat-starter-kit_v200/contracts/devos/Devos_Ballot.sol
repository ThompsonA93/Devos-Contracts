// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

/**
 * @dev Interface to call functions over ballot archive
 */
interface Devos_BallotArchiveInterface {
    function createNewBallot(address _creator, address _ballot) external;
}

/**
 * @dev Interface to call chainlink functions over voter archive
 */
interface Devos_VoterArchiveInterface{
    function requestNationalityData(address _voter) external;
    function getNationalityData(address _voter) external returns (string memory _nationality);
}

/**
 * @title Devos_Ballot
 * @author ThompsonA93
 * @notice contains any information regarding a singular voting context
 */
contract Devos_Ballot  {

    /**
     * @notice Address for the ballot archive
     */
    address public ballotArchiveAddress;

    /**
     * @notice Address for the voter registry & authentication procedures
     */
    address public voterArchiveAddress;

    /**
     * @notice Map of voters that have voted. Used in modifier to check who has already voted
     * @dev Uint8 for Demo-Purposes. Could be set to address => bool to hide the actual vote. 
     */
    mapping(address => uint8) public voters;

    /**
     * @notice Structure comprising relevant data. Fed to websites to display HTML
     */
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

    /**
     * @param _ballotArchiveAddress as address of the ballot archive 
     * @param _voterArchiveAddress as address of the voter registry
     * @param _title as ballot title
     * @param _metainfo as details on the ballot
     * @param _nationality as limitation who may vote for this ballot
     * @param _votingDays as duration during which the ballot allows people to vote
     */
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
     * @dev modifier enforcing that a given address has not called any votes before
     * @param _voter as entity to be checked
     */
    modifier hasNotVoted(address _voter) {
        require(voters[_voter] != 1 && voters[_voter] != 2);
        _;
    }

    /**
     * @dev modifier enforcing correct voting period
     */
    modifier validVotingTime() {
        require(block.timestamp < ballot.endTime);
        _;
    }

    /**
     * @dev modifier enforcing legal input on votes
     * @param _vote as 1 or 2
     */
    modifier validVoteChoice(uint _vote){
        require(_vote == 1 || _vote == 2);
        _;
    }

    /**
     * @dev modifier enforcing that a voter has the corresponding nationality of the ballot
     * @param _voter as entity to be checked
     */
    modifier hasValidNationality(address _voter){
        string memory _voterNationality = Devos_VoterArchiveInterface(voterArchiveAddress).getNationalityData(_voter);
        require(keccak256(abi.encodePacked(_voterNationality)) == keccak256(abi.encodePacked(ballot.nationality)));
        _;
    }

    /**
     * @notice function to call a vote for this contract's ballot
     * @param _vote as 1 or 2
     */
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
