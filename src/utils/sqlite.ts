/* eslint-disable no-useless-constructor */

/**
 * 查询类型对象接口
 */
interface QueryTypeObject {
  id?: string
  type?: string
  [key: string]: any
}

/**
 * 查询条件接口
 */
interface QueryCondition {
  sTime?: string
  eTime?: string
  type?: string
  [key: string]: any
}

/**
 * 表结构字段定义接口
 */
export interface TableFieldDefinition {
  name: string
  type: 'TEXT' | 'INTEGER' | 'REAL' | 'BLOB' | 'NULL'
  primaryKey?: boolean
  notNull?: boolean
  unique?: boolean
  defaultValue?: string
}

/**
 * 表结构定义接口
 */
export interface TableDefinition {
  tableName: string
  fields: TableFieldDefinition[]
}

/**
 * 数据库管理类
 */
class SqliteManager {
  private readonly DB_NAME = 'main'
  private readonly DB_PATH = '_doc/main.db'
  private static instance: SqliteManager
  private constructor() {}

  public static getInstance(): SqliteManager {
    if (!SqliteManager.instance) {
      SqliteManager.instance = new SqliteManager()
    }
    return SqliteManager.instance
  }

  public openDB(): Promise<any> {
    return new Promise((resolve, reject) => {
      // #ifdef APP-PLUS
      plus.sqlite.openDatabase({
        name: this.DB_NAME,
        path: this.DB_PATH,
        success: (e: any) => {
          resolve(e)
        },
        fail: (e: any) => {
          reject(e)
        },
      })
      // #endif
    })
  }

  public isOpened() {
    // #ifdef APP-PLUS
    return plus.sqlite.isOpenDatabase({ name: this.DB_NAME, path: this.DB_PATH })
    // #endif
  }

  public closeDB(): Promise<any> {
    return new Promise((resolve, reject) => {
      // #ifdef APP-PLUS
      plus.sqlite.closeDatabase({
        name: this.DB_NAME,
        success: function (e) {
          resolve(e)
        },
        fail: function (e) {
          reject(e)
        },
      })
      // #endif
    })
  }

