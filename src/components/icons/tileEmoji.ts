// Vendored decorative/meaning icons for Home tiles. NOT one source: mixed
// per-glyph, each licensed and tagged below — never hand-edit paths, only
// re-run the same extraction against a newer pin.
//
// - Fluent Emoji FLAT (Microsoft, MIT — github.com/microsoft/fluentui-emoji),
//   pinned via @iconify-json/fluent-emoji-flat: openBook, bullseye, writingHand.
// - Fluent Emoji HIGH CONTRAST (Microsoft, MIT), pinned via
//   @iconify-json/fluent-emoji-high-contrast: graduationCap — swapped from
//   Flat because Flat's dark cap colors (#533566/#321b41) blend into our dark
//   bgCard (#2f1d38); High Contrast draws with currentColor so TileEmoji's
//   `tint` prop sets the color explicitly.
// - Twemoji (Twitter/jdecked, CC-BY 4.0 — needs attribution, see README),
//   pinned via @iconify-json/twemoji: speechBalloon — swapped from Fluent
//   Flat because that version read as a plain oval with no visible tail/dots
//   at tile size, not a recognisable comic speech-bubble.
//
// UI-action icons (nav, search, edit) use phosphor-react-native instead —
// see ways-of-working.md for the Phosphor/Fluent split.

