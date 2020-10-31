<template lang='pug'>
#chartWrapper(v-bind:class='{ clickable: !isClicked }')
  .shield(v-on:click.prevent='click')
  svg#chart(width='960', :height='height')
</template>

<script>

import chart from '../../../d3/chart3'
import { draw as drawMessage, clear as clearMessage } from '../../../d3/message'

const MIN_CANDLES = 4;

export default {
  props: ['data', 'height'],

  data: function() {
    return {
      isClicked: false
    }
  },

  watch: {
    data: function() { this.render() },
  },

  created: function() { setTimeout( this.render, 100) },
  beforeDestroy: function() {
    this.remove();
  },

  methods: {
    click: function() {
      this.isClicked = true;
    },
    render: function() {
      this.remove();


      if(_.size(this.data.candles) < MIN_CANDLES) {
        drawMessage('Not enough data to spawn chart');
      } else {
        chart(this.data.candles, this.data.trades, this.height);
      }
    },
    remove: function() {
      d3.select('#chart').html('');
    }
  }
}
</script>

<style>

    #chartWrapper {
        position: relative;
    }

    #chart {
        width: 100%;
        height: 700px;
        font-family: sans-serif;
        font-size: 10px;
    }

    text {
        fill: #000;
    }

    text.symbol {
        fill: #BBBBBB;
    }

    text.coords {
        font-family: sans-serif;
        font-size: 20px
    }

    path {
        fill: none;
        stroke-width: 1;
    }

    path.candle {
        stroke: #000000;
    }

    path.candle.body {
        stroke-width: 0;
    }

    path.candle.up {
        fill: rgba(0, 170, 0, 0.5);
        stroke: rgba(0, 170, 0, 0.5);;
    }

    path.candle.down {
        fill: rgba(255, 0, 0, 0.5);
        stroke: rgba(255, 0, 0, 0.5);
    }

    .close.annotation.up path {
        fill: #00AA00;
    }

    path.volume {
        fill: #DDDDDD;
    }

    .indicator-plot path.line {
        fill: none;
        stroke-width: 1;
    }

    .ma-0 path.line {
        stroke: #53870a;
    }

    .ma-1 path.line {
        stroke: #a50c0c;
    }

    .ma-2 path.line {
        stroke: #000000;
    }

    button {
        position: absolute;
        right: 110px;
        top: 25px;
    }

    path.macd {
        stroke: #0000AA;
    }

    path.signal {
        stroke: #FF9999;
    }

    path.zero {
        stroke: #BBBBBB;
        stroke-dasharray: 0;
        stroke-opacity: 0.5;
    }

    path.difference {
        fill: #BBBBBB;
        opacity: 0.5;
    }

    path.rsi {
        stroke: #000000;
    }

    path.overbought, path.oversold {
        stroke: #FF9999;
        stroke-dasharray: 5, 5;
    }

    path.middle, path.zero {
        stroke: #BBBBBB;
        stroke-dasharray: 5, 5;
    }

    .analysis path, .analysis circle {
        stroke: blue;
        stroke-width: 0.8;
    }

    .trendline circle {
        stroke-width: 0;
        display: none;
    }

    .mouseover .trendline path {
        stroke-width: 1.2;
    }

    .mouseover .trendline circle {
        stroke-width: 1;
        display: inline;
    }

    .dragging .trendline path, .dragging .trendline circle {
        stroke: darkblue;
    }

    .interaction path, .interaction circle {
        pointer-events: all;
    }

    .interaction .body {
        cursor: move;
    }

    .trendlines .interaction .start, .trendlines .interaction .end {
        cursor: nwse-resize;
    }

    .supstance path {
        stroke-dasharray: 2, 2;
    }

    .supstances .interaction path {
        pointer-events: all;
        cursor: ns-resize;
    }

    .mouseover .supstance path {
        stroke-width: 1.5;
    }

    .dragging .supstance path {
        stroke: darkblue;
    }

    .crosshair {
        cursor: crosshair;
    }

    .crosshair path.wire {
        stroke: #DDDDDD;
        stroke-dasharray: 1, 1;
    }

    .crosshair .axisannotation path {
        fill: #DDDDDD;
    }

    .tradearrow path.tradearrow {
        stroke: none;
    }

    .tradearrow path.buy {
        fill: rgb(32, 194, 0);
    }

    .tradearrow path.sell {
        fill: rgb(210, 0, 0);
    }

    .tradearrow path.highlight {
        fill: none;
        stroke-width: 2;
    }

    .tradearrow path.highlight.buy {
        stroke: rgb(58, 152, 0);
    }

    .tradearrow path.highlight.sell {
        stroke: rgb(155, 0, 0);
    }

</style>
