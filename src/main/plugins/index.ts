/**
 * 插件目录
 */
import { dependencyAuditPlugin } from './dependency-audit'
import { checkEnvPlugin } from './check-env'
import { checkProjectStandardPlugin } from './check-project-standard'
import { checkTsconfigPlugin } from './check-tsconfig'
import { checkBuildArtifactsPlugin } from './check-build-artifacts'
import { checkBrowserslistPlugin } from './check-browserslist'
import { checkPackageManagerPlugin } from './check-package-manager'
import { checkNodeVersionPlugin } from './check-node-version'
import { IScanPlugin } from '../types'

export const plugins: IScanPlugin[] = [
  dependencyAuditPlugin,
  checkEnvPlugin,
  checkProjectStandardPlugin,
  checkTsconfigPlugin,
  checkBuildArtifactsPlugin,
  checkBrowserslistPlugin,
  checkPackageManagerPlugin,
  checkNodeVersionPlugin
]
