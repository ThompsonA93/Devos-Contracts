const { assert, expect } = require("chai");
const { ethers } = require("hardhat");

// Archive-Node required as dependency given smart contract construction
describe("BallotOpenTest", function () {
  const zero_address = "0x00000000000000000000000000000000000000000";

  it("Deploy archive onto chain", async function () {
    const BallotArchive = await hre.ethers.getContractFactory("BallotArchive");
    const ballotArchive = await BallotArchive.deploy();
    const ballotArchiveContract = await ballotArchive.deployed();
    assert(
      ballotArchiveContract.address !== "",
      "Expected non-null address on deployment, got ''"
    );
  });
  it("Write and read singular OpenBallot", async function () {
    const [voter1] = await ethers.getSigners();
    const BallotArchive = await hre.ethers.getContractFactory("BallotArchive");
    const ballotArchive = await BallotArchive.deploy();
    const ballotArchiveContract = await ballotArchive.deployed();

    // Create new Ballot Contract
    _archiveAddress = ballotArchiveContract.address;
    _title = "My First Ballot";
    _metainfo = "Lorem Ipsum";
    _votingDays = 30;
    const BallotOpen = await hre.ethers.getContractFactory("BallotOpen");
    const ballotOpen = await BallotOpen.connect(voter1).deploy(
      _archiveAddress,
      _title,
      _metainfo,
      _votingDays
    );
    const ballotOpenContract = await ballotOpen.deployed();

    var fullBallotInfo =
      await ballotOpenContract.getFullBallotInformation.call();

    assert(fullBallotInfo[0] == _archiveAddress);
    assert(
      fullBallotInfo[1] == voter1.address,
      "Fetched creator-address " +
        fullBallotInfo[1] +
        " is not equal to " +
        voter1.address
    );
    assert(fullBallotInfo[2] == ballotOpen.address);
    assert(fullBallotInfo[3] == _title);
    assert(fullBallotInfo[4] == _metainfo);
    //FIXME find way to test Start & Endtime :: assert(fullBallotInfo[5] == );
  });

  it("Pass singular vote", async function () {
    const [voter1] = await ethers.getSigners();
    const BallotArchive = await hre.ethers.getContractFactory("BallotArchive");
    const ballotArchive = await BallotArchive.deploy();
    const ballotArchiveContract = await ballotArchive.deployed();

    // Create new Ballot and deploy to chain
    _archiveAddress = ballotArchiveContract.address;
    _title = "My First Ballot";
    _metainfo = "Lorem Ipsum";
    _votingDays = 30;

    const BallotOpen = await hre.ethers.getContractFactory("BallotOpen");
    const ballotOpen = await BallotOpen.connect(voter1).deploy(
      _archiveAddress,
      _title,
      _metainfo,
      _votingDays
    );
    const ballotOpenContract = await ballotOpen.deployed();

    // Invoke vote
    await ballotOpenContract.vote(2);

    // Read expected voting information
    var fullBallotInfo =
      await ballotOpenContract.getFullBallotInformation.call();
    assert(
      fullBallotInfo[7] == 1,
      "Stored TotalVotes was not one but instead " + fullBallotInfo[7]
    );
    assert(
      fullBallotInfo[8] == 1,
      "Stored ProVotes was not one but instead " + fullBallotInfo[8]
    );
  });

  it("Pass multiple votes, single voter (expected: revert)", async function () {
    const [voter1] = await ethers.getSigners();
    const BallotArchive = await hre.ethers.getContractFactory("BallotArchive");
    const ballotArchive = await BallotArchive.deploy();
    const ballotArchiveContract = await ballotArchive.deployed();

    // Create new Ballot and deploy to chain
    _archiveAddress = ballotArchiveContract.address;
    _title = "My First Ballot";
    _metainfo = "Lorem Ipsum";
    _votingDays = 30;

    const BallotOpen = await hre.ethers.getContractFactory("BallotOpen");
    const ballotOpen = await BallotOpen.connect(voter1).deploy(
      _archiveAddress,
      _title,
      _metainfo,
      _votingDays
    );
    const ballotOpenContract = await ballotOpen.deployed();

    // Invoke double voting (forbidden)
    await ballotOpenContract.vote(1);
    await expect(ballotOpenContract.vote(2)).to.be.reverted;
  });

  it("Pass single votes, multiple voters", async function () {
    const [voter1, voter2, voter3] = await ethers.getSigners();
    const BallotArchive = await hre.ethers.getContractFactory("BallotArchive");
    const ballotArchive = await BallotArchive.deploy();
    const ballotArchiveContract = await ballotArchive.deployed();

    _archiveAddress = ballotArchiveContract.address;
    _title = "My First Ballot";
    _metainfo = "Lorem Ipsum";
    _votingDays = 30;
    const BallotOpen = await hre.ethers.getContractFactory("BallotOpen");
    const ballotOpen = await BallotOpen.connect(voter1).deploy(
      _archiveAddress,
      _title,
      _metainfo,
      _votingDays
    );
    const ballotOpenContract = await ballotOpen.deployed();

    // Invoke multiple votes using different accounts
    await ballotOpenContract.connect(voter1).vote(2);
    await ballotOpenContract.connect(voter2).vote(1);
    await ballotOpenContract.connect(voter3).vote(2);

    // Read expected voting information
    var fullBallotInfo =
      await ballotOpenContract.getFullBallotInformation.call();
    assert(
      fullBallotInfo[7] == 3,
      "Stored TotalVotes was not one but instead " + fullBallotInfo[7]
    );
    assert(
      fullBallotInfo[8] == 2,
      "Stored ProVotes was not one but instead " + fullBallotInfo[8]
    );
  });
});
