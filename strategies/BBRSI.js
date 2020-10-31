
/*

  BB strategy - okibcn 2018-01-03  */

// helpers
var _ = require('lodash');
var log = require('../core/log.js');
const moment = require('moment')

var BB = require('./indicators/BB.js');
var rsi = require('./indicators/RSI.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function () {
  this.name = 'BB';
  this.trend = {
    zone: 'none',  // none, top, high, low, bottom
    duration: 0,
    persisted: false
  };

  this.prevCandlesPositivesCounter = 0
  this.preAction = 'sell'

  this.candlePrev = {
    start: 0,
    open: 1,
    high: 2,
    low: 1,
    close: 1,
    vwp: 1,
    volume: 1,
    trades: 1,
    positive: false,
    prevPositiveCounter: 0
  }

  this.requiredHistory = this.tradingAdvisor.historySize;
  this.candleCount = 0;

  // define the indicators we need
  this.addIndicator('bb', 'BB', this.settings.bbands);
  this.addIndicator('rsi', 'RSI', this.settings);

  this.addTulipIndicator('macd', 'macd', {
    optInFastPeriod: this.settings.macd.fast,
    optInSlowPeriod: this.settings.macd.slow,
    optInSignalPeriod: this.settings.macd.signal
  });

  this.addTulipIndicator('bb', 'bbands', {
    optInTimePeriod: this.settings.bb.period,
    optInNbStdDevs: this.settings.bb.stdDevs
  });

}


// for debugging purposes log the last
// calculated parameters.
method.log = function (candle) {
  // var digits = 8;
  // var BB = this.indicators.bb;
  // //BB.lower; BB.upper; BB.middle are your line values 

  // log.debug('______________________________________');
  // log.debug('calculated BB properties for candle ', this.nsamples);

  // if (BB.upper > candle.close) log.debug('\t', 'Upper BB:', BB.upper.toFixed(digits));
  // if (BB.middle > candle.close) log.debug('\t', 'Mid   BB:', BB.middle.toFixed(digits));
  // if (BB.lower >= candle.close) log.debug('\t', 'Lower BB:', BB.lower.toFixed(digits));
  // log.debug('\t', 'price:', candle.close.toFixed(digits));
  // if (BB.upper <= candle.close) log.debug('\t', 'Upper BB:', BB.upper.toFixed(digits));
  // if (BB.middle <= candle.close) log.debug('\t', 'Mid   BB:', BB.middle.toFixed(digits));
  // if (BB.lower < candle.close) log.debug('\t', 'Lower BB:', BB.lower.toFixed(digits));
  // log.debug('\t', 'Band gap: ', BB.upper.toFixed(digits) - BB.lower.toFixed(digits));

  // var rsi = this.indicators.rsi;

  // log.debug('calculated RSI properties for candle:');
  // log.debug('\t', 'rsi:', rsi.result.toFixed(digits));
  // log.debug('\t', 'price:', candle.close.toFixed(digits));
}

