# Mobile device verification

Everything in the Expo port so far has been verified by types, lint,
`expo-doctor` and bundle contents. **No audio has been played and no screen
has been rendered on a device.** This is the checklist that closes that gap.

Work through it in two stages. Stage 1 needs no build at all.

---

## Stage 1 — Expo Go (no build required)

`expo-audio` ships inside Expo Go, so foreground playback works there. What
does *not* work in Expo Go is anything the config plugin adds to the native
manifest — background playback and lock screen controls. Those are stage 2.

```bash
cd apps/mobile
npm run start:go        # then scan the QR with Expo Go
```

Analytics print to the Metro console in development, so you can see each
event as it fires. That is deliberate — several checks below are about
whether the right event fired, not just whether audio played.

### Does it work at all

- [ ] Library lists your songs with cover art
- [ ] Tapping a row starts playback and opens the song screen
- [ ] The tab bar stays visible on the song screen
- [ ] Back returns to the library
- [ ] Mini player appears above the tab bar, hidden on the song screen
- [ ] The "Playing" tab animates in, with moving equaliser bars

### The eight player behaviours

These are ported from the web player. The pure logic is unit-tested in
`packages/core`; what is untested is the wiring to real audio.

- [ ] **Skip detection** — play A, skip to B around 40% → console shows
      `song_skipped` with `progress_pct` near 40, and B's milestones start fresh
- [ ] **Auto-advance** — let a track end naturally → next track starts,
      console shows `song_play` with `play_source: auto_advance`
- [ ] **Repeat all** — on the last track with repeat=all → wraps to the first
- [ ] **Repeat off** — on the last track with repeat=off → stops
- [ ] **Repeat one** — restarts the same track AND `song_complete` fires
      again on the second pass. This one matters: it proves we are not using
      native looping, which would suppress the end-of-track event entirely
- [ ] **No audio** — a song with an empty `mp3Url` shows "Coming Soon",
      the play button is disabled, nothing crashes
- [ ] **Shuffle** — turning it on keeps the current track playing and pins it
      first; returning to the library and back does not reshuffle mid-track
- [ ] **Previous** — at 5s restarts (`prev_track action=restart`); at 1s goes
      back one (`action=prev_song`)
- [ ] **Scrub** — drag to both extremes → `song_seeked` percentages look
      right, no NaN in the time labels, scrubbing to the very end does not
      double-fire the end-of-track handler
- [ ] **Milestones** — 25 / 50 / 75 fire once each; seeking back below 5%
      resets them so they can fire again

### Navigation

- [ ] Auto-advance through 5 tracks, then press back → lands on the library,
      **not** five song screens deep

### Content pipeline risk

- [ ] Compare each track's displayed duration against the real file length.
      VBR MP3s without a Xing header report wrong durations on Android's
      ExoPlayer, which silently corrupts the scrubber, the milestones and
      `song_complete`. This is a content problem, not a code problem, and it
      is invisible until checked.

---

## Stage 2 — Android dev build (background + lock screen)

Needed because the config plugin's manifest changes do not exist in Expo Go.

```bash
cd apps/mobile
npx eas login
npx eas build:configure          # first time only — creates the EAS project
npx eas build --profile development --platform android
```

Install the resulting APK, then:

```bash
npm run start                     # --dev-client
```

- [ ] Audio keeps playing with the screen off
- [ ] Audio keeps playing after switching to another app
- [ ] Lock screen / notification shows title, "Kai", "beatsbykai.com" and
      artwork, with play, pause and seek
- [ ] Playback survives more than three minutes in the background. This is
      the specific thing `setActiveForLockScreen` exists to prevent — the
      foreground service is otherwise reclaimed
- [ ] **Deny the notification permission**, then play → audio still works,
      only the controls are missing, nothing crashes

### Known gap

There are no next/previous buttons on the lock screen. `expo-audio` 57 has
no support for them — `AudioLockScreenOptions` exposes only
`showSeekForward`, `showSeekBackward` and `isLiveStream`. Adding them means
patching the module's native code (see expo#43538), which is deferred until
the above is confirmed working.

---

## Reporting back

For anything that fails, the useful details are: which checklist item, what
happened instead, the relevant Metro console lines, and whether it was Expo
Go or the dev build. Several of these behaviours are timing-dependent, so
"it skipped twice" is more diagnostic than "next was broken".
