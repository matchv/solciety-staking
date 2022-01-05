const router = require('express').Router();


//===========middlewares and controller

const {
    v2_stake,
} = require('../solmate/v2_stake')

const {
    v2_expand,
} = require('../solmate/v2_expand')

const {
    v2_unstake,
} = require('../solmate/v2_unstake')

const {
    v2_reward,
} = require('../solmate/v2_reward')

const {
    v2_check_expiration,
} = require('../solmate/v2_check_expiration')

const {
    v2_claim,
} = require('../solmate/v2_claim')

//===========route
router.post('/v2_stake', v2_stake);
router.post('/v2_expand', v2_expand);
router.post('/v2_unstake', v2_unstake);
router.post('/v2_reward', v2_reward);
router.post('/v2_check_expiration', v2_check_expiration);
router.post('/v2_claim', v2_claim);

module.exports = router