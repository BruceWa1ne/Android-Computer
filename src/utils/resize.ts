export const fitPx = (size: number): number => {
  const sysInfo = uni.getSystemInfoSync()
  const clientWidth = sysInfo.windowWidth

  if (!clientWidth) return size

  const fontSize = clientWidth / import.meta.env.VITE_DESIGN_WIDTH
  return size * fontSize
}
