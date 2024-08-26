import pandas as pd
import numpy as np
from matplotlib import pyplot as plt

# Read CSV into pandas
data = pd.read_csv(r"Performance.spec.csv")
data.head()
df = pd.DataFrame(data)

def generateScatterPlot(filter: str )-> None:
    df_filtered = df[df['testcase'] == filter]
    df_indexed = df_filtered[['testcase', 'totalTime', 'costEUR']]    
    df_indexed.plot.scatter(x="totalTime",y="costEUR")
    plt.title('Performance metrics for ' + filter)

    plt.xlabel('Time per transaction[s]')
    plt.ylabel('Cost per transaction[€]')

    plt.savefig('Plot_Scatter_' + filter + ".png")

generateScatterPlot('ArchiveCreation')
generateScatterPlot('RegistrarCreation')
generateScatterPlot('BallotCreation')
generateScatterPlot('VoterCheck')
generateScatterPlot('BallotVoting')
