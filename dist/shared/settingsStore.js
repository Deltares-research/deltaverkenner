export const settingsStore = {
  state: {
    left: { scenario: null, measures: [] },
    right: { scenario: null, measures: [] }
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
  },

  setSettings(data) {
    this.settings = data
  },


  subscribe(cb) {
    this.listeners.push(cb);
  }
};
