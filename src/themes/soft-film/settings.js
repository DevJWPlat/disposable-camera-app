// Soft Film: warm tones, tactile textures and a relaxed analogue look.
// Made for garden parties and birthdays.
// Every value here can be overridden per event in events.settings_json.
export default {
  key: 'soft-film',
  label: 'Soft Film',
  fonts: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;1,400;1,500&display=swap',
  themeColor: '#f1e8da',
  defaults: {
    // Shown above the names, e.g. "12 . 08 . 27". Built from event_date if empty.
    dateLabel: '',
    // Orange date stamp on the second print, e.g. "'27 8 12". Built from event_date if empty.
    stamp: '',
    // Two prints on the landing page. src is a file name uploaded for this
    // event (served from /api/event/image/<name>) or a full URL.
    photos: [
      { src: '', caption: 'make a wish' },
      { src: '', caption: 'cheers!' },
    ],
    colours: {
      paper: '#f1e8da',
      ink: '#2b2420',
      accent: '#b8562e',
      muted: '#7a6a5c',
    },
    copy: {
      heading: 'TAKE THE MOMENT',
      intro: 'No posing. No previews.\nJust memories from your favourite people.',
      cta: 'OPEN THE CAMERA',
      cameraHeading: 'Take the moment',
      cameraIntro: 'No previews and no retakes. Every shot is a surprise until the gallery opens.',
      savingTitle: 'Developing',
      savingCopy: 'Keeping this one safe',
      finishedTitle: 'That’s a wrap',
      finishedBody: 'Your roll is finished and every photo is safely stored. They’ll all be waiting in the gallery once it opens.',
    },
    // Lets the organiser switch on a shareable gallery link for guests.
    guestSharing: true,
  },
}
