export interface MemoryInfo {
  usedMemory: string
  availableMemory: string
  totalMemory: string
  lowMemory: boolean
  pssTotalFormatted: string
  raw: {
    usedMemoryBytes: number
    availableMemoryBytes: number
    totalMemoryBytes: number
    lowMemory: boolean
    pssTotalBytes: number
  }
}

export interface MemoryStatus {
  usedMemoryBytes: number
  availableMemoryBytes: number
  totalMemoryBytes: number
  usedMemoryFormatted: string
  availableMemoryFormatted: string
  totalMemoryFormatted: string
  lowMemory: boolean
  app: {
    pssTotalBytes: number
    pssTotalFormatted: string
  }
  timestamp: number
}
