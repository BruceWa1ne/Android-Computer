/* eslint-disable no-useless-constructor */
import SqliteManager from './sqlite'
import dayjs from 'dayjs'
import { DatabaseTables } from '@/enum/database'
import type { TableDefinition } from './sqlite'
import snowflakeId from './snowflake'

class TablesManager {
  private static instance: TablesManager
  public readonly CommonTables: TableDefinition[] = [
    {
      tableName: DatabaseTables.DataCoil,
      fields: [
        { name: 'id', type: 'TEXT', primaryKey: true },
        { name: 'type', type: 'INTEGER' },
        { name: 'dataType', type: 'INTEGER' },
        { name: 'faultMachineCharacter', type: 'TEXT' },
        { name: 'machineCharacter', type: 'TEXT' },
        { name: 'energy', type: 'TEXT' },
        { name: 'angle', type: 'TEXT' },
        { name: 'travel', type: 'TEXT' },
        { name: 'coil', type: 'TEXT' },
        { name: 'actionTime', type: 'TEXT' },
        { name: 'addTime', type: 'TEXT' },
      ],
    },
    {
      tableName: DatabaseTables.StandardDataCoil,
      fields: [
        { name: 'id', type: 'TEXT', primaryKey: true },
        { name: 'type', type: 'INTEGER' },
        { name: 'dataType', type: 'INTEGER' },
        { name: 'faultMachineCharacter', type: 'TEXT' },
        { name: 'machineCharacter', type: 'TEXT' },
        { name: 'energy', type: 'TEXT' },
        { name: 'angle', type: 'TEXT' },
        { name: 'travel', type: 'TEXT' },
        { name: 'coil', type: 'TEXT' },
        { name: 'actionTime', type: 'TEXT' },
        { name: 'addTime', type: 'TEXT' },
      ],
    },
    {
      tableName: DatabaseTables.TempCurve,
      fields: [
        { name: 'id', type: 'TEXT', primaryKey: true },
        { name: 'mainBusbar', type: 'TEXT' },
        { name: 'breakerUpper', type: 'TEXT' },
        { name: 'breakerLower', type: 'TEXT' },
        { name: 'outletCable', type: 'TEXT' },
        { name: 'addTime', type: 'TEXT' },
      ],
    },
    {
      tableName: DatabaseTables.PartialCurve,
      fields: [
        { name: 'id', type: 'TEXT', primaryKey: true },
        { name: 'ultrasonicDischarge', type: 'INTEGER' },
        { name: 'transientGround', type: 'INTEGER' },
        { name: 'addTime', type: 'TEXT' },
      ],
    },
    {
      tableName: DatabaseTables.Record,
      fields: [
        { name: 'id', type: 'TEXT', primaryKey: true },
        { name: 'eventName', type: 'TEXT' },
        { name: 'eventDescription', type: 'TEXT' },
        { name: 'eventTime', type: 'TEXT' },
      ],
    },
  ]

  private constructor() {}

  public static getInstance(): TablesManager {
    if (!TablesManager.instance) {
      TablesManager.instance = new TablesManager()
    }
    return TablesManager.instance
  }

  /**
   * 将对象数据转换为SQL格式
   * @param data 要转换的数据对象
   * @param addTimestamp 是否添加时间戳
   * @param timestampField 时间戳字段名，默认为'addTime'
   * @param allowGenerateId 是否允许自动生成ID，默认为true
   * @returns 包含列名、值和SQL片段的对象
   */
  private prepareDataForSql(
    data: Record<string, any>,
    addTimestamp = true,
    timestampField = 'addTime',
    allowGenerateId = true,
  ): { columnNames: string[]; values: string[]; sql?: string } {
    const columnNames: string[] = []
    const values: string[] = []
    let sql = ''

    if (!data.id && allowGenerateId) {
      data.id = snowflakeId.nextId()
    }

    // 处理传入的数据
    for (const key in data) {
      if (key === 'id') {
        sql += 'id TEXT primary key,'
        columnNames.push(key)
        values.push(String(data[key]))
      } else {
        sql += `"${key}" TEXT,`
        columnNames.push(key)

        if (data[key] instanceof Object || Array.isArray(data[key])) {
          values.push(JSON.stringify(data[key]))
        } else {
          values.push(String(data[key]))
        }
      }
    }

    // 添加时间戳
    if (addTimestamp) {
      const time = dayjs().format('YYYY-MM-DD HH:mm:ss')
      if (sql) {
        sql += `"${timestampField}" TEXT`
      }
      columnNames.push(timestampField)
      values.push(time)
    } else if (sql) {
      // 移除最后一个逗号
      sql = sql.replace(/,$/, '')
    }

    return { columnNames, values, sql }
  }

