import t from 'tap'

import { stemmer as bulgarianStemmer } from '@orama/stemmers/bulgarian'
import { stemmer as danishStemmer } from '@orama/stemmers/danish'
import { stemmer as dutchStemmer } from '@orama/stemmers/dutch'
import { stemmer as finnishStemmer } from '@orama/stemmers/finnish'
import { stemmer as frenchStemmer } from '@orama/stemmers/french'
import { stemmer as germanStemmer } from '@orama/stemmers/german'
import { stemmer as italianStemmer } from '@orama/stemmers/italian'
import { stemmer as norwegianStemmer } from '@orama/stemmers/norwegian'
import { stemmer as portugueseStemmer } from '@orama/stemmers/portuguese'
import { stemmer as russianStemmer } from '@orama/stemmers/russian'
import { stemmer as spanishStemmer } from '@orama/stemmers/spanish'
import { stemmer as swedishStemmer } from '@orama/stemmers/swedish'
import { stemmer as ukrainianStemmer } from '@orama/stemmers/ukrainian'
import { createTokenizer } from '../src/components/tokenizer/index.js'

t.test('Tokenizer', async t => {
  t.plan(20)

  t.test('should tokenize and stem correctly in english', async t => {
    t.plan(2)

    const tokenizer = await createTokenizer({ language: 'english', stopWords: false, stemming: true })

    const I1 = 'the quick brown fox jumps over the lazy dog'
    const I2 = 'I baked some cakes'

    const O1 = tokenizer.tokenize(I1, 'english')
    const O2 = tokenizer.tokenize(I2, 'english')

    t.strictSame(O1, ['the', 'quick', 'brown', 'fox', 'jump', 'over', 'lazi', 'dog'])
    t.strictSame(O2, ['i', 'bake', 'some', 'cake'])
  })

  t.test('should tokenize and stem correctly in english and allow duplicates', async t => {
    t.plan(2)

    const tokenizer = await createTokenizer({
      language: 'english',
      allowDuplicates: true,
      stopWords: false,
      stemming: true,
    })

    const I1 = 'this is a test with test duplicates'
    const I2 = "it's alive! it's alive!"

    const O1 = tokenizer.tokenize(I1, 'english')
    const O2 = tokenizer.tokenize(I2, 'english')

    t.strictSame(O1, ['thi', 'is', 'a', 'test', 'with', 'test', 'duplic'])
    t.strictSame(O2, ["it'", 'aliv', "it'", 'aliv'])
  })

  t.test('should tokenize and stem correctly in english skipping appropriate properties (single)', async t => {
    t.plan(2)

    const tokenizer = await createTokenizer({
      language: 'english',
      stemming: true,
      stemmerSkipProperties: 'notToStem',
    })

    const I1 = 'the quick brown fox jumps over the lazy dog'

    const O1 = tokenizer.tokenize(I1, 'english')
    const O2 = tokenizer.tokenize(I1, 'english', 'notToStem')

    t.strictSame(O1, ['quick', 'brown', 'fox', 'jump', 'lazi', 'dog'])
    t.strictSame(O2, ['quick', 'brown', 'fox', 'jumps', 'lazy', 'dog'])
  })

  t.test('should tokenize and stem correctly in english skipping appropriate properties (multiple)', async t => {
    t.plan(3)

    const tokenizer = await createTokenizer({
      language: 'english',
      stemming: true,
      stemmerSkipProperties: ['notToStem', 'another'],
    })

    const I1 = 'the quick brown fox jumps over the lazy dog'

    const O1 = tokenizer.tokenize(I1, 'english')
    const O2 = tokenizer.tokenize(I1, 'english', 'notToStem')
    const O3 = tokenizer.tokenize(I1, 'english', 'another')

    t.strictSame(O1, ['quick', 'brown', 'fox', 'jump', 'lazi', 'dog'])
    t.strictSame(O2, ['quick', 'brown', 'fox', 'jumps', 'lazy', 'dog'])
    t.strictSame(O3, ['quick', 'brown', 'fox', 'jumps', 'lazy', 'dog'])
  })

  t.test('should tokenize and stem correctly in english skipping appropriate properties (invalid)', async t => {
    t.plan(2)

    const tokenizer = await createTokenizer({
      language: 'english',
      stemming: true,
      // @ts-expect-error Testing error
      stemmerSkipProperties: 1,
    })

    const I1 = 'the quick brown fox jumps over the lazy dog'

    const O1 = tokenizer.tokenize(I1, 'english')
    const O2 = tokenizer.tokenize(I1, 'english', 'notToStem')

    t.strictSame(O1, ['quick', 'brown', 'fox', 'jump', 'lazi', 'dog'])
    t.strictSame(O2, ['quick', 'brown', 'fox', 'jump', 'lazi', 'dog'])
  })

  t.test('should tokenize and stem correctly in french', async t => {
    t.plan(2)

    const tokenizer = await createTokenizer({ language: 'french', stemmer: frenchStemmer })

    const I1 = 'voyons quel temps il fait dehors'
    const I2 = "j'ai fait des gâteaux"

    const O1 = tokenizer.tokenize(I1)
    const O2 = tokenizer.tokenize(I2)

    t.strictSame(O1, ['voyon', 'temp', 'fait', 'dehor'])
    t.strictSame(O2, ['fait', 'gateau'])
  })

  t.test('should tokenize and stem correctly in italian', async t => {
    t.plan(2)

    const tokenizer = await createTokenizer({ language: 'italian', stemmer: italianStemmer })

    const I1 = 'ho cucinato delle torte'
    const I2 = 'dormire è una cosa difficile quando i test non passano'

    const O1 = tokenizer.tokenize(I1)
    const O2 = tokenizer.tokenize(I2)

    t.strictSame(O1, ['cucin', 'tort'])
    t.strictSame(O2, ['dorm', 'cos', 'difficil', 'quand', 'test', 'pass'])
  })

  t.test('should tokenize and stem correctly in norwegian', async t => {
    t.plan(2)

    const tokenizer = await createTokenizer({ language: 'norwegian', stemmer: norwegianStemmer })
    const I1 = 'Jeg kokte noen kaker'
    const I2 = 'å sove er en vanskelig ting når testene mislykkes'

    const O1 = tokenizer.tokenize(I1)
    const O2 = tokenizer.tokenize(I2)

    t.strictSame(O1, ['kokt', 'kak'])
    t.strictSame(O2, ['sov', 'vansk', 'ting', 'test', 'mislykk'])
  })

  t.test('should tokenize and stem correctly in portuguese', async t => {
    t.plan(2)

    const tokenizer = await createTokenizer({ language: 'portuguese', stemmer: portugueseStemmer })

    const I1 = 'Eu cozinhei alguns bolos'
    const I2 = 'dormir é uma coisa difícil quando os testes falham'

    const O1 = tokenizer.tokenize(I1)
    const O2 = tokenizer.tokenize(I2)

    t.strictSame(O1, ['cozinh', 'alguns', 'bol'])
    t.strictSame(O2, ['dorm', 'e', 'cois', 'dificil', 'test', 'falh'])
  })

  t.test('should tokenize and stem correctly in russian', async t => {
    t.plan(2)

    const tokenizer = await createTokenizer({ language: 'russian', stemmer: russianStemmer })

    const I1 = 'я приготовила пирожные'
    const I2 = 'спать трудно, когда тесты не срабатывают'

    const O1 = tokenizer.tokenize(I1)
    const O2 = tokenizer.tokenize(I2)

    t.strictSame(O1, ['приготов', 'пирожн'])
    t.strictSame(O2, ['спат', 'трудн', 'тест', 'срабатыва'])
  })

  t.test('should tokenize and stem correctly in swedish', async t => {
    t.plan(2)

    const tokenizer = await createTokenizer({ language: 'swedish', stemmer: swedishStemmer })
    const I1 = 'Jag lagade några kakor'
    const I2 = 'att sova är en svår sak när testerna misslyckas'

    const O1 = tokenizer.tokenize(I1)
    const O2 = tokenizer.tokenize(I2)

    t.strictSame(O1, ['lag', 'kak'])
    t.strictSame(O2, ['sov', 'svar', 'sak', 'test', 'misslyck'])
  })

  t.test('should tokenize and stem correctly in spanish', async t => {
    t.plan(2)

    const tokenizer = await createTokenizer({ language: 'spanish', stemmer: spanishStemmer })

    const I1 = 'cociné unos pasteles'
    const I2 = 'dormir es algo dificil cuando las pruebas fallan'

    const O1 = tokenizer.tokenize(I1)
    const O2 = tokenizer.tokenize(I2)

    t.strictSame(O1, ['cocin', 'pastel'])
    t.strictSame(O2, ['dorm', 'dificil', 'prueb', 'fall'])
  })

  t.test('should tokenize and stem correctly in dutch', async t => {
    t.plan(2)

    const tokenizer = await createTokenizer({ language: 'dutch', stemmer: dutchStemmer })
    const I1 = 'de kleine koeien'
    const I2 = 'Ik heb wat taarten gemaakt'

    const O2 = tokenizer.tokenize(I2)
    const O1 = tokenizer.tokenize(I1)

    t.strictSame(O1, ['klein', 'koei'])
    t.strictSame(O2, ['taart', 'gemaakt'])
  })

  t.test('should tokenize and stem correctly in german', async t => {
    t.plan(2)

    const tokenizer = await createTokenizer({ language: 'german', stemmer: germanStemmer })

    const I1 = 'Schlaf ist eine harte Sache, wenn Tests fehlschlagen'
    const I2 = 'Ich habe ein paar Kekse gebacken'

    const O1 = tokenizer.tokenize(I1)
    const O2 = tokenizer.tokenize(I2)

    t.strictSame(O1, ['schlaf', 'hart', 'sach', 'test', 'fehlschlag'])
    t.strictSame(O2, ['paar', 'keks', 'geback'])
  })

  t.test('should tokenize and stem correctly in finnish', async t => {
    t.plan(2)

    const tokenizer = await createTokenizer({ language: 'finnish', stemmer: finnishStemmer })

    const I1 = 'Uni on vaikea asia, kun testit epäonnistuvat'
    const I2 = 'Leivoin keksejä'

    const O1 = tokenizer.tokenize(I1)
    const O2 = tokenizer.tokenize(I2)

    t.strictSame(O1, ['uni', 'vaike', 'as', 'test', 'epaonnistuv'])
    t.strictSame(O2, ['leivo', 'keksej'])
  })

  t.test('should tokenize and stem correctly in danish', async t => {
    t.plan(2)

    const tokenizer = await createTokenizer({ language: 'danish', stemmer: danishStemmer })

    const I1 = 'Søvn er en svær ting, når prøver mislykkes'
    const I2 = 'Jeg bagte småkager'

    const O1 = tokenizer.tokenize(I1)
    const O2 = tokenizer.tokenize(I2)

    t.strictSame(O1, ['sovn', 'svar', 'ting', 'prov', 'mislyk'])
    t.strictSame(O2, ['bagt', 'smakag'])
  })

  t.test('should tokenize and stem correctly in ukrainian', async t => {
    t.plan(2)

    const tokenizer = await createTokenizer({ language: 'ukrainian', stemmer: ukrainianStemmer })

    const I1 = 'Коли тести не проходять, спати важко'
    const I2 = 'я приготувала тістечка'

    const O1 = tokenizer.tokenize(I1)
    const O2 = tokenizer.tokenize(I2)

    t.strictSame(O1, ['кол', 'тест', 'не', 'проход', 'спат', 'важк'])
    t.strictSame(O2, ['я', 'приготувал', 'тістечк'])
  })

  t.test('should tokenize and stem correctly in bulgarian', async t => {
    t.plan(2)

    const tokenizer = await createTokenizer({ language: 'bulgarian', stemmer: bulgarianStemmer, stopWords: [] })

    const I1 = 'Кокошката е малка крава която не може да се събере с теста'
    const I2 = 'Има първа вероятност да се случи нещо неочаквано докато се изпълняват тестовете'

    const O1 = tokenizer.tokenize(I1)
    const O2 = tokenizer.tokenize(I2)

    t.strictSame(O1, ['кокошк', 'е', 'малк', 'крав', 'коят', 'не', 'мож', 'да', 'се', 'събер', 'с', 'тест'])
    t.strictSame(O2, ['има', 'първ', 'вероятност', 'да', 'се', 'случ', 'нещ', 'неочакван', 'док', 'изпълняват', 'тест'])
  })

  t.test('disable stemming', async t => {
    t.plan(2)

    const tokenizer = await createTokenizer({ language: 'english', stemming: false })

    const I1 = 'the quick brown fox jumps over the lazy dog'
    const I2 = 'I baked some cakes'

    const O1 = tokenizer.tokenize(I1)
    const O2 = tokenizer.tokenize(I2)

    t.same(O1, ['quick', 'brown', 'fox', 'jumps', 'lazy', 'dog'])
    t.same(O2, ['baked', 'cakes'])
  })

  t.test('should validate options', async t => {
    t.plan(3)

    await t.rejects(() => createTokenizer({ language: 'weird-language' }), { code: 'LANGUAGE_NOT_SUPPORTED' })

    await t.rejects(() => createTokenizer({ language: 'italian', stemming: true }), { code: 'MISSING_STEMMER' })

    // @ts-expect-error testing validation
    await t.rejects(() => createTokenizer({ language: 'english', stemmer: 'FOO' }), {
      code: 'INVALID_STEMMER_FUNCTION_TYPE',
    })
  })
})

