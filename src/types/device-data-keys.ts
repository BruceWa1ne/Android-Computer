import type { BaseInfo } from './base-info'
import type { InjectionKey, Ref } from 'vue'

export const BaseInfoKey = Symbol('baseInfo') as InjectionKey<Ref<Partial<BaseInfo>>>
export const OperationValKey = Symbol('operationVal') as InjectionKey<Ref<number>>
