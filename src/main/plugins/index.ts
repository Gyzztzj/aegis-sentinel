/**
 * 插件目录
 */
import { depCountPlugin } from './dep-count'
import { IScanPlugin } from '../types'

export const plugins: IScanPlugin[] = [depCountPlugin]
