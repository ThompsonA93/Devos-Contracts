const BallotArchiveContract = artifacts.require('BallotArchive');

contract('BallotArchive', () => {
    it('Test proper deployment onto chain', async() => {
        const ballotArchiveContract = await BallotArchiveContract.deployed();
        console.log(ballotArchiveContract.address);
        assert(ballotArchiveContract.address !== '');
    });
});