  /**
   * 创建表并插入数据
   * @param data 要插入的数据
   * @param tableName 表名
   * @param replace 是否使用REPLACE模式（默认为false，使用INSERT）
   * @param options 额外选项
   * @returns Promise
   */
  public async createAndInsertData(
    data: Record<string, any>,
    tableName: string,
    replace = false,
    options: {
      addTimestamp?: boolean
      timestampField?: string
      allowGenerateId?: boolean
    } = {},
  ): Promise<void> {
    try {
      if (!data || Object.keys(data).length === 0) {
        console.log('数据为空，跳过创建表和插入操作')
        return
      }

      const addTimestamp = options.addTimestamp !== undefined ? options.addTimestamp : true
      const timestampField = options.timestampField || this.getDefaultTimestampField(tableName)
      const allowGenerateId = options.allowGenerateId !== undefined ? options.allowGenerateId : true

      const { columnNames, values, sql } = this.prepareDataForSql(
        data,
        addTimestamp,
        timestampField,
        allowGenerateId,
      )

      if (sql) {
        await SqliteManager.createTable(tableName, sql)
      }

      const columnNamesStr = columnNames.join(',')
      const valuesStr = values.map((v) => `'${v}'`).join(',')

      if (replace) {
        await SqliteManager.insertOrReplaceData(tableName, valuesStr, columnNamesStr)
      } else {
        await SqliteManager.insertTableData(tableName, valuesStr, columnNamesStr)
      }
    } catch (error) {
      console.error(`创建表${tableName}并插入数据失败:`, error)
      throw error
    }
  }

  /**
   * 根据表名获取默认的时间戳字段名
   * @param tableName 表名
   * @returns 默认时间戳字段名
   */
  private getDefaultTimestampField(tableName: string): string {
    switch (tableName) {
      case DatabaseTables.TempCurve:
      case DatabaseTables.PartialCurve:
        return 'addTime'
      case DatabaseTables.Record:
        return 'eventTime'
      default:
        return 'addTime'
    }
  }

  /**
   * 保存数据到表
   * @param data 要保存的数据
   * @param tableName 表名
   * @param options 额外选项，可以指定是否添加时间戳和时间戳字段名
   * @returns Promise
   */
  public async saveDataToTable(
    data: Record<string, any>,
    tableName = 'data_coil',
    options: {
      addTimestamp?: boolean
      timestampField?: string
      allowGenerateId?: boolean
    } = {},
  ): Promise<void> {
    return this.createAndInsertData(data, tableName, false, options)
  }

  /**
   * 查询表数据
   * @param tableName 表名
   * @param condition 查询条件
   * @param reverseOrder 是否逆序（按ID降序）
   * @returns 查询结果
   */
  public async queryTableData(
    tableName: string,
    condition = {},
    reverseOrder = false,
  ): Promise<any> {
    if (reverseOrder) {
      return await SqliteManager.selectReverseOrder(tableName, condition)
    }
    return await SqliteManager.selectTableData(tableName, condition)
  }

  /**
   * 默认读取"data_coil"这个表的数据，最新一条数据
   * @param tableName
   * @param typeObj
   * @returns {Promise<unknown>}
   */
  public async selectData(tableName = 'data_coil', typeObj = {}) {
    return this.queryTableData(tableName, typeObj, true)
  }

