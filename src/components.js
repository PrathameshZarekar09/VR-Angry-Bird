/**
 * Shared ECS Component Catalog
 * System-free module defining all game ECS components.
 */

import { createComponent, defineComponents, Types } from '@iwsdk/core';

export const SlingshotComponent = createComponent('SlingshotComponent', {
  tension: { type: Types.Float32, default: 0 },
  isGrabbed: { type: Types.Boolean, default: false },
});

export const BirdComponent = createComponent('BirdComponent', {
  type: { type: Types.String, default: 'red' }, // 'red' | 'yellow' | 'bomb'
  state: { type: Types.String, default: 'in_sling' }, // 'in_sling' | 'grabbed' | 'flying' | 'landed' | 'exploded'
  hasUsedAbility: { type: Types.Boolean, default: false },
  flightTime: { type: Types.Float32, default: 0 },
});

export const PigComponent = createComponent('PigComponent', {
  health: { type: Types.Float32, default: 100 },
  isAlive: { type: Types.Boolean, default: true },
  points: { type: Types.Float32, default: 500 },
});

export const DestructibleBlock = createComponent('DestructibleBlock', {
  materialType: { type: Types.String, default: 'wood' }, // 'wood' | 'stone' | 'glass'
  health: { type: Types.Float32, default: 100 },
  points: { type: Types.Float32, default: 100 },
});

export const TNTComponent = createComponent('TNTComponent', {
  isDetonated: { type: Types.Boolean, default: false },
  blastRadius: { type: Types.Float32, default: 1.8 },
  blastForce: { type: Types.Float32, default: 28 },
});

export const ScorePopupComponent = createComponent('ScorePopupComponent', {
  points: { type: Types.Float32, default: 100 },
  elapsed: { type: Types.Float32, default: 0 },
  duration: { type: Types.Float32, default: 1.2 },
});

export default defineComponents([
  SlingshotComponent,
  BirdComponent,
  PigComponent,
  DestructibleBlock,
  TNTComponent,
  ScorePopupComponent,
]);
