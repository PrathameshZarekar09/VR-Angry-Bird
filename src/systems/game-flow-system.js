/**
 * Game Flow & State Management System
 * Coordinates scores, levels, bird queues, victory celebrations,
 * and automatic level rearrangement within seconds when all birds fall down.
 */

import {
  CanvasTexture,
  createSystem,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Vector3,
} from '@iwsdk/core';
import { sound } from '../game/audio.js';
import { LEVEL_DEFINITIONS } from '../game/levels.js';
import { particles } from '../game/particles.js';
import { PhysicsGameSystem } from './physics-game-system.js';
import { SlingshotSystem } from './slingshot-system.js';

export class GameFlowSystem extends createSystem({}) {
  constructor() {
    super(...arguments);
    this.currentLevelIndex = 0;
    this.score = 0;
    this.highScore = 0;

    this.birdsQueue = [];
    this.currentBirdIndex = 0;
    this.pigsRemaining = 3;

    this.state = 'READY'; // 'READY' | 'AIMING' | 'FLYING' | 'VICTORY' | 'DEFEAT'
    this.stateTimer = 0;
    this.autoResetDuration = 2.5; // Auto-rearrange after 2.5s on defeat
    this.autoNextDuration = 3.2;  // Auto-advance after 3.2s on victory

    this.hudGroup = new Group();
    this.hudGroup.name = 'SpatialGameHUD';
    this.hudMesh = null;
    this.hudTexture = null;
    this.hudCanvas = null;
    this.hudCtx = null;
  }

  init() {
    this.createSpatialHUD();
    this.world.scene.add(this.hudGroup);
  }

  createSpatialHUD() {
    this.hudCanvas = document.createElement('canvas');
    this.hudCanvas.width = 512;
    this.hudCanvas.height = 384;
    this.hudCtx = this.hudCanvas.getContext('2d');

    this.hudTexture = new CanvasTexture(this.hudCanvas);
    const mat = new MeshBasicMaterial({
      map: this.hudTexture,
      transparent: true,
      side: DoubleSide,
    });

    const geo = new PlaneGeometry(0.7, 0.52);
    this.hudMesh = new Mesh(geo, mat);

    // Floating spatial HUD beside slingshot at chest height
    this.hudGroup.position.set(-0.75, 1.25, -0.85);
    this.hudGroup.rotation.y = 0.45;
    this.hudGroup.add(this.hudMesh);

    window.addEventListener('pointerdown', (e) => {
      this.handleHUDClick(e);
    });

    this.renderHUD();
  }

  handleHUDClick(e) {
    if (this.state === 'VICTORY') {
      this.nextLevel();
    } else if (this.state === 'DEFEAT') {
      this.restartLevel();
    }
  }

