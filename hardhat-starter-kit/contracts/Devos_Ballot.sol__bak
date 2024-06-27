// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

/**
 * @dev Interface to call functionality of archive smart contract
 */
interface Devos_ETHNET_ArchiveInterface {
    function createNewBallot(address _creator, address _ballot) external;
}

/**
 * @title BallotOpen
 * @author ThompsonA93
 * @notice Stores information on a single ballot.
 * @dev Dependant on primary smart contract "BallotArchive", @see constructor()
 */
contract Devos_ETHNET_Ballot {
    struct Ballot {
        address archiveAddress;
        address creator;
        address ballotAddress;
        string title;
        string metainfo;
        string allowedNationality;
        uint startTime;
        uint endTime;
        uint totalVotes;
        uint proVotes;
    }
    Ballot ballot;

    /**
     * @dev map voters to given votes.
     * 0 - Has not voted
     * 1 - Has voted 'No'
     * 2 - Has voted 'Yes'
     */
    mapping(address => uint8) public votes;

    /**
     * @dev Iterable storage for all addresses that voted
     * FIXME :: Experimental, not sure if necessary at all 
     */
    address[] voters;

    /**
     * @param _archiveAddress On-Chain location of Archive smart contract. See: "./BallotArchive.sol"
     * @param _title as ballot title
     * @param _metainfo as information on the ballot
     * @param _votingDays as time limit to cast votes.
     * TODO:: Aggregate votes on expiration
     * TODO:: Check if saving archiveAddress is necessary
     */
    constructor(
        address _archiveAddress,
        string memory _title,
        string memory _metainfo,
        uint _votingDays,
        string memory _allowedNationality
    ) {
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

        Devos_ETHNET_ArchiveInterface(ballot.archiveAddress).createNewBallot(
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
     * @dev casts a vote given modifiers and increments voting counts
     * @param _choice as 1 (No) or 2 (Yes).
     */
    function vote(
        uint8 _choice
    ) public validVotingTime hasNotVoted(msg.sender) {
        votes[msg.sender] = _choice;
        voters.push(msg.sender);
        if (_choice == 2) {
            ballot.proVotes += 1;
        }
        ballot.totalVotes += 1;
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
            uint,
            uint,
            uint,
            uint
        )
    {
        return (
            ballot.archiveAddress,
            ballot.creator,
            ballot.ballotAddress,
            ballot.title,
            ballot.metainfo,
            ballot.startTime,
            ballot.endTime,
            ballot.totalVotes,
            ballot.proVotes
        );
    }
}
