const { assert } = require("chai");
const { ethers } = require("hardhat");

describe("BallotArchiveTest", function () {
  const zero_address = "0x0000000000000000000000000000000000000000";

  it("Deploy archive onto chain", async () => {
    const BallotArchive = await hre.ethers.getContractFactory("BallotArchive");
    const ballotArchive = await BallotArchive.deploy();
    const ballotArchiveContract = await ballotArchive.deployed();
    assert(
      ballotArchiveContract.address !== "",
      "Expected non-null address on deployment, got ''"
    );
  });
  it("Write and read singular ballot", async () => {
    const BallotArchive = await hre.ethers.getContractFactory("BallotArchive");
    const ballotArchive = await BallotArchive.deploy();
    const ballotArchiveContract = await ballotArchive.deployed();

    var _creator = "0xA6E62310271Dd0f479Fb2e50cc6f4c43355280c8";
    var _ballot = "0xf48cED837d9a4aD05D137055488782853B862cDd";
    const creation = await ballotArchiveContract.createNewBallot(
      _creator,
      _ballot
    );

    const storedBallot = await ballotArchiveContract.getBallotByAddress(
      _ballot
    );
    assert(
      _ballot === storedBallot,
      "Expected address " + _ballot + " but received " + storedBallot
    );
  });
  it("Write and read multiple ballots", async () => {
    const BallotArchive = await hre.ethers.getContractFactory("BallotArchive");
    const ballotArchive = await BallotArchive.deploy();
    const ballotArchiveContract = await ballotArchive.deployed();

    var _creator = "0x73abcE584909D02d59cDC20Ea988277f63864A5f";
    var _ballot1 = "0x576920c331B572ffa619daAf4217049A5455848F";
    var _ballot2 = "0x2AE680fE5C8c4f6F38367C6099E7fd82cD43Bc76";
    var _ballot3 = "0x74909799BdE4c4262F9e308aB0Eb92c785A84549";

    var creation = await ballotArchiveContract.createNewBallot(
      _creator,
      _ballot1
    );
    creation = await ballotArchiveContract.createNewBallot(_creator, _ballot2);
    creation = await ballotArchiveContract.createNewBallot(_creator, _ballot3);

    var storedBallots = await ballotArchiveContract.getBallotsByCreator(
      _creator
    );

    assert(
      storedBallots[0] === _ballot1,
      "Expected address " + _ballot1 + " but received " + storedBallots[0]
    );
    assert(
      storedBallots[1] === _ballot2,
      "Expected address " + _ballot2 + " but received " + storedBallots[1]
    );
    assert(
      storedBallots[2] === _ballot3,
      "Expected address " + _ballot3 + " but received " + storedBallots[2]
    );
  });
  it("Write and read non-existing ballot", async () => {
    const BallotArchive = await hre.ethers.getContractFactory("BallotArchive");
    const ballotArchive = await BallotArchive.deploy();
    const ballotArchiveContract = await ballotArchive.deployed();

    var _ballot = "0x5887D1A31C4aA418D883687FC8895736826bc65f";
    // Attempt to read nonexisting _ballot from chain (defaults to address(zero) )
    var _expectedBallot = await ballotArchiveContract.getBallotByAddress(
      _ballot
    );
    assert(
      _expectedBallot === zero_address,
      "Expected " + zero_address + " but got " + _expectedBallot
    );
  });
});