  renderHUD() {
    if (!this.hudCtx) return;
    const ctx = this.hudCtx;
    const levelDef = LEVEL_DEFINITIONS[this.currentLevelIndex];

    ctx.clearRect(0, 0, 512, 384);

    // Background Card
    ctx.fillStyle = 'rgba(12, 18, 32, 0.92)';
    ctx.beginPath();
    ctx.roundRect(12, 12, 488, 360, 24);
    ctx.fill();

    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(12, 12, 488, 360, 24);
    ctx.stroke();

    // Level Header
    ctx.fillStyle = '#ffea00';
    ctx.font = 'bold 30px "Arial Black", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`LEVEL ${this.currentLevelIndex + 1}`, 36, 56);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(levelDef.name, 36, 88);

    // Score & High Score
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`SCORE:`, 36, 138);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px sans-serif';
    ctx.fillText(`${this.score}`, 145, 140);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`BEST: ${Math.max(this.score, this.highScore)}`, 36, 175);

    // Remaining Birds Queue
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`BIRDS LEFT:`, 36, 225);

    for (let i = 0; i < this.birdsQueue.length; i++) {
      const bType = this.birdsQueue[i];
      const isUsed = i < this.currentBirdIndex;
      const x = 185 + i * 46;
      const y = 218;

      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      if (isUsed) {
        ctx.fillStyle = 'rgba(80, 80, 80, 0.4)';
      } else {
        ctx.fillStyle = bType === 'yellow' ? '#ffcc00' : bType === 'bomb' ? '#222226' : '#ee2222';
      }
      ctx.fill();
      ctx.strokeStyle = isUsed ? '#444444' : '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Status Banner
    if (this.state === 'VICTORY') {
      ctx.fillStyle = '#22cc44';
      ctx.beginPath();
      ctx.roundRect(36, 275, 440, 72, 16);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 24px "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      const remainingSec = Math.max(1, Math.ceil(this.autoNextDuration - this.stateTimer));
      ctx.fillText(`VICTORY! NEXT LEVEL IN ${remainingSec}S`, 256, 320);
    } else if (this.state === 'DEFEAT') {
      ctx.fillStyle = '#dd2233';
      ctx.beginPath();
      ctx.roundRect(36, 275, 440, 72, 16);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 22px "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      const remainingSec = Math.max(1, Math.ceil(this.autoResetDuration - this.stateTimer));
      ctx.fillText(`ALL BIRDS DOWN! RESETTING IN ${remainingSec}S`, 256, 320);
    } else {
      ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
      ctx.beginPath();
      ctx.roundRect(36, 275, 440, 72, 16);
      ctx.fill();

      ctx.fillStyle = '#00e5ff';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PINCH & PULL SLINGSHOT TO LAUNCH', 256, 320);
    }

    this.hudTexture.needsUpdate = true;
  }

  onLevelLoaded(levelIndex, pigsCount, birds) {
    this.currentLevelIndex = levelIndex;
    this.pigsRemaining = pigsCount;
    this.birdsQueue = [...birds];
    this.currentBirdIndex = 0;
    this.state = 'READY';
    this.stateTimer = 0;

    this.renderHUD();

    try {
      const slingshotSys = this.world.getSystem(SlingshotSystem);
      if (slingshotSys && this.birdsQueue.length > 0) {
        slingshotSys.spawnBird(this.birdsQueue[0]);
      }
    } catch (_) {}
  }

  addScore(pts) {
    this.score += pts;
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }
    this.renderHUD();
  }

  onPigDestroyed(pts, remainingPigs) {
    this.pigsRemaining = remainingPigs;
    this.addScore(pts);

    if (this.pigsRemaining <= 0) {
      this.triggerVictory();
    }
  }

  onBirdLaunched(birdEntity) {
    this.state = 'FLYING';
    this.currentBirdIndex++;
    this.renderHUD();
  }

  onBirdTurnResolved() {
    if (this.state === 'VICTORY') return;

    if (this.pigsRemaining <= 0) {
      this.triggerVictory();
      return;
    }

    if (this.currentBirdIndex < this.birdsQueue.length) {
      this.state = 'READY';
      const nextBirdType = this.birdsQueue[this.currentBirdIndex];
      try {
        const slingshotSys = this.world.getSystem(SlingshotSystem);
        if (slingshotSys) {
          slingshotSys.spawnBird(nextBirdType);
        }
      } catch (_) {}
      this.renderHUD();
    } else {
      // All birds spent -> Trigger Defeat & Auto-Rearrange Timer
      this.triggerDefeat();
    }
  }

  triggerVictory() {
    this.state = 'VICTORY';
    this.stateTimer = 0;
    sound.playVictory();
    this.renderHUD();
  }

  triggerDefeat() {
    this.state = 'DEFEAT';
    this.stateTimer = 0;
    sound.playDefeat();
    this.renderHUD();
  }

  nextLevel() {
    const nextIdx = (this.currentLevelIndex + 1) % LEVEL_DEFINITIONS.length;
    try {
      const physGameSys = this.world.getSystem(PhysicsGameSystem);
      if (physGameSys) {
        physGameSys.loadLevel(nextIdx);
      }
    } catch (_) {}
  }

  restartLevel() {
    try {
      const physGameSys = this.world.getSystem(PhysicsGameSystem);
      if (physGameSys) {
        physGameSys.loadLevel(this.currentLevelIndex);
      }
    } catch (_) {}
  }

  update(delta) {
    // 1. Victory Celebration & Auto Next Level
    if (this.state === 'VICTORY') {
      this.stateTimer += delta;
      if (Math.random() > 0.3) {
        const headPos = new Vector3(0, 1.4, -0.8);
        if (this.world?.camera) {
          this.world.camera.getWorldPosition(headPos);
          headPos.z -= 1.0;
        }
        particles.spawnVictoryStar(headPos);
      }

      this.renderHUD();

      if (this.stateTimer >= this.autoNextDuration) {
        this.nextLevel();
      }
    }

    // 2. Defeat Auto-Rearrangement (Reset within some seconds)
    if (this.state === 'DEFEAT') {
      this.stateTimer += delta;
      this.renderHUD();

      if (this.stateTimer >= this.autoResetDuration) {
        this.restartLevel();
      }
    }
  }
}
