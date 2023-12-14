import t from 'tap'
import { boundedLevenshtein, levenshtein } from '../src/components/levenshtein.js'

t.test('levenshtein', (t) => {
  t.plan(3)

  t.test('should be 0 when both inputs are empty', (t) => {
    t.plan(1)

    t.equal(levenshtein('', ''), 0)
  })

  t.test('should be the max input length when either strings are empty', (t) => {
    t.plan(2)

    t.equal(levenshtein('', 'some'), 4)
    t.equal(levenshtein('body', ''), 4)
  })

  t.test('some examples', (t) => {
    t.plan(5)

    t.equal(levenshtein('aa', 'b'), 2)
    t.equal(levenshtein('b', 'aa'), 2)
    t.equal(levenshtein('somebody once', 'told me'), 9)
    t.equal(levenshtein('the world is gonna', 'roll me'), 15)
    t.equal(levenshtein('kaushuk chadhui', 'caushik chakrabar'), 8)
  })
})

t.test('boundedLevenshtein', (t) => {
  t.plan(3)

  t.test('should be 0 when both inputs are empty', async (t) => {
    t.plan(2)

    t.match(await boundedLevenshtein('', '', 0), { distance: 0, isBounded: true })
    t.match(await boundedLevenshtein('', '', 1), { distance: 0, isBounded: true })
  })

  t.test('should be the max input length when either strings are empty', async (t) => {
    t.plan(3)

    t.match(await boundedLevenshtein('', 'some', 0), { distance: 0, isBounded: true })

    t.match(await boundedLevenshtein('', 'some', 4), { distance: 0, isBounded: true })
    t.match(await boundedLevenshtein('body', '', 4), { distance: 0, isBounded: true })
  })

  t.test('should tell whether the Levenshtein distance is upperbounded by a given tolerance', async (t) => {
    t.plan(2)

    t.match(await boundedLevenshtein('somebody once', 'told me', 9), { isBounded: true })
    t.match(await boundedLevenshtein('somebody once', 'told me', 8), { isBounded: false })
  })
})

t.test('syncBoundedLevenshtein substrings are ok even if with tolerance pppppp', async (t) => {
  t.match(await boundedLevenshtein('Dhris', 'Chris', 0), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Dhris', 'Chris', 1), { isBounded: true, distance: 1 })
  t.match(await boundedLevenshtein('Dhris', 'Cgris', 1), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Dhris', 'Cgris', 2), { isBounded: true, distance: 2 })
  t.match(await boundedLevenshtein('Dhris', 'Cgris', 3), { isBounded: true, distance: 2 })

  t.match(await boundedLevenshtein('Dhris', 'Cris', 0), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Dhris', 'Cris', 1), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Dhris', 'Cris', 2), { isBounded: true, distance: 2 })
  
  t.match(await boundedLevenshtein('Dhris', 'Caig', 0), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Dhris', 'Caig', 1), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Dhris', 'Caig', 2), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Dhris', 'Caig', 3), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Dhris', 'Caig', 4), { isBounded: true, distance: 4 })

  t.match(await boundedLevenshtein('Chris', 'Chris', 0), { isBounded: true, distance: 0 })
  t.match(await boundedLevenshtein('Chris', 'Chris', 1), { isBounded: true, distance: 0 })
  t.match(await boundedLevenshtein('Chris', 'Chris', 2), { isBounded: true, distance: 0 })

  t.match(await boundedLevenshtein('Chris', 'Cris', 0), { isBounded: false, distance: -1 })

  t.match(await boundedLevenshtein('Chris', 'Cris', 1), { isBounded: true, distance: 1 })
  t.match(await boundedLevenshtein('Chris', 'Cris', 2), { isBounded: true, distance: 1 })

  t.match(await boundedLevenshtein('Chris', 'Caig', 0), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Chris', 'Caig', 1), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Chris', 'Caig', 2), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Chris', 'Caig', 3), { isBounded: true, distance: 3 })

  t.match(await boundedLevenshtein('Craig', 'Caig', 0), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Craig', 'Caig', 1), { isBounded: true, distance: 1 })
  t.match(await boundedLevenshtein('Craig', 'Caig', 2), { isBounded: true, distance: 1 })

  t.match(await boundedLevenshtein('Chxy', 'Cris', 0), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Chxy', 'Cris', 1), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Chxy', 'Cris', 2), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Chxy', 'Cris', 3), { isBounded: true, distance: 3 })

  t.match(await boundedLevenshtein('Chxy', 'Caig', 0), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Chxy', 'Caig', 1), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Chxy', 'Caig', 2), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Chxy', 'Caig', 3), { isBounded: true, distance: 3 })

  t.match(await boundedLevenshtein('Crxy', 'Cris', 0), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Crxy', 'Cris', 1), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Crxy', 'Cris', 2), { isBounded: true, distance: 2 })

  t.match(await boundedLevenshtein('Crxy', 'Caig', 0), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Crxy', 'Caig', 1), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Crxy', 'Caig', 2), { isBounded: false, distance: -1 })
  t.match(await boundedLevenshtein('Crxy', 'Caig', 3), { isBounded: true, distance: 3 })

  t.match(await boundedLevenshtein('Crxy', 'Caig', 3), { isBounded: true, distance: 3 })

  t.match(await boundedLevenshtein('Chris', 'Christopher', 0), { isBounded: true, distance: 0 })
  t.match(await boundedLevenshtein('Chris', 'Christopher', 1), { isBounded: true, distance: 0 })

  t.end()
})
