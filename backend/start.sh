#!/bin/bash
nohup npm run-script server > server.log 2>&1 &
echo $! > server.pid