method.check = function (candle) {
  var BB = this.indicators.bb;
  var price = candle.close;
  this.candleCount++;

  candle.positive = (candle.close > candle.open) ? true : false
  candle.diffPercentageCandlePrev = (((candle.close / this.candlePrev.close) * 100) - 100).toFixed(2)

  if (this.candlePrev.positive && candle.positive) {
    this.prevCandlesPositivesCounter++
  } else {
    this.prevCandlesPositivesCounter = 0
  }

  candle.prevCandlesPositivesCounter = this.prevCandlesPositivesCounter

  var rsi = this.indicators.rsi;
  var rsiVal = rsi.result;

  let macd = this.tulipIndicators.macd.result
  macd.diff = (macd.macd/macd.macdSignal).toFixed(2);

  let bb = this.tulipIndicators.bb.result

  // price Zone detection
  var zone = 'none';
  if (price >= BB.upper) zone = 'top';
  if ((price < BB.upper) && (price >= BB.middle)) zone = 'high';
  if ((price > BB.lower) && (price < BB.middle)) zone = 'low';
  if (price <= BB.lower) zone = 'bottom';
  log.debug('current zone:  ', zone);
  log.debug('current trend duration:  ', this.trend.duration);

  if (this.trend.zone == zone) {
    this.trend = {
      zone: zone,  // none, top, high, low, bottom
      duration: this.trend.duration+1,
      persisted: true
    }
  }
  else {
    this.trend = {
      zone: zone,  // none, top, high, low, bottom
      duration: 0,
      persisted: false
    }
  }

  if (this.requiredHistory < this.candleCount) {
    if (this.preAction === 'sell') {
        // BUY
        if (macd.diff > 2 && macd.macd > macd.macdSignal) {
            this.advice('long')
            this.preAction = 'buy'
    
            console.log("BUY - %s - MACD: %s - SIGNAL: %s - HISTOGRAM: %s - Close: %s - DIFF %s", candle.start.format("DD-MM-YYYY HH"), macd.macd.toFixed(0), macd.macdSignal.toFixed(0), macd.macdHistogram.toFixed(0), candle.close.toFixed(0), macd.diff)
            // console.log(bb)
            // console.log(candle)
        }
    
     } else {
        // SELL
        if (macd.macd < macd.macdSignal) {
            this.advice('short')
            this.preAction = 'sell'
    
            console.log("SELL - %s - MACD: %s - SIGNAL: %s - HISTOGRAM: %s - Close: %s - DIFF %s", candle.start.format("DD-MM-YYYY HH"), macd.macd.toFixed(0), macd.macdSignal.toFixed(0), macd.macdHistogram.toFixed(0), candle.close.toFixed(0), macd.diff)
        }
    
     }
    
  }



//   if (this.settings.trailingstop.enabled) {
//     if (macd.diff > 1 && macd.macd > macd.macdSignal && candle.close > bb.bbandsLower && candle.close < bb.bbandsMiddle) {
//         this.advice({
//             direction: 'long', // or short
//             trigger: { // ignored when direction is not "long"
//               type: 'trailingStop',
//               trailPercentage: this.settings.trailingstop.percentage
//             }
//         });
    
//         console.log("%s - MACD: %s - SIGNAL: %s - HISTOGRAM: %s - Close: %s - DIFF %s", moment(candle.start).format("DD-MM-YYYY HH"), macd.macd.toFixed(0), macd.macdSignal.toFixed(0), macd.macdHistogram.toFixed(0), candle.close.toFixed(0), macd.diff)
//         console.log(bb)    
//     }
//   } 

//   if (this.settings.trailingstop.enabled) {
//     if (price <= BB.lower && rsiVal <= this.settings.thresholds.low && this.candle.prevCandlesPositivesCounter >= 1) {
//         this.advice({
//             direction: 'long', // or short
//             trigger: { // ignored when direction is not "long"
//               type: 'trailingStop',
//               trailPercentage: this.settings.trailingstop.percentage
//             }
//         });

//         //console.log(candle.diffPercentageCandlePrev, candle.prevCandlesPositivesCounter)
//         console.log("%s - Short: %s - Long: %s - Signal: %s - Result: %s - Diff: %s", moment(candle.start).format("DD-MM-YYYY"), macd.short.result.toFixed(0), macd.long.result.toFixed(0), macd.signal.result.toFixed(0), macd.result.toFixed(0), macd.diff.toFixed(0))
//     }
//   } else {
//     if (price <= BB.middle && rsiVal <= this.settings.thresholds.low && this.trend.duration >= this.settings.thresholds.persistence) {
//         this.advice('long')
//       }
//       if (price >= BB.upper && rsiVal >= this.settings.thresholds.high) {
//         this.advice('short')
//       }
//   }

  this.candlePrev = candle

}

// Optional for executing code
// after completion of a backtest.
// This block will not execute in
// live use as a live gekko is
// never ending.
method.end = function() {
    // your code!
  }
  
module.exports = method;