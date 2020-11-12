<template lang='pug'>
  .contain.roundtrips
    h2 Roundtrips
    table(v-if='roundtrips.length')
      thead
        tr
          th Entry at (UTC)
          th Exit at (UTC)
          th Exposure
          th Entry balance
          th Exit balance
          th P&amp;L
          th Profit
        tr(v-for='rt in roundtrips')
          td {{ fmt(rt.entryAt) }}
          td {{ fmt(rt.exitAt) }}
          td {{ diff(rt.duration) }}
          td {{ round(rt.entryBalance) }}
          td {{ round(rt.exitBalance) }}
          template(v-if="Math.sign(rt.pnl)===-1")
            td.loss {{ rt.pnl.toFixed(2) }}
            td.loss {{ rt.profit.toFixed(2) }}%
          template(v-else)
            td.profit {{ rt.pnl.toFixed(2) }}
            td.profit {{ rt.profit.toFixed(2) }}%
      tfoot
        tr
          template(v-if="Math.sign(totalRoundtripsProfit(roundtrips).pnl)===-1")
            td(colspan='6' class='loss') {{ totalRoundtripsProfit(roundtrips).pnl }}
            td.loss {{ totalRoundtripsProfit(roundtrips).profit }}%
          template(v-else)
            td(colspan='6' class='profit') {{ totalRoundtripsProfit(roundtrips).pnl }}
            td.profit {{ totalRoundtripsProfit(roundtrips).profit }}%
    div(v-if='!roundtrips.length')
      p Not enough data to display
</template>

<script>
import _ from 'lodash'

export default {
  props: ['roundtrips'],
  data: () => {
    return {}
  },
  methods: {
    diff: n => moment.duration(n).humanize(),
    humanizeDuration: (n) => window.humanizeDuration(n),
    fmt: date => {

      // roundtrips coming out of a backtest
      // are unix timestamp, live roundtrips
      // are date strings.
      // TODO: normalize

      let mom;

      if(_.isNumber(date)) {
        mom = moment.unix(date);
      } else {
        mom = moment(date).utc();
      }

      return mom.utc().format('YYYY-MM-DD HH:mm');
    },
    round: n => (+n).toFixed(3),
    totalRoundtripsProfit: roundtrips => {
      let result = {
        totalProfit: 0,
        totalPNL: 0
      }

      _.forEach(roundtrips, element => {
        result.totalPNL += element.pnl
        result.totalProfit += element.profit
      });

      return {
        pnl: result.totalPNL.toFixed(2),
        profit: result.totalProfit.toFixed(2),
      }
    }

  },
  computed: {

  }
}
</script>

<style>

.roundtrips {
  margin-top: 50px;
  margin-bottom: 50px;
}

.roundtrips table {
  width: 100%;
}

.roundtrips table th,
.roundtrips table td {
  border: 1px solid #c6cbd1;
  padding: 8px 12px;
}

.roundtrips table td.loss {
  color: red;
  text-align: right;
}
.roundtrips table td.profit {
  color: green;
  text-align: right;
}

.roundtrips table tr:nth-child(2n) {
  background-color: #f6f8fa;
}

.roundtrips table tfoot td.loss {
  background-color: rgba(255, 0, 0, 0.413);
  text-align: right;
}

.roundtrips table tfoot td.profit {
  background-color: rgba(21, 255, 0, 0.413);
  text-align: right;
}


</style>
