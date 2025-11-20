export const settingsStore = {
  state: {
    left: {},
    right: {}
  },
  settings: {},
  listeners: [],

  update() {
    this.listeners.forEach(cb => cb( {
      state: this.state,
      settings: this.settings
    }));
  },

  setState(side, data, update=true) {
    this.state[side] = data;
    this.update()
    console.log(this.state)
  },

  setSettings(data) {
    this.settings = data
  },

  subscribe(cb) {
    this.listeners.push(cb);
  }
};
