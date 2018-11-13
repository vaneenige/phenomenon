// Import module from source
import Phenomenon from '../../src/index';

// Import optional utils
import { getRandom, rgbToHsl, rotateY } from './utils';

// Material colors in HSL
const colors = [[255, 108, 0], [83, 109, 254], [29, 233, 182], [253, 216, 53]].map(color =>
  rgbToHsl(color)
);

// Boolean to toggle dynamic attributes
const dynamicAttributes = false;

// Update value for every frame
const step = 0.01;

// Multiplier of the canvas resolution
const devicePixelRatio = 1;

// Create the renderer
const phenomenon = new Phenomenon({
  settings: {
    devicePixelRatio,
    position: { x: 0, y: 0, z: 3 },
    onRender: r => {
      rotateY(r.uniforms.uModelMatrix.value, step * 2);
    }
  }
});

let count = 0;

function addInstance() {
  count += 1;

  // The amount of particles that will be created
  const multiplier = 4000;

  // Percentage of how long every particle will move
  const duration = 0.6;

  // Base start position (center of the cube)
  const start = {
    x: getRandom(1),
    y: getRandom(1),
    z: getRandom(1)
  };

  // Base end position (center of the cube)
  const end = {
    x: getRandom(1),
    y: getRandom(1),
    z: getRandom(1)
  };

  // Every attribute must have:
  // - Name (used in the shader)
  // - Data (returns data for every particle)
  // - Size (amount of variables in the data)
  const attributes = [
    {
      name: 'aPositionStart',
      data: () => [start.x + getRandom(0.1), start.y + getRandom(0.1), start.z + getRandom(0.1)],
      size: 3
    },
    {
      name: 'aPositionEnd',
      data: () => [end.x + getRandom(0.1), end.y + getRandom(0.1), end.z + getRandom(0.1)],
      size: 3
    },
    {
      name: 'aColor',
      data: () => colors[count % 4],
      size: 3
    },
    {
      name: 'aOffset',
      data: i => [i * ((1 - duration) / (multiplier - 1))],
      size: 1
    }
  ];

  // Every uniform must have:
  // - Key (used in the shader)
  // - Type (what kind of value)
  // - Value (based on the type)
  const uniforms = {
    uProgress: {
      type: 'float',
      value: 0.0
    }
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

  // Boolean to switch transition direction
  let forward = true;

  // Add an instance to the renderer
  const instance = phenomenon.add(count, {
    attributes,
    multiplier,
    vertex,
    fragment,
    uniforms,
    onRender: r => {
      const { uProgress } = r.uniforms;
      uProgress.value += forward ? step : -step;

      if (uProgress.value >= 1) {
        if (dynamicAttributes) {
          const b = {
            x: getRandom(1),
            y: getRandom(1),
            z: getRandom(1)
          };
          const e = {
            x: getRandom(1),
            y: getRandom(1),
            z: getRandom(1)
          };
          instance.prepareAttribute({
            name: 'aPositionEnd',
            data: () => [b.x + getRandom(0.1), b.y + getRandom(0.1), b.z + getRandom(0.1)],
            size: 3
          });
          instance.prepareAttribute({
            name: 'aPositionStart',
            data: () => [e.x + getRandom(0.1), e.y + getRandom(0.1), e.z + getRandom(0.1)],
            size: 3
          });
          uProgress.value = 0;
        } else {
          forward = false;
        }
      } else if (uProgress.value <= 0) forward = true;
    }
  });
}

for (let i = 0; i < 20; i += 1) {
  // Delay the creation of each instance
  setTimeout(() => {
    addInstance();
  }, 100 * i);
}
