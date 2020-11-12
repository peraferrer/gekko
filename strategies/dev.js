const deepEqual = require('deep-equal')
const createTrend = require('trendline')
const FifoArray = require('fifo-array')
const colors = require('colors')


// Let's create our own strategy
const strat = {};

// Prepare everything our strat needs
strat.init = function() {
    this.on("advice", event => {
      //console.log(event);
      this.stoplossCounter++
    })

    this.addTulipIndicator('slow', 'ema', {
        optInTimePeriod: this.settings.ema.slow
    })

    this.addTulipIndicator('fast', 'ema', {
        optInTimePeriod: this.settings.ema.fast
    })

    this.addTulipIndicator('trend', 'ema', {
      optInTimePeriod: this.settings.ema.trend
    })

    this.addTulipIndicator('vwma', 'vwma', {
        optInTimePeriod: this.settings.vwma.period
    })

    this.addTulipIndicator('rsi', 'rsi', {
      optInTimePeriod: this.settings.rsi.period
    })

    this.addTulipIndicator('bb', 'bbands', {
        optInTimePeriod: this.settings.bb.period,
        optInNbStdDevs: this.settings.bb.mult
    })

    this.addIndicator('stoploss', 'StopLoss', {
      threshold : this.settings.stoploss.threshold
    });

    this.addTulipIndicator('macd', 'macd', {
      optInFastPeriod: this.settings.macd.fast,
      optInSlowPeriod: this.settings.macd.slow,
      optInSignalPeriod: this.settings.macd.signal
    });

    this.requiredHistory = this.tradingAdvisor.historySize
    this.candleCount = 0

    this.action = 'BUY'

    this.candles = new FifoArray(5)

    this.candleCountPrevDown = 0

    this.countTrades = 0

    this.buyLast = {
        candle_id: 0,
        candle: {},
        maxPrice: 0
    }
    this.sellLast = {
        candle_id: 0,
        canddle: {}
    }

    this.percentage = (val1, val2) => {
        return Number(((val1/val2-1) * 100).toFixed(2))
    }

    this.angle1 = (p1, p2) => {
        return 360 + Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI
    }

    this.angle = (p1, p2) => {
        var dy = p2.y - p1.y;
        var dx = p2.x - p1.x;
        var theta = Math.atan2(dy, dx); // range (-PI, PI]
        theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
        return theta;
    }

    this.angle360 = (p1, p2) => {
        var theta = this.angle(p1, p2); // range (-180, 180]
        if (theta < 0) theta = 360 + theta; // range [0, 360)
        return theta;
    }

    this.buy = (candle) => {
        this.advice('long');
        this.countTrades++
        this.action = 'SELL'
        this.buyLast.candle_id = this.candleCount
        this.buyLast.candle = candle
        this.buyLast.maxPrice = candle.close
        console.log("BUY - %s - EmaDiff: %s - EmaDiffCfg: %s - Close: %s - EmaSlow: %s - VWMA: %s - Volume: %s".brightGreen, this.countTrades, candle.ema.diffFastSlow, this.settings.ema.diffFastLow, candle.close, candle.ema.slow.toFixed(2), candle.vwma.toFixed(2), candle.volume.toFixed(2))
    }

    this.sell = (candle) => {
        this.advice('short');
        this.countTrades++
        this.action = 'BUY'
        this.sellLast.candle_id = this.candleCount
        this.sellLast.candle = candle
    }

}

