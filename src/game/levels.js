/**
 * Multi-Level Setup Definitions
 * Rock-solid structural foundations with precise resting coordinates.
 */

export const LEVEL_DEFINITIONS = [
  // ==========================================
  // LEVEL 1: THE WOODEN OUTPOST
  // ==========================================
  {
    levelNumber: 1,
    name: 'The Wooden Outpost',
    description: 'Aim and pull the slingshot to take down the piggy outpost!',
    birds: ['red', 'red', 'red'],
    center: { x: 0, y: 0, z: -2.6 },
    // Sturdy target table stand (Static foundation)
    table: {
      dimensions: [1.8, 0.4, 0.9],
      position: [0, 0.2, 0],
    },
    blocks: [
      // Lower Level Foundation Slab (Resting on table at y = 0.4)
      {
        type: 'woodLight',
        dimensions: [1.4, 0.08, 0.5],
        position: [0, 0.44, 0], // y: 0.40 to 0.48
        state: 'dynamic',
        density: 1.5,
      },
      // Left vertical support column (Resting on slab at y = 0.48)
      {
        type: 'wood',
        dimensions: [0.16, 0.6, 0.2],
        position: [-0.42, 0.78, 0], // y: 0.48 to 1.08
        state: 'dynamic',
        density: 1.2,
      },
      // Right vertical support column
      {
        type: 'wood',
        dimensions: [0.16, 0.6, 0.2],
        position: [0.42, 0.78, 0], // y: 0.48 to 1.08
        state: 'dynamic',
        density: 1.2,
      },
      // Middle Tier Plank (Resting at y = 1.08)
      {
        type: 'woodLight',
        dimensions: [1.2, 0.08, 0.45],
        position: [0, 1.12, 0], // y: 1.08 to 1.16
        state: 'dynamic',
        density: 1.4,
      },
      // Upper Tier Left Column (Resting at y = 1.16)
      {
        type: 'wood',
        dimensions: [0.14, 0.45, 0.18],
        position: [-0.26, 1.385, 0], // y: 1.16 to 1.61
        state: 'dynamic',
        density: 1.0,
      },
      // Upper Tier Right Column
      {
        type: 'wood',
        dimensions: [0.14, 0.45, 0.18],
        position: [0.26, 1.385, 0], // y: 1.16 to 1.61
        state: 'dynamic',
        density: 1.0,
      },
      // Top Stone Cap Beam (Resting at y = 1.61)
      {
        type: 'stone',
        dimensions: [0.8, 0.08, 0.35],
        position: [0, 1.65, 0], // y: 1.61 to 1.69
        state: 'dynamic',
        density: 2.2,
      },
    ],
    pigs: [
      // Pig 1 (Inside ground level bay, resting on slab at y = 0.48)
      { position: [0, 0.61, 0], radius: 0.13 },
      // Pig 2 (Inside middle tier, resting on beam at y = 1.16)
      { position: [0, 1.29, 0], radius: 0.13 },
      // Pig 3 (On top roof cap, resting at y = 1.69)
      { position: [0, 1.82, 0], radius: 0.13 },
    ],
    tnt: [],
  },

  // ==========================================
  // LEVEL 2: THE STONE CITADEL
  // ==========================================
  {
    levelNumber: 2,
    name: 'The Stone Citadel',
    description: 'Use Yellow Chuck to punch through heavy stone fortifications!',
    birds: ['red', 'yellow', 'yellow'],
    center: { x: 0, y: 0, z: -2.8 },
    table: {
      dimensions: [2.0, 0.4, 1.0],
      position: [0, 0.2, 0],
    },
    blocks: [
      // Foundation Slab (Resting at y = 0.4)
      {
        type: 'stone',
        dimensions: [1.6, 0.1, 0.6],
        position: [0, 0.45, 0], // y: 0.40 to 0.50
        state: 'dynamic',
        density: 2.5,
      },
      // Left Stone Column (Resting at y = 0.50)
      {
        type: 'stone',
        dimensions: [0.2, 0.65, 0.25],
        position: [-0.55, 0.825, 0], // y: 0.50 to 1.15
        state: 'dynamic',
        density: 2.2,
      },
      // Center Glass Column
      {
        type: 'glass',
        dimensions: [0.16, 0.65, 0.2],
        position: [0, 0.825, 0], // y: 0.50 to 1.15
        state: 'dynamic',
        density: 1.0,
      },
      // Right Stone Column
      {
        type: 'stone',
        dimensions: [0.2, 0.65, 0.25],
        position: [0.55, 0.825, 0], // y: 0.50 to 1.15
        state: 'dynamic',
        density: 2.2,
      },
      // Middle Tier Stone Floor (Resting at y = 1.15)
      {
        type: 'stone',
        dimensions: [1.5, 0.1, 0.5],
        position: [0, 1.20, 0], // y: 1.15 to 1.25
        state: 'dynamic',
        density: 2.5,
      },
      // Upper Columns
      {
        type: 'wood',
        dimensions: [0.15, 0.5, 0.2],
        position: [-0.35, 1.50, 0], // y: 1.25 to 1.75
        state: 'dynamic',
        density: 1.2,
      },
      {
        type: 'wood',
        dimensions: [0.15, 0.5, 0.2],
        position: [0.35, 1.50, 0], // y: 1.25 to 1.75
        state: 'dynamic',
        density: 1.2,
      },
      // Upper Glass Roof (Resting at y = 1.75)
      {
        type: 'glass',
        dimensions: [1.1, 0.08, 0.4],
        position: [0, 1.79, 0], // y: 1.75 to 1.83
        state: 'dynamic',
        density: 1.0,
      },
    ],
    pigs: [
      // Pig 1 (Left bay, resting on stone slab at y = 0.50)
      { position: [-0.28, 0.63, 0], radius: 0.13 },
      // Pig 2 (Right bay)
      { position: [0.28, 0.63, 0], radius: 0.13 },
      // Pig 3 (Upper penthouse at y = 1.25)
      { position: [0, 1.38, 0], radius: 0.13 },
    ],
    tnt: [
      // 1 TNT barrel on the center ground slab
      { position: [0, 0.66, 0.22], radius: 0.14, height: 0.32 },
    ],
  },

  // ==========================================
  // LEVEL 3: TNT MOUNTAIN
  // ==========================================
  {
    levelNumber: 3,
    name: 'TNT Mountain',
    description: 'Trigger chained explosive TNT blasts with the Bomb Bird!',
    birds: ['red', 'yellow', 'bomb'],
    center: { x: 0, y: 0, z: -3.0 },
    table: {
      dimensions: [2.4, 0.4, 1.1],
      position: [0, 0.2, 0],
    },
    blocks: [
      // Left Base Slab (Resting on table at y = 0.4)
      {
        type: 'stone',
        dimensions: [0.8, 0.1, 0.5],
        position: [-0.65, 0.45, 0], // y: 0.40 to 0.50
        state: 'dynamic',
        density: 2.5,
      },
      // Right Base Slab
      {
        type: 'stone',
        dimensions: [0.8, 0.1, 0.5],
        position: [0.65, 0.45, 0], // y: 0.40 to 0.50
        state: 'dynamic',
        density: 2.5,
      },
      // Left Tower Columns (Resting at y = 0.50)
      {
        type: 'wood',
        dimensions: [0.15, 0.7, 0.2],
        position: [-0.9, 0.85, 0], // y: 0.50 to 1.20
        state: 'dynamic',
        density: 1.2,
      },
      {
        type: 'wood',
        dimensions: [0.15, 0.7, 0.2],
        position: [-0.4, 0.85, 0], // y: 0.50 to 1.20
        state: 'dynamic',
        density: 1.2,
      },
      // Right Tower Columns
      {
        type: 'wood',
        dimensions: [0.15, 0.7, 0.2],
        position: [0.4, 0.85, 0], // y: 0.50 to 1.20
        state: 'dynamic',
        density: 1.2,
      },
      {
        type: 'wood',
        dimensions: [0.15, 0.7, 0.2],
        position: [0.9, 0.85, 0], // y: 0.50 to 1.20
        state: 'dynamic',
        density: 1.2,
      },
      // Main Bridge Linking Both Towers (Resting at y = 1.20)
      {
        type: 'stone',
        dimensions: [2.1, 0.1, 0.45],
        position: [0, 1.25, 0], // y: 1.20 to 1.30
        state: 'dynamic',
        density: 2.5,
      },
      // Central Spire Columns (Resting at y = 1.30)
      {
        type: 'wood',
        dimensions: [0.14, 0.55, 0.18],
        position: [-0.28, 1.575, 0], // y: 1.30 to 1.85
        state: 'dynamic',
        density: 1.0,
      },
      {
        type: 'wood',
        dimensions: [0.14, 0.55, 0.18],
        position: [0.28, 1.575, 0], // y: 1.30 to 1.85
        state: 'dynamic',
        density: 1.0,
      },
      // Top Spire Roof (Resting at y = 1.85)
      {
        type: 'glass',
        dimensions: [0.9, 0.08, 0.35],
        position: [0, 1.89, 0], // y: 1.85 to 1.93
        state: 'dynamic',
        density: 1.0,
      },
    ],
    pigs: [
      // Left tower pig
      { position: [-0.65, 0.63, 0], radius: 0.13 },
      // Right tower pig
      { position: [0.65, 0.63, 0], radius: 0.13 },
      // Middle suspension bridge pig
      { position: [0, 1.43, 0], radius: 0.13 },
      // Top spire king pig
      { position: [0, 2.06, 0], radius: 0.13 },
    ],
    tnt: [
      // TNT 1 in left tower
      { position: [-0.65, 0.66, 0.2], radius: 0.14, height: 0.32 },
      // TNT 2 in right tower
      { position: [0.65, 0.66, 0.2], radius: 0.14, height: 0.32 },
    ],
  },
];
