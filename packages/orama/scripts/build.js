import { transformFile } from '@swc/core'
import glob from 'glob'
import { spawn } from 'node:child_process'
import { cp, mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const rootDir = process.cwd()
const destinationDir = resolve(rootDir, 'dist')

function step(section, message) {
  console.log(`\x1b[1m\x1b[32m[${section}] ${message}\x1b[0m`)
}

async function execute(section, command, args, cwd) {
  const fullCommand = resolve(rootDir, '../../node_modules/.bin', command)

  if (!Array.isArray(args)) {
    args = [args]
  }

  let success, fail
  const promise = new Promise((resolve, reject) => {
    success = resolve
    fail = reject
  })

  step(section, `Executing: ${command} ${args.join(' ')} ...`)
  const childProcess = spawn(fullCommand, args, { cwd, stdio: 'inherit' })

  childProcess.on('close', code => {
    if (code !== 0) {
      fail(new Error(`Process failed with status code ${code}.`))
    }

    success()
  })

  return promise
}

async function replaceInFile(file, replacements) {
  if (replacements.length === 2 && !Array.isArray(replacements[1])) {
    replacements = [replacements]
  }

  let content = await readFile(file, 'utf-8')

  for (const [from, to] of replacements) {
    content = content.replaceAll(from, to)
  }

  await writeFile(file, content, 'utf-8')
}

async function esm() {
  // Compile using SWC
  await execute('ESM', 'swc', ['-q', '--extensions', '.ts,.cts', '-d', 'dist', 'src'])

  // Create types declarations
  await execute('ESM', 'tsc', ['-p', '.', '--emitDeclarationOnly'])

  // Copy stemmers
  step('ESM', 'Copying stemmers/lib to dist/stemmers ...')
  await cp(resolve(rootDir, 'stemmers/lib'), resolve(destinationDir, 'stemmers'), { recursive: true })

  step('ESM', 'Fixing file inclusions ...')
  await replaceInFile(resolve(destinationDir, 'components/tokenizer/stemmers.d.ts'), ['@stemmers', '../../stemmers'])
}

async function cjs() {
  // Create types declarations
  await execute('CJS', 'tsc', ['-p', 'tsconfig.cjs.json', '--emitDeclarationOnly'])

  step('CJS', 'Fixing file extensions ...')
  const filesGlob = await glob('**/*.{js,js.map,d.ts}', { cwd: resolve(destinationDir, 'cjs'), withFileTypes: true })
  await Promise.all(
    filesGlob.map(file => {
      const source = file.fullpath()
      const destination = file
        .fullpath()
        .replace(/.js$/, '.cjs')
        .replace(/.js.map$/, '.cjs.map')
        .replace(/.d.ts$/, '.d.cts')

      return rename(source, destination)
    }),
  )

  step('CJS', 'Fixing file inclusions ...')
  await replaceInFile(resolve(destinationDir, 'cjs/index.cjs'), [/require\("\.\/(.+)\.cts"\)/g, 'require("./$1.cjs")'])
  await replaceInFile(resolve(destinationDir, 'cjs/components.cjs'), [
    /require\("\.\/(.+)\.cts"\)/g,
    'require("./$1.cjs")',
  ])
  await replaceInFile(resolve(destinationDir, 'cjs/stemmers.cjs'), [
    ['../stemmers', './stemmers'],
    ['.js");', '.cjs");'],
  ])
  await replaceInFile(resolve(destinationDir, 'cjs/stemmers.d.cts'), [
    ['@stemmers', './stemmers'],
    [".js';", ".cjs';"],
  ])

  // Transpile stemmers
  step('CJS', 'Transpiling stemmers/lib to dist/cjs/stemmers ...')
  const stemmersSource = resolve(rootDir, 'stemmers/lib')
  const stemmersDestination = resolve(destinationDir, 'cjs/stemmers')
  await mkdir(stemmersDestination)
  let stemmers = await readdir(stemmersSource)
  stemmers = stemmers.filter(p => p.endsWith('.js')).map(s => s.replace(/\.js$/, ''))

  await Promise.all(
    stemmers.map(async stemmer => {
      const transformed = await transformFile(resolve(stemmersSource, stemmer + '.js'), {
        swcrc: false,
        module: { type: 'commonjs' },
      })

      await writeFile(resolve(stemmersDestination, stemmer + '.cjs'), transformed.code)
      await cp(resolve(stemmersSource, stemmer + '.d.ts'), resolve(stemmersDestination, stemmer + '.d.cts'))
    }),
  )
}

async function main() {
  // Remove and recreate destination directory
  await rm(destinationDir, { recursive: true, force: true })
  await mkdir(destinationDir)

  // Compile different versions
  await esm()
  await cjs()
}

await main()
