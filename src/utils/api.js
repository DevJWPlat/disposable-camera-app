const LOCAL_DEVELOPMENT_API =
  'https://paul-60-camera.jonny-whittle.workers.dev'

export const API_BASE_URL =
  import.meta.env.DEV
    ? LOCAL_DEVELOPMENT_API
    : ''