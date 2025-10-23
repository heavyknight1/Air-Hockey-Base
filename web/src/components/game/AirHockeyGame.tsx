"use client";
import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

export default function AirHockeyGame() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    class AirHockeyScene extends Phaser.Scene {
      width = 800;
      height = 450;
      puck!: Phaser.Physics.Arcade.Image;
      player!: Phaser.Physics.Arcade.Image;
      ai!: Phaser.Physics.Arcade.Image;
      scorePlayer = 0;
      scoreAI = 0;
      scoreText!: Phaser.GameObjects.Text;

      create() {
        // Table background and center line
        const g = this.add.graphics();
        g.fillStyle(0x0b1220, 1).fillRect(0, 0, this.width, this.height);
        g.lineStyle(2, 0x334155, 1)
          .beginPath()
          .moveTo(this.width / 2, 0)
          .lineTo(this.width / 2, this.height)
          .closePath()
          .strokePath();

        // Create textures for paddle and puck
        const draw = this.add.graphics();
        draw.clear();
        draw.fillStyle(0xffffff, 1);
        draw.fillCircle(12, 12, 12);
        draw.generateTexture("puck", 24, 24);
        draw.clear();
        draw.fillStyle(0x60a5fa, 1);
        draw.fillRoundedRect(0, 0, 18, 90, 9);
        draw.generateTexture("paddleL", 18, 90);
        draw.clear();
        draw.fillStyle(0xf97316, 1);
        draw.fillRoundedRect(0, 0, 18, 90, 9);
        draw.generateTexture("paddleR", 18, 90);
        draw.destroy();

        // Physics world: only top/bottom collide (goals left/right)
        this.physics.world.setBounds(0, 0, this.width, this.height);
        this.physics.world.setBoundsCollision(false, false, true, true);

        // Puck
        this.puck = this.physics.add.image(this.width / 2, this.height / 2, "puck");
        this.puck.setCircle(12);
        this.puck.setBounce(1, 1);
        this.puck.setCollideWorldBounds(false);
        (this.puck.body as Phaser.Physics.Arcade.Body).useDamping = true;
        (this.puck.body as Phaser.Physics.Arcade.Body).drag.set(0, 0);

        // Paddles
        this.player = this.physics.add.image(60, this.height / 2, "paddleL").setImmovable(true).setCollideWorldBounds(true);
        this.ai = this.physics.add.image(this.width - 60, this.height / 2, "paddleR").setImmovable(true).setCollideWorldBounds(true);

        // Collisions
        this.physics.add.collider(this.puck, this.player, this.onPaddleHit as any, undefined, this);
        this.physics.add.collider(this.puck, this.ai, this.onPaddleHit as any, undefined, this);

        // Score text
        this.scoreText = this.add.text(this.width / 2, 16, "0 : 0", {
          color: "#e2e8f0",
          fontFamily: "monospace",
          fontSize: "24px",
        }).setOrigin(0.5, 0);

        // Input: mouse controls player Y within left half
        this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
          const clampY = Phaser.Math.Clamp(p.y, 45, this.height - 45);
          this.player.setY(clampY);
        });

        // Kick off round
        this.resetPuck(Phaser.Math.Between(0, 1) ? 1 : -1);
      }

      onPaddleHit = () => {
        const pb = this.puck.body as Phaser.Physics.Arcade.Body;
        const paddle = Math.abs(this.puck.x - this.player.x) < Math.abs(this.puck.x - this.ai.x) ? this.player : this.ai;
        const diff = this.puck.y - paddle.y;
        pb.velocity.y += diff * 4;
        const max = 520;
        pb.velocity.x = Phaser.Math.Clamp(pb.velocity.x, -max, max);
        pb.velocity.y = Phaser.Math.Clamp(pb.velocity.y, -max, max);
      };

      resetPuck(dir: 1 | -1) {
        this.puck.setPosition(this.width / 2, this.height / 2);
        const speed = 320;
        const angle = Phaser.Math.DegToRad(Phaser.Math.Between(-25, 25));
        const vx = Math.cos(angle) * speed * dir;
        const vy = Math.sin(angle) * speed;
        this.puck.setVelocity(vx, vy);
      }

      goalScored(byPlayer: boolean) {
        if (byPlayer) this.scorePlayer++; else this.scoreAI++;
        this.scoreText.setText(`${this.scorePlayer} : ${this.scoreAI}`);
        this.time.delayedCall(500, () => this.resetPuck(byPlayer ? -1 : 1));
      }

      update(): void {
        // Goals: left/right out of bounds
        if (this.puck.x < -10) {
          this.goalScored(false);
        } else if (this.puck.x > this.width + 10) {
          this.goalScored(true);
        }

        // Constrain paddles to halves
        this.player.x = 60;
        this.ai.x = this.width - 60;

        // Simple AI
        const targetY = (this.puck.x > this.width / 2 - 40) ? this.puck.y : this.height / 2;
        const dy = targetY - this.ai.y;
        this.ai.setY(Phaser.Math.Clamp(this.ai.y + Phaser.Math.Clamp(dy * 0.06, -6, 6), 45, this.height - 45));

        // Cap puck speed
        const pb = this.puck.body as Phaser.Physics.Arcade.Body;
        const v = new Phaser.Math.Vector2(pb.velocity.x, pb.velocity.y);
        const max = 600;
        if (v.length() > max) {
          v.setLength(max);
          pb.setVelocity(v.x, v.y);
        }
      }
    }

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 800,
      height: 450,
      backgroundColor: "#0f172a",
      parent: containerRef.current!,
      physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 }, debug: false } },
      scene: [AirHockeyScene],
    });

    gameRef.current = game;
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      <div className="shadow-md border border-slate-700 rounded" />
    </div>
  );
}

