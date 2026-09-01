/**
 * High-Performance Low-Poly Particle Systems
 * Handles grab confetti, impact debris fragments, TNT blast fireballs, flight trails, and victory stars.
 */

import {
  BoxGeometry,
  DodecahedronGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  OctahedronGeometry,
  TetrahedronGeometry,
  Vector3,
} from '@iwsdk/core';

const CONFETTI_COLORS = [
  0xff3366, 0x33ccff, 0xffcc00, 0x33ff66, 0xff66cc, 0x9933ff, 0xff9900,
];

const WOOD_DEBRIS_COLORS = [0xba7a44, 0x985e30, 0x7c4921, 0xdb965c];
const STONE_DEBRIS_COLORS = [0x8a929a, 0x6e767f, 0xa1aab3, 0x545a61];
const GLASS_DEBRIS_COLORS = [0x44ddff, 0x88eeff, 0xbbffff, 0x22bbdd];
const PIG_DEBRIS_COLORS = [0x33cc44, 0x55ee66, 0x22aa33, 0x88ff99];
const TNT_DEBRIS_COLORS = [0xff2200, 0xff6600, 0xffcc00, 0x333333];

class ParticlePool {
  constructor() {
    this.activeParticles = [];
    this.container = new Group();
    this.container.name = 'ParticleContainer';

    // Shared geometries for efficiency
    this.cubeGeo = new BoxGeometry(1, 1, 1);
    this.octaGeo = new OctahedronGeometry(1, 0);
    this.tetraGeo = new TetrahedronGeometry(1, 0);
    this.starGeo = new DodecahedronGeometry(1, 0);
  }

  getContainer() {
    return this.container;
  }

  /**
   * Tiny 10-particle geometric confetti burst from finger coordinates on successful pinch.
   */
  spawnPinchConfetti(pos) {
    for (let i = 0; i < 10; i++) {
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const mat = new MeshBasicMaterial({ color });
      const mesh = new Mesh(this.tetraGeo, mat);

      const size = 0.012 + Math.random() * 0.015;
      mesh.scale.set(size, size, size);
      mesh.position.copy(pos);

      // Random burst velocity
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * Math.PI;
      const speed = 0.5 + Math.random() * 1.2;

      const vel = new Vector3(
        Math.cos(angle) * Math.cos(elevation) * speed,
        Math.sin(elevation) * speed + 0.5,
        Math.sin(angle) * Math.cos(elevation) * speed
      );

      const rotSpeed = new Vector3(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15
      );

      this.container.add(mesh);
      this.activeParticles.push({
        mesh,
        vel,
        rotSpeed,
        life: 0.5,
        maxLife: 0.5,
        gravity: 2.0,
      });
    }
  }

  /**
   * Instantiates 8 tiny, unlit, fading low-poly fragments that burst and scale down over 0.8s.
   */
  spawnImpactDebris(pos, type = 'wood', count = 8) {
    let colorPalette = WOOD_DEBRIS_COLORS;
    if (type === 'stone') colorPalette = STONE_DEBRIS_COLORS;
    else if (type === 'glass') colorPalette = GLASS_DEBRIS_COLORS;
    else if (type === 'pig') colorPalette = PIG_DEBRIS_COLORS;
    else if (type === 'tnt') colorPalette = TNT_DEBRIS_COLORS;

    for (let i = 0; i < count; i++) {
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      const mat = new MeshBasicMaterial({ color });
      const geo = Math.random() > 0.5 ? this.octaGeo : this.cubeGeo;
      const mesh = new Mesh(geo, mat);

      const baseScale = 0.025 + Math.random() * 0.035;
      mesh.scale.set(baseScale, baseScale, baseScale);
      mesh.position.copy(pos).add(
        new Vector3(
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1
        )
      );

      const speed = 1.2 + Math.random() * 2.5;
      const vel = new Vector3(
        (Math.random() - 0.5) * speed,
        0.5 + Math.random() * speed,
        (Math.random() - 0.5) * speed
      );

      const rotSpeed = new Vector3(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12
      );

      this.container.add(mesh);
      this.activeParticles.push({
        mesh,
        vel,
        rotSpeed,
        life: 0.8,
        maxLife: 0.8,
        gravity: 4.5,
        baseScale,
      });
    }
  }

