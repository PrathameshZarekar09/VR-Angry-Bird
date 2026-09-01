/**
 * Bird Flight & Special Abilities System
 * Manages flying birds, special powers (Chuck Speed Dash, Bomb Detonation), and turn resolution.
 */

import {
  createSystem,
  PhysicsBody,
  PhysicsManipulation,
  Vector3,
} from '@iwsdk/core';
import { BirdComponent } from '../components.js';
import { sound } from '../game/audio.js';
import { HandPinchTracker } from '../game/hand-tracker.js';
import { particles } from '../game/particles.js';
import { GameFlowSystem } from './game-flow-system.js';
import { PhysicsGameSystem } from './physics-game-system.js';

export class BirdSystem extends createSystem({
  flyingBirds: { required: [BirdComponent] },
}) {
  constructor() {
    super(...arguments);
    this.handTracker = null;
  }

  init() {
    this.handTracker = new HandPinchTracker(this.world);
  }

  update(delta) {
    if (this.world?.xrFrame) {
      this.handTracker.update(this.world.xrFrame);
    }

    this.queries.flyingBirds.entities.forEach((entity) => {
      if (!entity.hasComponent(BirdComponent)) return;
      const state = entity.getValue(BirdComponent, 'state');
      if (state !== 'flying') return;

      const obj = entity.object3D;
      if (!obj) return;

      let flightTime = (entity.getValue(BirdComponent, 'flightTime') || 0) + delta;
      entity.setValue(BirdComponent, 'flightTime', flightTime);

      const birdType = entity.getValue(BirdComponent, 'type') || 'red';

      // Flight smoke trail
      if (Math.random() > 0.4) {
        const trailColor =
          birdType === 'yellow'
            ? 0xffea00
            : birdType === 'bomb'
            ? 0x444444
            : 0xff6666;
        particles.spawnFlightPuff(obj.position, trailColor);
      }

      // Check for In-Flight Special Ability trigger (Pinch tap while flying)
      const hasUsedAbility = entity.getValue(BirdComponent, 'hasUsedAbility');
      if (!hasUsedAbility) {
        const pinchStatus = this.handTracker.getPinchNear(obj.position, 1.8);
        if (pinchStatus.isPinching || (this.handTracker.pointer.isDown && flightTime > 0.2)) {
          entity.setValue(BirdComponent, 'hasUsedAbility', true);
          this.activateSpecialAbility(entity, birdType);
        }
      }

      // Read velocity from Havok physics body
      let speed = 1.0;
      if (entity.hasComponent(PhysicsBody)) {
        try {
          const lv = entity.getVectorView(PhysicsBody, '_linearVelocity');
          if (lv) {
            speed = Math.sqrt(lv[0] * lv[0] + lv[1] * lv[1] + lv[2] * lv[2]);
          }
        } catch (_) {}
      }

      // Resolve flight when bird stops or falls out of bounds
      const isOutOfBounds = obj.position.y < -0.3 || obj.position.z < -6.0 || obj.position.z > 0.5;
      const isSettled = speed < 0.15 && flightTime > 1.8;
      const isTimedOut = flightTime > 5.5;

      if (isOutOfBounds || isSettled || isTimedOut) {
        this.resolveBirdTurn(entity);
      }
    });
  }

  /**
   * Activates bird special powers.
   */
  activateSpecialAbility(entity, birdType) {
    const obj = entity.object3D;
    if (!obj) return;

    if (birdType === 'yellow') {
      sound.playSpecialAbility('dash');

      let forwardDir = new Vector3(0, 0.15, -1).normalize();
      if (entity.hasComponent(PhysicsBody)) {
        try {
          const lv = entity.getVectorView(PhysicsBody, '_linearVelocity');
          if (lv) {
            const currentSpeed = Math.sqrt(lv[0] * lv[0] + lv[1] * lv[1] + lv[2] * lv[2]);
            if (currentSpeed > 0.1) {
              forwardDir.set(lv[0], lv[1] + 0.3, lv[2]).normalize();
            }
          }
        } catch (_) {}
      }

      const dashSpeed = 22.0;
      entity.addComponent(PhysicsManipulation, {
        linearVelocity: [
          forwardDir.x * dashSpeed,
          forwardDir.y * dashSpeed,
          forwardDir.z * dashSpeed,
        ],
      });

      for (let i = 0; i < 12; i++) {
        particles.spawnFlightPuff(obj.position, 0xffea00);
      }
    } else if (birdType === 'bomb') {
      sound.playExplosion();
      particles.spawnExplosion(obj.position);

      try {
        const physGameSys = this.world.getSystem(PhysicsGameSystem);
        if (physGameSys) {
          physGameSys.applyRadialExplosion(obj.position, 2.2, 35.0);
        }
      } catch (_) {}

      this.resolveBirdTurn(entity);
    }
  }

  /**
   * Resolves bird flight, despawns entity, and notifies GameFlow.
   */
  resolveBirdTurn(entity) {
    if (entity.hasComponent(BirdComponent)) {
      entity.setValue(BirdComponent, 'state', 'landed');
    }

    const obj = entity.object3D;
    if (obj) {
      particles.spawnImpactDebris(obj.position, 'wood', 4);
    }

    try {
      entity.dispose();
    } catch (_) {}

    try {
      const gameFlowSys = this.world.getSystem(GameFlowSystem);
      if (gameFlowSys) {
        gameFlowSys.onBirdTurnResolved();
      }
    } catch (_) {}
  }
}
