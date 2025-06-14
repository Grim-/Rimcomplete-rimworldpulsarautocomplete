# RimWorld Autocomplete for Pulsar

A simple brute-force autocomplete package for referencing `defName` values in RimWorld XML modding within the Pulsar editor.

## Installation

1. Copy the package folder to your Pulsar packages directory
2. Restart Pulsar
3. Go to **Packages > Open Package Manager**
4. Find the "RimComplete" package and click on it
5. Set the **RimWorld installation folder** path in the settings

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

## Supported Definition Types

The package automatically scans and indexes definitions from:
- **Core game** (all DLCs)
- **All installed mods**

Supported definition types include: `thing`, `hediff`, `research`, `trait`, `recipe`, `job`, `thought`, `bodypart`, `biome`, `faction`, `pawnkind`, `ability`, `gene`, `mental`, `stat`, `damage`, `effecter`, and more.

## Features

- Recursively scans all definition folders and subfolders
- Supports both direct mod structures (`ModName/Defs/`) and versioned structures (`ModName/1.5/Defs/`)
- Parses both `<defName>` tags and `Name=""` attributes
- Filters suggestions based on partial text matching
- Works with all RimWorld DLCs and mods

## Requirements

- Pulsar text editor
- RimWorld installation