export const TILE_EMOJI = {
  // Слова — open-book (Fluent Flat)
  openBook: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g fill="none"><path fill="#b4acbc" fill-rule="evenodd" d="M16 8.05A3.5 3.5 0 0 1 18.5 7h8c.743 0 1.39.404 1.734 1.003c.07.121.096.26.096.4v2.294L29 25.5a2.5 2.5 0 0 1-2.5 2.5h-21A2.5 2.5 0 0 1 3 25.5l.67-14.803V8.403c0-.14.026-.279.096-.4A2 2 0 0 1 5.5 7h8c.98 0 1.865.402 2.5 1.05" clip-rule="evenodd"/><path fill="#0074ba" d="M17.732 30H28.5c.83 0 1.501-.678 1.501-1.505V27.44c0-.827-.67-2.441-1.501-2.441h-25C2.671 25 2 26.614 2 27.441v1.064C2 29.332 2.67 30 3.501 30h10.767a2 2 0 0 0 3.464 0"/><path fill="#00a6ed" fill-rule="evenodd" d="M3.501 10H14v1h4v-1h10.499c.83 0 1.501.668 1.501 1.495v16c0 .827-.67 1.505-1.501 1.505H17.732a2 2 0 0 1-3.464 0H3.5c-.829 0-1.5-.668-1.5-1.495v-16.01C2 10.668 2.67 10 3.501 10M17.5 27.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0" clip-rule="evenodd"/><path fill="#b4acbc" d="M13 8H5.803a1.5 1.5 0 0 0-1.248.668L3 11v14.5A1.5 1.5 0 0 0 4.5 27h23a1.5 1.5 0 0 0 1.5-1.5V11l-1.555-2.332A1.5 1.5 0 0 0 26.197 8H19v3h-6z"/><path fill="#f3eef8" d="M5.5 8h8a2.5 2.5 0 0 1 2.5 2.5V27l-.447-.894A2 2 0 0 0 13.763 25H5.5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1m13 0h8a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1h-8.264a2 2 0 0 0-1.736 1.007V9c.456-.607 1.182-1 2-1"/></g></svg>`,

  // Вікторина — bullseye (Fluent Flat)
  bullseye: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g fill="none"><path fill="#f4f4f4" d="M14 28.292c5.684 0 10.292-4.608 10.292-10.292S19.684 7.708 14 7.708S3.708 12.316 3.708 18S8.316 28.292 14 28.292"/><path fill="#f8312f" d="M26 18c0-6.627-5.373-12-12-12S2 11.373 2 18s5.373 12 12 12s12-5.373 12-12m-3 0a9 9 0 1 1-18 0a9 9 0 0 1 18 0m-9 6a6 6 0 1 1 0-12a6 6 0 0 1 0 12m3-6a3 3 0 1 0-6 0a3 3 0 0 0 6 0"/><path fill="#9b9b9b" d="M14.25 17.742a.864.864 0 0 0 1.232 0l4.26-4.254a.86.86 0 0 0 0-1.23a.864.864 0 0 0-1.232 0l-4.26 4.254a.88.88 0 0 0 0 1.23"/><path fill="#46a4fb" d="m19.658 10.093l-.45-1.59c-.54-1.9-.01-3.95 1.39-5.34l.89-.89a.906.906 0 0 1 1.52.39L24 6zM22 12.33l1.572.458c1.878.55 3.904.01 5.278-1.416l.88-.906c.494-.5.277-1.356-.385-1.55L26 8z"/><path fill="#50e2ff" d="M15.85 16.152a2.892 2.892 0 0 0 4.307-.24l5.424-6.798a1.92 1.92 0 0 0-2.698-2.696l-6.802 5.42a2.904 2.904 0 0 0-.231 4.314"/><path fill="#46a4fb" d="M21.258 10.742a.86.86 0 0 0 1.23 0l4.254-4.254a.86.86 0 0 0 0-1.23a.86.86 0 0 0-1.23 0l-4.254 4.254a.86.86 0 0 0 0 1.23"/></g></svg>`,

  // Граматика — graduation-cap, HIGH CONTRAST варіант (не Flat): у Flat колір
  // шапки (#533566/#321b41) майже зливається з нашим темним фоном bgCard
  // (#2f1d38) — реальна проблема контрасту, знайдена на встановленій збірці.
  // High Contrast малює через currentColor, тож колір задає TileEmoji (tint).
  graduationCap: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g fill="currentColor"><path d="m17.13 5.278l12.28 6.29a1.052 1.052 0 0 1 0 1.87l-.539.276l-.008-.017l-2.227 1.161l-.636.326v.006l-1.625.847v-.209a1.79 1.79 0 0 0-.97-1.6l-6.714-3.442a1.8 1.8 0 0 0-.818-.2l-.005.006a1.794 1.794 0 0 0-1.69 2.393c.155.444.476.81.896 1.022l5.706 2.922v.982L17.155 19.8a2.5 2.5 0 0 1-2.311 0L6 15.2l-.053-.027l-.872-.454v.006l-2.5-1.281a1.051 1.051 0 0 1 0-1.87l12.28-6.29a2.47 2.47 0 0 1 2.275-.006"/><path d="M23.37 15.828v6.28a2 2 0 0 1 .308.189a1.82 1.82 0 0 1 .662 1.91v.02l-.005.02a.5.5 0 0 1-.035.11q-.001.008-.005.016q-.005.008-.005.015c-.01.04-.03.08-.05.12c0 .01-.01.02-.01.02c-.05.11-.12.22-.19.31c-.01.02-.02.03-.04.05l.47 2.2a1.94 1.94 0 0 1-1.9 2.35a1.94 1.94 0 0 1-1.9-2.35l.47-2.2a1.8 1.8 0 0 1-.4-1.073a1.8 1.8 0 0 1 .14-.757c0-.01.01-.02.02-.03c.01-.03.03-.07.05-.1l.008-.016l.009-.018a1 1 0 0 1 .053-.086q.007-.008.01-.015l.01-.015c.18-.28.44-.51.74-.66v-5.8l-6.25-3.2a.82.82 0 0 1-.404-.456a.78.78 0 0 1 .024-.614a.79.79 0 0 1 .664-.454a.8.8 0 0 1 .416.084l6.71 3.44a.79.79 0 0 1 .43.71"/><path d="m17.618 20.689l3.162-1.649v2.543a2.9 2.9 0 0 0-.577.647v.006a2 2 0 0 0-.121.2q-.045.076-.081.157l-.033.071a2.8 2.8 0 0 0-.212 1.31a7 7 0 0 1-.614.026h-6.561A6.614 6.614 0 0 1 6 17.157v-.834l8.382 4.366a3.5 3.5 0 0 0 3.236 0m7.861-.909a6.8 6.8 0 0 1-1.095 1.796l-.009-.007v-4.404L26 16.318v.839c0 .9-.176 1.791-.521 2.623"/></g></svg>`,

  // Фрази — speech-balloon, TWEMOJI (не Fluent Flat): біло-сіра версія Fluent
  // на нашому фоні читалась як "око без зіниці" — не було видно ні хвостика,
  // ні "..." всередині. Twemoji-версія — світло-блакитна булька з трьома
  // крапками (типографський знак "друкує/слова"), саме той комікс-плейсхолдер.
  speechBalloon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><path fill="#bdddf4" d="M18 1C8.059 1 0 7.268 0 15c0 4.368 2.574 8.268 6.604 10.835C6.08 28.144 4.859 31.569 2 35c5.758-.96 9.439-3.761 11.716-6.416c1.376.262 2.805.416 4.284.416c9.941 0 18-6.268 18-14S27.941 1 18 1"/><circle cx="18" cy="15" r="2" fill="#2a6797"/><circle cx="26" cy="15" r="2" fill="#2a6797"/><circle cx="10" cy="15" r="2" fill="#2a6797"/></svg>`,

  // Речення з пропусками — writing-hand (Fluent Flat)
  writingHand: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g fill="none"><path fill="#d67d00" d="M9.995 15.583a2.5 2.5 0 0 1 5 0v8.42h6.95v-4h8.04v8.76c0 .68-.55 1.24-1.24 1.24h-9.24c-2.49 0-4.51-2.02-4.51-4.51v2.01a2.5 2.5 0 0 1-5 0z"/><path fill="#ffc83d" d="m13.045 9.653l15.85 6.88c.67.29 1.1.94 1.1 1.67v9.81h-6.81c-1.88 0-3.57-.86-4.62-2.3c-.49-.67-1.4-.85-2.12-.45l-3.26 1.82A3.005 3.005 0 0 1 9.095 26H8v-3.5l-1.325.013a2.52 2.52 0 0 1-2.17 1.25c-.43 0-.86-.11-1.25-.34c-1.2-.7-1.61-2.22-.92-3.42l5.2-8.68a4.42 4.42 0 0 1 5.51-1.67M8.125 20h4.125v.69l2.265-1.307q.228-.131.465-.218a3.487 3.487 0 0 0-3.475-3.162c-.67 0-1.29 1.36-1.62 1.95z"/><path fill="#f95725" d="m19.185 2.083l2.38 1.38c.3.17.4.55.23.85l-9.401 16.294l-2.21 1.276a3.005 3.005 0 0 0-.991 4.272l-.558.968c-.16.28-.39.53-.66.72l-2.75 2.08a.468.468 0 0 1-.73-.42l.38-3.44c.03-.34.13-.67.3-.96l13.16-22.79c.17-.3.55-.4.85-.23"/><path fill="#fbb8ab" d="m8.552 27.256l-3.43-2.058a2.3 2.3 0 0 0-.247.865L4.61 28.46l1.469.816l1.896-1.433c.226-.16.424-.361.577-.587"/><path fill="#000" d="m4.685 27.723l-.19 1.78c-.03.39.41.64.73.42l1.4-1.07z"/><path fill="#d3d3d3" d="m16.395 5.673l3.46 2l1.04-1.8l-3.46-2z"/></g></svg>`,
} as const;

export type TileEmojiName = keyof typeof TILE_EMOJI;
