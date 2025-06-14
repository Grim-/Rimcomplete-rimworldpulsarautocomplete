const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const path = require('path');

function scanDefinitions(defsPath) {
  const definitions = new Map();

  function addDefinition(defType, defName) {
    if (!definitions.has(defType)) {
      definitions.set(defType, []);
    }
    const defs = definitions.get(defType);
    if (!defs.includes(defName)) {
      defs.push(defName);
    }
  }

  function scanXMLFiles(folderPath) {
    try {
      const items = fs.readdirSync(folderPath);

      items.forEach(item => {
        const itemPath = path.join(folderPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isFile() && path.extname(item) === '.xml') {
          parseXMLFile(itemPath);
        } else if (stat.isDirectory()) {
          scanXMLFiles(itemPath);
        }
      });
    } catch (error) {
    }
  }

  function parseXMLFile(filePath) {
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
              addDefinition(simpleType, defName);
              break;
            }
          }
        }
      }

      Object.entries(defTypeMappings).forEach(([xmlDefType, simpleType]) => {
        const nameAttrRegex = new RegExp(`<${xmlDefType}[^>]*Name="([^"]+)"`, 'g');
        let nameMatch;

        while ((nameMatch = nameAttrRegex.exec(xmlContent)) !== null) {
          addDefinition(simpleType, nameMatch[1]);
        }
      });

    } catch (error) {
    }
  }

  try {
    const folders = fs.readdirSync(defsPath);
    folders.forEach(folder => {
      const folderPath = path.join(defsPath, folder);
      if (fs.statSync(folderPath).isDirectory()) {
        scanXMLFiles(folderPath);
      }
    });
  } catch (error) {
  }

  return Array.from(definitions.entries());
}

const { pathsToScan } = workerData;

for (let i = 0; i < pathsToScan.length; i++) {
  const { path: scanPath, name } = pathsToScan[i];

  parentPort.postMessage({
    type: 'progress',
    current: i + 1,
    total: pathsToScan.length,
    name: name
  });

  const definitions = scanDefinitions(scanPath);

  parentPort.postMessage({
    type: 'definitions',
    definitions: definitions
  });
}

parentPort.postMessage({
  type: 'complete'
});
