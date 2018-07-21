/* global expect */

import Phenomenon from '../src/index';

let phenomenon;

describe('phenomenon', () => {
  beforeEach(() => {
    const canvas = document.querySelector('canvas');
    if (canvas !== null) canvas.outerHTML = '';
    document.body.appendChild(document.createElement('canvas'));
    if (typeof phenomenon !== 'undefined') phenomenon.destroy();
    phenomenon = new Phenomenon();
  });

  describe('renderer', () => {
    describe('constructor()', () => {
      it('should have a valid WebGL context after creation', () => {
        expect(phenomenon.gl.constructor.name).toBe('WebGLRenderingContext');
      });

      it('should override default values based on parameters', () => {
        phenomenon = new Phenomenon({
          context: { alpha: false },
          settings: { devicePixelRatio: 2 },
        });
        expect(phenomenon.gl.getContextAttributes().alpha).toBe(false);
        expect(phenomenon.devicePixelRatio).toBe(2);
      });
    });

    describe('resize()', () => {
      it('should adjust the width and height of the canvas', () => {
        phenomenon = new Phenomenon({
          settings: { devicePixelRatio: 2 },
        });
        expect(phenomenon.canvas.width).toBe(600);
        expect(phenomenon.canvas.height).toBe(300);
      });

      it('should have projection, view and model uniforms', () => {
        const { uProjectionMatrix, uViewMatrix, uModelMatrix } = phenomenon.uniforms;
        expect(uProjectionMatrix).toBeDefined();
        expect(uViewMatrix).toBeDefined();
        expect(uModelMatrix).toBeDefined();
      });
    });

    describe('toggle()', () => {
      it('should update its state if its provided as a parameter', () => {
        phenomenon.toggle(false);
        expect(phenomenon.shouldRender).toBe(false);
      });

      it('should toggle the shouldRender boolean without parameters', () => {
        phenomenon.toggle();
        expect(phenomenon.shouldRender).toBe(false);
        phenomenon.toggle();
        expect(phenomenon.shouldRender).toBe(true);
      });
    });

    describe('render()', () => {
      it('should call the render hooks if provided', (done) => {
        phenomenon = new Phenomenon({
          settings: {
            onRender: () => {
              done();
            },
          },
        });
      });
    });

    describe('add()', () => {
      it('should add a new instance by its key', (done) => {
        phenomenon.add('instance');
        expect(phenomenon.instances.size).toBe(1);
        expect(phenomenon.instances.get('instance')).toBeDefined();
        done();
      });

      it('should create a deep clone of renderer uniforms', () => {
        const instance = phenomenon.add('instance');
        expect(instance.uniforms.uModelMatrix === phenomenon.uniforms.uModelMatrix).toBe(false);
      });

      it('should return the instance after creation', () => {
        const instance = phenomenon.add('instance');
        expect(instance.constructor.name).toBe('Instance');
      });
    });

    describe('remove()', () => {
      it('should remove an instance by its key', (done) => {
        phenomenon.add('instance');
        phenomenon.remove('instance');
        expect(phenomenon.instances.size).toBe(0);
        done();
      });
    });

    describe('destroy()', () => {
      it('should remove all instances', () => {
        phenomenon.add('instance');
        phenomenon.destroy();
        expect(phenomenon.instances.size).toBe(0);
        expect(phenomenon.shouldRender).toBe(false);
      });

      it('should stop requesting animation frames', () => {
        phenomenon.destroy();
        expect(phenomenon.shouldRender).toBe(false);
      });
    });
  });

  describe('instance', () => {
    const vertex = `
      void main(){
        gl_Position = vec4(0.0, 0.0, 0.0, 0.0);
      }
    `;
    const fragment = `
      void main(){
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
      }
    `;

    describe('constructor()', () => {
      it('should override default values based on parameters', () => {
        const settings = { multiplier: 1000 };
        const instance = phenomenon.add('instance', settings);
        expect(instance.multiplier).toBe(1000);
      });
    });

    describe('compileShader()', () => {
      it('should compile vertex and fragment shaders', () => {
        const instance = phenomenon.add('instance');
        const vertexShader = instance.compileShader(35633, vertex);
        const fragmentShader = instance.compileShader(35632, fragment);
        expect(instance.gl.isShader(vertexShader)).toBe(true);
        expect(instance.gl.isShader(fragmentShader)).toBe(true);
      });
    });

    describe('prepareProgram()', () => {
      it('should create a valid shader program', () => {
        const instance = phenomenon.add('instance', { vertex, fragment });
        const { gl, program } = instance;
        expect(gl.getProgramParameter(program, gl.LINK_STATUS)).toBe(true);
      });
    });
  });
});
