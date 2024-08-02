import pandas as pd
from matplotlib import pyplot as plt

# Read CSV into pandas
data = pd.read_csv(r"Performance.spec.csv")
data.head()
df = pd.DataFrame(data)

print(df)

def generateTPSBarChart(filter):
    df_filtered = df[df['testcase'] == filter]
    df_sorted = df_filtered.sort_values(by=['testcase', 'voters'])
    df_indexed = df_sorted[['testcase', 'TPS', 'voters']]
    df_indexed.plot(kind='bar', x='voters', rot=0)
    plt.xlabel("Voters [#]")
    plt.ylabel("Time required [s]")
    plt.savefig('TPSBarChart_' + filter + ".png")

def generateCEthBarChart(filter):
    df_filtered = df[df['testcase'] == filter]
    
    df_sorted = df_filtered.sort_values(by=['testcase', 'voters'])
    df_indexed = df_sorted[['testcase', 'cEth', 'voters']]
    df_indexed.plot(kind='bar', x='voters', rot=0)
    plt.xlabel("Voters [#]")
    plt.ylabel("Cost in Ethereum-Tokens [ETH]")
    plt.savefig('CEthBarChart_' + filter + ".png")

def generateCLinkBarChart(filter):
    df_filtered = df[df['testcase'] == filter]
    df_sorted = df_filtered.sort_values(by=['testcase', 'voters'])
    df_indexed = df_sorted[['testcase', 'cLink', 'voters']]
    df_indexed.plot(kind='bar', x='voters', rot=0)
    plt.xlabel("Voters [#]")
    plt.ylabel("Cost in Chainlink-Tokens [LINK]")
    plt.savefig('CLinkBarChart_' + filter + ".png")


generateTPSBarChart('ArchiveCreation')
generateCEthBarChart('ArchiveCreation')
generateCLinkBarChart('ArchiveCreation')

generateTPSBarChart('BallotCreation')
generateCEthBarChart('BallotCreation')
generateCLinkBarChart('BallotCreation')

generateTPSBarChart('RegistrarCreation')
generateCEthBarChart('RegistrarCreation')
generateCLinkBarChart('RegistrarCreation')

generateTPSBarChart('VoterCheck')
generateCEthBarChart('VoterCheck')
generateCLinkBarChart('VoterCheck')

generateTPSBarChart('BallotVoting')
generateCEthBarChart('BallotVoting')
generateCLinkBarChart('BallotVoting')
