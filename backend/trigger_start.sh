#!/bin/bash
nohup node solmate/v2_reward_trigger.js > reward_trigger.log 2>&1 &
echo $! > reward_trigger.pid