# RimWorld Autocomplete for Pulsar

A simple brute-force autocomplete package for referencing `defName` values in RimWorld XML modding within the Pulsar editor.

## Installation

1. Copy the package folder to your Pulsar packages directory
2. Restart Pulsar
3. Go to **Packages > Open Package Manager**
4. Find the "RimComplete" package and click on it
5. Set the **RimWorld installation folder** path in the settings (e.g., `C:\Program Files (x86)\Steam\steamapps\common\RimWorld`)

## Initial Setup

After installation, you need to generate the definitions cache:

1. Go to **Packages > RimComplete > Generate Cache**
2. Wait for the scanning process to complete (progress shown in notifications)
3. You'll see a "Cache generation complete!" notification when finished

The cache generation scans all your RimWorld core files and mod definitions. This may take a moment depending on how many mods you have installed.

## Usage

When editing RimWorld XML files, type a definition type followed by an asterisk to trigger autocomplete:

- `thing*` - Shows all ThingDef defNames
- `hediff*` - Shows all HediffDef defNames  
- `damage*` - Shows all DamageDef defNames
- `research*` - Shows all ResearchProjectDef defNames
- `gene*` - Shows all GeneDef defNames (Biotech)
- `ability*` - Shows all AbilityDef defNames (Royalty)

Add a filter after the asterisk to narrow results:
- `thing*steel` - Shows only things containing "steel"
- `hediff*infection` - Shows only hediffs containing "infection"

Press **Ctrl+Space** to trigger the autocomplete suggestions.

## Cache Management

Access cache management options via **Packages > RimComplete**:

- **Generate Cache** - Scans all RimWorld files and creates/updates the autocomplete database
- **Clear Cache** - Deletes the cached definitions (you'll need to regenerate)
- **Reload Definitions** - Clears and regenerates the cache in one step

You can also access these commands via the Command Palette (**Ctrl+Shift+P**):
- `RimComplete: Generate Cache`
- `RimComplete: Clear Cache` 
- `RimComplete: Reload Definitions`

## Supported Definition Types

The package automatically scans and indexes definitions from:
- **Core game** (all DLCs)
- **All installed mods**

Supported definition types include: `thing`, `hediff`, `research`, `trait`, `recipe`, `job`, `workgiver`, `thought`, `bodypart`, `biome`, `faction`, `pawnkind`, `worldobject`, `ability`, `gene`, `mental`, `stat`, `damage`, `effecter`, and more.

## Features

- **On-demand cache generation** - No startup delays, generate cache when you need it
- **Progress tracking** - Real-time progress updates during cache generation
- **Responsive UI** - Editor stays usable during cache generation
- **Comprehensive scanning** - Recursively scans all definition folders and subfolders
- **Multi-format support** - Supports both direct mod structures (`ModName/Defs/`) and versioned structures (`ModName/1.5/Defs/`)
- **Flexible parsing** - Parses both `<defName>` tags and `Name=""` attributes
- **Smart filtering** - Filters suggestions based on partial text matching
- **Universal compatibility** - Works with all RimWorld DLCs and mods
- **Persistent caching** - Cache survives editor restarts for fast loading

## Requirements

- Pulsar text editor
- RimWorld installation

## Troubleshooting

- **No autocomplete suggestions?** Make sure you've generated the cache first via **Packages > RimComplete > Generate Cache**
- **Outdated suggestions?** Use **Reload Definitions** after installing new mods
- **Performance issues?** Try **Clear Cache** and regenerate if the cache becomes corrupted
