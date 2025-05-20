/* eslint-disable prefer-promise-reject-errors */
/* eslint-disable no-useless-constructor */
import type { SerialPortConfig } from '@/types/serial'
import SerialManager from './serial'

export enum Frame68Flag {
  START = '68', // 帧起始标志
  END = '16', // 帧结束标志
}

export const Frame68Constants = {
  ADDR_INDEX: 2, // 地址域起始索引
  ADDR_LEN: 2, // 地址域长度
  CTRL_INDEX: 4, // 控制码起始索引
  CTRL_LEN: 2, // 控制码长度
  DATA_INDEX: 6, // 数据域起始索引
  CS_LEN: 2, // 校验和长度
  END_LEN: 2, // 结束标志长度
  MIN_FRAME_LEN: 10, // 最小帧长度: head(2) + addr(2) + ctrl(2) + data(2) + cs(2)
}

/**
 * 68帧协议管理器
 * 负责68帧协议的发送和接收处理
 */
class Frame68Manager {
  private static instance: Frame68Manager
  private frameConfig: SerialPortConfig | null = null
  private frame68Buffer: string = '' // 用于累积68帧数据
  private frame68LastReceiveTime: number = 0 // 记录上次接收68帧数据的时间
  private readonly MAX_FRAME68_BUFFER: number = 1024 // 帧缓冲区最大长度
  private readonly FRAME68_TIMEOUT: number = 200 // 帧接收超时时间，单位毫秒
  private readonly DEBUG = JSON.parse(import.meta.env.VITE_APP_SERIAL_68_DEBUG) // 是否开启调试日志

  private constructor() {}

  public static getInstance(): Frame68Manager {
    if (!Frame68Manager.instance) {
      Frame68Manager.instance = new Frame68Manager()
    }
    return Frame68Manager.instance
  }

  /**
   * 打开68帧串口
   * @param config 串口配置
   */
  public open68FrameSerial(config: SerialPortConfig) {
    this.frameConfig = config

    const res = SerialManager.openSerial(config, (result) => {
      const msg = JSON.parse(JSON.stringify(result))
      const data = msg.data
      const currentTime = Date.now()

      if (this.DEBUG) {
        console.log(
          `68帧接收数据: ${data}, 长度: ${data.length}, 是否超时: ${currentTime - this.frame68LastReceiveTime > this.FRAME68_TIMEOUT}`,
        )
      }

      // 如果超过设定的超时时间没有接收到数据，则认为是新的数据包
      if (currentTime - this.frame68LastReceiveTime > this.FRAME68_TIMEOUT) {
        this.frame68Buffer = ''
      }

      this.frame68Buffer += data
      this.frame68LastReceiveTime = currentTime

      // 处理68帧缓冲区
      this.processFrame68Buffer()
    })

    uni.showToast({
      title: res.errMsg,
      icon: 'none',
    })
  }

  /**
   * 关闭68帧串口
   */
  public close68FrameSerial() {
    if (!this.frameConfig) return

    const res = SerialManager.closeSerial(this.frameConfig.port)
    this.frameConfig = null
    this.frame68Buffer = ''
    this.frame68LastReceiveTime = 0

    if (this.DEBUG) {
      console.log('68帧串口已关闭', res)
    }
  }

  /**
   * 检查68帧串口是否已打开
   */
  public is68FrameOpen(): boolean {
    return this.frameConfig !== null
  }

  /**
   * 发送68帧数据
   * @param addr 地址域
   * @param ctrl 控制码
   * @param data 数据域（可选）
   * @returns 是否发送成功
   */
  public send68Frame(addr: string, ctrl: string, data: string = ''): boolean {
    if (!this.is68FrameOpen()) {
      if (this.DEBUG) {
        console.log('68帧串口未打开，无法发送数据')
      }
      return false
    }

    // 构建68帧
    let frameData = Frame68Flag.START + addr + ctrl + data

    // 计算校验和
    const cs = this.calculateCS(frameData)

    // 完整的帧数据
    frameData = frameData + cs + Frame68Flag.END

    if (this.DEBUG) {
      console.log(`发送68帧数据: ${frameData}`)
    }

    if (this.frameConfig) {
      try {
        return SerialManager.sendData(this.frameConfig.port, frameData)
      } catch (error) {
        console.error('发送68帧数据失败:', error)
        return false
      }
    }

    return false
  }

