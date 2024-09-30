import pandas as pd
from matplotlib import pyplot as plt

data = pd.read_csv(r"Scalability.spec.csv")
data.head()
df = pd.DataFrame(data)

def generateScatterPlot(filter: str )-> None:
    df_filtered = df[df['testcase'] == filter]
    df_indexed = df_filtered[['testcase', 'totalTime', 'costEUR']]    
    df_indexed.plot.scatter(x="totalTime",y="costEUR")
    plt.title('Scalability metrics for ' + filter + '(10x10x10, Parallel)')

    plt.xlabel('Time per transaction[s]')
    plt.ylabel('Cost per transaction[€]')

    plt.savefig('Scalability_Plot_Scatter_' + filter + ".png")

generateScatterPlot('ArchiveCreation')
generateScatterPlot('RegistrarCreation')
generateScatterPlot('BallotCreation')
generateScatterPlot('VoterCheck')
generateScatterPlot('BallotVoting')

data = pd.read_csv(r"Performance.spec.csv")
data.head()
df = pd.DataFrame(data)

def generateScatterPlot(filter: str )-> None:
    df_filtered = df[df['testcase'] == filter]
    df_indexed = df_filtered[['testcase', 'totalTime', 'costEUR']]    
    df_indexed.plot.scatter(x="totalTime",y="costEUR")
    plt.title('Performance metrics for ' + filter + '(10x10, Sequential)')

    plt.xlabel('Time per transaction[s]')
    plt.ylabel('Cost per transaction[€]')

    plt.savefig('Performance_Plot_Scatter_' + filter + ".png")

generateScatterPlot('ArchiveCreation')
generateScatterPlot('RegistrarCreation')
generateScatterPlot('BallotCreation')
generateScatterPlot('VoterCheck')
generateScatterPlot('BallotVoting')