  /**
   * Explosive TNT fireball & shockwave particle burst.
   */
  spawnExplosion(pos) {
    // 24 fiery fragments
    this.spawnImpactDebris(pos, 'tnt', 24);

    // Expanding low-poly shockwave puff
    for (let i = 0; i < 8; i++) {
      const mat = new MeshBasicMaterial({
        color: i % 2 === 0 ? 0xff4400 : 0xffcc00,
        transparent: true,
        opacity: 0.8,
      });
      const mesh = new Mesh(this.dodecaGeo || this.octaGeo, mat);
      const baseScale = 0.08 + Math.random() * 0.08;
      mesh.scale.set(baseScale, baseScale, baseScale);
      mesh.position.copy(pos);

      const speed = 2.0 + Math.random() * 3.0;
      const vel = new Vector3(
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed + 1.0,
        (Math.random() - 0.5) * speed
      );

      this.container.add(mesh);
      this.activeParticles.push({
        mesh,
        vel,
        rotSpeed: new Vector3(5, 5, 5),
        life: 0.6,
        maxLife: 0.6,
        gravity: 1.0,
        baseScale,
      });
    }
  }

  /**
   * Trail smoke puff behind flying bird.
   */
  spawnFlightPuff(pos, color = 0xffffff) {
    const mat = new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
    });
    const mesh = new Mesh(this.octaGeo, mat);
    const baseScale = 0.035;
    mesh.scale.set(baseScale, baseScale, baseScale);
    mesh.position.copy(pos);

    this.container.add(mesh);
    this.activeParticles.push({
      mesh,
      vel: new Vector3(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
      ),
      rotSpeed: new Vector3(1, 1, 1),
      life: 0.35,
      maxLife: 0.35,
      gravity: -0.2, // Drifts slightly upward
      baseScale,
    });
  }

  /**
   * Continuous gold star confetti burst scaling up in front of the player on victory.
   */
  spawnVictoryStar(originPos) {
    const mat = new MeshBasicMaterial({
      color: Math.random() > 0.3 ? 0xffd700 : 0xffffff,
      wireframe: false,
    });
    const mesh = new Mesh(this.starGeo, mat);
    const baseScale = 0.04 + Math.random() * 0.04;
    mesh.scale.set(0.001, 0.001, 0.001); // Scales up
    mesh.position.copy(originPos).add(
      new Vector3(
        (Math.random() - 0.5) * 1.6,
        (Math.random() - 0.5) * 1.2,
        (Math.random() - 0.5) * 0.8 - 0.5
      )
    );

    const speed = 0.8 + Math.random() * 1.5;
    const vel = new Vector3(
      (Math.random() - 0.5) * speed,
      0.8 + Math.random() * speed,
      (Math.random() - 0.5) * speed
    );

    const rotSpeed = new Vector3(
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 8
    );

    this.container.add(mesh);
    this.activeParticles.push({
      mesh,
      vel,
      rotSpeed,
      life: 1.5,
      maxLife: 1.5,
      gravity: 0.8,
      baseScale,
      isStar: true,
    });
  }

  /**
   * Per-frame particle update loop.
   */
  update(dt) {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const p = this.activeParticles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.container.remove(p.mesh);
        p.mesh.geometry.dispose?.();
        p.mesh.material.dispose?.();
        this.activeParticles.splice(i, 1);
        continue;
      }

      // Physics integration
      p.vel.y -= p.gravity * dt;
      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt;
      p.mesh.position.z += p.vel.z * dt;

      p.mesh.rotation.x += p.rotSpeed.x * dt;
      p.mesh.rotation.y += p.rotSpeed.y * dt;
      p.mesh.rotation.z += p.rotSpeed.z * dt;

      // Scale down over time (or scale up then down for stars)
      const lifeRatio = p.life / p.maxLife;
      if (p.isStar) {
        const scaleProgress = 1 - lifeRatio;
        const s =
          scaleProgress < 0.2
            ? (scaleProgress / 0.2) * p.baseScale
            : lifeRatio * p.baseScale;
        p.mesh.scale.set(s, s, s);
      } else {
        const s = (p.baseScale || 0.02) * lifeRatio;
        p.mesh.scale.set(s, s, s);
      }
    }
  }

  clear() {
    for (const p of this.activeParticles) {
      this.container.remove(p.mesh);
      p.mesh.geometry.dispose?.();
      p.mesh.material.dispose?.();
    }
    this.activeParticles.length = 0;
  }
}

export const particles = new ParticlePool();