  /**
   * 处理68帧缓冲区数据
   * 查找、提取、验证缓冲区中的68帧数据
   */
  private processFrame68Buffer() {
    if (this.frame68Buffer.length < 4) return // 数据不足，无法处理

    if (this.DEBUG) {
      console.log(`处理68帧缓冲区数据: ${this.frame68Buffer}`)
    }

    // 提取所有完整的68帧
    const frames = this.extractFrame68(this.frame68Buffer)

    if (frames.length > 0) {
      if (this.DEBUG) {
        console.log(`提取到${frames.length}个完整68帧: ${JSON.stringify(frames)}`)
      }

      // 处理每个完整帧
      for (const frameData of frames) {
        if (this.isValidFrame68(frameData)) {
          if (this.DEBUG) {
            console.log(`有效68帧: ${frameData}`)
          }
          this.processValidFrame68(frameData)
        } else {
          if (this.DEBUG) {
            console.log(`无效68帧: ${frameData}`)
          }
        }
      }

      // 移除已处理的帧数据
      const lastFrame = frames[frames.length - 1]
      const lastFrameEndIndex = this.frame68Buffer.lastIndexOf(lastFrame) + lastFrame.length
      this.frame68Buffer = this.frame68Buffer.substring(lastFrameEndIndex)
    }

    // 如果缓冲区过长，进行清理
    if (this.frame68Buffer.length > this.MAX_FRAME68_BUFFER) {
      if (this.DEBUG) {
        console.log(`68帧缓冲区过长，进行清理: ${this.frame68Buffer.length}`)
      }
      this.frame68Buffer = this.frame68Buffer.substring(
        this.frame68Buffer.length - this.MAX_FRAME68_BUFFER,
      )
    }
  }

  /**
   * 提取68帧完整数据
   * @param buffer 缓冲区数据
   * @returns 提取到的完整帧数组
   */
  private extractFrame68(buffer: string): string[] {
    const frames: string[] = []
    let startIndex = 0

    while (startIndex < buffer.length) {
      // 查找起始标志68
      const frameStartIndex = buffer.indexOf(Frame68Flag.START, startIndex)
      if (frameStartIndex === -1) break // 未找到帧起始标志

      // 使用findFrame68End函数查找真正的帧结束位置
      const frameEndPos = this.findFrame68End(buffer, frameStartIndex)
      if (frameEndPos === -1) {
        // 未找到有效的帧结束位置，更新起始索引继续查找
        startIndex = frameStartIndex + 2
        continue
      }

      // 提取完整的帧数据
      const currentFrameData = buffer.substring(frameStartIndex, frameEndPos)

      if (this.DEBUG) {
        console.log(`提取的帧数据: ${currentFrameData}, 长度: ${currentFrameData.length}`)
      }

      // 确保提取的帧符合格式要求：以68开头，以16结尾
      if (
        currentFrameData.startsWith(Frame68Flag.START) &&
        currentFrameData.endsWith(Frame68Flag.END)
      ) {
        frames.push(currentFrameData)

        if (this.DEBUG) {
          console.log(`提取有效帧: ${currentFrameData}, 长度: ${currentFrameData.length}`)
        }
      } else {
        if (this.DEBUG) {
          console.log(`提取的帧格式不符合要求: ${currentFrameData}`)
        }
      }

      // 更新起始索引，继续查找下一帧
      startIndex = frameEndPos
    }

    return frames
  }

