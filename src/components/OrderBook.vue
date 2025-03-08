<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Order from './Order.vue';
import LastPrice from './LastPrice.vue';

const currentCurrency = ref('USD');
const socket = ref(null);
const toShowOrderNum = ref(8);
const currentSeqNum = ref(null);
const asks = ref(null);
const bids = ref(null);

const toShowAsks = computed(() => Array.from(asks?.value || []).slice(0, toShowOrderNum.value));
const toShowBids = computed(() => Array.from(bids?.value || []).slice(0, toShowOrderNum.value));

const askTotalVolume = computed(() => {
  let total = 0;
  asks?.value.forEach((value) => {
    total += Number(value);
  });
  return total;
});

const bidTotalVolume = computed(() => {
  let total = 0;
  bids?.value.forEach((value) => {
    total += Number(value);
  });
  return total;
});

const askTotals = computed(() => {
  let totals = [];
  const askArray = Array.from(asks?.value);

  for (let i = askArray.length - 1; i >= 0; i--) {
    const value = askArray[i][1];
    const previousTotal = totals[totals.length - 1]?.[1] || 0;
    const nextTotal = Number(value) + previousTotal;

    totals.push([askArray[i][0], nextTotal]);
  }

  return new Map(totals);
});

const bidTotals = computed(() => {
  let totals = [];

  bids?.value.forEach((value, key) => {
    totals.push([key, Number(value) + (totals[totals.length - 1]?.[1] || 0)]);
  });
  return new Map(totals);
});

onMounted(() => {
  connectSocket();
});

const connectSocket = () => {
  socket.value = new WebSocket('wss://ws.btse.com/ws/oss/futures');

  socket.value.onopen = () => {
    const subscriptionMessage = JSON.stringify({
      op: 'subscribe',
      args: ['update:BTCPFC'],
    });
    socket.value.send(subscriptionMessage);
  };

  socket.value.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data?.data?.type) {
      processOrderBook(data);
    }
  };

  socket.value.onerror = () => {
    socket.value.close();
    connectSocket();
  };
};

const processOrderBook = (data) => {
  const newAsks = data?.data?.asks || [];
  const newBids = data?.data?.bids || [];
  switch (data.data.type) {
    case 'snapshot':
      currentSeqNum.value = data.data.seqNum;
      asks.value = new Map(newAsks);
      bids.value = new Map(newBids);
      break;
    case 'delta':
      if (newAsks.length) {
        newAsks.forEach((ask) => {
          const price = ask[0];
          const size = ask[1];
          if (size === '0') {
            asks.value.delete(price);
          } else {
            asks.value.set(price, size);
          }
        });
        asks.value = new Map([...asks.value].sort(([keyA], [keyB]) => keyB - keyA));
      }
      if (newBids.length) {
        newBids.forEach((bid) => {
          const price = bid[0];
          const size = bid[1];
          if (size === '0') {
            bids.value.delete(price);
          } else {
            bids.value.set(price, size);
          }
        });
        bids.value = new Map([...bids.value].sort(([keyA], [keyB]) => keyB - keyA));
      }

      if (currentSeqNum.value !== data.data.prevSeqNum) {
        socket.value.close();
        connectSocket();
      } else {
        currentSeqNum.value = data.data.seqNum;
      }
      break;
    default:
      break;
  }
};

onUnmounted(() => {
  if (socket.value) {
    socket.value.close();
  }
});
</script>

<template>
  <div class="order-book">
    <div class="header">Order Book</div>
    <div class="content">
      <div class="quotes-header quotes-grid">
        <p>Price ({{ currentCurrency }})</p>
        <p>Size</p>
        <p>Total</p>
      </div>

      <div class="ask-quotes">
        <Order
          v-for="[key, value] in toShowAsks"
          isAsk
          :price="key"
          :size="value"
          :total="`${askTotals.get(key) || 0}`"
          :totalVolume="askTotalVolume"
          :key="key"
        ></Order>
      </div>
      <LastPrice></LastPrice>
      <div class="bid-quotes">
        <Order
          v-for="[key, value] in toShowBids"
          :price="key"
          :size="value"
          :total="`${bidTotals.get(key) || 0}`"
          :totalVolume="bidTotalVolume"
          :key="key"
        ></Order>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.order-book {
  background: #131b29;

  .header {
    padding: 20px;
    color: #f0f4f8;
    font-size: 20px;
    border-bottom: 1px solid gray;
  }

  .quotes-header {
    color: #8698aa;
    padding: 18px 22px 0;
    font-size: 18px;
  }

  .ask-quotes,
  .bid-quotes {
    color: white;
    padding: 18px 0;
    line-height: 2rem;
    font-size: 18px;
    font-weight: bold;
  }

  ::v-deep .quotes-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 2fr;

    > :nth-child(2),
    > :nth-child(3) {
      width: 100%;
      text-align: right;
      padding-right: 8px;
    }
  }
}
</style>
