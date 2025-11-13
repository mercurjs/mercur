const { spawn } = require('child_process')
const path = require('path')

const ROOT = path.resolve(__dirname, '../..')
const MODULES_DIR = path.join(ROOT, 'packages/modules')
const modules = process.argv.slice(2)

const children = []
const run = (cmd, args, opts = {}) => {
  const p = spawn(cmd, args, { stdio: 'pipe', shell: true, ...opts })
  children.push(p)
  return p
}
const runInherit = (cmd, args, opts = {}) => {
  const p = spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts })
  children.push(p)
  return p
}

const backendCmd =
  'CHOKIDAR_USEPOLLING=1 CHOKIDAR_INTERVAL=300 nodemon --verbose --legacy-watch --signal SIGTERM -e js,json,ts -w src -w ../../packages/modules --exec "medusa develop --types=false"'

const backend = run(backendCmd, [], {
  cwd: path.resolve(__dirname),
  env: { ...process.env }
})

const READY_RE = /(server|medusa).*(ready|listening|running|started)/i
let started = false
const startModules = () => {
  if (started) return
  started = true
  modules.forEach((name) => {
    const cwd = path.join(MODULES_DIR, name)
    console.log(`\n[watch] ${name} → medusa plugin:develop`)
    runInherit('npx', ['medusa', 'plugin:develop'], { cwd, env: process.env })
  })
}

backend.stdout.on('data', (b) => {
  const line = b.toString()
  process.stdout.write(line)
  if (READY_RE.test(line)) startModules()
})
backend.stderr.on('data', (b) => {
  const line = b.toString()
  process.stderr.write(line)
  if (READY_RE.test(line)) startModules()
})

setTimeout(startModules, 8000).unref()

backend.on('exit', (code) => {
  children.forEach((c) => c !== backend && !c.killed && c.kill('SIGTERM'))
  process.exit(code ?? 0)
})
;['SIGINT', 'SIGTERM'].forEach((sig) =>
  process.on(sig, () => {
    children.forEach((c) => !c.killed && c.kill('SIGTERM'))
    process.exit(0)
  })
)
