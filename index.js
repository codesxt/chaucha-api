const graphql_client = require('graphql-request');
const express    = require('express');
const LinearRegression = require('shaman').LinearRegression;

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

const historyQuery = `{
  marketStats(marketCode:"CHACLP" aggregation:m1) {
    _id
    open
    close
    high
    low
    variation
    average
    volume
    volumeSecondary
    count
    fromDate
    toDate
  }
}`;

var tendency = 0;

graphql_client.request(
  'http://api.orionx.io/graphql', query
).then(
  data => {
    //console.log(JSON.stringify(data, null, '\t'))
  }
)


var updateTendency = () => {
  graphql_client.request(
    'http://api.orionx.io/graphql', historyQuery
  ).then(
    data => {
      //console.log(JSON.stringify(data, null, '\t'));
      //console.log(data.marketStats.length);
      let prices = [];
      let priceSum = 0;
      let count = 0;
      data.marketStats.forEach((item) => {
        prices.push(item.average);
        if(item.average!=null){
          priceSum += item.average;
          count++;
        }
      });
      let avgPrice = Math.round(priceSum / count);
      let fixedPrices = [];
      let indices     = [];
      prices.forEach((item, index) => {
        if(item){
          fixedPrices.push(item);
          indices.push(index);
        }
      });
      var lr = new LinearRegression(indices,fixedPrices);
      lr.train(function(err) {
        if (err) { throw err; }
        tendency = lr.theta.elements[1][0];
        console.log("["+new Date()+"] Tendency updated at: " + tendency);
      });
    }
  )
}

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

router.get('/v1/tendency', function(req, res) {
  res.json({
    tendency: tendency
  });
});

updateTendency();
setInterval(() => {
  updateTendency();
}, 1000*60*5);

app.use('/api', router);

app.listen(port);
console.log('Server is running on port: ' + port);
