import { describe, it, expect } from 'vitest'
import { formatTime } from '../../app/utils/formatTime'

describe('formatTime', () => {
  it('returns 刚刚 for timestamps less than 1 minute ago', () => {
    const now = new Date()
    expect(formatTime(now)).toBe('刚刚')
    expect(formatTime(new Date(now.getTime() - 30_000))).toBe('刚刚')
  })

  it('returns X分钟前 for timestamps 1-59 minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000)
    expect(formatTime(fiveMinAgo)).toBe('5分钟前')
  })

  it('returns X小时前 for timestamps 1-23 hours ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600_000)
    expect(formatTime(threeHoursAgo)).toBe('3小时前')
  })

  it('returns X天前 for timestamps 1-6 days ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400_000)
    expect(formatTime(twoDaysAgo)).toBe('2天前')
  })

  it('returns locale date string for timestamps older than 7 days', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86400_000)
    const result = formatTime(tenDaysAgo)
    expect(result).toMatch(/\d{1,4}\/\d{1,2}\/\d{1,2}/)
  })

  it('accepts string dates', () => {
    const now = new Date().toISOString()
    expect(formatTime(now)).toBe('刚刚')
  })
})
