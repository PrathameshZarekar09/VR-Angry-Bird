/**
 * WebXR VR Angry Birds - Main Entry Point
 */

import { World } from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';

import { PanelSystem } from './panel.js';
import { PopupSystem } from './systems/popup-system.js';
import { GameFlowSystem } from './systems/game-flow-system.js';
import { SlingshotSystem } from './systems/slingshot-system.js';
import { BirdSystem } from './systems/bird-system.js';
import { PhysicsGameSystem } from './systems/physics-game-system.js';

World.create(document.getElementById('scene-container'), projectOptions).then((world) => {
  world.registerSystem(PanelSystem);
  world.registerSystem(PopupSystem);
  world.registerSystem(GameFlowSystem);
  world.registerSystem(SlingshotSystem);
  world.registerSystem(BirdSystem);
  world.registerSystem(PhysicsGameSystem);
});
