<script setup>
import { defineProps, computed, watch, ref } from 'vue';
import formatWithCommas from '../utils/formatWithCommas';

const props = defineProps({
  isAsk: {
    type: Boolean,
    default: false,
  },
  price: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: '',
  },
  total: {
    type: String,
    default: '',
  },
  totalVolume: {
    type: Number,
    default: 0,
  },
});

const isSizeIncrease = ref(false);
const isSizeDecrease = ref(false);

const percentage = computed(() => (props.total / props.totalVolume) * 100);

watch(
  () => props.size,
  (newSize, oldSize) => {
    if (newSize > oldSize) {
      isSizeIncrease.value = true;
      setTimeout(() => {
        isSizeIncrease.value = false;
      }, 200);
    } else if (newSize < oldSize) {
      isSizeDecrease.value = true;
      setTimeout(() => {
        isSizeDecrease.value = false;
      }, 200);
    }
  },
);

const parsedPrice = computed(() => formatWithCommas(props.price));
const parsedSize = computed(() => formatWithCommas(props.size));
const parsedTotal = computed(() => formatWithCommas(props.total));
</script>

<template>
  <div
    class="order quotes-grid"
    :class="{ ask: isAsk, bid: !isAsk }"
  >
    <p class="price">
      {{ parsedPrice }}
    </p>
    <p
      class="size"
      :class="{ increase: isSizeIncrease, decrease: isSizeDecrease }"
      :key="size"
    >
      {{ parsedSize }}
    </p>
    <div class="total">
      <div
        class="total-bar"
        :style="{ width: `${percentage}%` }"
      ></div>
      <p>{{ parsedTotal }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.order {
  transition: all 0.2s;
  padding: 0 22px;

  &:hover {
    background: #1e3059;
  }

  .size {
    transition: all 0.2s;

    &.increase {
      @starting-style {
        background: rgba(0, 177, 93, 0.5);
      }
    }

    &.decrease {
      @starting-style {
        background: rgba(255, 91, 90, 0.5);
      }
    }
  }

  .total {
    position: relative;
    .total-bar {
      position: absolute;
      top: 0;
      bottom: 0;
      right: 0;
    }
  }

  &.ask {
    @starting-style {
      background: rgba(255, 91, 90, 0.5);
    }
    .price {
      color: #ff5b5a;
    }
    .total-bar {
      background-color: rgba(255, 90, 90, 0.12);
    }
  }

  &.bid {
    @starting-style {
      background: rgba(0, 177, 93, 0.5);
    }
    .price {
      color: #00b15d;
    }
    .total-bar {
      background: rgba(16, 186, 104, 0.12);
    }
  }
}
</style>