// What happens on every new candle?
strat.update = function(candle) {
    candle.id = this.candleCount

    candle.ema = {
        slow: this.tulipIndicators.slow.result.result,
        fast: this.tulipIndicators.fast.result.result,
        diffFastSlow: this.percentage(this.tulipIndicators.fast.result.result, this.tulipIndicators.slow.result.result),
        trend: this.tulipIndicators.trend.result.result
    }

    candle.vwma = this.tulipIndicators.vwma.result.result

    candle.rsi = this.tulipIndicators.rsi.result.result

    candle.bb = this.tulipIndicators.bb.result

    candle.macd = this.tulipIndicators.macd.result
    candle.macd.diff = this.percentage(candle.macd.macd, candle.macd.macdSignal)

    // Canddle Direction
    if (candle.close >= candle.open) {
        candle.direction = 'UP'
    } else {
        candle.direction = 'DOWN'
    }

    // Difference open and close in percentage
    candle.diffOpenClose = this.percentage(candle.close, candle.open)

    // Quantity of previous candles towards dow
    if (candle.direction === 'DOWN') {
        this.candleCountPrevDown++
    } else {
        this.candleCountPrevDown = 0
    }

    // Update Buy maxPrice
    if (this.action === 'SELL') {
        if (candle.direction === 'UP') {
            if (candle.close > this.buyLast.maxPrice) {
                this.buyLast.maxPrice = candle.close
            }
        }
    }

    // WARMUP PERIOD
    if (this.candleCount > this.requiredHistory) {
        candle.angleEmaTrend = this.angle360({
            x: this.candles[0].id,
            y: this.candles[0].ema.trend
        }, {
            x: candle.id,
            y: candle.ema.trend
        })

    }

    this.candles.push(candle)

}

// For debugging purposes.
strat.log = function() {
  // your code!
}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function(candle) {

    // WARMUP PERIOD
    if (this.candleCount > this.requiredHistory) {

        // BUY
        if (this.action === 'BUY') {

            if (candle.angleEmaTrend > 60) {

                if (candle.ema.diffFastSlow > this.settings.ema.diffFastLow) {

                    if (candle.ema.slow > candle.ema.trend) {

                        if (candle.close > candle.ema.slow) {

                            if (candle.volume > candle.vwma) {
                                this.buy(candle)
                            }

                        }

                    }

                }

            }

            // if (candle.ema.diffFastSlow > this.settings.ema.diffFastLow && candle.close > candle.ema.slow) {
            //     this.buy(candle)
            // }

        // SELL
        } else if (this.action === 'SELL') {

            switch (this.settings.strategie) {

                case 1:
                    // Negative ema trend
                    if (candle.angleEmaTrend > 270 && candle.angleEmaTrend < 330) {
                        this.sell(candle)
                        console.log("Negative Ema Trend - %s - Angle: %s".red, this.countTrades, candle.angleEmaTrend)
                    }
                    break;

                case 2:
                    // Stop loss over buy
                    if (this.percentage(candle.close, this.buyLast.candle.close) < this.settings.stoploss.overBuy) {
                        this.sell(candle)
                        console.log("Stop Loss Buy - %s - Close: %s - CloseBuy: %s - DiffClose: %s".red, this.countTrades, candle.close, this.buyLast.candle.close, this.percentage(candle.close, this.buyLast.candle.close))

                    // Trailing stop over the max price
                    } else if (this.percentage(candle.close, this.buyLast.maxPrice) < this.settings.trailingstop.overMaxPrice) {
                        this.sell(candle)
                        console.log("Trailing Stop - %s - Close: %s - BuyMaxPrice: %s - Diff: %s".red, this.countTrades, candle.close, this.buyLast.maxPrice, this.percentage(candle.close, this.buyLast.maxPrice))

                    // Closed for down of ema fast
                    } else if (this.percentage(candle.close, candle.ema.fast) < -1) {
                        this.sell(candle)
                        console.log("Ema - %s - Close: %s - EmaFast: %s".red, this.countTrades, candle.close, candle.ema.fast.toFixed(2))

                    // Negative ema trend
                    } else if (candle.angleEmaTrend > 270 && candle.angleEmaTrend < 300) {
                        this.sell(candle)
                        console.log("Negative Ema Trend - %s - Angle: %s".red, this.countTrades, candle.angleEmaTrend)

                    // Stop abrupt loss
                    } else if (candle.diffOpenClose < this.settings.stoploss.abruptLoss) {
                        this.sell(candle)
                        console.log("Stop Abrupt Loss - %s - DiffOpenClose: %s".red, this.countTrades, candle.diffOpenClose)

                    }
                    break;

            }

        }

    }

    this.candleCount++

}

// Optional for executing code
// after completion of a backtest.
// This block will not execute in
// live use as a live gekko is
// never ending.
strat.end = function() {
  // your code!
}

module.exports = strat;
