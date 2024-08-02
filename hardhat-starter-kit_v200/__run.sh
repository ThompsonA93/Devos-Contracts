#!/bin/bash
npm run test-devos-performance-sequential
cd test/devos/results/
python3 ChartGenerator.py