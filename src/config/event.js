import sophie from './events/sophies-last-rodeo.js'
import cazAndDan from './events/caz-and-dan.js'

const events = {
  [sophie.key]: sophie,
  [cazAndDan.key]: cazAndDan,
}

const selectedKey = import.meta.env.VITE_EVENT || 'sophies-last-rodeo'

export const eventConfig = events[selectedKey] || sophie
export const availableEvents = events
