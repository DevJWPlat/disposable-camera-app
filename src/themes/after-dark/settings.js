// After Dark: full-bleed flash photo, bold condensed type, late-night glow.
// Made for hen dos and nights out.
export default {
  key: 'after-dark',
  label: 'After Dark',
  fonts: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
  themeColor: '#050505',
  defaults: {
    // Shown under the title, e.g. "12.09.26". Built from event_date if empty.
    dateLabel: '',
    // Full-screen photo behind the landing page: a file name uploaded for
    // this event (served from /api/event/image/<name>) or a full URL.
    heroPhoto: '',
    colours: {
      glow: '#c9b2ff',
      pink: '#ff5fa2',
    },
    copy: {
      tagline: 'The night, through\neveryone’s eyes',
      intro: 'Capture the moments you might have missed.',
      cta: 'OPEN THE CAMERA',
      cameraHint: 'No previews. No retakes. See them all when the gallery opens.',
      savingTitle: 'Developing',
      savingCopy: 'Keeping this one safe',
      finishedTitle: 'That’s a wrap',
      finishedBody: 'Your roll is finished and every photo is safely stored. They’ll all be waiting in the gallery once it opens.',
    },
    guestSharing: true,
  },
}
