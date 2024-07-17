const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")
const { expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Devos-System basic functionality testing", async function () {
        async function deployDevosSystemFixture() {
            const [owner, voter] = await ethers.getSigners()

            const DevosBallotArchiveFactory = await ethers.getContractFactory("Devos_BallotArchive")
            const DevosBallotArchive = await DevosBallotArchiveFactory
                .connect(owner)
                .deploy()


            const chainId = network.config.chainId
            const linkTokenFactory = await ethers.getContractFactory("LinkToken")
            const linkToken = await linkTokenFactory.connect(owner).deploy()
            const mockOracleFactory = await ethers.getContractFactory("MockOracle")
            const mockOracle = await mockOracleFactory.connect(owner).deploy(linkToken.address)
            const jobId = ethers.utils.toUtf8Bytes("7d80a6386ef543a3abb52817f6707e3b")
            const fee = networkConfig[chainId]["fee"]

            const DevosVoterArchiveFactory = await ethers.getContractFactory("Devos_VoterArchive")
            const DevosVoterArchive = await DevosVoterArchiveFactory
                .connect(owner)
                .deploy(mockOracle.address, linkToken.address, jobId, fee)

            await DevosVoterArchive.DEBUG_setNationalityData(owner.address, "Austria");
            await DevosVoterArchive.DEBUG_setNationalityData(voter.address, "France");

            const DevosBallotFactory = await ethers.getContractFactory("Devos_Ballot")
            const DevosBallot = await DevosBallotFactory
                .connect(owner)
                .deploy(
                    DevosBallotArchive.address,
                    DevosVoterArchive.address,
                    "My title",
                    "My metainformation",
                    "Austria",
                    7
                )

            return { owner, voter, DevosBallotArchive, DevosVoterArchive, DevosBallot }
        }

        describe("#Devos_Ballot", async function () {
            describe("success", async function () {
                it("Should successfully link with BallotArchive and VoterArchive", async function () {
                    const { DevosBallotArchive, DevosVoterArchive, DevosBallot } = await loadFixture(deployDevosSystemFixture);
                    expect(await DevosBallot.ballotArchiveAddress()).equal(DevosBallotArchive.address)
                    expect(await DevosBallot.voterArchiveAddress()).equal(DevosVoterArchive.address)
                })
                it("Should return correct ballot information", async function () {
                    const { owner, DevosBallot } = await loadFixture(deployDevosSystemFixture);
                    ballotInformation = await DevosBallot.ballot();

                    expect(ballotInformation[0]).equal(owner.address);
                    expect(ballotInformation[1]).equal("My title");
                    expect(ballotInformation[2]).equal("My metainformation")
                    expect(ballotInformation[3]).equal("Austria")
                })
                it("Should successfully allow a vote", async function () {
                    const { owner, DevosBallot } = await loadFixture(deployDevosSystemFixture);
                    await DevosBallot.connect(owner).callVote(1);
                    ballotInformation = await DevosBallot.ballot();
                    expect(ballotInformation[6]).equal(1);
                    expect(ballotInformation[7]).equal(0);
                })
            })
            describe("error", async function () {
                it("Should successfully revert illegal vote by nationality", async function () {
                    const { voter, DevosBallot } = await loadFixture(deployDevosSystemFixture);
                    await expect(DevosBallot.connect(voter).callVote(1)).to.be.reverted;
                })
                it("Should successfully revert illegal vote by multiple voting", async function () {
                    const { owner, DevosBallot } = await loadFixture(deployDevosSystemFixture);
                    await expect(DevosBallot.connect(owner).callVote(1)).to.not.be.null;
                    await expect(DevosBallot.connect(owner).callVote(2)).to.be.reverted;
                })
                it("Should successfully revert illegal vote by undefined voting arguement", async function () {
                    const { owner, DevosBallot } = await loadFixture(deployDevosSystemFixture);
                    await expect(DevosBallot.connect(owner).callVote(3)).to.be.reverted;
                })
            })
        })
    })