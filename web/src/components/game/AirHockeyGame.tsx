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
      infoText!: Phaser.GameObjects.Text;
      roundActive = false;
      resetting = false;
      winScore = 5;
      playerTargetY = this.height / 2;
      paused = false;

      aiEnabled = true; keys!: { w: Phaser.Input.Keyboard.Key; s: Phaser.Input.Keyboard.Key; }; create() {
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
        this.player = this.physics.add
          .image(60, this.height / 2, "paddleL")
          .setImmovable(true)
          .setCollideWorldBounds(true);
        this.ai = this.physics.add
          .image(this.width - 60, this.height / 2, "paddleR")
          .setImmovable(true)
          .setCollideWorldBounds(true);

        // Collisions
        this.physics.add.collider(this.puck, this.player, this.onPaddleHit as any, undefined, this);
        this.physics.add.collider(this.puck, this.ai, this.onPaddleHit as any, undefined, this);

        // Score text
        this.scoreText = this.add
          .text(this.width / 2, 12, "0 : 0", {
            color: "#e2e8f0",
            fontFamily: "monospace",
            fontSize: "24px",
          })
          .setOrigin(0.5, 0);

        this.infoText = this.add
          .text(this.width / 2, this.height - 24, "Boşluk: Başlat/Durdur — Hedef Skor: 5 — M: Mod (AI/2P)", {
            color: "#94a3b8",
            fontFamily: "monospace",
            fontSize: "14px",
          })
          .setOrigin(0.5, 1);

        // Input: mouse controls player target Y
        this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
          this.playerTargetY = Phaser.Math.Clamp(p.y, 45, this.height - 45);
        });

        // Keyboard: Space to pause/resume
        this.input.keyboard!.on("keydown-SPACE", () => {
          this.paused = !this.paused;
          if (!this.paused && !this.roundActive && !this.resetting) {
            this.resetPuck(Phaser.Math.Between(0, 1) ? 1 : -1);
          } else if (this.paused) {
            (this.puck.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
          }
        });

                // Toggle AI/2P with M
        this.input.keyboard!.on("keydown-M", () => {
          this.aiEnabled = !this.aiEnabled;
          const mode = this.aiEnabled ? "AI" : "2P";
          this.infoText.setText(`Boşluk: Başlat/Durdur — Hedef Skor: ${this.winScore} — Mod: ${mode}`);
        });
        // Player 2 keys (W/S for right paddle)
        this.keys = {
          w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
          s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        } as any;

        // Start initial round
        this.resetPuck(Phaser.Math.Between(0, 1) ? 1 : -1);
      }

      onPaddleHit = () => {
        const pb = this.puck.body as Phaser.Physics.Arcade.Body;
        const paddle = Math.abs(this.puck.x - this.player.x) < Math.abs(this.puck.x - this.ai.x) ? this.player : this.ai;
        const diff = this.puck.y - paddle.y;
        const norm = Phaser.Math.Clamp(diff / 45, -1, 1);
        pb.velocity.y += norm * 180; // add spin
        // Ensure horizontal keeps moving to avoid stalls
        const minX = 160;
        if (Math.abs(pb.velocity.x) < minX) {
          pb.velocity.x = (pb.velocity.x >= 0 ? 1 : -1) * minX;
        }
        const max = 620;
        pb.velocity.x = Phaser.Math.Clamp(pb.velocity.x, -max, max);
        pb.velocity.y = Phaser.Math.Clamp(pb.velocity.y, -max, max);
      };

      resetPuck(dir: 1 | -1) {
        this.resetting = false;
        this.roundActive = true;
        this.paused = false;
        this.puck.setPosition(this.width / 2, this.height / 2);
        const speed = 340;
        const angle = Phaser.Math.DegToRad(Phaser.Math.Between(-20, 20));
        const vx = Math.cos(angle) * speed * dir;
        const vy = Math.sin(angle) * speed;
        this.puck.setVelocity(vx, vy);
      }

      goalScored(byPlayer: boolean) {
        if (this.resetting || !this.roundActive) return;
        this.roundActive = false;
        this.resetting = true;
        // Count once per round
        if (byPlayer) this.scorePlayer += 1; else this.scoreAI += 1;
        this.scoreText.setText(`${this.scorePlayer} : ${this.scoreAI}`);

        // Win check
        if (this.scorePlayer >= this.winScore || this.scoreAI >= this.winScore) {
          const winner = this.scorePlayer > this.scoreAI ? "Oyuncu" : "Bilgisayar";
          this.infoText.setText(`${winner} kazandı! Boşluk ile yeniden başlat.`);
          (this.puck.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
          this.time.delayedCall(100, () => {
            this.paused = true;
          });
          return;
        }

        // Quick reset without letting puck leave view
        this.time.delayedCall(500, () => {
          this.resetPuck(byPlayer ? -1 : 1);
        });
      }

      update(): void {
        const radius = 12;
        // Goals: when logically crossing goal lines (left/right edges)
        if (this.roundActive && !this.paused) {
          if (this.puck.x <= radius + 1) {
            this.goalScored(false); // AI scores
          } else if (this.puck.x >= this.width - radius - 1) {
            this.goalScored(true); // Player scores
          }
        }

        if (this.paused) return;

        // Constrain paddles to halves
        this.player.x = 60;
        this.ai.x = this.width - 60;

        // Smooth player control toward target Y
        const lerp = Phaser.Math.Linear;
        this.player.setY(Phaser.Math.Clamp(lerp(this.player.y, this.playerTargetY, 0.25), 45, this.height - 45));
        // Manual bounce on top/bottom to avoid sticking
        const pb = this.puck.body as Phaser.Physics.Arcade.Body;
        if (this.puck.y <= radius && pb.velocity.y < 0) {
          this.puck.y = radius;
          pb.velocity.y *= -1;
        } else if (this.puck.y >= this.height - radius && pb.velocity.y > 0) {
          this.puck.y = this.height - radius;
          pb.velocity.y *= -1;
        }

        // Right paddle: AI or 2P keyboard control
        if (this.aiEnabled) {
          const targetY = this.puck.x > this.width / 2 - 40 ? this.puck.y : this.height / 2;
          const dy = targetY - this.ai.y;
          this.ai.setY(Phaser.Math.Clamp(this.ai.y + Phaser.Math.Clamp(dy * 0.06, -6, 6), 45, this.height - 45));
        } else {
          const speed = 7;
          let ny = this.ai.y;
          if (this.keys.w.isDown) ny -= speed;
          if (this.keys.s.isDown) ny += speed;
          this.ai.setY(Phaser.Math.Clamp(ny, 45, this.height - 45));
        }
        // Cap puck speed
        const v = new Phaser.Math.Vector2(pb.velocity.x, pb.velocity.y);
        const max = 640;
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






