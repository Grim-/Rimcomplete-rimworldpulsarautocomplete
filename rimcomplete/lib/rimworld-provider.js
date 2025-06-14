const fs = require('fs');
const path = require('path');
const os = require('os');

class RimWorldProvider {
  constructor() {
    this.selector = '*';
    this.inclusionPriority = 1;
    this.excludeLowerPriority = true;
    this.definitions = new Map();
    this.cacheFile = path.join(os.homedir(), '.rimworld-autocomplete-cache.json');

    this.loadFromCacheOnly();
  }

  getSuggestions({ editor, bufferPosition, scopeDescriptor, prefix }) {
    const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);

    const match = line.match(/(\w+)\*(\w*)$/);
    if (match) {
      const [fullMatch, defType, filter] = match;
      const normalizedDefType = defType.toLowerCase();

      if (this.definitions.has(normalizedDefType)) {
        return this.getDefinitionSuggestions(normalizedDefType, filter, fullMatch);
      }
    }

    return [];
  }

  getDefinitionSuggestions(defType, filter = '', originalText = '') {
    const allDefs = this.definitions.get(defType) || [];

    let filteredDefs = allDefs;
    if (filter) {
      filteredDefs = allDefs.filter(defName =>
        defName.toLowerCase().includes(filter.toLowerCase())
      );
    }

    return filteredDefs.slice(0, 50).map(defName => ({
      text: defName,
      type: 'constant',
      leftLabel: defType,
      description: `${defType}: ${defName}`,
      replacementPrefix: originalText
    }));
  }

  loadDefinitions() {
    const rimworldPath = atom.config.get('rimcomplete.rimworldPath');

    if (!rimworldPath || !fs.existsSync(rimworldPath)) {
      return;
    }

    if (this.loadFromCache(rimworldPath)) {
      console.log('Loaded definitions from cache');
      return;
    }

    console.log('Cache miss, scanning definitions...');

    // Scan Data folder (Core + DLCs)
    const dataPath = path.join(rimworldPath, 'Data');
    if (fs.existsSync(dataPath)) {
      try {
        const dataFolders = fs.readdirSync(dataPath);
        dataFolders.forEach(folder => {
          const defsPath = path.join(dataPath, folder, 'Defs');
          if (fs.existsSync(defsPath)) {
            this.scanDefinitions(defsPath);
          }
        });
      } catch (error) {
        console.error('Error reading Data directory:', error);
      }
    }

    const modsPath = path.join(rimworldPath, 'Mods');
    if (fs.existsSync(modsPath)) {
      try {
        const modDirs = fs.readdirSync(modsPath);

        modDirs.forEach(modDir => {
          const modPath = path.join(modsPath, modDir);

          if (fs.existsSync(modPath) && fs.statSync(modPath).isDirectory()) {
            // Check direct Defs folder
            const directDefsPath = path.join(modPath, 'Defs');
            if (fs.existsSync(directDefsPath)) {
              this.scanDefinitions(directDefsPath);
            }

            // Check version folders (1.4, 1.5, etc.)
            try {
              const modContents = fs.readdirSync(modPath);
              modContents.forEach(subFolder => {
                const versionDefsPath = path.join(modPath, subFolder, 'Defs');
                if (fs.existsSync(versionDefsPath)) {
                  this.scanDefinitions(versionDefsPath);
                }
              });
            } catch (e) {
            }
          }
        });
      } catch (error) {
        console.error('Error reading mods directory:', error);
      }
    }

    this.saveToCache(rimworldPath);

    console.log('Final counts:');
    for (const [type, defs] of this.definitions.entries()) {
      console.log(`  ${type}: ${defs.length}`);
    }
  }

  loadFromCache(rimworldPath) {
    try {
      if (!fs.existsSync(this.cacheFile)) {
        return false;
      }

      const cacheData = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));

      if (cacheData.rimworldPath !== rimworldPath) {
        return false;
      }

      const cacheTime = new Date(cacheData.timestamp);
      const modsPath = path.join(rimworldPath, 'Mods');

      if (fs.existsSync(modsPath)) {
        const modsModTime = fs.statSync(modsPath).mtime;
        if (modsModTime > cacheTime) {
          return false;
        }
      }

      this.definitions = new Map(cacheData.definitions);
      return true;

    } catch (error) {
      console.log('Cache load failed:', error.message);
      return false;
    }
  }

  saveToCache(rimworldPath) {
    try {
      const cacheData = {
        rimworldPath: rimworldPath,
        timestamp: new Date().toISOString(),
        definitions: Array.from(this.definitions.entries())
      };

      fs.writeFileSync(this.cacheFile, JSON.stringify(cacheData, null, 2));
      console.log('Definitions cached to:', this.cacheFile);
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }

  scanDefinitions(defsPath) {
    try {
      const folders = fs.readdirSync(defsPath);
      folders.forEach(folder => {
        const folderPath = path.join(defsPath, folder);
        if (fs.statSync(folderPath).isDirectory()) {
          this.scanXMLFiles(folderPath);
        }
      });
    } catch (error) {
    }
  }

  scanXMLFiles(folderPath) {
    try {
      const items = fs.readdirSync(folderPath);

      items.forEach(item => {
        const itemPath = path.join(folderPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isFile() && path.extname(item) === '.xml') {
          this.parseXMLFile(itemPath);
        } else if (stat.isDirectory()) {
          this.scanXMLFiles(itemPath);
        }
      });
    } catch (error) {

    }
  }

  parseXMLFile(filePath) {
    try {
      const xmlContent = fs.readFileSync(filePath, 'utf8');

      const defTypeMappings = {
        'HediffDef': 'hediff',
        'ThingDef': 'thing',
        'ResearchProjectDef': 'research',
        'TraitDef': 'trait',
        'RecipeDef': 'recipe',
        'JobDef': 'job',
        'WorkGiverDef': 'workgiver',
        'ThoughtDef': 'thought',
        'BodyPartDef': 'bodypart',
        'BiomeDef': 'biome',
        'FactionDef': 'faction',
        'PawnKindDef': 'pawnkind',
        'WorldObjectDef': 'worldobject',
        'AbilityDef': 'ability',
        'GeneDef': 'gene',
        'MentalStateDef': 'mental',
        'StatDef': 'stat',
        'DamageDef': 'damage',
        'EffecterDef': 'effecter'
      };

      const defNameRegex = /<defName>([^<]+)<\/defName>/g;
      let match;

      while ((match = defNameRegex.exec(xmlContent)) !== null) {
        const defName = match[1];
        const beforeDefName = xmlContent.substring(0, match.index);

        for (const [xmlDefType, simpleType] of Object.entries(defTypeMappings)) {
          const lastDefTypeIndex = beforeDefName.lastIndexOf(`<${xmlDefType}`);
          if (lastDefTypeIndex !== -1) {
            const lastClosingIndex = beforeDefName.lastIndexOf(`</${xmlDefType}>`);
            if (lastClosingIndex < lastDefTypeIndex) {
              this.addDefinition(simpleType, defName);
              break;
            }
          }
        }
      }

      Object.entries(defTypeMappings).forEach(([xmlDefType, simpleType]) => {
        const nameAttrRegex = new RegExp(`<${xmlDefType}[^>]*Name="([^"]+)"`, 'g');
        let nameMatch;

        while ((nameMatch = nameAttrRegex.exec(xmlContent)) !== null) {
          this.addDefinition(simpleType, nameMatch[1]);
        }
      });

    } catch (error) {
      // Skip if can't parse file
    }
  }

  addDefinition(defType, defName) {
    if (!this.definitions.has(defType)) {
      this.definitions.set(defType, []);
    }
    const defs = this.definitions.get(defType);
    if (!defs.includes(defName)) {
      defs.push(defName);
    }
  }

  clearCache() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        fs.unlinkSync(this.cacheFile);
        console.log('Cache file deleted');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }

  loadFromCacheOnly() {
    const rimworldPath = atom.config.get('rimcomplete.rimworldPath');
    if (rimworldPath && this.loadFromCache(rimworldPath)) {
      console.log('Loaded definitions from cache');
    } else {
      console.log('No cache found - use "Generate Cache" to scan definitions');
    }
  }

  async generateCacheWithProgress(progressCallback) {
    console.log('Starting cache generation...');
    this.definitions.clear();

    const rimworldPath = atom.config.get('rimcomplete.rimworldPath');
    if (!rimworldPath || !fs.existsSync(rimworldPath)) {
      throw new Error('Invalid RimWorld path');
    }

    const pathsToScan = [];

    const dataPath = path.join(rimworldPath, 'Data');
    if (fs.existsSync(dataPath)) {
      const dataFolders = fs.readdirSync(dataPath);
      dataFolders.forEach(folder => {
        const defsPath = path.join(dataPath, folder, 'Defs');
        if (fs.existsSync(defsPath)) {
          pathsToScan.push({ path: defsPath, name: `Data/${folder}` });
        }
      });
    }

    // Add Mod folders
    const modsPath = path.join(rimworldPath, 'Mods');
    if (fs.existsSync(modsPath)) {
      const modDirs = fs.readdirSync(modsPath);
      modDirs.forEach(modDir => {
        const modPath = path.join(modsPath, modDir);
        if (fs.existsSync(modPath) && fs.statSync(modPath).isDirectory()) {
          const directDefsPath = path.join(modPath, 'Defs');
          if (fs.existsSync(directDefsPath)) {
            pathsToScan.push({ path: directDefsPath, name: `Mod: ${modDir}` });
          }

          try {
            const modContents = fs.readdirSync(modPath);
            modContents.forEach(subFolder => {
              const versionDefsPath = path.join(modPath, subFolder, 'Defs');
              if (fs.existsSync(versionDefsPath)) {
                pathsToScan.push({ path: versionDefsPath, name: `Mod: ${modDir}/${subFolder}` });
              }
            });
          } catch (e) {
          }
        }
      });
    }

    if (pathsToScan.length === 0) {
      throw new Error('No definition folders found');
    }

    for (let i = 0; i < pathsToScan.length; i++) {
      const { path: scanPath, name } = pathsToScan[i];

      if (progressCallback) {
        progressCallback(i + 1, pathsToScan.length, name);
      }
      await this.scanDefinitionsAsync(scanPath);
      await new Promise(resolve => setImmediate(resolve));
    }

    this.saveToCache(rimworldPath);

    console.log('Final counts:');
    for (const [type, defs] of this.definitions.entries()) {
      console.log(`  ${type}: ${defs.length}`);
    }

    return pathsToScan.length;
  }

  async scanDefinitionsAsync(defsPath) {
    try {
      const folders = fs.readdirSync(defsPath);

      for (const folder of folders) {
        const folderPath = path.join(defsPath, folder);
        if (fs.statSync(folderPath).isDirectory()) {
          await this.scanXMLFilesAsync(folderPath);
        }
      }
    } catch (error) {
      // Skip if can't read defs directory
    }
  }

  async scanXMLFilesAsync(folderPath) {
    try {
      const items = fs.readdirSync(folderPath);
      let fileCount = 0;

      for (const item of items) {
        const itemPath = path.join(folderPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isFile() && path.extname(item) === '.xml') {
          this.parseXMLFile(itemPath);
          fileCount++;

          if (fileCount % 4 === 0) {
            await new Promise(resolve => setImmediate(resolve));
          }
        } else if (stat.isDirectory()) {
          await this.scanXMLFilesAsync(itemPath);
        }
      }
    } catch (error) {
      // Skip if can't scan folder
    }
  }

  reloadDefinitions() {
    this.definitions.clear();
    this.clearCache();
    this.loadDefinitions();
  }

  dispose() {
    this.definitions.clear();
  }
}

module.exports = RimWorldProvider;
