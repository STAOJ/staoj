// Message address
const to = 'webserver';

// State enum
export const state = Object.freeze({
  queuing: 'queuing',
  compiling: 'compiling',
  compiled: 'compiled',
  testing: 'testing',
  tested: 'tested',
  done: 'done',
});

// Message constructor
export function Message(uuid, state, props) {
  // Setting the core props
  this.to = to;

  // Setting main props if defined

  if (uuid !== undefined) {
    this.id = uuid;
  }

  if (state !== undefined) {
    this.state = state;
  }

  // Adding additonal props to the message if any passed
  if (props !== undefined) {
    for (let prop in props) {
      if (props.hasOwnProperty(prop)) {
        this[prop] = props[prop];
      }
    }
  }
}