/* eslint-disable no-useless-constructor */
import PeriodicSerialManager from '@/utils/periodicSerial'
import TablesManager from '@/utils/tables'
import { useConfigStore } from '@/store/config'
import { Ratio } from '@/enum/ratio'
import { MachineCharacterType } from '@/enum/states'

/**
 * 故障诊断管理器
 */
class FaultDiagnosisManager {
  private static instance: FaultDiagnosisManager

  private constructor() {}

  public static getInstance(): FaultDiagnosisManager {
    if (!FaultDiagnosisManager.instance) {
      FaultDiagnosisManager.instance = new FaultDiagnosisManager()
    }
    return FaultDiagnosisManager.instance
  }

  // 执行故障诊断
  public async executeFaultDiagnosis() {
    const configStore = useConfigStore()
    const baseInfo = PeriodicSerialManager.getBaseInfo()
    const characterList = configStore.mechanicalAlarm || []
    const breakerTempList = configStore.temperatureAlarm.slice(0, 6) || []
    const mainBusTempList = configStore.temperatureAlarm.slice(6, 12) || []
    const partialDischargeList = configStore.partialDischargeAlarm || []

    // 机械特性
    const alarmInfo0: number[] = []
    const res = await TablesManager.selectData()
    if (res && Array.isArray(res) && res.length > 0) {
      const data = res[0].faultMachineCharacter
      if (!data) return
      const machineCharacter = JSON.parse(data)

      for (const key in machineCharacter) {
        alarmInfo0.push(machineCharacter[key].type)
        if (machineCharacter[key].type === MachineCharacterType.EXCEPTION) {
          baseInfo.healthState = '1'
        }
      }
    }

    // 温度
    const alarmInfo1: number[] = []
    const alarm1: string[] = [
      (Number(baseInfo.breakerUpperATemperature) * Ratio.ZeroAndOne).toString(),
      (Number(baseInfo.breakerUpperBTemperature) * Ratio.ZeroAndOne).toString(),
      (Number(baseInfo.breakerUpperCTemperature) * Ratio.ZeroAndOne).toString(),
      (Number(baseInfo.breakerLowerATemperature) * Ratio.ZeroAndOne).toString(),
      (Number(baseInfo.breakerLowerBTemperature) * Ratio.ZeroAndOne).toString(),
      (Number(baseInfo.breakerLowerCTemperature) * Ratio.ZeroAndOne).toString(),
      (Number(baseInfo.mainBusbarATemperature) * Ratio.ZeroAndOne).toString(),
      (Number(baseInfo.mainBusbarBTemperature) * Ratio.ZeroAndOne).toString(),
      (Number(baseInfo.mainBusbarCTemperature) * Ratio.ZeroAndOne).toString(),
      (Number(baseInfo.outletCableATemperature) * Ratio.ZeroAndOne).toString(),
      (Number(baseInfo.outletCableBTemperature) * Ratio.ZeroAndOne).toString(),
      (Number(baseInfo.outletCableCTemperature) * Ratio.ZeroAndOne).toString(),
      (Number(baseInfo.breakerTemperature) * Ratio.ZeroAndOne).toString(),
      (Number(baseInfo.cableTemperature) * Ratio.ZeroAndOne).toString(),
    ]

    const combinedTempList = [
      ...breakerTempList,
      ...mainBusTempList,
      partialDischargeList[0],
      partialDischargeList[5],
    ]

    for (let i = 0; i < alarm1.length; i++) {
      if (i < 6) {
        alarm1[i] = Math.abs(Number(alarm1[i]) - Number(alarm1[12])).toFixed(2)
      } else if (i >= 6 && i < 12) {
        alarm1[i] = Math.abs(Number(alarm1[i]) - Number(alarm1[13])).toFixed(2)
      }

      if (
        combinedTempList[i].upperLimit < parseFloat(alarm1[i]) &&
        parseFloat(alarm1[i]) < combinedTempList[i].upperLimit * Ratio.OnePointTwo
      ) {
        alarmInfo1.push(MachineCharacterType.ALARM) // 告警
      } else if (parseFloat(alarm1[i]) >= combinedTempList[i].upperLimit * Ratio.OnePointTwo) {
        alarmInfo1.push(MachineCharacterType.EXCEPTION) // 异常
        baseInfo.healthState = '1'
      } else {
        alarmInfo1.push(MachineCharacterType.NORMAL) // 正常
      }
    }

    // 局放
    const alarmInfo2: number[] = []
    const alarm2: string[] = [
      (Number(baseInfo.breakerHumidity) * Ratio.ZeroPointOne).toString(),
      baseInfo.ultrasonicVal,
      baseInfo.transientGroundWaveVal,
      (Number(baseInfo.cableHumidity) * Ratio.ZeroPointOne).toString(),
    ]

    const partialList1 = partialDischargeList.slice(1, 5)

    for (let i = 0; i < alarm2.length; i++) {
      if (parseFloat(alarm2[i]) > partialList1[i].upperLimit) {
        alarmInfo2.push(MachineCharacterType.EXCEPTION) // 异常
        baseInfo.healthState = '1'
      } else {
        alarmInfo2.push(MachineCharacterType.NORMAL) // 正常
      }
    }

    return [[...alarmInfo1, ...alarmInfo2], alarmInfo2.slice(1, 3)]
  }
}

export default FaultDiagnosisManager.getInstance()
