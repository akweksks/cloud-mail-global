<template>
  <div class="random-prefix-tools">
    <div class="tool-label">
      <span>{{ t('emailPrefix') }}</span>
    </div>
    <div class="tool-actions">
      <el-select
          v-model="mode"
          size="small"
          class="prefix-mode-select"
          :aria-label="t('prefixGenerateMode')"
          :teleported="false"
      >
        <el-option :label="t('prefixModeAlnum')" value="alnum"/>
        <el-option :label="t('prefixModeName')" value="name"/>
        <el-option :label="t('prefixModeNameNumber')" value="nameNumber"/>
      </el-select>
      <el-button class="random-prefix-button" size="small" type="primary" plain @click="fillRandomPrefix">
        <Icon icon="mdi:dice-multiple-outline" width="16" height="16"/>
        <span>{{ t('randomPrefix') }}</span>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from "vue";
import {Icon} from "@iconify/vue";
import {useI18n} from "vue-i18n";
import {generateEmailPrefix} from "@/utils/email-prefix-utils.js";

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  minLength: {
    type: Number,
    default: 8
  },
  fullEmailDomain: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])
const {t} = useI18n()
const mode = ref('alnum')

const prefix = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

function fillRandomPrefix() {
  const value = generateEmailPrefix(mode.value, props.minLength)
  prefix.value = props.fullEmailDomain ? `${value}${props.fullEmailDomain}` : value
}
</script>

<style scoped lang="scss">
.random-prefix-tools {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
}

.tool-label {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 32px;
  white-space: nowrap;
}

.tool-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
  min-width: 0;
}

.prefix-mode-select {
  flex: 1 1 118px;
  min-width: 0;
}

.random-prefix-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex: 0 0 auto;
  min-width: 90px;
  height: 32px;
  padding: 0 10px;
  border-radius: 6px;
}

:deep(.el-select__wrapper) {
  min-height: 32px;
  border-radius: 6px;
}

@media (max-width: 420px) {
  .random-prefix-tools {
    grid-template-columns: 1fr;
    gap: 7px;
  }

  .tool-actions {
    width: 100%;
  }

  .random-prefix-button {
    min-width: 90px;
  }
}
</style>
