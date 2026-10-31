// Classic Editorial: clean typography, timeless layouts and a polished
// editorial feel. Made for weddings and anniversaries. First built for
// Caz & Dan's wedding.
export default {
  key: 'classic-editorial',
  label: 'Classic Editorial',
  fonts: '', // Georgia (built in) and Montserrat (already loaded by index.html)
  themeColor: '#f7f5ef',
  defaults: {
    // Shown under the names, e.g. "10.10.26". Built from event_date if empty.
    dateLabel: '',
    // Square photo under the names: a file name uploaded for this event
    // (served from /api/event/image/<name>) or a full URL.
    heroPhoto: '',
    colours: {
      paper: '#f7f5ef',
      ink: '#111111',
      muted: '#6d6a65',
    },
    copy: {
      welcome: 'WELCOME',
      subtitle: 'TO OUR DISPOSABLE CAMERA',
      intro: 'Help us capture the memories\nfrom our favourite people.',
      cta: 'LET’S TAKE PHOTOS',
      cameraHeading: 'Capture the day',
      cameraIntro: 'No previews. No retakes. Just {shots} photographs to capture the people, moments and memories around you.',
      savingTitle: 'Saving photograph',
      savingCopy: 'Keeping this one safe for {names}',
      finishedTitle: 'THANK YOU',
      finishedSubtitle: 'YOUR CAMERA ROLL IS COMPLETE',
      finishedBody: 'You’ve used all {shots} photographs. Your memories are safely stored and will be ready for {names} once the gallery opens.',
    },
    guestSharing: true,
  },
}
