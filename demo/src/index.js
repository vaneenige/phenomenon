// Import module from source
import Phenomenon from './../../src/index.js';

// Import optional utils
import { getRandom, rotateX, rotateY } from './utils.js';

// The amount of particles that will be created
const multiplier = 400000;

// Percentage of how long every particle will move
const duration = 0.9;

// Update value for every frame
const step = 0.01;

// Multiplier of the canvas resolution
const devicePixelRatio = 1;

// Every attribute must have:
// - Name (used in the shader)
// - Data (returns data for every particle)
// - Size (amount of variables in the data)
const attributes = [
	{
		name: 'aPositionStart',
		data: () => [getRandom(0.5), getRandom(0.5), getRandom(0.5)],
		size: 3,
	},
	{
		name: 'aPositionEnd',
		data: () => [getRandom(1.5), getRandom(1.5), getRandom(1.5)],
		size: 3,
	},
	{
		name: 'aColor',
		data: () => Math.random() > 0.5 ? [29 / 255, 233 / 255, 182 / 255, 1] : [4 / 255, 208 / 255, 157 / 255, 1],
		size: 3,
	},
	{
		name: 'aOffset',
		data: i => [i * ((1 - duration) / (multiplier - 1))],
		size: 1,
	},
];

// Every uniform must have:
// - Key (used in the shader)
// - Type (what kind of value)
// - Value (based on the type)
const uniforms = {
	uProgress: {
		type: 'float',
		value: 0.0,
	},
};

// Vertex shader used to calculate the position
const vertex = `
  attribute vec3 aPositionStart;
  attribute vec3 aControlPointOne;
  attribute vec3 aControlPointTwo;
  attribute vec3 aPositionEnd;
  attribute vec3 aPosition;
  attribute vec3 aColor;
  attribute float aOffset;

  uniform float uProgress;
  uniform mat4 uProjectionMatrix;
  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;

  varying vec3 vColor;

  float easeInOutQuint(float t){
    return t < 0.5 ? 16.0 * t * t * t * t * t : 1.0 + 16.0 * (--t) * t * t * t * t;
  }

  void main(){
    float tProgress = easeInOutQuint(min(1.0, max(0.0, (uProgress - aOffset)) / ${duration}));
    vec3 newPosition = mix(aPositionStart, aPositionEnd, tProgress);
    gl_Position = uProjectionMatrix * uModelMatrix * uViewMatrix * vec4(newPosition + aPosition, 1.0);
    gl_PointSize = ${devicePixelRatio.toFixed(1)};
    vColor = aColor;
  }
`;

// Fragment shader to draw the colored pixels to the canvas
const fragment = `
  precision mediump float;

  varying vec3 vColor;

  void main(){
    gl_FragColor = vec4(vColor, 1.0);
  }
`;

// Boolean value to switch direction
let forward = true;

// Create the renderer
const phenomenon = new Phenomenon({
	settings: {
		devicePixelRatio,
		position: { x: 0, y: 0, z: 3 },
		shouldRender: true,
		uniforms,
		willRender: r => {
			const { uProgress, uModelMatrix } = r.uniforms;
			uProgress.value += forward ? step : -step;

			if (uProgress.value >= 1) forward = false;
			else if (uProgress.value <= 0) forward = true;

			rotateY(uModelMatrix.value, step * 2);
			rotateX(uModelMatrix.value, step * 2);
		},
	},
});

// Add an instance to the renderer
phenomenon.add('cube', {
	attributes,
	multiplier,
	vertex,
	fragment,
});
