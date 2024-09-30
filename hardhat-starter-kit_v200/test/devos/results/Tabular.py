import pandas as pd
import csv

# Read CSV into pandas
data = pd.read_csv(r"Scalability.spec.csv")
data.head()
df = pd.DataFrame(data)

def search(filter: str) -> None:
    df_filtered = df[df['testcase'] == filter]
    df_indexed = df_filtered[['testcase', 'totalTime', 'totalEth', 'totalLink', 'costEUR']]    
    set_1 = df_indexed.head(1)
    set_2 = df_indexed.head(10)
    set_3 = df_indexed.head(100)

    # totalTime = TPS, totalEth = cEth, totalLink = cLink
    record_1 = {
        'testcase': filter,
        'tx': set_1.index.size,
        'totalTime': set_1['totalTime'].sum().round(4),
        'totalEth': set_1['totalEth'].sum().round(4),
        'totalLink': set_1['totalLink'].sum().round(4),
        'TPS': ( set_1.index.size / set_1['totalTime'].sum() ).round(4) ,
        'cEth': set_1['totalEth'].mean().round(4),
        'cLink': set_1['totalLink'].mean().round(4),
        'costEUR': set_1['costEUR'].sum().round(4)
    }

    record_10 = {
        'testcase': filter,
        'tx': set_2.index.size,
        'totalTime': set_2['totalTime'].sum().round(4),
        'totalEth': set_2['totalEth'].sum().round(4),
        'totalLink': set_2['totalLink'].sum().round(4),
        'TPS': ( set_2.index.size / set_2['totalTime'].sum() ).round(4) ,
        'cEth': set_2['totalEth'].mean().round(4),
        'cLink': set_2['totalLink'].mean().round(4),
        'costEUR': set_2['costEUR'].sum().round(4)
    }    

    record_100 = {
        'testcase': filter,
        'tx': set_3.index.size,
        'totalTime': set_3['totalTime'].sum().round(4),
        'totalEth': set_3['totalEth'].sum().round(4),
        'totalLink': set_3['totalLink'].sum().round(4),
        'TPS': ( set_3.index.size / set_3['totalTime'].sum() ).round(4) ,
        'cEth': set_3['totalEth'].mean().round(4),
        'cLink': set_3['totalLink'].mean().round(4),
        'costEUR': set_3['costEUR'].sum().round(4)
    }

    with open("Tabular_AggregatedRecords_Scalability.csv", "a", newline="") as f:
        w = csv.DictWriter(f, record_1.keys())
        w.writeheader()
        w.writerow(record_1)
        w.writerow(record_10)
        w.writerow(record_100)

search('ArchiveCreation')
search('RegistrarCreation')
search('BallotCreation')
search('VoterCheck')
search('BallotVoting')



# Read CSV into pandas
data = pd.read_csv(r"Performance.spec.csv")
data.head()
df = pd.DataFrame(data)

def search(filter: str) -> None:
    df_filtered = df[df['testcase'] == filter]
    df_indexed = df_filtered[['testcase', 'totalTime', 'totalEth', 'totalLink', 'costEUR']]    
    set_1 = df_indexed.head(1)
    set_2 = df_indexed.head(10)
    set_3 = df_indexed.head(100)

    # totalTime = TPS, totalEth = cEth, totalLink = cLink
    record_1 = {
        'testcase': filter,
        'tx': set_1.index.size,
        'totalTime': set_1['totalTime'].sum().round(4),
        'totalEth': set_1['totalEth'].sum().round(4),
        'totalLink': set_1['totalLink'].sum().round(4),
        'TPS': ( set_1.index.size / set_1['totalTime'].sum() ).round(4) ,
        'cEth': set_1['totalEth'].mean().round(4),
        'cLink': set_1['totalLink'].mean().round(4),
        'costEUR': set_1['costEUR'].sum().round(4)
    }

    record_10 = {
        'testcase': filter,
        'tx': set_2.index.size,
        'totalTime': set_2['totalTime'].sum().round(4),
        'totalEth': set_2['totalEth'].sum().round(4),
        'totalLink': set_2['totalLink'].sum().round(4),
        'TPS': ( set_2.index.size / set_2['totalTime'].sum() ).round(4) ,
        'cEth': set_2['totalEth'].mean().round(4),
        'cLink': set_2['totalLink'].mean().round(4),
        'costEUR': set_2['costEUR'].sum().round(4)
    }    

    record_100 = {
        'testcase': filter,
        'tx': set_3.index.size,
        'totalTime': set_3['totalTime'].sum().round(4),
        'totalEth': set_3['totalEth'].sum().round(4),
        'totalLink': set_3['totalLink'].sum().round(4),
        'TPS': ( set_3.index.size / set_3['totalTime'].sum() ).round(4) ,
        'cEth': set_3['totalEth'].mean().round(4),
        'cLink': set_3['totalLink'].mean().round(4),
        'costEUR': set_3['costEUR'].sum().round(4)
    }

    with open("Tabular_AggregatedRecords_Performance.csv", "a", newline="") as f:
        w = csv.DictWriter(f, record_1.keys())
        w.writeheader()
        w.writerow(record_1)
        w.writerow(record_10)
        w.writerow(record_100)

search('ArchiveCreation')
search('RegistrarCreation')
search('BallotCreation')
search('VoterCheck')
search('BallotVoting')