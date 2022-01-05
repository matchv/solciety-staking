const express = require('express');
const axios = require('axios')
// const redis = require('redis');
const cors = require('cors');
const morgan = require('morgan');
const expressValidator = require('express-validator');
const bodyParser = require('body-parser');
const config = require('config');
const path = require('path')

require('dotenv').config();
const app = express();
const router = require('./routes/router');

//Middlewares
app.use(cors());
app.use(express.json());
app.use(bodyParser.json())
app.use(expressValidator());
app.use(morgan('dev'));

//routes endpoint
app.use('/api', router);

// const rdsClient = redis.createClient();

//Serve static assets if in production
//if (process.env.NODE_ENV === 'production') {
    //Set Static folder
    app.use(express.static(path.join('/root/solmate/frontend/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve('/root/solmate/frontend', 'build', 'index.html'));
    });
//}

const port = process.env.PORT || 9000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

