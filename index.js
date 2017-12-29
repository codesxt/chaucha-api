const graphql_client = require('graphql-request');
const express    = require('express');

const query = `{
  marketOrderBook(marketCode:"CHACLP" limit:1){
    spread
    sell {
      amount
      limitPrice
      accumulated
      accumulatedPrice
    }
    buy {
      amount
      limitPrice
      accumulated
      accumulatedPrice
    }
  }
}`;

graphql_client.request(
  'http://api.orionx.io/graphql', query
).then(
  data => console.log(JSON.stringify(data, null, '\t'))
)

var app        = express();
var router     = express.Router();
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8562;

const API = {
  '/'   : 'This documentation.',
  '/v1' : 'V1 of the API.'
}

const API_V1 = {
  '/'       : 'This documentation.',
  '/prices' : 'Get Chaucha prices from Orionx.IO'
}

router.get('/', function(req, res) {
  res.json(API);
});

router.get('/v1', function(req, res) {
  res.json(API_V1);
});

router.get('/v1/prices', function(req, res) {
  graphql_client.request(
    'http://api.orionx.io/graphql', query
  ).then(
    data => {
      res.json(data);
    }
  )
});

app.use('/api', router);

app.listen(port);
console.log('Magic happens on port ' + port);
