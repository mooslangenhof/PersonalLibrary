# The Cozy Library

A personal reading journal shaped like a warm, wood-panelled library at night. Your books stand on a 3D bookshelf by a crackling fireplace; click one and it glides off the shelf, floats toward you and opens to a journal spread with its core teachings and your own reflections.

Built with [React](https://react.dev), [Three.js](https://threejs.org) via [React Three Fiber](https://r3f.docs.pmnd.rs) and [drei](https://drei.docs.pmnd.rs), and [Vite](https://vite.dev). All textures (wood, brick, wallpaper, rug, book covers) are drawn in code, so there are no image assets to manage.

**Live site:** https://mooslangenhof.github.io/PersonalLibrary/

## Run it locally

You need **Node.js 20.19+ or 22.12+** ([download](https://nodejs.org)).

```bash
npm install
npm run dev
```

Your browser opens at `http://localhost:5173`. That's it.

To make a production build (a static site you can host anywhere, e.g. GitHub Pages, Netlify, Vercel):

```bash
npm run build     # output goes to dist/
npm run preview   # serve the built site locally to check it
```

## Publishing to GitHub Pages

Every push to `main` rebuilds the site and publishes it to GitHub Pages (see `.github/workflows/deploy.yml`). One-time setup: in the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**. You can follow each deploy in the **Actions** tab.

Your saved books live in each browser's local storage, so the books you add on the live site stay on that device. Use **Export backup** / **Import backup** to move them between devices.

## Using the library

| Action | How |
| --- | --- |
| Look around the room | Drag with the mouse (or one finger) |
| Lean in / step back | Scroll wheel or pinch |
| Open a book | Click it — it slides off the shelf and opens |
| Close a book | **Return to Shelf**, click outside the pages, or press `Esc` |
| Add a book | The **+** button in the bottom-right corner |
| Edit or remove a book | Open it, then **Edit** |
| Room sounds | The speaker button in the bottom-left corner; the sliders button next to it turns the fireplace, rain and piano on or off and sets the volume |

When you save a new book, a 3D book is generated with your title, author and colours on the cover and spine, and it slides into the next free spot on the shelf. The eye-level shelf fills first; when every shelf is full, extra books are stacked flat on top of the bookcase.

### Room sounds

The speaker button plays a crackling fire, rain on the window and a slow, soft piano melody. Everything is generated live in the browser with the Web Audio API (`src/audio/ambience.js`), so there are no audio files and no licensing to worry about, and the melody never repeats exactly. Browsers only allow sound after you click, so the room always starts quiet. Your choice of sounds and volume is remembered. On an iPhone, the silent switch also mutes it.

### "Fill in for me": automatic core teachings

Type a title (and the author, if you know it) in the **+** panel and press **Fill in for me**. The Core Teachings box fills itself, and the author is filled in if you left it empty. Your reflections are always left for you to write. Check the result and edit it before saving.

- **Without any setup** it looks the book up in the free Google Books and Open Library databases and uses the published description of the book.
- **With the AI helper on** it asks Claude to write 4–6 core teachings, like the three starting books. To turn it on:
  1. Sign in at [console.anthropic.com](https://console.anthropic.com) and add a little credit under **Billing**. Each lookup uses only a very small amount of credit.
  2. Go to **API Keys**, create a key and copy it (it starts with `sk-ant-`).
  3. In the app, open the **+** panel, scroll to **AI helper**, paste the key and press **Save key**.

  The key is stored only in your browser's local storage, never in this repository's code, so it is not published on GitHub and visitors to your site can't use it. You'll need to paste it again on each new browser or device. **Remove key from this browser** turns the AI helper off again.

  If Claude doesn't know a book or can't be reached, the button falls back to the free description and tells you so.

### Where your books are saved

Books are saved in your browser's **localStorage**, so they are still there the next time you open the app in the same browser. Clearing site data, or opening the app in a different browser or computer, starts from the three default books.

To move your library or keep it safe, open the **+** panel and use **Export backup** (downloads a `.json` file) and **Import backup**. **Reset library** returns to the three starting books.

### Optional passcode

By default anyone using the app can add and edit books. To lock the add/edit/remove actions behind a passcode:

1. Copy `.env.example` to `.env.local`
2. Set `VITE_LIBRARY_PASSCODE=your-passcode`
3. Restart `npm run dev`

You will be asked for the passcode once per browser session. This is a light privacy lock for a personal app, not real security: the passcode ends up in the site's JavaScript, so anyone determined could find it.

## Project structure

```
src/
├── App.jsx                      App shell: 3D canvas + UI overlays
├── state/useLibrary.js          Global state (zustand): books, reading flow, panels, persistence
├── data/
│   ├── defaultBooks.js          The three starting books — edit to change the starting set
│   ├── storage.js               localStorage load/save, export/import backup
│   ├── bookLookup.js            "Fill in for me": Claude, Google Books, Open Library
│   └── themes.js                Cover colour presets and colour helpers
├── utils/
│   ├── layout.js                Room & bookcase measurements, shelf slot calculation
│   └── textures.js              Procedural canvas textures (wood, brick, rug, covers, spines…)
├── components/scene/            Everything inside the 3D world
│   ├── LibraryScene.jsx         Puts the scene together
│   ├── Room.jsx                 Floor, walls, window, armchair, lamp, lantern
│   ├── Fireplace.jsx            Brick fireplace, fire, flickering firelight
│   ├── Bookshelf.jsx            Bookcase, shelf decorations, the books
│   ├── Book.jsx                 One book: hinged cover, hover glow, open/close animation
│   ├── Flame.jsx                Shader flame + candles
│   ├── CameraRig.jsx            Orbit controls, intro glide, focus on the open book
│   ├── Lighting.jsx             Ambient/fill lights
│   ├── Effects.jsx              Bloom, tone mapping, vignette
│   └── materials.js             Shared materials
├── audio/ambience.js            Generated room sounds: fire, rain, piano
├── components/ui/               HTML overlays
│   ├── JournalOverlay.jsx       The open-book journal pages
│   ├── BookForm.jsx             Add / edit panel ("admin portal") with backup tools
│   ├── AddBookButton.jsx        The + button
│   ├── SoundControl.jsx         Speaker button and sound mixer
│   ├── UnlockDialog.jsx         Passcode prompt (only if a passcode is set)
│   └── Header.jsx, HoverLabel.jsx, Toast.jsx, LoadingScreen.jsx
└── styles/global.css            All UI styling
```

## Customising

- **Starting books**: edit `src/data/defaultBooks.js`. Teachings are one per line; reflections are left empty for you to write in the app. Because your library lives in localStorage after the first visit, use **Reset library** to see changes to this file.
- **Colour presets**: add or change entries in `src/data/themes.js`.
- **Room mood**: light colours and strengths are in `Lighting.jsx`, `Fireplace.jsx` (`FireLight`) and `Room.jsx` (floor lamp and lantern). Bloom strength is in `Effects.jsx`.
- **Camera**: starting view, reading position and orbit limits are in `src/utils/layout.js` and `CameraRig.jsx`.

## Notes

- The scene uses real-time shadows and bloom. It runs smoothly on most laptops; on a very old machine, lowering `dpr` in `App.jsx` (e.g. `dpr={1}`) helps.
- The fonts (Cormorant Garamond, Caveat, Inter) load from Google Fonts. Without internet access the app still works with fallback fonts.
