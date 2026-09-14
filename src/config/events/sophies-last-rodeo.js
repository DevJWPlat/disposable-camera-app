import imageOne from '@/assets/events/sophies-last-rodeo/image-one.jpeg'
import imageTwo from '@/assets/events/sophies-last-rodeo/image-two.jpeg'
import imageThree from '@/assets/events/sophies-last-rodeo/image-three.jpeg'
import faviconSophie from '@/assets/events/sophies-last-rodeo/favicon-sophie.jpg'

export default {
  key: 'sophies-last-rodeo',
  slug: 'sophies-last-rodeo',
  title: 'Sophie’s Last Rodeo',
  shortTitle: 'Last Rodeo',
  maxShots: 50,
  theme: 'western',
  heroImage: null,
  heroImages: [imageOne, imageTwo, imageThree],
  favicon: faviconSophie,

  copy: {
    landing: {
      topLeft: 'Good friends\nGreat photos\nBigger memories',
      topRight: 'Same girls\nDifferent stories',
      photoPlaceholder: 'Sophie’s\nphoto\ngoes here',
      titleTop: 'SOPHIE’S',
      titleScript: 'Last Rodeo',
      subtitle: 'CAPTURE THE MEMORIES',
      intro: 'Snap, laugh, and make it a night to remember. You’ve got 50 shots to catch all the best moments!',
      shotTicket: '50 SHOTS',
      cta: 'START SNAPPING',
      sideNoteLeft: 'HEN\nENERGY\nONLY',
      sideNoteRight: 'TIL DEATH\nDO US\nPARTY',
      footer: 'A HEN-DO DISPOSABLE CAMERA',
    },
    camera: {
      topline: '★ Sophie’s Last Rodeo ★',
      eyebrow: 'One last wild night',
      headingLineOne: 'Point and',
      headingLineTwo: 'capture',
      intro: 'No previews. No retakes. Just 50 chances to capture the night as it happens.',
      developingTitle: 'Developing photograph',
      developingCopy: 'Your shot is being safely stored',
      loadingFilm: 'Loading your film...',
      openingCamera: 'Opening camera...',
      exposuresLabel: 'Exposures remaining',
      rollLabel: '50 shot roll',
      shutterLabel: 'Take photograph',
      footerNote: 'Boots on. Camera up. Make it count.',
    },
    finished: {
      eyebrow: 'Sophie’s Last Rodeo',
      title: 'That’s all, cowgirl',
      body: 'Your roll is finished and every photograph has been safely tucked away for the morning after.',
      rollLabel: 'Roll complete',
      remainingLabel: '0 shots remaining',
      note: 'No previews tonight — the best bits stay a surprise.',
    },
  },

  palette: {
    background: '#151111',
    surface: '#f6e9dc',
    surfaceStrong: '#e7c9c7',
    ink: '#211715',
    muted: '#9b7f78',
    accent: '#de7e93',
    accentDark: '#a84a60',
    sand: '#d5a65d',
    line: '#f6e9dc',
    camera: '#171210',
  },
}
