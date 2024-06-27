const { assert } = require("chai");
const { ethers, waffle } = require("hardhat");

const generateString = (length) =>
  Math.random().toString(32).substring(2, length);

describe("PerformanceTest", function () {
  const zero_address = "0x0000000000000000000000000000000000000000";

  it("Deploy 1x BallotOpen - 1x Signer", async () => {
    const [voter1] = await ethers.getSigners();
    let nrContracts = 1;

    const BallotArchive = await hre.ethers.getContractFactory("BallotArchive");
    const ballotArchive = await BallotArchive.deploy();
    const ballotArchiveContract = await ballotArchive.deployed();
    for (var i = 0; i < nrContracts; i++) {
      _archiveAddress = ballotArchiveContract.address;
      _title = generateString(10);
      _metainfo = generateString(10);
      _votingDays = 1;

      const BallotOpen = await hre.ethers.getContractFactory("BallotOpen");
      const ballotOpen = await BallotOpen.connect(voter1).deploy(
        _archiveAddress,
        _title,
        _metainfo,
        _votingDays
      );
      const ballotOpenContract = await ballotOpen.deployed();

      assert(
        ballotOpenContract.address !== "",
        "Expected non-null address on deployment, got ''"
      );
    }
  });
  it("Deploy 10x BallotOpen - 1x Signer", async () => {
    const [voter1] = await ethers.getSigners();
    let nrContracts = 10;

    const BallotArchive = await hre.ethers.getContractFactory("BallotArchive");
    const ballotArchive = await BallotArchive.deploy();
    const ballotArchiveContract = await ballotArchive.deployed();
    for (var i = 0; i < nrContracts; i++) {
      _archiveAddress = ballotArchiveContract.address;
      _title = generateString(10);
      _metainfo = generateString(10);
      _votingDays = 1;

      const BallotOpen = await hre.ethers.getContractFactory("BallotOpen");
      const ballotOpen = await BallotOpen.connect(voter1).deploy(
        _archiveAddress,
        _title,
        _metainfo,
        _votingDays
      );
      const ballotOpenContract = await ballotOpen.deployed();

      assert(
        ballotOpenContract.address !== "",
        "Expected non-null address on deployment, got ''"
      );
    }
  });
  it("Deploy 100x BallotOpen - 1x Signer", async () => {
    const [voter1] = await ethers.getSigners();
    let nrContracts = 100;

    const BallotArchive = await hre.ethers.getContractFactory("BallotArchive");
    const ballotArchive = await BallotArchive.deploy();
    const ballotArchiveContract = await ballotArchive.deployed();
    for (var i = 0; i < nrContracts; i++) {
      _archiveAddress = ballotArchiveContract.address;
      _title = generateString(10);
      _metainfo = generateString(10);
      _votingDays = 1;

      const BallotOpen = await hre.ethers.getContractFactory("BallotOpen");
      const ballotOpen = await BallotOpen.connect(voter1).deploy(
        _archiveAddress,
        _title,
        _metainfo,
        _votingDays
      );
      const ballotOpenContract = await ballotOpen.deployed();

      assert(
        ballotOpenContract.address !== "",
        "Expected non-null address on deployment, got ''"
      );
    }
  });
  it("Deploy 1000x BallotOpen - 1x Signer", async () => {
    const [voter1] = await ethers.getSigners();
    let nrContracts = 1000;

    const BallotArchive = await hre.ethers.getContractFactory("BallotArchive");
    const ballotArchive = await BallotArchive.deploy();
    const ballotArchiveContract = await ballotArchive.deployed();
    for (var i = 0; i < nrContracts; i++) {
      _archiveAddress = ballotArchiveContract.address;
      _title = generateString(10);
      _metainfo = generateString(10);
      _votingDays = 1;

      const BallotOpen = await hre.ethers.getContractFactory("BallotOpen");
      const ballotOpen = await BallotOpen.connect(voter1).deploy(
        _archiveAddress,
        _title,
        _metainfo,
        _votingDays
      );
      const ballotOpenContract = await ballotOpen.deployed();

      assert(
        ballotOpenContract.address !== "",
        "Expected non-null address on deployment, got ''"
      );
    }
  });
});
