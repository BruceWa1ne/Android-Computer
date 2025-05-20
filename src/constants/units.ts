import { UnitFormat } from '@/types/units'
import { Ratio } from '@/enum/ratio'

export const UNIT_FORMATS = {
  VOLTAGE: {
    multiply: Ratio.ZeroPointOne,
    unit: 'kV',
    decimals: 2,
  } as UnitFormat,

  CURRENT: {
    multiply: Ratio.ZeroAndOne,
    unit: 'A',
    decimals: 2,
  } as UnitFormat,

  FREQUENCY: {
    multiply: Ratio.ZeroAndOne,
    unit: 'Hz',
    decimals: 2,
  } as UnitFormat,

  ACTIVE_POWER: {
    multiply: Ratio.ZeroAndZeroZeroOne,
    unit: 'kW',
    decimals: 2,
  } as UnitFormat,

  REACTIVE_POWER: {
    multiply: Ratio.ZeroAndZeroZeroOne,
    unit: 'kVar',
    decimals: 2,
  } as UnitFormat,

  POWER_FACTOR: {
    multiply: Ratio.ZeroPointOne,
    unit: '',
    decimals: 2,
  } as UnitFormat,

  DEFAULT: {
    multiply: Ratio.One,
    unit: '',
    decimals: 2,
  } as UnitFormat,
}

export function getUnitFormatByKey(key: string): UnitFormat {
  const formatMap: Record<string, UnitFormat> = {
    f: UNIT_FORMATS.FREQUENCY,

    Uab: UNIT_FORMATS.VOLTAGE,
    Ubc: UNIT_FORMATS.VOLTAGE,
    Uca: UNIT_FORMATS.VOLTAGE,

    ia: UNIT_FORMATS.CURRENT,
    ib: UNIT_FORMATS.CURRENT,
    ic: UNIT_FORMATS.CURRENT,

    yggl_high: UNIT_FORMATS.ACTIVE_POWER,
    yggl_low: UNIT_FORMATS.ACTIVE_POWER,

    wggl_high: UNIT_FORMATS.REACTIVE_POWER,
    wggl_low: UNIT_FORMATS.REACTIVE_POWER,

    glys: UNIT_FORMATS.POWER_FACTOR,
  }

  return formatMap[key] || UNIT_FORMATS.DEFAULT
}
