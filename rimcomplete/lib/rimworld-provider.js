const fs = require('fs');
const path = require('path');

class RimWorldProvider {
  constructor() {
    this.selector = '*';
    this.inclusionPriority = 1;
    this.excludeLowerPriority = true;
    this.definitions = new Map();
    this.loadDefinitions();
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

    // Scan Mods folder
    const modsPath = path.join(rimworldPath, 'Mods');
    if (fs.existsSync(modsPath)) {
      try {
        const modDirs = fs.readdirSync(modsPath);
        console.log(`Found ${modDirs.length} total mod folders`);

        modDirs.forEach(modDir => {
          const modPath = path.join(modsPath, modDir);

          if (fs.existsSync(modPath) && fs.statSync(modPath).isDirectory()) {
            let foundDefs = false;

            // Check direct Defs folder
            const directDefsPath = path.join(modPath, 'Defs');
            if (fs.existsSync(directDefsPath)) {
              console.log(`Scanning ${modDir}/Defs`);
              this.scanDefinitions(directDefsPath);
              foundDefs = true;
            }

            // Check version folders (1.4, 1.5, etc.)
            try {
              const modContents = fs.readdirSync(modPath);
              modContents.forEach(subFolder => {
                const versionDefsPath = path.join(modPath, subFolder, 'Defs');
                if (fs.existsSync(versionDefsPath)) {
                  console.log(`Scanning ${modDir}/${subFolder}/Defs`);
                  this.scanDefinitions(versionDefsPath);
                  foundDefs = true;
                }
              });
            } catch (e) {
              // Skip if can't read mod contents
            }

            if (!foundDefs) {
              console.log(`No Defs found in ${modDir}`);
            }
          }
        });
      } catch (error) {
        console.error('Error reading mods directory:', error);
      }
    }

    console.log('Final counts:');
    for (const [type, defs] of this.definitions.entries()) {
      console.log(`  ${type}: ${defs.length}`);
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
      // Skip if can't read defs directory
    }
  }

  scanXMLFiles(folderPath) {
    try {
      const items = fs.readdirSync(folderPath);

      items.forEach(item => {
        const itemPath = path.join(folderPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isFile() && path.extname(item) === '.xml') {
          // It's an XML file, parse it
          this.parseXMLFile(itemPath);
        } else if (stat.isDirectory()) {
          // It's a subfolder, recurse into it
          this.scanXMLFiles(itemPath);
        }
      });
    } catch (error) {
      // Skip if can't scan folder
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

      let foundAny = false;

      // Find defName tags
      const defNameRegex = /<defName>([^<]+)<\/defName>/g;
      let match;

      while ((match = defNameRegex.exec(xmlContent)) !== null) {
        const defName = match[1];
        const beforeDefName = xmlContent.substring(0, match.index);

        console.log(`Found defName: ${defName} in ${path.basename(filePath)}`);

        for (const [xmlDefType, simpleType] of Object.entries(defTypeMappings)) {
          const lastDefTypeIndex = beforeDefName.lastIndexOf(`<${xmlDefType}`);
          if (lastDefTypeIndex !== -1) {
            const lastClosingIndex = beforeDefName.lastIndexOf(`</${xmlDefType}>`);
            console.log(`  Checking ${xmlDefType}: openIndex=${lastDefTypeIndex}, closeIndex=${lastClosingIndex}`);
            if (lastClosingIndex < lastDefTypeIndex) {
              console.log(`  ✓ Adding ${defName} as ${simpleType}`);
              this.addDefinition(simpleType, defName);
              foundAny = true;
              break;
            }
          }
        }
      }

      // Find Name attributes
      Object.entries(defTypeMappings).forEach(([xmlDefType, simpleType]) => {
        const nameAttrRegex = new RegExp(`<${xmlDefType}[^>]*Name="([^"]+)"`, 'g');
        let nameMatch;

        while ((nameMatch = nameAttrRegex.exec(xmlContent)) !== null) {
          console.log(`Found Name attribute: ${nameMatch[1]} for ${xmlDefType}`);
          this.addDefinition(simpleType, nameMatch[1]);
          foundAny = true;
        }
      });

      if (!foundAny) {
        console.log(`No definitions found in ${path.basename(filePath)}`);
      }

    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error);
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

  dispose() {
    this.definitions.clear();
  }
}

module.exports = RimWorldProvider;
