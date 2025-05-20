import { ActionData, CoilData, TeData, TimeData, TravelData } from '@/types/angle-converter'
import { AngleConverterDAO } from '@/dao/AngleConverterDAO'
import dayjs from 'dayjs'

/**
 * 动作数据处理器
 * 负责处理和计算动作相关的数据
 */
export class ActionDataProcessor {
  private angleConverterDAO: AngleConverterDAO

  constructor() {
    this.angleConverterDAO = new AngleConverterDAO()
  }

  /**
   * 获取动作时间数据
   * @param coilData 线圈数据
   * @returns 时间数据对象
   */
  public getActionTime(coilData: CoilData): TimeData {
    const timeObj: TimeData = {
      startTime: 0,
      actDuration: 0,
      endTime: 0,
    }

    let startTime = 0
    let endTime = 0
    let findStartTime = true // true: 查找动作开始点；false：查找动作结束点

    const cData = coilData.data
    const stepTime = coilData.stepTime

    for (let i = 0; i < cData.length; i++) {
      // 查找动作开始点
      if (findStartTime) {
        // 线圈电流 >= 0.2A
        if (cData[i] >= 20) {
          if (startTime === 0) {
            startTime = stepTime[i]
          }
        } else {
          if (startTime !== 0) {
            startTime = 0
          }
        }
        // 线圈电流 >= 1A
        if (cData[i] >= 60) {
          findStartTime = false
        }
        // 查找动作结束点
      } else {
        if (cData[i] <= 20) {
          if (endTime === 0) {
            endTime = stepTime[i]
            break
          }
        }
      }
    }

    // 计算动作持续时间
    if (endTime !== 0 && startTime !== 0) {
      timeObj.actDuration = endTime - startTime
    }

    timeObj.startTime = startTime
    timeObj.endTime = endTime

    return timeObj
  }

  /**
   * 获取Te数据（计算结果数据）
   * @param data 动作数据
   * @returns Te数据对象
   */
  public async getTeData(data: ActionData): Promise<TeData> {
    const teData: TeData = {
      num: 0,
      type: '',
      energyTime: '',
      actionStartTime: '',
      actionEndTime: '',
      maxCoil: 0,
      actionTime: 0,
      travelData: { data: [], stepTime: [] },
      distance: 0,
      contactDistance: 0,
      overContactDistance: 0,
      overDistance: 0,
      speed: 0,
      time: 0,
    }

    const coilObj = data.coil
    const timeObj = this.getActionTime(coilObj)

    teData.num = coilObj.num
    teData.type = parseInt(String(data.type)) ? '合闸' : '分闸'

    teData.energyTime = dayjs(data.actionTime).format('YYYY-MM-DD HH:mm:ss')
    teData.actionStartTime = dayjs(data.actionTime).format('YYYY-MM-DD HH:mm:ss:SSS')
    teData.actionEndTime = dayjs(dayjs(data.actionTime).valueOf() + timeObj.endTime).format(
      'YYYY-MM-DD HH:mm:ss:SSS',
    )

    const coilArr = coilObj.data
    let maxCoil = 0

    if (coilArr.length > 0) {
      maxCoil = Math.max(...coilArr) * 0.01
    }

    teData.maxCoil = parseFloat(maxCoil.toFixed(2))
    teData.actionTime = parseFloat(timeObj.actDuration.toFixed(2))

    const angleObj = data.angle
    const angleArr = angleObj.data.map((v) => v / 100)

    // 获取行程数组
    const getTravelArr = await this.angleConverterDAO.getOffset(
      angleArr,
      parseInt(String(data.type)),
    )

    // 构建行程数据
    const travelData: TravelData = {
      stepTime: angleObj.stepTime,
      data: getTravelArr,
    }

    teData.travelData = travelData

    const firstOffset = getTravelArr[0] // 行程 前端稳定值
    const lastOffset = getTravelArr[getTravelArr.length - 1] // 行程 最后端稳定值
    const distance = parseFloat(Math.abs(lastOffset - firstOffset).toFixed(2)) // 行程：前后端稳定值的差的绝对值

    let bounceMaxValue = 0
    let limitValue: number
    let xsData: number // 极限值：合闸取最大值，分闸取最小值

    // 1:合闸  0:分闸
    if (parseInt(String(data.type)) === 1) {
      limitValue = parseFloat(Math.max(...getTravelArr).toFixed(2))
      xsData = 0.66
    } else {
      xsData = 0.74
      limitValue = parseFloat(Math.min(...getTravelArr).toFixed(2))
      bounceMaxValue = this.angleConverterDAO.getBounceMaxValue(getTravelArr, limitValue)
      teData.bounceValue = Math.abs(bounceMaxValue - lastOffset).toFixed(2) // 分闸反弹
    }

    const contactDistance = (distance * xsData).toFixed(2) // 开距
    const overContactDistance = Math.abs(distance - parseFloat(contactDistance)).toFixed(2) // 超程=|行程-开距|

    teData.distance = distance
    teData.contactDistance = contactDistance
    teData.overContactDistance = overContactDistance
    teData.overDistance = parseFloat(Math.abs(limitValue - lastOffset).toFixed(2)) // 过冲：极限值与最后端稳定值的差

    let xsTime: number
    let contactIndex: number
    let contactStartIndex: number

    if (parseInt(String(data.type))) {
      contactIndex = this.angleConverterDAO.getDataIndex(
        travelData,
        0,
        lastOffset - parseFloat(contactDistance),
        true,
      )
      contactStartIndex = this.angleConverterDAO.getDataIndex(
        travelData,
        contactIndex,
        lastOffset - parseFloat(contactDistance) + 6,
        true,
      )
      xsTime = 1.11 // 合闸时间系数
    } else {
      contactIndex = this.angleConverterDAO.getDataIndex(
        travelData,
        0,
        lastOffset + parseFloat(contactDistance),
        false,
      )
      contactStartIndex = this.angleConverterDAO.getDataIndex(
        travelData,
        contactIndex,
        lastOffset + parseFloat(contactDistance) - 6,
        false,
      )
      xsTime = 1 // 分闸时间系数
    }

    const t1 = travelData.stepTime[contactStartIndex]
    const t2 = travelData.stepTime[contactIndex]
    const v = 6 / (Math.abs(t2 - t1) * xsTime)
    const t3 = timeObj.startTime
    const time = Math.abs(t2 - t3)

    teData.speed = parseFloat(v.toFixed(2)) // 合闸或分闸速度
    teData.time = parseFloat(time.toFixed(2)) // 合闸或分闸时间

    return teData
  }
}