  /**
   * 计算68帧校验和
   * 校验和计算：从头部68到数据域（包含数据域）的所有字节累加，取低8位
   * @param frameData 帧数据
   * @returns 校验和的十六进制字符串
   */
  private calculateCS(frameData: string): string {
    if (frameData.length < Frame68Constants.MIN_FRAME_LEN) return '00' // 数据不足，无法计算校验和

    // 找到数据域结束的位置（校验和前一个字节）
    const csIndex = frameData.length - (Frame68Constants.CS_LEN + Frame68Constants.END_LEN) // 减去CS和结束符16

    // 从头部68到数据域的所有字节累加
    let sum = 0
    for (let i = 0; i < csIndex; i += 2) {
      if (i + 1 < frameData.length) {
        const byteValue = parseInt(frameData.substring(i, i + 2), 16)
        if (!isNaN(byteValue)) {
          sum += byteValue
        }
      }
    }

    // 取低8位作为校验和
    const cs = sum & 0xff
    return cs.toString(16).padStart(2, '0').toUpperCase()
  }

  /**
   * 验证68帧的有效性
   * @param frameData 帧数据
   * @returns 是否为有效帧
   */
  private isValidFrame68(frameData: string): boolean {
    console.log(frameData)
    // 验证基本格式
    if (frameData.length < Frame68Constants.MIN_FRAME_LEN) return false
    if (!frameData.startsWith(Frame68Flag.START) || !frameData.endsWith(Frame68Flag.END))
      return false

    // 提取接收到的校验和 - 位于结束标志16之前的两个字符
    const receivedCS = frameData.substring(
      frameData.length - Frame68Constants.END_LEN - Frame68Constants.CS_LEN,
      frameData.length - Frame68Constants.END_LEN,
    )

    // 计算数据部分（从68开始到校验和之前）的校验和
    const dataForCs = frameData.substring(
      0,
      frameData.length - Frame68Constants.END_LEN - Frame68Constants.CS_LEN,
    )
    const calculatedCS = this.calculateFrameCS(dataForCs)

    if (this.DEBUG) {
      console.log(
        `68帧校验和验证: 长度=${frameData.length}, 数据=${frameData}, 数据部分=${dataForCs}, 计算校验和=${calculatedCS}, 接收校验和=${receivedCS}`,
      )
    }

    // 比较校验和
    return receivedCS.toUpperCase() === calculatedCS.toUpperCase()
  }

  /**
   * 处理有效的68帧数据
   * @param frameData 有效的帧数据
   */
  private processValidFrame68(frameData: string): void {
    // 解析帧结构
    const addrField = frameData.substring(
      Frame68Constants.ADDR_INDEX,
      Frame68Constants.ADDR_INDEX + Frame68Constants.ADDR_LEN,
    ) // 地址域
    const ctrlCode = frameData.substring(
      Frame68Constants.CTRL_INDEX,
      Frame68Constants.CTRL_INDEX + Frame68Constants.CTRL_LEN,
    ) // 控制码

    // 获取数据长度字段(位于控制码后面的字节)，十六进制转为十进制
    const dataLengthField = frameData.substring(
      Frame68Constants.DATA_INDEX,
      Frame68Constants.DATA_INDEX + 2,
    )
    const dataFieldLength = parseInt(dataLengthField, 16)

    // 提取数据域(从数据长度字段后面开始)
    const dataField = frameData.substring(
      Frame68Constants.DATA_INDEX + 2,
      Frame68Constants.DATA_INDEX + 2 + dataFieldLength * 2,
    )

    if (this.DEBUG) {
      console.log(
        `68帧解析结果: 完整帧=${frameData}, 长度=${frameData.length}, 地址域=${addrField}, 控制码=${ctrlCode}, 数据长度=${dataFieldLength}, 数据域=${dataField}, CS值=${this.calculateCS(frameData)}`,
      )
    }

    // 触发事件或回调通知上层应用
    uni.$emit('frame68Received', {
      frameData,
      addrField,
      ctrlCode,
      dataField,
      dataLength: dataFieldLength,
    })
  }

