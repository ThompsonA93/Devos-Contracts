#!/bin/bash
rm test/devos/results/*.png
rm test/devos/results/*.csv

for i in {1..10}; do npm run test-devos-performance; done
for i in {1..10}; do npm run test-devos-scalability; done

cd test/devos/results
python3 Tabular.py
python3 Plot.py