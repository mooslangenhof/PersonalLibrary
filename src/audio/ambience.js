// Room sounds, generated live with the Web Audio API (no audio files):
//   fire  – low rumble, soft hiss and random crackles/pops
//   rain  – filtered noise on the window with the odd drip
//   music – a slow, generative piano melody over a warm pad, with reverb
//
// Usage:
//   const amb = createAmbience()
//   await amb.start()                 // must be called from a click/tap
//   amb.setLayer('rain', false)
//   amb.setVolume(0.5)
//   amb.stop()

const LOOKAHEAD = 0.25 // seconds of sound scheduled ahead of time
const TICK_MS = 80

// Chords (MIDI notes) and the melody scale: D major, warm and unhurried.
const CHORDS = [
  [50, 57, 61, 64, 66], // Dmaj9
  [47, 54, 57, 62, 64], // Bm9
  [43, 50, 54, 57, 59], // Gmaj9 (add 13)
  [45, 52, 57, 59, 64], // Asus2/E
]
const SCALE = [62, 64, 66, 69, 71, 74, 76, 78, 81] // D major pentatonic, two octaves
const CHORD_SECONDS = 9.6

const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12)
const rand = (a, b) => a + Math.random() * (b - a)

export function createAmbience() {
  let ctx = null
  let nodes = null
  let timer = null
  let running = false
  const state = { volume: 0.6, layers: { fire: true, rain: true, music: true } }

  /* ------------------------------------------------------------ setup -- */
  function build() {
    const AC = window.AudioContext || window.webkitAudioContext
    ctx = new AC()

    const master = ctx.createGain()
    master.gain.value = 0
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.ratio.value = 3
    master.connect(comp).connect(ctx.destination)

    const reverb = ctx.createConvolver()
    reverb.buffer = impulseResponse(ctx, 3.2, 2.6)
    const reverbOut = ctx.createGain()
    reverbOut.gain.value = 0.55
    reverb.connect(reverbOut).connect(master)

    const layer = (name, level) => {
      const g = ctx.createGain()
      g.gain.value = state.layers[name] ? level : 0
      g.connect(master)
      return { gain: g, level }
    }
    const fire = layer('fire', 0.9)
    const rain = layer('rain', 0.9)
    const music = layer('music', 0.75)
    const musicWet = ctx.createGain()
    musicWet.gain.value = 0.9
    music.gain.connect(musicWet).connect(reverb)

    const buffers = {
      white: noiseBuffer(ctx, 'white'),
      pink: noiseBuffer(ctx, 'pink'),
      brown: noiseBuffer(ctx, 'brown'),
      crackle: crackleBuffer(ctx),
    }

    nodes = { master, reverb, fire, rain, music, buffers, sched: { crackle: 0, drip: 0, chord: 0, note: 0, chordIndex: 0 } }
    buildFireBed()
    buildRainBed()
  }

  function loopNoise(buffer, rate = 1) {
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.loop = true
    src.playbackRate.value = rate
    src.loopStart = Math.random() * 2
    src.start(0, Math.random() * buffer.duration)
    return src
  }

  function lfo(param, rate, depth) {
    const osc = ctx.createOscillator()
    osc.frequency.value = rate
    const g = ctx.createGain()
    g.gain.value = depth
    osc.connect(g).connect(param)
    osc.start()
  }

  function buildFireBed() {
    const { buffers, fire } = nodes
    // Low, breathing rumble.
    const rumble = loopNoise(buffers.brown)
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 320
    const rg = ctx.createGain()
    rg.gain.value = 0.55
    lfo(rg.gain, 0.17, 0.18)
    lfo(lp.frequency, 0.11, 90)
    rumble.connect(lp).connect(rg).connect(fire.gain)
    // Soft hiss of burning wood.
    const hiss = loopNoise(buffers.pink, 0.9)
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 2600
    bp.Q.value = 0.6
    const hg = ctx.createGain()
    hg.gain.value = 0.035
    lfo(hg.gain, 0.23, 0.015)
    hiss.connect(bp).connect(hg).connect(fire.gain)
  }

  function buildRainBed() {
    const { buffers, rain } = nodes
    const wash = loopNoise(buffers.pink)
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 450
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 5200
    const wg = ctx.createGain()
    wg.gain.value = 0.32
    lfo(wg.gain, 0.05, 0.08) // rain coming in waves
    wash.connect(hp).connect(lp).connect(wg).connect(rain.gain)
    // Patter on the glass.
    const patter = loopNoise(buffers.white, 1.3)
    const pb = ctx.createBiquadFilter()
    pb.type = 'bandpass'
    pb.frequency.value = 3800
    pb.Q.value = 1.2
    const pg = ctx.createGain()
    pg.gain.value = 0.05
    lfo(pg.gain, 0.31, 0.02)
    patter.connect(pb).connect(pg).connect(rain.gain)
  }

  /* -------------------------------------------------------- scheduler -- */
  function schedule() {
    if (!running || !ctx) return
    const now = ctx.currentTime
    const until = now + LOOKAHEAD
    const s = nodes.sched
    for (const key of ['crackle', 'drip', 'chord', 'note']) if (s[key] < now) s[key] = now + rand(0, 0.2)

    if (state.layers.fire) {
      while (s.crackle < until) {
        crackle(s.crackle)
        // Mostly small ticks, every so often a cluster or a bigger pop.
        s.crackle += Math.random() < 0.12 ? rand(0.02, 0.06) : rand(0.08, 0.6)
      }
    } else s.crackle = until

    if (state.layers.rain) {
      while (s.drip < until) {
        drip(s.drip)
        s.drip += rand(0.25, 1.6)
      }
    } else s.drip = until

    if (state.layers.music) {
      while (s.chord < until) {
        playChord(CHORDS[s.chordIndex % CHORDS.length], s.chord)
        s.chordIndex += 1
        s.chord += CHORD_SECONDS
      }
      while (s.note < until) {
        playMelodyNote(s.note)
        s.note += [1.2, 1.2, 2.4, 2.4, 3.6, 4.8][Math.floor(Math.random() * 6)]
      }
    } else {
      s.chord = until
      s.note = until
    }
  }

  function crackle(t) {
    const src = ctx.createBufferSource()
    src.buffer = nodes.buffers.crackle
    src.playbackRate.value = rand(0.5, 1.7)
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = rand(1200, 5200)
    bp.Q.value = rand(0.7, 2.5)
    const g = ctx.createGain()
    const big = Math.random() < 0.08
    g.gain.value = big ? rand(0.35, 0.6) : rand(0.04, 0.2)
    src.connect(bp).connect(g).connect(nodes.fire.gain)
    src.start(t)
  }

  function drip(t) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    const f = rand(1800, 3400)
    osc.frequency.setValueAtTime(f, t)
    osc.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.06)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(rand(0.006, 0.02), t + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
    osc.connect(g).connect(nodes.rain.gain)
    osc.start(t)
    osc.stop(t + 0.1)
  }

  function playChord(chord, t) {
    const dur = CHORD_SECONDS + 3
    chord.forEach((m, i) => {
      for (const detune of [-6, 6]) {
        const osc = ctx.createOscillator()
        osc.type = i === 0 ? 'sine' : 'triangle'
        osc.frequency.value = midiToHz(m)
        osc.detune.value = detune
        const lp = ctx.createBiquadFilter()
        lp.type = 'lowpass'
        lp.frequency.value = 900
        const g = ctx.createGain()
        const peak = (i === 0 ? 0.05 : 0.018)
        g.gain.setValueAtTime(0, t)
        g.gain.linearRampToValueAtTime(peak, t + 2.5)
        g.gain.setValueAtTime(peak, t + dur - 3.5)
        g.gain.linearRampToValueAtTime(0, t + dur)
        osc.connect(lp).connect(g).connect(nodes.music.gain)
        osc.start(t)
        osc.stop(t + dur + 0.1)
      }
    })
  }

  function playMelodyNote(t) {
    if (Math.random() < 0.18) return // leave some silence
    const chord = CHORDS[(nodes.sched.chordIndex + CHORDS.length - 1) % CHORDS.length]
    // Prefer notes that belong to the current chord.
    const fits = SCALE.filter((n) => chord.some((c) => (n - c) % 12 === 0))
    const pool = Math.random() < 0.7 && fits.length ? fits : SCALE
    const m = pool[Math.floor(Math.random() * pool.length)]
    pianoNote(m, t, rand(0.08, 0.14))
    if (Math.random() < 0.25) pianoNote(m - 12, t + 0.01, 0.05) // soft octave below
  }

  /** A soft, felt-piano-like tone: a few sine partials with a quick attack and long decay. */
  function pianoNote(m, t, vel) {
    const f = midiToHz(m)
    const out = ctx.createGain()
    out.gain.value = vel
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(3200, t)
    lp.frequency.exponentialRampToValueAtTime(900, t + 1.5)
    out.connect(lp).connect(nodes.music.gain)
    ;[
      [1, 1, 3.2],
      [2, 0.35, 1.8],
      [3, 0.12, 1.1],
      [4.02, 0.05, 0.6],
    ].forEach(([ratio, amp, decay]) => {
      const osc = ctx.createOscillator()
      osc.frequency.value = f * ratio
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(amp, t + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
      osc.connect(g).connect(out)
      osc.start(t)
      osc.stop(t + decay + 0.05)
    })
  }

  /* ---------------------------------------------------------- controls -- */
  async function start() {
    if (!ctx) build()
    if (ctx.state === 'suspended') await ctx.resume()
    running = true
    nodes.master.gain.cancelScheduledValues(ctx.currentTime)
    nodes.master.gain.setTargetAtTime(state.volume, ctx.currentTime, 0.6)
    schedule()
    clearInterval(timer)
    timer = setInterval(schedule, TICK_MS)
  }

  function stop() {
    if (!ctx) return
    running = false
    clearInterval(timer)
    nodes.master.gain.cancelScheduledValues(ctx.currentTime)
    nodes.master.gain.setTargetAtTime(0, ctx.currentTime, 0.25)
    // Suspend after the fade so it uses no CPU while muted.
    setTimeout(() => {
      if (!running && ctx.state === 'running') ctx.suspend()
    }, 1500)
  }

  function setVolume(v) {
    state.volume = v
    if (ctx && running) nodes.master.gain.setTargetAtTime(v, ctx.currentTime, 0.1)
  }

  function setLayer(name, on) {
    state.layers[name] = on
    if (!ctx) return
    const l = nodes[name]
    l.gain.gain.setTargetAtTime(on ? l.level : 0, ctx.currentTime, on ? 0.8 : 0.3)
  }

  function configure({ volume, layers }) {
    if (typeof volume === 'number') state.volume = volume
    if (layers) Object.assign(state.layers, layers)
  }

  /** For tests: an analyser tapped off the master output. */
  function analyser() {
    if (!ctx) return null
    const a = ctx.createAnalyser()
    a.fftSize = 2048
    nodes.master.connect(a)
    return a
  }

  return { start, stop, setVolume, setLayer, configure, analyser, get running() { return running } }
}

/* ------------------------------------------------------- audio buffers -- */

function noiseBuffer(ctx, kind) {
  const len = ctx.sampleRate * 4
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1
    if (kind === 'white') d[i] = w * 0.5
    else if (kind === 'pink') {
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.969 * b2 + w * 0.153852
      b3 = 0.8665 * b3 + w * 0.3104856
      b4 = 0.55 * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.016898
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
      b6 = w * 0.115926
    } else {
      last = (last + 0.02 * w) / 1.02
      d[i] = last * 3.5
    }
  }
  // Crossfade the ends so the loop has no click.
  const fade = Math.floor(ctx.sampleRate * 0.05)
  for (let i = 0; i < fade; i++) {
    const k = i / fade
    d[i] = d[i] * k + d[len - fade + i] * (1 - k)
  }
  return buf
}

/** A few milliseconds of sharply decaying noise: one crackle. */
function crackleBuffer(ctx) {
  const len = Math.floor(ctx.sampleRate * 0.03)
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 6)
  return buf
}

/** A generated room reverb: stereo noise with an exponential tail. */
function impulseResponse(ctx, seconds, decay) {
  const len = Math.floor(ctx.sampleRate * seconds)
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return buf
}