  /**
   * 导入输出轴角度与行程对比表
   * @param comparisonData 需要导入的数据
   * @param tName 表名
   */
  public async importComparisonData(
    comparisonData: Array<{ angle: string | number; trip: string | number }>,
    tName = 'comparison',
  ): Promise<void> {
    try {
      const sql = 'id TEXT primary key,"angle" TEXT,"trip" TEXT'

      await SqliteManager.createTable(tName, sql)

      const insertPromises = comparisonData.map((item) => {
        const id = snowflakeId.nextId() // 使用雪花算法生成ID，替代之前的序号
        const value = `'${id}','${item.angle}','${item.trip}'`
        return SqliteManager.insertOrReplaceData(tName, value)
      })

      await Promise.all(insertPromises)

      console.log(`成功导入 ${comparisonData.length} 条数据到表 ${tName}`)
    } catch (error) {
      console.error(`导入JSON数据到表 ${tName} 失败:`, error)
      throw error
    }
  }

  /**
   * 读取度数和行程对照数据
   * @returns {Promise<unknown>}
   */
  public async getContrastData(tName = 'comparison') {
    return this.queryTableData(tName)
  }

  /**
   * 标准曲线数据保存，标准数据只有一条，再次保存，会覆盖原有数据
   * @param standardData 传入某一条标准数据
   * @param tName 表名
   * @param options 额外选项，可以指定是否添加时间戳和时间戳字段名
   * @returns {Promise<void>}
   */
  public async saveStandard(
    standardData: Record<string, any>,
    tName = 'standardDataCoil',
    options: { addTimestamp?: boolean; timestampField?: string } = {},
  ): Promise<void> {
    if (!standardData || Object.keys(standardData).length === 0) {
      return
    }

    try {
      await this.deleteAllTableData(tName).catch((err) => {
        console.log(`清空${tName}表失败，可能是表不存在:`, err)
      })

      const dataToSave = { ...standardData }
      const fullOptions = {
        ...options,
        allowGenerateId: false,
      }

      return this.createAndInsertData(dataToSave, tName, false, fullOptions)
    } catch (error) {
      console.error(`保存标准曲线数据失败:`, error)
      throw error
    }
  }

  /**
   * 获取标准曲线数据
   * @param tName
   * @param condition
   * @returns {Promise<unknown>}
   */
  public async getStandardData(tName = 'standardDataCoil', condition) {
    return this.queryTableData(tName, condition)
  }

  /**
   * 查询表数据总条数
   * @param tName
   * @param keyword
   * @returns {Promise<unknown>}
   */
  public async getPageCount(
    tName = 'data_coil',
    keyword: {
      sTime?: string
      eTime?: string
      actionType?: string | number
      dataType?: string | number
      [key: string]: any
    } = {},
  ) {
    return await SqliteManager.queryCount(tName, keyword)
  }

  /**
   * 获取分页数据
   * @param num 当前页码
   * @param size 每页条数
   * @param tName 表名
   * @param byType 排序类型 desc倒序 / asc正序
   * @param byName 排序主键字段
   * @param queryObj 查询条件
   * @returns {Promise<unknown>}
   */
  public async getDataList(
    num: number,
    size: number,
    tName = 'data_coil',
    byType = 'asc',
    byName = 'id',
    queryObj: {
      sTime?: string
      eTime?: string
      actionType?: string | number
      dataType?: string | number
      [key: string]: any
    } = {},
  ) {
    return await SqliteManager.queryDataList(num, size, tName, byType, byName, queryObj)
  }

  /**
   * 查询表数据
   * @param tableName 表名
   * @param dataObj 查询条件
   * @returns {Promise<unknown>}
   */
  public async selectDataList(tableName, dataObj) {
    return this.queryTableData(tableName, dataObj)
  }