t.test('Custom stop-words rules', async t => {
  t.plan(5)

  t.test('custom array of stop-words', async t => {
    t.plan(2)

    const tokenizer = await createTokenizer({
      language: 'english',
      stopWords: ['quick', 'brown', 'fox', 'dog'],
      stemming: true,
    })

    const I1 = 'the quick brown fox jumps over the lazy dog'
    const I2 = 'I baked some cakes'

    const O1 = tokenizer.tokenize(I1)

    const O2 = tokenizer.tokenize(I2)

    t.same(O1, ['the', 'jump', 'over', 'lazi'])
    t.same(O2, ['i', 'bake', 'some', 'cake'])
  })

  t.test('custom stop-words function', async t => {
    t.plan(2)

    const tokenizer = await createTokenizer({
      language: 'english',
      stopWords(words: string[]): string[] {
        return [...words, 'quick', 'brown', 'fox', 'dog']
      },
      stemming: true,
    })

    const I1 = 'the quick brown fox jumps over the lazy dog'
    const I2 = 'I baked some cakes'

    const O1 = tokenizer.tokenize(I1)
    const O2 = tokenizer.tokenize(I2)

    t.same(O1, ['jump', 'lazi'])
    t.same(O2, ['bake', 'cake'])
  })

  t.test('disable stop-words', async t => {
    t.plan(2)

    const tokenizer = await createTokenizer({ language: 'english', stopWords: false, stemming: true })

    const I1 = 'the quick brown fox jumps over the lazy dog'
    const I2 = 'I baked some cakes'

    const O1 = tokenizer.tokenize(I1)
    const O2 = tokenizer.tokenize(I2)

    t.same(O1, ['the', 'quick', 'brown', 'fox', 'jump', 'over', 'lazi', 'dog'])
    t.same(O2, ['i', 'bake', 'some', 'cake'])
  })

  t.test('custom stemming function', async t => {
    t.plan(2)

    const tokenizer = await createTokenizer({ language: 'english', stemmer: word => `${word}-ish` })

    const I1 = 'the quick brown fox jumps over the lazy dog'
    const I2 = 'I baked some cakes'

    const O1 = tokenizer.tokenize(I1)
    const O2 = tokenizer.tokenize(I2)

    t.same(O1, ['quick-ish', 'brown-ish', 'fox-ish', 'jumps-ish', 'lazy-ish', 'dog-ish'])
    t.same(O2, ['baked-ish', 'cakes-ish'])
  })

  await t.test('should validate options', async t => {
    t.plan(3)

    // @ts-expect-error testing validation
    await t.rejects(() => createTokenizer({ language: 'english', stopWords: 'FOO' }), {
      code: 'CUSTOM_STOP_WORDS_MUST_BE_FUNCTION_OR_ARRAY',
    })

    // @ts-expect-error testing validation
    await t.rejects(() => createTokenizer({ language: 'english', stopWords: [1, 2, 3] }), {
      code: 'CUSTOM_STOP_WORDS_MUST_BE_FUNCTION_OR_ARRAY',
    })

    // @ts-expect-error testing validation
    await t.rejects(() => createTokenizer({ language: 'english', stopWords: {} }), {
      code: 'CUSTOM_STOP_WORDS_MUST_BE_FUNCTION_OR_ARRAY',
    })
  })
})
