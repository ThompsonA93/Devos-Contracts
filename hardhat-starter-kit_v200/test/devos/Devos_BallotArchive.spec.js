const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")
const { expect } = require("chai")
const { generateString, generateNationality, generateVotingDays } = require("../../helper-functions")


!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Devos-System basic functionality testing", async function () {
        async function deployBallotArchiveFixture() {
            const [deployer] = await ethers.getSigners()

            const DevosBallotArchiveFactory = await ethers.getContractFactory("Devos_BallotArchive")
            const DevosBallotArchive = await DevosBallotArchiveFactory
                .connect(deployer)
                .deploy()

            return { deployer, DevosBallotArchive }
        }

        async function deployDevosSystemFixture() {
            const [deployer] = await ethers.getSigners()

            const DevosBallotArchiveFactory = await ethers.getContractFactory("Devos_BallotArchive")
            const DevosBallotArchive = await DevosBallotArchiveFactory
                .connect(deployer)
                .deploy()

            const chainId = network.config.chainId
            const linkTokenFactory = await ethers.getContractFactory("LinkToken")
            const linkToken = await linkTokenFactory.connect(deployer).deploy()
            const mockOracleFactory = await ethers.getContractFactory("MockOracle")
            const mockOracle = await mockOracleFactory.connect(deployer).deploy(linkToken.address)
            const jobId = ethers.utils.toUtf8Bytes("7d80a6386ef543a3abb52817f6707e3b")
            const fee = networkConfig[chainId]["fee"]

            const DevosVoterArchiveFactory = await ethers.getContractFactory("Devos_VoterArchive")
            const DevosVoterArchive = await DevosVoterArchiveFactory
                .connect(deployer)
                .deploy(mockOracle.address, linkToken.address, jobId, fee)

            const DevosBallotFactory = await ethers.getContractFactory("Devos_Ballot")
            const DevosBallotOne = await DevosBallotFactory
                .connect(deployer)
                .deploy(
                    DevosBallotArchive.address,
                    DevosVoterArchive.address,
                    generateString(10),
                    generateString(10),
                    generateNationality(),
                    generateVotingDays(14)
                )

            const DevosBallotTwo = await DevosBallotFactory
                .connect(deployer)
                .deploy(
                    DevosBallotArchive.address,
                    DevosVoterArchive.address,
                    generateString(10),
                    generateString(10),
                    generateNationality(),
                    generateVotingDays(14)
                )

            const DevosBallotThree = await DevosBallotFactory
                .connect(deployer)
                .deploy(
                    DevosBallotArchive.address,
                    DevosVoterArchive.address,
                    generateString(10),
                    generateString(10),
                    generateNationality(),
                    generateVotingDays(14)
                )

            return { deployer, DevosBallotArchive, DevosVoterArchive, DevosBallotOne, DevosBallotTwo, DevosBallotThree }
        }


        describe("#Devos_BallotArchive", async function () {
            describe("success", async function () {
                it("Should successfully return Devos_BallotArchive address", async function () {
                    const { deployer, DevosBallotArchive } = await loadFixture(deployBallotArchiveFixture);
                    contractAddress = await DevosBallotArchive.archiveAddress();
                    expect(contractAddress).to.not.be.null;
                })
                it("Should successfully return Devos_BallotArchive owner", async function () {
                    const { deployer, DevosBallotArchive } = await loadFixture(deployBallotArchiveFixture);
                    ownerAddress = await DevosBallotArchive.archiveOwner();
                    expect(ownerAddress).equal(deployer.address);
                })


                it("Should successfully return correct amount of ballots", async function () {
                    const { DevosBallotArchive } = await loadFixture(deployDevosSystemFixture);
                    ballotAmount = await DevosBallotArchive.ballotCount();
                    /**
                     * @dev Note that basevalue is 1, as 0 is reserved by design
                     */
                    expect(ballotAmount).equal(4);
                })
                it("Should successfully return addresses of all created ballots", async function () {
                    const { DevosBallotArchive, DevosBallotOne, DevosBallotTwo, DevosBallotThree } = await loadFixture(deployDevosSystemFixture);
                    ballotAddresses = await DevosBallotArchive.getAllBallots();
                    expect(ballotAddresses[0]).equal(DevosBallotOne.address)
                    expect(ballotAddresses[1]).equal(DevosBallotTwo.address)
                    expect(ballotAddresses[2]).equal(DevosBallotThree.address)

                })
                it("Should successfully return existance of ballot by address", async function () {
                    const { DevosBallotArchive, DevosBallotTwo } = await loadFixture(deployDevosSystemFixture);
                    ballotAddress = await DevosBallotArchive.getBallotByAddress(DevosBallotTwo.address)
                    /**
                     * @dev Depends on return value by function. Here, address is returned
                     */
                    expect(ballotAddress).equal(DevosBallotTwo.address);

                })
                it("Should successfully return ballots by owner", async function () {
                    const { deployer, DevosBallotArchive, DevosBallotOne, DevosBallotTwo, DevosBallotThree } = await loadFixture(deployDevosSystemFixture);
                    deployedContractsByCreator = await DevosBallotArchive.getBallotsByCreator(deployer.address)

                    expect(deployedContractsByCreator[0]).equal(DevosBallotOne.address)
                    expect(deployedContractsByCreator[1]).equal(DevosBallotTwo.address)
                    expect(deployedContractsByCreator[2]).equal(DevosBallotThree.address)
                })

            })
        })
    })