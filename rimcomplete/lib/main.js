const RimWorldProvider = require('./rimworld-provider');

module.exports = {
  activate() {
    console.log('RimWorld Autocomplete: Package activated!');
    this.provider = new RimWorldProvider();
  },

  deactivate() {
    console.log('RimWorld Autocomplete: Package deactivated!');
    if (this.provider) {
      this.provider.dispose();
    }
  },

  getProvider() {
    console.log('RimWorld Autocomplete: Provider requested!');
    return this.provider;
  }
};