  /**
   * 查找68帧的结束位置
   * 基于帧结构特征找到真正的结束位置，避免数据域中包含16时的误判
   * @param buffer 缓冲区数据
   * @param startIndex 起始标志68的位置
   * @returns 找到的帧结束位置（16之后的位置），如果未找到则返回-1
   */
  private findFrame68End(buffer: string, startIndex: number): number {
    // 确保缓冲区足够长，至少包含起始标志、地址域、控制码、校验和和结束标志
    const minLength =
      startIndex +
      Frame68Flag.START.length +
      Frame68Constants.ADDR_LEN +
      Frame68Constants.CTRL_LEN +
      Frame68Constants.CS_LEN +
      Frame68Flag.END.length

    if (buffer.length < minLength) {
      if (this.DEBUG) {
        console.log(`缓冲区长度不足，无法找到完整帧: ${buffer.length} < ${minLength}`)
      }
      return -1
    }

    if (this.DEBUG) {
      console.log(
        `查找帧结束位置，缓冲区: ${buffer.substring(startIndex)}, 起始位置: ${startIndex}`,
      )
    }

    // 从起始位置开始查找第一个16
    let currentPos = startIndex + 2 // 跳过起始标志68

    while (currentPos < buffer.length - 1) {
      // 查找下一个可能的结束标志16
      const endPos = buffer.indexOf(Frame68Flag.END, currentPos)
      if (endPos === -1) return -1 // 未找到结束标志

      // 获取可能的校验和位置（结束标志前两个字符）
      const possibleCsPos = endPos - Frame68Constants.CS_LEN

      if (
        possibleCsPos >=
        startIndex +
          Frame68Flag.START.length +
          Frame68Constants.ADDR_LEN +
          Frame68Constants.CTRL_LEN
      ) {
        // 提取从起始标志到校验和之前的数据，计算校验和
        const dataForCs = buffer.substring(startIndex, possibleCsPos)
        const calculatedCs = this.calculateFrameCS(dataForCs)

        // 提取缓冲区中可能的校验和
        const possibleCs = buffer.substring(possibleCsPos, endPos)

        if (this.DEBUG) {
          console.log(
            `可能的帧结束位置: ${endPos}, 可能的校验和: ${possibleCs}, 计算的校验和: ${calculatedCs}, 提取数据: ${dataForCs}`,
          )
        }

        // 验证校验和是否匹配
        if (possibleCs.toUpperCase() === calculatedCs.toUpperCase()) {
          // 校验和匹配，找到了真正的帧结束位置
          if (this.DEBUG) {
            console.log(
              `找到有效帧结束位置: ${endPos}, 完整帧: ${buffer.substring(startIndex, endPos + Frame68Flag.END.length)}`,
            )
          }
          return endPos + Frame68Flag.END.length // 返回帧结束后的位置
        }
      }

      // 校验和不匹配，继续查找下一个可能的结束标志
      currentPos = endPos + 2
    }

    if (this.DEBUG) {
      console.log(`未找到有效的帧结束位置，缓冲区: ${buffer.substring(startIndex)}`)
    }
    return -1 // 未找到有效的帧结束位置
  }

  /**
   * 计算68帧数据的校验和
   * 专用于findFrame68End方法，计算从头部68到指定位置之前的数据的校验和
   * @param frameData 帧数据（从68开始，不包含校验和和结束标志）
   * @returns 校验和的十六进制字符串
   */
  private calculateFrameCS(frameData: string): string {
    if (
      frameData.length <
      Frame68Flag.START.length + Frame68Constants.ADDR_LEN + Frame68Constants.CTRL_LEN
    ) {
      return '00' // 数据不足，无法计算校验和
    }

    // 计算所有字节的累加和
    let sum = 0
    for (let i = 0; i < frameData.length; i += 2) {
      if (i + 1 < frameData.length) {
        const byteValue = parseInt(frameData.substring(i, i + 2), 16)
        if (!isNaN(byteValue)) {
          sum += byteValue
        }
      }
    }

    // 取低8位作为校验和
    const cs = sum & 0xff
    return cs.toString(16).padStart(2, '0').toUpperCase()
  }
}

export default Frame68Manager.getInstance()
