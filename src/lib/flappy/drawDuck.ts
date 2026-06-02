/** Horizontal position of the player (used for collision + drawing). */
export const DUCK_X = 45;

/**
 * Draws the player character on the canvas.
 * Edit colors and shapes here to customize your duck.
 */
export function drawDuck(ctx: CanvasRenderingContext2D, centerY: number) {
	const x = DUCK_X;
	const y = centerY;

	// Body
	ctx.fillStyle = '#f5d547';
	ctx.beginPath();
	ctx.ellipse(x - 2, y + 3, 14, 11, 0, 0, Math.PI * 2);
	ctx.fill();

	// Wing
	ctx.fillStyle = '#e8b830';
	ctx.beginPath();
	ctx.ellipse(x - 7, y + 5, 7, 4, -0.4, 0, Math.PI * 2);
	ctx.fill();

	// Head
	ctx.fillStyle = '#f5d547';
	ctx.beginPath();
	ctx.arc(x + 3, y - 5, 10, 0, Math.PI * 2);
	ctx.fill();

	// Tail feathers
	ctx.fillStyle = '#e8b830';
	ctx.beginPath();
	ctx.moveTo(x - 14, y + 2);
	ctx.lineTo(x - 20, y - 2);
	ctx.lineTo(x - 20, y + 6);
	ctx.closePath();
	ctx.fill();

	// Bill (flat duck beak)
	ctx.fillStyle = '#ff8c00';
	ctx.beginPath();
	ctx.ellipse(x + 13, y - 3, 11, 5, 0.15, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = '#e67a00';
	ctx.beginPath();
	ctx.ellipse(x + 12, y - 1, 8, 3, 0.15, 0, Math.PI * 2);
	ctx.fill();

	// Eye
	ctx.fillStyle = '#ffffff';
	ctx.beginPath();
	ctx.arc(x + 6, y - 7, 4.5, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = '#1a1a1a';
	ctx.beginPath();
	ctx.arc(x + 7, y - 7, 2.2, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = '#ffffff';
	ctx.beginPath();
	ctx.arc(x + 8, y - 8, 0.9, 0, Math.PI * 2);
	ctx.fill();
}
