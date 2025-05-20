/**
 * 雪花算法ID生成器
 */
export class SnowflakeId {
  private static instance: SnowflakeId

  private readonly twepoch: bigint = BigInt(1672531200000) // 2023-01-01 起始时间戳
  private readonly workerIdBits: number = 5
  private readonly dataCenterIdBits: number = 5
  private readonly maxWorkerId: bigint = BigInt((1 << this.workerIdBits) - 1)
  private readonly maxDataCenterId: bigint = BigInt((1 << this.dataCenterIdBits) - 1)
  private readonly sequenceBits: number = 12

  private readonly workerIdShift: number = this.sequenceBits
  private readonly dataCenterIdShift: number = this.sequenceBits + this.workerIdBits
  private readonly timestampLeftShift: number =
    this.sequenceBits + this.workerIdBits + this.dataCenterIdBits

  private readonly sequenceMask: bigint = BigInt((1 << this.sequenceBits) - 1)

  private sequence: bigint = BigInt(0)
  private lastTimestamp: bigint = BigInt(-1)
  private readonly workerId: bigint
  private readonly dataCenterId: bigint

  /**
   * 构造函数
   * @param workerId 工作机器ID (0-31)
   * @param dataCenterId 数据中心ID (0-31)
   */
  private constructor(workerId: number = 1, dataCenterId: number = 1) {
    if (BigInt(workerId) > this.maxWorkerId || BigInt(workerId) < BigInt(0)) {
      throw new Error(`Worker ID must be between 0 and ${this.maxWorkerId}`)
    }

    if (BigInt(dataCenterId) > this.maxDataCenterId || BigInt(dataCenterId) < BigInt(0)) {
      throw new Error(`Data Center ID must be between 0 and ${this.maxDataCenterId}`)
    }

    this.workerId = BigInt(workerId)
    this.dataCenterId = BigInt(dataCenterId)
  }

  /**
   * 获取单例实例
   */
  public static getInstance(workerId: number = 1, dataCenterId: number = 1): SnowflakeId {
    if (!SnowflakeId.instance) {
      SnowflakeId.instance = new SnowflakeId(workerId, dataCenterId)
    }
    return SnowflakeId.instance
  }

  /**
   * 生成下一个ID
   * @returns 生成的雪花算法ID (字符串形式，因为JavaScript整数精度限制)
   */
  public nextId(): string {
    let timestamp = this.currentTimeMillis()

    if (timestamp < this.lastTimestamp) {
      throw new Error(
        `Clock moved backwards. Refusing to generate ID for ${this.lastTimestamp - timestamp} milliseconds`,
      )
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + BigInt(1)) & this.sequenceMask
      if (this.sequence === BigInt(0)) {
        timestamp = this.tilNextMillis(this.lastTimestamp)
      }
    } else {
      this.sequence = BigInt(0)
    }

    this.lastTimestamp = timestamp

    const id =
      ((timestamp - this.twepoch) << BigInt(this.timestampLeftShift)) |
      (this.dataCenterId << BigInt(this.dataCenterIdShift)) |
      (this.workerId << BigInt(this.workerIdShift)) |
      this.sequence

    return id.toString()
  }

  /**
   * 获取当前时间戳（毫秒）
   */
  private currentTimeMillis(): bigint {
    return BigInt(Date.now())
  }

  /**
   * 等待直到下一毫秒
   * @param lastTimestamp 上次生成ID的时间戳
   * @returns 新的时间戳
   */
  private tilNextMillis(lastTimestamp: bigint): bigint {
    let timestamp = this.currentTimeMillis()
    while (timestamp <= lastTimestamp) {
      timestamp = this.currentTimeMillis()
    }
    return timestamp
  }

  /**
   * 将数字ID转换为雪花算法ID
   * @param numericId 原有的数字ID
   * @param timeOffset 时间偏移量（毫秒），用于区分批次，默认为0
   * @returns 生成的雪花算法ID
   */
  public convertNumericIdToSnowflake(numericId: number, timeOffset: number = 0): string {
    const timestamp = this.currentTimeMillis() + BigInt(timeOffset)

    const mappedSequence = BigInt(numericId) & this.sequenceMask

    const id =
      ((timestamp - this.twepoch) << BigInt(this.timestampLeftShift)) |
      (this.dataCenterId << BigInt(this.dataCenterIdShift)) |
      (this.workerId << BigInt(this.workerIdShift)) |
      mappedSequence

    return id.toString()
  }

  /**
   * 批量转换数字ID到雪花算法ID
   * @param numericIds 数字ID数组
   * @returns 转换后的雪花算法ID数组
   */
  public batchConvertIds(numericIds: number[]): Record<number, string> {
    const result: Record<number, string> = {}

    const baseTimeOffset = 0

    numericIds.forEach((numericId, index) => {
      const timeOffset = baseTimeOffset + index
      result[numericId] = this.convertNumericIdToSnowflake(numericId, timeOffset)
    })

    return result
  }
}

export default SnowflakeId.getInstance()