  /**
   * 初始化表结构
   * @param tableDefinitions 表结构定义数组
   * @returns 创建结果
   */
  public async initializeTables(tableDefinitions: TableDefinition[]): Promise<void> {
    try {
      // 过滤出不存在的表，只创建不存在的表
      const tablesToCreate: TableDefinition[] = []

      for (const tableDef of tableDefinitions) {
        const tableExists = await SqliteManager.isTableExists(tableDef.tableName)
        if (!tableExists) {
          tablesToCreate.push(tableDef)
        } else {
          console.log(`表 ${tableDef.tableName} 已存在，跳过创建`)
        }
      }

      if (tablesToCreate.length === 0) {
        console.log('所有表已存在，无需创建')
        return
      }

      await SqliteManager.initTables(tablesToCreate)
      console.log(`已创建 ${tablesToCreate.length} 个新表`)
    } catch (error) {
      console.error('表初始化失败:', error)
      throw error
    }
  }

  /**
   * 插入表的默认数据
   * @param tableName 表名
   * @param defaultData 默认数据对象
   * @param addTimestamp 是否添加时间戳字段，默认为true
   * @returns {Promise<void>}
   */
  public async insertDefaultData(
    tableName: string,
    defaultData: Record<string, any>,
    addTimestamp = true,
  ): Promise<void> {
    try {
      // 检查表是否存在
      const tableExists = await SqliteManager.isTableExists(tableName)
      if (!tableExists) {
        console.log(`${tableName}表不存在，无法插入默认数据`)
        return
      }

      // 检查表中是否已有数据
      const existingData = await SqliteManager.selectTableData(tableName)
      if (existingData && existingData.length > 0) {
        console.log(`${tableName}表已有数据，跳过插入默认数据`)
        return
      }

      const { columnNames, values } = this.prepareDataForSql(defaultData, addTimestamp)

      // 拼接SQL并执行插入
      const columnNamesStr = columnNames.join(',')
      const valuesStr = values.map((v) => `'${v}'`).join(',')

      await SqliteManager.insertTableData(tableName, valuesStr, columnNamesStr)
      console.log(`默认数据已插入到${tableName}表`)
    } catch (error) {
      console.error(`插入默认数据到${tableName}表失败:`, error)
    }
  }

  /**
   * 清空表中所有数据
   * @param tableName 表名
   * @returns {Promise<void>} 清空结果
   */
  public async deleteAllTableData(tableName: string): Promise<void> {
    try {
      // 检查表是否存在
      const tableExists = await SqliteManager.isTableExists(tableName)
      if (!tableExists) {
        console.log(`${tableName}表不存在，无法删除数据`)
        throw new Error(`表${tableName}不存在`)
      }

      // 执行删除所有数据的操作
      await SqliteManager.deleteTableData(tableName)
      console.log(`已清空${tableName}表中的所有数据`)
    } catch (error) {
      console.error(`清空${tableName}表数据失败:`, error)
      throw error
    }
  }

  /**
   * 设备初始化时调用，创建常用表
   */
  public async initializeDeviceTables(): Promise<void> {
    try {
      await this.initializeTables(this.CommonTables)

      console.log('设备表初始化完成')
    } catch (error) {
      console.error('设备表初始化失败:', error)
      throw error
    }
  }

  /**
   * 存储日志信息
   * @param logData 日志数据
   * @param tableName 表名
   * @returns 存储结果
   */
  public async saveLog(logData: Record<string, any>, tableName = 'record'): Promise<void> {
    try {
      const tableExists = await SqliteManager.isTableExists(tableName)
      if (!tableExists) {
        uni.showToast({
          title: `${tableName}表不存在，无法存储日志信息`,
          icon: 'none',
        })
        return
      }

      const { columnNames, values } = this.prepareDataForSql(logData, true, 'eventTime')

      const columnNamesStr = columnNames.join(',')
      const valuesStr = values.map((v) => `'${v}'`).join(',')

      await SqliteManager.insertTableData(tableName, valuesStr, columnNamesStr)
    } catch (error) {
      uni.showToast({
        title: `存储日志信息到${tableName}表失败:`,
        icon: 'none',
      })
      throw error
    }
  }
}

export default TablesManager.getInstance()
