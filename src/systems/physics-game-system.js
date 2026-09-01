/**
 * Physics Game System
 * Builds stable Havok physics level structures, tracks collision impacts,
 * triggers structural fractures, pig squeaks/gasps, and TNT chain explosions.
 */

import {
  BoxGeometry,
  createSystem,
  Mesh,
  MeshBasicMaterial,
  PhysicsBody,
  PhysicsManipulation,
  PhysicsShape,
  PhysicsShapeType,
  PhysicsState,
  Vector3,
} from '@iwsdk/core';
import {
  BirdComponent,
  DestructibleBlock,
  PigComponent,
  TNTComponent,
} from '../components.js';
import { sound } from '../game/audio.js';
import {
  createBlockMesh,
  createPigMesh,
  createTNTBarrelMesh,
  Materials,
} from '../game/geometry.js';
import { LEVEL_DEFINITIONS } from '../game/levels.js';
import { particles } from '../game/particles.js';
import { GameFlowSystem } from './game-flow-system.js';
import { PopupSystem } from './popup-system.js';

export class PhysicsGameSystem extends createSystem({
  blocks: { required: [DestructibleBlock, PhysicsBody] },
  pigs: { required: [PigComponent, PhysicsBody] },
  tnt: { required: [TNTComponent, PhysicsBody] },
  birds: { required: [BirdComponent, PhysicsBody] },
}) {
  constructor() {
    super(...arguments);
    this.currentLevelIndex = 0;
    this.activeEntities = [];
    this.tableEntity = null;
    this.floorEntity = null;

    this.prevVelocities = new Map();
    this.pigsRemaining = 0;
    this.settleDelay = 0.5;
  }

  init() {
    this.createStaticFloorCollider();
    this.loadLevel(0);
  }

  createStaticFloorCollider() {
    if (this.floorEntity) return;

    const floorMesh = new Mesh(
      new BoxGeometry(20, 0.1, 20),
      new MeshBasicMaterial({ visible: false })
    );
    floorMesh.position.set(0, -0.05, -2.5);

    this.floorEntity = this.world.createTransformEntity(floorMesh);
    this.floorEntity.addComponent(PhysicsShape, {
      shape: PhysicsShapeType.Box,
      dimensions: [20, 0.1, 20],
      density: 0,
      restitution: 0.1,
      friction: 0.9,
    });
    this.floorEntity.addComponent(PhysicsBody, {
      state: PhysicsState.Static,
    });
  }

  loadLevel(levelIndex = 0) {
    this.clearCurrentLevel();
    this.currentLevelIndex = levelIndex % LEVEL_DEFINITIONS.length;
    const levelDef = LEVEL_DEFINITIONS[this.currentLevelIndex];
    const center = levelDef.center;

    this.pigsRemaining = levelDef.pigs.length;
    this.settleDelay = 0.5;

    // 1. Build Static Sturdy Target Table/Platform Stand
    if (levelDef.table) {
      const [tw, th, td] = levelDef.table.dimensions;
      const tableMesh = new Mesh(new BoxGeometry(tw, th, td), Materials.wood);
      tableMesh.position.set(
        center.x + levelDef.table.position[0],
        center.y + levelDef.table.position[1],
        center.z + levelDef.table.position[2]
      );
      this.tableEntity = this.world.createTransformEntity(tableMesh);
      this.tableEntity.addComponent(PhysicsShape, {
        shape: PhysicsShapeType.Box,
        dimensions: [tw, th, td],
        density: 0,
        restitution: 0.1,
        friction: 0.9,
      });
      this.tableEntity.addComponent(PhysicsBody, {
        state: PhysicsState.Static,
      });
      this.activeEntities.push(this.tableEntity);
    }

    // 2. Build Target Blocks (Wood, Stone, Glass)
    levelDef.blocks.forEach((blockDef) => {
      const blockMesh = createBlockMesh(blockDef.dimensions, blockDef.type);
      blockMesh.position.set(
        center.x + blockDef.position[0],
        center.y + blockDef.position[1],
        center.z + blockDef.position[2]
      );

      const entity = this.world.createTransformEntity(blockMesh);
      entity.addComponent(DestructibleBlock, {
        materialType: blockDef.type,
        health: blockDef.type === 'stone' ? 160 : blockDef.type === 'glass' ? 50 : 100,
        points: blockDef.type === 'stone' ? 150 : 100,
      });

      entity.addComponent(PhysicsShape, {
        shape: PhysicsShapeType.Box,
        dimensions: blockDef.dimensions,
        density: blockDef.density || 1.2,
        restitution: blockDef.type === 'glass' ? 0.05 : 0.15,
        friction: 0.85,
      });

      entity.addComponent(PhysicsBody, {
        state: PhysicsState.Dynamic,
        linearDamping: 0.15,
        angularDamping: 0.25,
        gravityFactor: 1.0,
      });

      this.activeEntities.push(entity);
    });

    // 3. Build Comical Enemy Pigs
    levelDef.pigs.forEach((pigDef) => {
      const pigMesh = createPigMesh(pigDef.radius || 0.13);
      pigMesh.position.set(
        center.x + pigDef.position[0],
        center.y + pigDef.position[1],
        center.z + pigDef.position[2]
      );

      const entity = this.world.createTransformEntity(pigMesh);
      entity.addComponent(PigComponent, {
        health: 70,
        isAlive: true,
        points: 500,
      });

      entity.addComponent(PhysicsShape, {
        shape: PhysicsShapeType.Sphere,
        dimensions: [pigDef.radius || 0.13, 0, 0],
        density: 1.5,
        restitution: 0.25,
        friction: 0.7,
      });

      entity.addComponent(PhysicsBody, {
        state: PhysicsState.Dynamic,
        linearDamping: 0.15,
        angularDamping: 0.25,
        gravityFactor: 1.0,
      });

      this.activeEntities.push(entity);
    });

    // 4. Build TNT Barrels
    levelDef.tnt.forEach((tntDef) => {
      const tntMesh = createTNTBarrelMesh(tntDef.radius || 0.14, tntDef.height || 0.32);
      tntMesh.position.set(
        center.x + tntDef.position[0],
        center.y + tntDef.position[1],
        center.z + tntDef.position[2]
      );

      const entity = this.world.createTransformEntity(tntMesh);
      entity.addComponent(TNTComponent, {
        isDetonated: false,
        blastRadius: 2.2,
        blastForce: 34.0,
      });

      entity.addComponent(PhysicsShape, {
        shape: PhysicsShapeType.Cylinder,
        dimensions: [tntDef.radius || 0.14, tntDef.height || 0.32, 0],
        density: 1.4,
        restitution: 0.2,
        friction: 0.8,
      });

      entity.addComponent(PhysicsBody, {
        state: PhysicsState.Dynamic,
        linearDamping: 0.15,
        angularDamping: 0.25,
        gravityFactor: 1.0,
      });

      this.activeEntities.push(entity);
    });

    try {
      const gameFlowSys = this.world.getSystem(GameFlowSystem);
      if (gameFlowSys) {
        gameFlowSys.onLevelLoaded(this.currentLevelIndex, this.pigsRemaining, levelDef.birds);
      }
    } catch (_) {}
  }

  clearCurrentLevel() {
    this.activeEntities.forEach((entity) => {
      try {
        entity.dispose();
      } catch (_) {}
    });
    this.activeEntities = [];
    this.prevVelocities.clear();
  }

  update(delta) {
    if (this.settleDelay > 0) {
      this.settleDelay -= delta;
      return;
    }

    // 1. Process Pig Collisions & Impacts
    this.queries.pigs.entities.forEach((entity) => {
      if (!entity.hasComponent(PigComponent)) return;
      const isAlive = entity.getValue(PigComponent, 'isAlive');
      if (!isAlive) return;

      const obj = entity.object3D;
      if (!obj) return;

      if (obj.position.y < 0.15) {
        this.destroyPig(entity, obj.position);
        return;
      }

      if (!entity.hasComponent(PhysicsBody)) return;
      let currVel = null;
      try {
        currVel = entity.getVectorView(PhysicsBody, '_linearVelocity');
      } catch (_) {}
      if (!currVel) return;

      const key = entity.index !== undefined ? entity.index : entity.id;
      const prevVel = this.prevVelocities.get(key);

      if (prevVel) {
        const dvx = currVel[0] - prevVel.x;
        const dvy = currVel[1] - prevVel.y;
        const dvz = currVel[2] - prevVel.z;
        const impulse = Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz);

        if (impulse > 2.0) {
          const damage = impulse * 28;
          let health = (entity.getValue(PigComponent, 'health') || 70) - damage;
          entity.setValue(PigComponent, 'health', health);

          sound.playImpact(Math.min(1.0, impulse / 7), 'wood');
          particles.spawnImpactDebris(obj.position, 'pig', 3);

          if (health <= 0) {
            this.destroyPig(entity, obj.position);
          }
        }
      }

      this.prevVelocities.set(key, {
        x: currVel[0],
        y: currVel[1],
        z: currVel[2],
      });
    });

    // 2. Process Destructible Block Collisions
    this.queries.blocks.entities.forEach((entity) => {
      if (!entity.hasComponent(DestructibleBlock)) return;

      const obj = entity.object3D;
      if (!obj) return;

      if (obj.position.y < 0.1) {
        this.destroyBlock(entity, obj.position);
        return;
      }

      if (!entity.hasComponent(PhysicsBody)) return;
      let currVel = null;
      try {
        currVel = entity.getVectorView(PhysicsBody, '_linearVelocity');
      } catch (_) {}
      if (!currVel) return;

      const key = entity.index !== undefined ? entity.index : entity.id;
      const prevVel = this.prevVelocities.get(key);

      if (prevVel) {
        const dvx = currVel[0] - prevVel.x;
        const dvy = currVel[1] - prevVel.y;
        const dvz = currVel[2] - prevVel.z;
        const impulse = Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz);

        if (impulse > 2.6) {
          const damage = impulse * 22;
          let health = (entity.getValue(DestructibleBlock, 'health') || 100) - damage;
          entity.setValue(DestructibleBlock, 'health', health);

          const matType = entity.getValue(DestructibleBlock, 'materialType') || 'wood';
          sound.playImpact(Math.min(1.0, impulse / 7), matType);
          particles.spawnImpactDebris(obj.position, matType, 4);

          if (health <= 0) {
            this.destroyBlock(entity, obj.position);
          }
        }
      }

      this.prevVelocities.set(key, {
        x: currVel[0],
        y: currVel[1],
        z: currVel[2],
      });
    });

    // 3. Process TNT Collisions
    this.queries.tnt.entities.forEach((entity) => {
      if (!entity.hasComponent(TNTComponent)) return;
      const isDetonated = entity.getValue(TNTComponent, 'isDetonated');
      if (isDetonated) return;

      const obj = entity.object3D;
      if (!obj) return;

      if (!entity.hasComponent(PhysicsBody)) return;
      let currVel = null;
      try {
        currVel = entity.getVectorView(PhysicsBody, '_linearVelocity');
      } catch (_) {}
      if (!currVel) return;

      const key = entity.index !== undefined ? entity.index : entity.id;
      const prevVel = this.prevVelocities.get(key);

      if (prevVel) {
        const dvx = currVel[0] - prevVel.x;
        const dvy = currVel[1] - prevVel.y;
        const dvz = currVel[2] - prevVel.z;
        const impulse = Math.sqrt(dvx * dvx + dvy * dvy + dvz * dvz);

        if (impulse > 2.0) {
          this.detonateTNT(entity, obj.position);
        }
      }

      this.prevVelocities.set(key, {
        x: currVel[0],
        y: currVel[1],
        z: currVel[2],
      });
    });
  }

  destroyPig(entity, pos) {
    if (entity.hasComponent(PigComponent)) {
      entity.setValue(PigComponent, 'isAlive', false);
    }

    sound.playPigGasp();
    particles.spawnImpactDebris(pos, 'pig', 10);

    try {
      const popupSys = this.world.getSystem(PopupSystem);
      if (popupSys) {
        popupSys.spawnPopup('+500', pos, 0x33ff66);
      }
    } catch (_) {}

    this.pigsRemaining = Math.max(0, this.pigsRemaining - 1);

    try {
      const gameFlowSys = this.world.getSystem(GameFlowSystem);
      if (gameFlowSys) {
        gameFlowSys.onPigDestroyed(500, this.pigsRemaining);
      }
    } catch (_) {}

    try {
      entity.dispose();
    } catch (_) {}
  }

  destroyBlock(entity, pos) {
    let matType = 'wood';
    let pts = 100;
    if (entity.hasComponent(DestructibleBlock)) {
      matType = entity.getValue(DestructibleBlock, 'materialType') || 'wood';
      pts = entity.getValue(DestructibleBlock, 'points') || 100;
    }

    particles.spawnImpactDebris(pos, matType, 8);

    try {
      const popupSys = this.world.getSystem(PopupSystem);
      if (popupSys) {
        popupSys.spawnPopup('+100', pos, 0xffcc00);
      }
    } catch (_) {}

    try {
      const gameFlowSys = this.world.getSystem(GameFlowSystem);
      if (gameFlowSys) {
        gameFlowSys.addScore(pts);
      }
    } catch (_) {}

    try {
      entity.dispose();
    } catch (_) {}
  }

  detonateTNT(entity, pos) {
    let blastRadius = 2.2;
    let blastForce = 34.0;
    if (entity.hasComponent(TNTComponent)) {
      entity.setValue(TNTComponent, 'isDetonated', true);
      blastRadius = entity.getValue(TNTComponent, 'blastRadius') || 2.2;
      blastForce = entity.getValue(TNTComponent, 'blastForce') || 34.0;
    }

    sound.playExplosion();
    particles.spawnExplosion(pos);

    try {
      const popupSys = this.world.getSystem(PopupSystem);
      if (popupSys) {
        popupSys.spawnPopup('BOOM! +1000', pos, 0xff3300);
      }
    } catch (_) {}

    try {
      const gameFlowSys = this.world.getSystem(GameFlowSystem);
      if (gameFlowSys) {
        gameFlowSys.addScore(1000);
      }
    } catch (_) {}

    this.applyRadialExplosion(pos, blastRadius, blastForce);

    try {
      entity.dispose();
    } catch (_) {}
  }

  applyRadialExplosion(centerPos, radius = 2.2, maxForce = 34.0) {
    const allPhysicsEntities = [
      ...this.queries.blocks.entities,
      ...this.queries.pigs.entities,
      ...this.queries.tnt.entities,
      ...this.queries.birds.entities,
    ];

    allPhysicsEntities.forEach((entity) => {
      const obj = entity.object3D;
      if (!obj) return;

      const dist = obj.position.distanceTo(centerPos);
      if (dist < radius && dist > 0.01) {
        const factor = 1.0 - dist / radius;
        const force = maxForce * factor;

        const dir = new Vector3()
          .subVectors(obj.position, centerPos)
          .normalize();
        dir.y += 0.4;
        dir.normalize();

        entity.addComponent(PhysicsManipulation, {
          force: [dir.x * force * 15, dir.y * force * 15, dir.z * force * 15],
          linearVelocity: [dir.x * force, dir.y * force, dir.z * force],
        });

        if (entity.hasComponent(PigComponent)) {
          const isAlive = entity.getValue(PigComponent, 'isAlive');
          if (isAlive) {
            let health = (entity.getValue(PigComponent, 'health') || 70) - factor * 150;
            entity.setValue(PigComponent, 'health', health);
            if (health <= 0) {
              this.destroyPig(entity, obj.position);
            }
          }
        }
      }
    });
  }
}
