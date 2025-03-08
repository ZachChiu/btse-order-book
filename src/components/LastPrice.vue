<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import IconArrowDown from './svg/IconArrowDown.vue';

const socket = ref(null);
const currentLastPrice = ref(0);
const previousLastPrice = ref(0);

const parsedPrice = computed(() => currentLastPrice.value.toLocaleString());
const isPriceUp = computed(() => currentLastPrice.value > previousLastPrice.value);
const isPriceDown = computed(() => currentLastPrice.value < previousLastPrice.value);

onMounted(() => {
  connectSocket();
});

const connectSocket = () => {
  socket.value = new WebSocket('wss://ws.btse.com/ws/futures');

  socket.value.onopen = () => {
    const subscriptionMessage = JSON.stringify({
      op: 'subscribe',
      args: ['tradeHistoryApi:BTCPFC'],
    });
    socket.value.send(subscriptionMessage);
  };

  socket.value.onmessage = (event) => {
    const price = JSON.parse(event.data)?.data?.[0]?.price;
    if (price) {
      previousLastPrice.value = currentLastPrice.value;
      currentLastPrice.value = price;
    }
  };

  socket.value.onerror = () => {
    socket.value.close();
    connectSocket();
  };
};

onUnmounted(() => {
  if (socket.value) {
    socket.value.close();
  }
});
</script>

<template>
  <div
    class="last-price"
    :class="{ 'price-up': isPriceUp, 'price-down': isPriceDown }"
  >
    <div class="wrapper">
      {{ parsedPrice }}
      <IconArrowDown
        v-if="isPriceUp || isPriceDown"
        class="price-trend-icon"
      ></IconArrowDown>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.last-price {
  display: flex;
  align-items: center;
  justify-content: center;
  column-gap: 10px;
  padding: 8px 16px;
  background: rgba(134, 152, 170, 0.12);
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  color: #f0f4f8;
  .wrapper {
    position: relative;
    display: flex;
  }
  .price-trend-icon {
    height: 100%;
    position: absolute;
    right: -30px;
  }

  &.price-up {
    color: #00b15d;
    background: rgba(16, 186, 104, 0.12);

    .price-trend-icon {
      rotate: 180deg;
      stroke: #00b15d;
    }
  }

  &.price-down {
    color: #ff5b5a;
    background: rgba(255, 90, 90, 0.12);
  }
}
</style>
