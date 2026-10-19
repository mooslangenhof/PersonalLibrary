// "Fill in for me": finds what a book is about.
//
// - With an Anthropic API key saved in this browser, Claude writes 4–6 core
//   teachings in the same style as the starting books.
// - Without a key (or if Claude can't help), it falls back to the free
//   Google Books and Open Library databases and uses the book's description.
//
// The API key is only ever kept in this browser's localStorage. It is never
// part of the code, so it is not published to GitHub.

const KEY_STORAGE = 'cozy-library/anthropic-key'
const CLAUDE_MODEL = 'claude-sonnet-5-5'

/* ------------------------------------------------------------ the key -- */

export function getApiKey() {
  try {
    return window.localStorage.getItem(KEY_STORAGE) || ''
  } catch {
    return ''
  }
}

export function saveApiKey(key) {
  try {
    if (key) window.localStorage.setItem(KEY_STORAGE, key.trim())
    else window.localStorage.removeItem(KEY_STORAGE)
    return true
  } catch {
    return false
  }
}

/* -------------------------------------------------------- main lookup -- */

/**
 * Look a book up. Resolves to
 *   { teachings: string, author?: string, source: 'claude' | 'google' | 'openlibrary', note?: string }
 * or throws an Error with a readable message.
 */
export async function lookupBook({ title, author }, { fetchImpl = fetch, apiKey = getApiKey() } = {}) {
  title = (title || '').trim()
  author = (author || '').trim()
  if (!title) throw new Error('Type the book title first.')

  let claudeProblem = null
  if (apiKey) {
    try {
      const result = await askClaude({ title, author }, apiKey, fetchImpl)
      if (result) return result
      claudeProblem = 'Claude didn’t recognise this book, so here is its description instead.'
    } catch (err) {
      // A bad key or empty credit balance should be fixed, not silently hidden.
      if (err.fatal) throw err
      claudeProblem = `Claude couldn’t be reached (${err.message}), so here is the book’s description instead.`
    }
  }

  const free = (await fromGoogleBooks({ title, author }, fetchImpl)) || (await fromOpenLibrary({ title, author }, fetchImpl))
  if (!free) {
    throw new Error(
      claudeProblem
        ? 'Claude didn’t recognise this book and no description was found. Check the spelling of the title, or write the teachings yourself.'
        : 'No description found for this title. Check the spelling, add the author, or write the teachings yourself.',
    )
  }
  return { ...free, note: claudeProblem ?? undefined }
}

/* ------------------------------------------------------------- Claude -- */

const PROMPT = (title, author) => `You help someone keep a personal reading journal.

Book title: ${title}
Author: ${author || '(not given)'}

Write the core teachings of this book: the 4 to 6 most important ideas a reader takes away.
Rules:
- Each teaching is one or two plain, warm sentences in your own words. Do not quote the book.
- Be concrete and accurate. If you do not know this specific book well, do not guess.
- No numbering, no bullet characters, no headings.

Reply with only a JSON object, no other text:
{"known": true or false, "author": "the author's full name as usually credited", "teachings": ["...", "..."]}
If you do not know the book, reply {"known": false}.`

async function askClaude({ title, author }, apiKey, fetchImpl) {
  let res
  try {
    res = await fetchImpl('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        // Allows calling the API straight from the browser with the user's own key.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 900,
        messages: [{ role: 'user', content: PROMPT(title, author) }],
      }),
    })
  } catch {
    throw new Error('the connection failed')
  }

  if (!res.ok) {
    let message = ''
    try {
      message = (await res.json())?.error?.message || ''
    } catch {
      /* ignore */
    }
    if (res.status === 401 || res.status === 403) {
      throw fatal('Your Anthropic API key wasn’t accepted. Check it in “AI helper” below, or remove it to use the free lookup.')
    }
    if (/credit balance/i.test(message)) {
      throw fatal('Your Anthropic account is out of credit. Add credit at console.anthropic.com, or remove the key to use the free lookup.')
    }
    if (res.status === 429 || res.status === 529) throw new Error('it is busy right now')
    throw new Error(message || `error ${res.status}`)
  }

  const data = await res.json()
  const text = (data?.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
  const parsed = parseJsonObject(text)
  if (!parsed || parsed.known === false || !Array.isArray(parsed.teachings)) return null
  const teachings = parsed.teachings.map((t) => String(t).trim()).filter(Boolean)
  if (teachings.length === 0) return null
  return {
    teachings: teachings.join('\n'),
    author: typeof parsed.author === 'string' ? parsed.author.trim() : undefined,
    source: 'claude',
  }
}

