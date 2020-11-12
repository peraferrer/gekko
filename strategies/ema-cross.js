var deepEqual = require('deep-equal')
const createTrend = require('trendline')
var FifoArray = require('fifo-array')
var colors = require('colors')

// Let's create our own strategy
var strat = {};

// Prepare everything our strat needs
strat.init = function() {
    this.on("advice", event => {
      console.log(event);
      this.stoplossCounter++
    })

    this.addTulipIndicator('slow', 'ema', {
        optInTimePeriod: this.settings.slow
    })

    this.addTulipIndicator('fast', 'ema', {
        optInTimePeriod: this.settings.fast
    })

    this.addTulipIndicator('trend', 'ema', {
      optInTimePeriod: this.settings.trend
    })

    this.addTulipIndicator('rsi', 'rsi', {
      optInTimePeriod: this.settings.rsi.period
    })

    this.addIndicator('stoploss', 'StopLoss', {
      threshold : this.settings.stoploss.threshold
    });

    this.addTulipIndicator('macd', 'macd', {
      optInFastPeriod: this.settings.macd.fast,
      optInSlowPeriod: this.settings.macd.slow,
      optInSignalPeriod: this.settings.macd.signal
    });  

    this.stoplossCounter = 0
    this.prevCandle = {}
    this.prevCandlePositiveCounter = 0
    this.trends = new FifoArray(100)
    this.trend = 0
    this.trendAngle = 0
    this.prevAction = 'sell'
    this.emaDirection = ''
    this.emaDirectionPrev = ''

    this.requiredHistory = this.tradingAdvisor.historySize;
    this.candleCount = 0;  

}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function(candle) {
    const slow = this.tulipIndicators.slow.result.result
    const fast = this.tulipIndicators.fast.result.result
    const emaDiff = ((fast/slow-1) * 100).toFixed(2)
    let isEmaCross = false

    const trend = this.tulipIndicators.trend.result.result

    const rsi = this.tulipIndicators.rsi.result.result

    let macd = this.tulipIndicators.macd.result
    macd.diff = (macd.macd/macd.macdSignal).toFixed(2);

    // Detecting Ema Cross
    if  (emaDiff > 0) {
      this.emaDirection = 'UP'

      if (this.emaDirection != this.emaDirectionPrev || this.prevAction === 'sell') {
        isEmaCross = true
      }

    } else if (emaDiff <= 0) {
      this.emaDirection = 'DOWN'

      if (this.emaDirection != this.emaDirectionPrev) {
        isEmaCross = true
      }
      
    }
  
    if (this.requiredHistory < this.candleCount) {

      // TRAILING STOP
      if (this.settings.trailingstop.enabled) {

        if (isEmaCross && this.emaDirection === 'UP') {
          this.advice({
            direction: 'long', // or short
            trigger: { // ignored when direction is not "long"
              type: 'trailingStop',
              trailPercentage: this.settings.trailingstop.percentage
                // or:
                // trailValue: 100
            }
          });
          console.log("BUY - %s - MACD: %s - SIGNAL: %s - HISTOGRAM: %s - Close: %s - DIFF %s - RSI: %s - EmaCross: %s".brightGreen, candle.start.format("DD-MM-YYYY HH"), macd.macd.toFixed(0), macd.macdSignal.toFixed(0), macd.macdHistogram.toFixed(0), candle.close.toFixed(0), emaDiff, rsi, this.emaDirection)

        }

      } else {
        // SELL
        if ('buy' === this.prevAction && ((isEmaCross && this.emaDirection === 'DOWN') || rsi < this.settings.rsi.low)) {
          this.advice('short');
          this.prevAction = 'sell'
          console.log("SELL - %s - MACD: %s - SIGNAL: %s - HISTOGRAM: %s - Close: %s - DIFF %s - RSI: %s - EmaCross: %s".red, candle.start.format("DD-MM-YYYY HH"), macd.macd.toFixed(0), macd.macdSignal.toFixed(0), macd.macdHistogram.toFixed(0), candle.close.toFixed(0), emaDiff, rsi, this.emaDirection)

        // BUY  
        } else if ('sell' === this.prevAction && isEmaCross && this.emaDirection === 'UP') {

            if (emaDiff > 0.1) {
              this.advice('long');
              this.prevAction = 'buy'
              console.log("BUY - %s - MACD: %s - SIGNAL: %s - HISTOGRAM: %s - Close: %s - DIFF %s - RSI: %s - EmaCross: %s".brightGreen, candle.start.format("DD-MM-YYYY HH"), macd.macd.toFixed(0), macd.macdSignal.toFixed(0), macd.macdHistogram.toFixed(0), candle.close.toFixed(0), emaDiff, rsi, this.emaDirection)
            }
        }

      }


    //   if (this.settings.stoploss.enabled) {

    //   } else {

    //     if (slow > fast && this.trendPositiveCounter > this.settings.canddlesPositiveTrend) {
    //       this.advice({
    //         direction: 'long', // or short
    //         trigger: { // ignored when direction is not "long"
    //           type: 'trailingStop',
    //           trailPercentage: trailPercentage
                // or:
                // trailValue: 100
    //         }
    //       });
    //     }

    //   }
    }

    this.candleCount++
    
    this.prevCandle = candle
    
    this.prevSlow = slow

    this.trends.push({
      date: this.candle.start,
      ema: trend
    })

    this.trendAngle = createTrend(this.trends, 'ema', 'date')

    console.log(this.trendAngle.slope, trend)

    this.emaDirectionPrev = this.emaDirection


}
  
  
// What happens on every new candle?
strat.update = function(candle) {
  // your code!
//  console.log(candle)
}

// For debugging purposes.
strat.log = function() {
  // your code!
}

// Optional for executing code
// after completion of a backtest.
// This block will not execute in
// live use as a live gekko is
// never ending.
strat.end = function() {
  // your code!
  console.log("Candles: ", this.candleCount)
  console.log("Stop Loss: ", this.stoplossCounter)
  console.log()
  console.log(this.emit)
  
}

module.exports = strat;