  public selectSql(sqlText: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // #ifdef APP-PLUS
      plus.sqlite.selectSql({
        name: this.DB_NAME,
        sql: sqlText,
        success: function (e) {
          resolve(e)
        },
        fail: function (e) {
          reject(e)
        },
      })
      // #endif
    })
  }

  public executeSql(sqlText: string[]): Promise<any> {
    return new Promise((resolve, reject) => {
      // #ifdef APP-PLUS
      plus.sqlite.executeSql({
        name: this.DB_NAME,
        sql: sqlText,
        success: function (e) {
          resolve(e)
        },
        fail: function (e) {
          reject(e)
        },
      })
      // #endif
    })
  }

  /**
   * 创建表
   * @param dbTable 表名
   * @param data 数据
   * @returns 创建结果
   */
  public createTable(dbTable: string, data: string) {
    const sql = `CREATE TABLE IF NOT EXISTS ${dbTable}(${data})`
    return this.executeSql([sql])
  }

  /**
   * 删除表
   * @param dbTable 表名
   * @returns 删除结果
   */
  public dropTable(dbTable: string) {
    const sql = `DROP TABLE ${dbTable}`
    return this.executeSql([sql])
  }

  /**
   * 插入表数据
   * @param dbTable 表名
   * @param data 数据
   * @param condition 条件
   * @returns 插入结果
   */
  public insertTableData(dbTable: string, data: string, condition?: string) {
    if (dbTable === undefined || data === undefined) {
      return Promise.reject(new Error('缺少必要参数'))
    }

    const isEmpty = JSON.stringify(data) === '{}'
    if (isEmpty) {
      return Promise.reject(new Error('数据不能为空'))
    }

    let sqlStatement: string
    if (condition === undefined) {
      sqlStatement = `INSERT INTO ${dbTable} VALUES('${data}')`
    } else {
      sqlStatement = `INSERT INTO ${dbTable} (${condition}) VALUES(${data})`
    }

    return this.executeSql([sqlStatement])
  }

  /**
   * 插入或替换表数据
   * @param dbTable 表名
   * @param data 数据
   * @param condition 条件
   * @returns 插入或替换结果
   */
  public insertOrReplaceData(dbTable: string, data: string, condition?: string) {
    if (dbTable === undefined || data === undefined) {
      return Promise.reject(new Error('缺少必要参数'))
    }

    let sqlStatement: string
    if (condition === undefined) {
      sqlStatement = `INSERT OR REPLACE INTO ${dbTable} VALUES('${data}')`
    } else {
      sqlStatement = `INSERT OR REPLACE INTO ${dbTable} (${condition}) VALUES(${data})`
    }

    return this.executeSql([sqlStatement])
  }

  /**
   * 查询表数据
   * @param dbTable 表名
   * @param condition 查询条件对象
   * @returns 查询结果
   */
  public selectTableData(dbTable: string, condition: QueryCondition | string = ''): Promise<any> {
    if (dbTable === undefined) {
      return Promise.reject(new Error('缺少表名参数'))
    }

    let sql = `SELECT * FROM ${dbTable} WHERE 1=1`

    if (condition === '' || typeof condition === 'string') {
      if (typeof condition === 'string' && condition !== '') {
        sql += ` AND ${condition}`
      }
      return this.selectSql(sql)
    }

    if (condition.sTime !== undefined && condition.sTime !== '') {
      sql += ` AND addTime >= '${condition.sTime}'`
    }
    if (condition.eTime !== undefined && condition.eTime !== '') {
      sql += ` AND addTime <= '${condition.eTime}'`
    }
    if (condition.type !== undefined && condition.type !== '') {
      sql += ` AND type = '${condition.type}'`
    }

    Object.entries(condition).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && !['sTime', 'eTime', 'type'].includes(key)) {
        sql += ` AND ${key} = '${value}'`
      }
    })

    return this.selectSql(sql)
  }

  /**
   * 删除表数据
   * @param dbTable 表名
   * @param condition 条件
   * @returns 删除结果
   */
  public deleteTableData(dbTable: string, condition = ''): Promise<any> {
    if (dbTable === undefined) {
      return Promise.reject(new Error('缺少表名参数'))
    }

    const sql = `DELETE FROM ${dbTable} ${condition}`
    return this.executeSql([sql])
  }

  /**
   * 更新表数据
   * @param dbTable 表名
   * @param data 更新数据
   * @param lname 条件列名
   * @param lvalue 条件列值
   * @returns 更新结果
   */
  public updateTableData(
    dbTable: string,
    data: string,
    lname?: string,
    lvalue?: string,
  ): Promise<any> {
    if (dbTable === undefined) {
      return Promise.reject(new Error('缺少表名参数'))
    }

    let sqlStatement: string
    if (lname === undefined) {
      sqlStatement = `UPDATE ${dbTable} SET ${data}`
    } else {
      sqlStatement = `UPDATE ${dbTable} SET ${data} WHERE ${lname} = '${lvalue}'`
    }

    return this.executeSql([sqlStatement])
  }

  /**
   * 获取指定数据条数
   * @param dbTable 表名
   * @param id 排序字段
   * @param num 偏移量
   * @returns 查询结果
   */
  public pullSQL(dbTable: string, id: string, num: number): Promise<any> {
    if (dbTable === undefined) {
      return Promise.reject(new Error('缺少表名参数'))
    }

    const sql = `SELECT * FROM ${dbTable} ORDER BY ${id} DESC LIMIT 15 OFFSET ${num}`
    return this.selectSql(sql)
  }

  /**
   * 获取按指定字段倒序1条数据
   * @param dbTable 表名
   * @param typeObj 查询条件对象
   * @returns 查询结果
   */
  public selectReverseOrder(dbTable: string, typeObj?: QueryTypeObject): Promise<any> {
    if (!dbTable) {
      return Promise.reject(new Error('缺少表名参数'))
    }

    let sql = `SELECT * FROM ${dbTable} WHERE 1=1`

    if (typeObj && Object.keys(typeObj).length > 0) {
      if (typeObj.id !== undefined && typeObj.id !== '') {
        sql += ` AND id < '${typeObj.id}'`
      }

      if (typeObj.type !== undefined && typeObj.type !== '') {
        sql += ` AND type = '${typeObj.type}' AND energy NOT LIKE '%[]%'`
      }
    }

    sql += ` ORDER BY id DESC LIMIT 1`

    return this.selectSql(sql)
  }

  /**
   * 查询表数据总条数
   * @param tabName 表名
   * @param query 查询条件对象
   * @returns 查询结果
   */
  public queryCount(
    tabName = 'data_coil',
    query: {
      sTime?: string // 开始时间
      eTime?: string // 结束时间
      actionType?: string | number // 动作类型
      dataType?: string | number // 数据类型
      [key: string]: any
    },
  ): Promise<any> {
    let sql = `SELECT COUNT(*) AS num FROM ${tabName} WHERE 1=1`
    const keyBool = !query || JSON.stringify(query) === '{}'

    if (!keyBool) {
      if (query.sTime) {
        sql += ` AND addTime >= '${query.sTime}'`
      }
      if (query.eTime) {
        sql += ` AND addTime <= '${query.eTime}'`
      }
      if (query.actionType !== undefined && query.actionType !== '') {
        sql += ` AND type = ${query.actionType}`
      }
      if (query.dataType !== undefined && query.dataType !== '') {
        sql += ` AND dataType = ${query.dataType}`
      }
    }

    return this.selectSql(sql)
  }

  /**
   * 获取数据库分页数据
   * @param num 页码
   * @param size 页面大小返回条数
   * @param tabName 表名
   * @param query 筛选json对象
   * @param byType 排序类型 desc倒序 / asc正序
   * @param byName 排序主键字段
   * @returns 查询结果
   */
  public async queryDataList(
    num: number,
    size: number,
    tabName = 'data_coil',
    byType = 'desc',
    byName = 'id',
    query?: {
      sTime?: string
      eTime?: string
      actionType?: string | number
      dataType?: string | number
      [key: string]: any
    },
  ): Promise<any> {
    let count = 0
    let sql = ''
    let numindex = 0

    await this.queryCount(tabName, query || {}).then((resNum) => {
      count = Math.ceil(resNum[0].num / size)
    })

    numindex = (num - 1) * size <= 0 ? 0 : (num - 1) * size

    sql = `SELECT * FROM ${tabName} WHERE 1=1`
    const keyBool = !query || JSON.stringify(query) === '{}'

    if (!keyBool) {
      if (query.sTime && query.sTime !== '') {
        sql += ` AND addTime >= '${query.sTime}'`
      }
      if (query.eTime && query.eTime !== '') {
        sql += ` AND addTime <= '${query.eTime}'`
      }
      if (query.actionType !== undefined && query.actionType !== '') {
        sql += ` AND type = ${query.actionType}`
      }
      if (query.dataType !== undefined && query.dataType !== '') {
        sql += ` AND dataType = ${query.dataType}`
      }
    }

    if (byName && byType) {
      sql += ` ORDER BY ${byName} ${byType}`
    }

    sql += ` LIMIT ${numindex},${size}`

    if (count < num - 1) {
      return Promise.reject(new Error('无数据'))
    }

    return this.selectSql(sql)
  }

  /**
   * 初始化表
   * @param tableDefinition 表结构定义
   * @returns 创建结果
   */
  public initTable(tableDefinition: TableDefinition): Promise<any> {
    const { tableName, fields } = tableDefinition

    if (!tableName || !fields || fields.length === 0) {
      return Promise.reject(new Error('表定义参数无效'))
    }

    const fieldsSql = fields
      .map((field) => {
        let fieldDef = `"${field.name}" ${field.type}`

        if (field.primaryKey) {
          fieldDef += ' PRIMARY KEY'
        }

        if (field.notNull) {
          fieldDef += ' NOT NULL'
        }

        if (field.unique) {
          fieldDef += ' UNIQUE'
        }

        if (field.defaultValue !== undefined) {
          fieldDef += ` DEFAULT ${field.defaultValue}`
        }

        return fieldDef
      })
      .join(',')

    return this.createTable(tableName, fieldsSql)
  }

  /**
   * 初始化多个表
   * @param tableDefinitions 表结构定义数组
   * @returns 创建结果的Promise数组
   */
  public initTables(tableDefinitions: TableDefinition[]): Promise<any[]> {
    const promises = tableDefinitions.map((tableDef) => this.initTable(tableDef))
    return Promise.all(promises)
  }

  /**
   * 检查表是否存在
   * @param tableName 表名
   * @returns 表是否存在
   */
  public async isTableExists(tableName: string): Promise<boolean> {
    try {
      const result = await this.selectSql(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`,
      )
      return result && result.length > 0
    } catch (error) {
      return false
    }
  }
}

export default SqliteManager.getInstance()
