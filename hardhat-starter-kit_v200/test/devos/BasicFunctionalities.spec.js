const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { networkConfig, developmentChains } = require("../../helper-hardhat-config")
const { expect } = require("chai")


// Generate randomized String
const generateString = (length) =>
    Math.random().toString(32).substring(2, length);

// Randomly chooses from predefined set of nationalities
const generateNationality = () => {
    var nationalities = ["Austria", "Egypt", "Germany", "Japan", "Turkey", "China", "Russia"];
    return nationalities[Math.floor(Math.random() * nationalities.length)];
}

// Generates 1 oder 2 
const generateVote = () => {
    return Math.floor(Math.random() * 2) + 1;
}


!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Devos-System basic functionalities testing", async function () {
        describe("#ETHNETRequests", async function () {
            describe("success", async function() {
                it("Should successfully deploy Devos_Archive", async function(){
                    const devosArchiveFactory = await hre.ethers.getContractFactory("Devos_Archive");
                    const devosArchive = await devosArchiveFactory.deploy();
                    const devosArchiveContract = await devosArchive.deployed();
                    expect(devosArchiveContract).to.not.be.reverted

                })
                it("Should successfully create two Devos_Ballot contract and link it to Devos_Archive", async function () {
                    const [voterOne] = await ethers.getSigners();
                    const chainId = network.config.chainId
                    const linkTokenFactory = await ethers.getContractFactory("LinkToken")
                    const linkToken = await linkTokenFactory.connect(voterOne).deploy()
                    const mockOracleFactory = await ethers.getContractFactory("MockOracle")
                    const mockOracle = await mockOracleFactory.connect(voterOne).deploy(linkToken.address)
                    const jobId = ethers.utils.toUtf8Bytes(networkConfig[chainId]["jobId"])
                    const fee = networkConfig[chainId]["fee"]
                    const devosArchiveFactory = await hre.ethers.getContractFactory("Devos_Archive");
                    const devosArchive = await devosArchiveFactory.deploy();
                    const devosArchiveContract = await devosArchive.deployed();
                    const devosBallotFactory = await hre.ethers.getContractFactory("Devos_Ballot");

                    const devosBallotOne = await devosBallotFactory.connect(voterOne).deploy(
                        devosArchiveContract.address,
                        generateString(10),
                        generateString(10),
                        1,
                        generateNationality(),
                        mockOracle.address,
                        jobId,
                        fee,
                        linkToken.address
                    );
                    const devosBallotOneContract = await devosBallotOne.deployed();

                    const devosBallotTwo = await devosBallotFactory.connect(voterOne).deploy(
                        devosArchiveContract.address,
                        generateString(10),
                        generateString(10),
                        1,
                        generateNationality(),
                        mockOracle.address,
                        jobId,
                        fee,
                        linkToken.address
                    );
                    const devosBallotTwoContract = await devosBallotTwo.deployed();

                    let numberOfContracts = await devosArchiveContract.getAllBallots()
                    expect(numberOfContracts.length).equals(2);
                })
                it("Should succesfully return ballot existence by address", async function (){
                    const [voterOne] = await ethers.getSigners();
                    const chainId = network.config.chainId
                    const linkTokenFactory = await ethers.getContractFactory("LinkToken")
                    const linkToken = await linkTokenFactory.connect(voterOne).deploy()
                    const mockOracleFactory = await ethers.getContractFactory("MockOracle")
                    const mockOracle = await mockOracleFactory.connect(voterOne).deploy(linkToken.address)
                    const jobId = ethers.utils.toUtf8Bytes(networkConfig[chainId]["jobId"])
                    const fee = networkConfig[chainId]["fee"]
                    const devosArchiveFactory = await hre.ethers.getContractFactory("Devos_Archive");
                    const devosArchive = await devosArchiveFactory.deploy();
                    const devosArchiveContract = await devosArchive.deployed();
                    const devosBallotFactory = await hre.ethers.getContractFactory("Devos_Ballot");

                    _archiveAddress = devosArchiveContract.address;
                    _title = generateString(10);
                    _metainfo = generateString(10);
                    _votingDays = 1;
                    _nationality = generateNationality();

                    const devosBallot = await devosBallotFactory.connect(voterOne).deploy(
                        _archiveAddress,
                        _title,
                        _metainfo,
                        _votingDays,
                        _nationality,
                        mockOracle.address,
                        jobId,
                        fee,
                        linkToken.address
                    );
                    const devosBallotContract = await devosBallot.deployed();
                    
                    const requestedContract = await devosArchiveContract.getBallotByAddress(devosBallotContract.address)
                    
                    expect(devosBallotContract.address).equals(requestedContract);
                    
                })


                it("Should successfully allow vote on ballot by one user", async function () {
                    const [voterOne] = await ethers.getSigners();
                    const chainId = network.config.chainId
                    const linkTokenFactory = await ethers.getContractFactory("LinkToken")
                    const linkToken = await linkTokenFactory.connect(voterOne).deploy()
                    const mockOracleFactory = await ethers.getContractFactory("MockOracle")
                    const mockOracle = await mockOracleFactory.connect(voterOne).deploy(linkToken.address)
                    const jobId = ethers.utils.toUtf8Bytes(networkConfig[chainId]["jobId"])
                    const fee = networkConfig[chainId]["fee"]
                    const devosArchiveFactory = await hre.ethers.getContractFactory("Devos_Archive");
                    const devosArchive = await devosArchiveFactory.deploy();
                    const devosArchiveContract = await devosArchive.deployed();
                    const devosBallotFactory = await hre.ethers.getContractFactory("Devos_Ballot");

                    _archiveAddress = devosArchiveContract.address;
                    _title = generateString(10);
                    _metainfo = generateString(10);
                    _votingDays = 1;
                    _nationality = generateNationality();
                    const devosBallot = await devosBallotFactory.connect(voterOne).deploy(
                        _archiveAddress,
                        _title,
                        _metainfo,
                        _votingDays,
                        _nationality,
                        mockOracle.address,
                        jobId,
                        fee,
                        linkToken.address
                    );
                    const devosBallotContract = await devosBallot.deployed();
                    const fundAmount = "1000000000000000000000" // 10**21
                    await linkToken.connect(voterOne).transfer(devosBallotContract.address, fundAmount)
                    
                    const callbackValue = "Austria"
                    await new Promise(async (resolve, reject) => {
                        devosBallotContract.once("FulfilledDataRequest", async () => {
                            const nationality = await devosBallotContract.nationality()
                            // TODO Continue this fuck
                        })
                    })



                })
                it("Should successfully allow vote on ballot by multiple users", async function () {
                    assert(false)

                })
            })
            describe("error", async function(){
                // TODO 
            })
        })

        describe("#SEMNETRequests", async function () {
            describe("success", async function () {
                it("Should successfully make an API request to oracle system", async function () {
                    assert(false)
                })
            })            
            describe("error", async function(){
                it("Should successfully make an API request to oracle system", async function () {
                    assert(false)
                })
            })
        })
    })