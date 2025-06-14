const RimWorldProvider = require('./rimworld-provider');

module.exports = {
  activate() {
    console.log('RimWorld Autocomplete: Activating...');
    this.provider = new RimWorldProvider();

    this.subscriptions = atom.commands.add('atom-workspace', {
      'rimcomplete:generate-cache': () => this.generateCache(),
      'rimcomplete:clear-cache': () => this.clearCache(),
      'rimcomplete:reload': () => this.reloadDefinitions()
    });
  },

  async generateCache() {
    if (!this.provider) return;

    try {
      let notification = atom.notifications.addInfo('Generating RimWorld cache...', {
        description: 'Starting scan... large mod folders can cause small lock ups..',
        dismissable: true
      });

      let lastPercent = 0;

      const totalScanned = await this.provider.generateCacheWithProgress((current, total, currentName) => {
        const percent = Math.round((current / total) * 100);
        console.log(`Scanning (${percent}%): ${currentName} (${current}/${total})`);

        if (percent >= lastPercent + 10) {
          notification.dismiss();
          notification = atom.notifications.addInfo(`Generating cache... (${percent}%)`, {
            description: `Scanned ${current}/${total} folders`,
            dismissable: true
          });
          lastPercent = percent;
        }
      });

      notification.dismiss();
      atom.notifications.addSuccess('Cache generation complete!', {
        description: `Scanned ${totalScanned} folders successfully`
      });

    } catch (error) {
      console.error('Cache generation failed:', error);
      atom.notifications.addError('Cache generation failed', {
        description: error.message
      });
    }
  },

  clearCache() {
    if (this.provider) {
      const result = this.provider.clearCache();
      if (result) {
        atom.notifications.addSuccess('Cache cleared successfully');
      } else {
        atom.notifications.addWarning('No cache file found');
      }
    }
  },

  reloadDefinitions() {
    if (this.provider) {
      this.provider.reloadDefinitions();
      atom.notifications.addSuccess('Definitions reloaded');
    }
  },

  deactivate() {
    console.log('RimWorld Autocomplete: Package deactivated!');
    if (this.subscriptions) {
      this.subscriptions.dispose();
    }
    if (this.provider) {
      this.provider.dispose();
    }
  },

  getProvider() {
    console.log('RimWorld Autocomplete: Provider requested!');
    return this.provider;
  },

  provide() {
    return this.provider;
  }
};