function fatal(message) {
  const err = new Error(message)
  err.fatal = true
  return err
}

export function parseJsonObject(text) {
  if (!text) return null
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
}

/* ---------------------------------------------------- free databases -- */

async function getJson(url, fetchImpl) {
  try {
    const res = await fetchImpl(url)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

const normalise = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

async function fromGoogleBooks({ title, author }, fetchImpl) {
  const clean = (s) => s.replace(/"/g, '')
  const q = [`intitle:"${clean(title)}"`, author && `inauthor:"${clean(author)}"`].filter(Boolean).join(' ')
  const data = await getJson(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=10&printType=books`,
    fetchImpl,
  )
  const items = (data?.items || []).map((i) => i.volumeInfo || {}).filter((v) => v.description)
  if (items.length === 0) return null
  // Prefer an exact title match, then the longest description.
  const wanted = normalise(title)
  items.sort((a, b) => {
    const am = normalise(a.title) === wanted ? 1 : 0
    const bm = normalise(b.title) === wanted ? 1 : 0
    return bm - am || b.description.length - a.description.length
  })
  const best = items[0]
  const teachings = descriptionToLines(best.description)
  if (!teachings) return null
  return {
    teachings,
    author: Array.isArray(best.authors) && best.authors.length ? best.authors.join(' & ') : undefined,
    source: 'google',
  }
}

async function fromOpenLibrary({ title, author }, fetchImpl) {
  const params = new URLSearchParams({ title, limit: '5', fields: 'key,title,author_name' })
  if (author) params.set('author', author)
  const search = await getJson(`https://openlibrary.org/search.json?${params}`, fetchImpl)
  for (const doc of search?.docs || []) {
    if (!doc.key) continue
    const work = await getJson(`https://openlibrary.org${doc.key}.json`, fetchImpl)
    const raw = typeof work?.description === 'string' ? work.description : work?.description?.value
    const teachings = descriptionToLines(raw)
    if (teachings) {
      return {
        teachings,
        author: Array.isArray(doc.author_name) && doc.author_name.length ? doc.author_name.join(' & ') : undefined,
        source: 'openlibrary',
      }
    }
  }
  return null
}

/**
 * Turn a publisher description into a few lines for the teachings box:
 * strip HTML and links, then group sentences into 3–5 short lines.
 */
export function descriptionToLines(raw) {
  if (!raw) return null
  const text = raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, '’')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '') // markdown links (Open Library)
    .replace(/-{3,}[\s\S]*$/, '') // Open Library "See also" sections
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length < 40) return null

  const all = text.match(/[^.!?]+[.!?]+["’”)]*|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) || [text]
  // Drop publisher marketing lines; keep the ones about the ideas.
  const salesy = /\b(edition|bestsell|best-sell|million copies|copies sold|new york times|now a major|translated by|foreword|introduction by|award-winning|available now|this book is)\b/i
  const sentences = all.filter((s) => !salesy.test(s))
  if (sentences.length === 0) sentences.push(...all)
  const lines = []
  let current = ''
  for (const s of sentences) {
    if (current && (current + ' ' + s).length > 150) {
      lines.push(current)
      current = s
    } else current = current ? current + ' ' + s : s
    if (lines.length === 5) break
  }
  if (current && lines.length < 5) lines.push(current)
  return lines.join('\n')
}
