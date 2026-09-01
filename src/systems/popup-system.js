/**
 * Floating Score Popup System
 * Instantiates elastic spring-animated text sprites that float upward and fade out.
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

export class PopupSystem extends createSystem({}) {
  constructor() {
    super(...arguments);
    this.container = new Group();
    this.container.name = 'PopupContainer';
    this.activePopups = [];
    this.cameraPos = new Vector3();
  }

  init() {
    this.world.scene.add(this.container);
  }

  /**
   * Spawns a floating score text popup.
   * @param {string} text - e.g. "+500" or "BOOM!"
   * @param {Vector3} worldPos - Origin location
   * @param {number} colorHex - Text color
   */
  spawnPopup(text, worldPos, colorHex = 0xffea00) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Bold stylized text with black stroke outline
    ctx.font = '900 52px "Arial Black", "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const hexStr = '#' + colorHex.toString(16).padStart(6, '0');

    // Shadow / Outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 10;
    ctx.strokeText(text, 128, 64);

    // Text Fill
    ctx.fillStyle = hexStr;
    ctx.fillText(text, 128, 64);

    const texture = new CanvasTexture(canvas);
    const mat = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 1.0,
      side: DoubleSide,
      depthWrite: false,
    });

    const geo = new PlaneGeometry(0.5, 0.25);
    const mesh = new Mesh(geo, mat);
    mesh.position.copy(worldPos).add(new Vector3(0, 0.15, 0));
    mesh.scale.set(0.001, 0.001, 0.001); // Starts small for spring scale-up

    this.container.add(mesh);

    this.activePopups.push({
      mesh,
      mat,
      originY: mesh.position.y,
      elapsed: 0,
      duration: 1.1,
      text,
    });
  }

  update(delta) {
    if (this.world?.camera) {
      this.world.camera.getWorldPosition(this.cameraPos);
    }

    for (let i = this.activePopups.length - 1; i >= 0; i--) {
      const p = this.activePopups[i];
      p.elapsed += delta;

      if (p.elapsed >= p.duration) {
        this.container.remove(p.mesh);
        p.mesh.geometry.dispose?.();
        p.mat.map?.dispose?.();
        p.mat.dispose?.();
        this.activePopups.splice(i, 1);
        continue;
      }

      const progress = p.elapsed / p.duration;

      // Elastic Spring Curve for scale (0 -> 1.3 -> 1.0)
      let scale = 1.0;
      if (progress < 0.25) {
        const t = progress / 0.25;
        scale = Math.sin(t * (Math.PI / 2)) * 1.35;
      } else if (progress < 0.45) {
        const t = (progress - 0.25) / 0.2;
        scale = 1.35 - t * 0.35;
      }

      p.mesh.scale.set(scale, scale, scale);

      // Float upwards along Y-axis
      p.mesh.position.y = p.originY + progress * 0.45;

      // Billboard to face player camera
      p.mesh.lookAt(this.cameraPos);

      // Fade out in last 30% of duration
      if (progress > 0.65) {
        const fade = (1.0 - progress) / 0.35;
        p.mat.opacity = fade;
      }
    }
  }
}
