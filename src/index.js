/**
 * Class representing an instance.
 */
class Instance {
  /**
   * Create an instance.
   * @param {object} settings
   */
  constructor(settings) {
    // Assign default parameters
    Object.assign(this, {
      uniforms: {},
      geometry: { vertices: [{ x: 0, y: 0, z: 0 }] },
      mode: 0,
      modifiers: {},
    });

    // Assign optional parameters
    Object.assign(this, settings);

    // Prepare all required pieces
    this.prepareProgram();
    this.prepareUniforms();
    this.prepareAttributes();
    this.prepareBuffers();
  }

  /**
   * Compile a shader.
   * @param {*} type
   * @param {*} source
   */
  compileShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    return shader;
  }

  /**
   * Create a program.
   */
  prepareProgram() {
    const {
      gl, vertex, fragment,
    } = this;

    const program = gl.createProgram();

    gl.attachShader(program, this.compileShader(35633, vertex, gl));

    gl.attachShader(program, this.compileShader(35632, fragment, gl));

    gl.linkProgram(program);

    gl.useProgram(program);

    // Assign it to the instance
    this.program = program;
  }

  /**
   * Create uniforms.
   */
  prepareUniforms() {
    const keys = Object.keys(this.uniforms);
    for (let i = 0; i < keys.length; i += 1) {
      const location = this.gl.getUniformLocation(this.program, keys[i]);
      this.uniforms[keys[i]].location = location;
    }
  }

  /**
   * Create buffer attributes.
   */
  prepareAttributes() {
    const { geometry, attributes, multiplier } = this;
    const { vertices, normal } = geometry;
    const positionMap = ['x', 'y', 'z'];
    if (typeof vertices !== 'undefined') {
      this.attributes.push({
        name: 'aPosition',
        size: 3,
      });
    }

    if (typeof normal !== 'undefined') {
      this.attributes.push({
        name: 'aNormal',
        size: 3,
      });
    }
    for (let i = 0; i < attributes.length; i += 1) {
      const attribute = attributes[i];
      const attributeBufferData = new Float32Array(multiplier * vertices.length * attribute.size);
      for (let j = 0; j < multiplier; j += 1) {
        const data = attribute.data && attribute.data(j, multiplier);
        let offset = j * vertices.length * attribute.size;
        for (let k = 0; k < vertices.length; k += 1) {
          for (let l = 0; l < attribute.size; l += 1) {
            offset += 1;
            const modifier = this.modifiers[attribute.name];
            if (typeof modifier !== 'undefined') {
              attributeBufferData[offset - 1] = modifier(data, k, l, this);
            } else if (attribute.name === 'aPosition') {
              attributeBufferData[offset - 1] = vertices[k][positionMap[l]];
            } else if (attribute.name === 'aNormal') {
              attributeBufferData[offset - 1] = normal[k][positionMap[l]];
            } else {
              attributeBufferData[offset - 1] = data[l];
            }
          }
        }
      }
      this.attributes[i].data = attributeBufferData;
    }
  }

  /**
   * Create a render buffer.
   */
  prepareBuffers() {
    this.buffers = [];

    for (let i = 0; i < this.attributes.length; i += 1) {
      const { data, name, size } = this.attributes[i];

      const buffer = this.gl.createBuffer();
      this.gl.bindBuffer(34962, buffer);
      this.gl.bufferData(34962, data, 35044);

      const location = this.gl.getAttribLocation(this.program, name);
      this.gl.enableVertexAttribArray(location);
      this.gl.vertexAttribPointer(location, size, 5126, false, false, 0);

      this.buffers.push({ buffer, location, size });
    }
  }

  /**
   * Render the instance.
   * @param {*} renderUniforms
   */
  render(renderUniforms) {
    const { uniforms, multiplier, gl } = this;

    gl.useProgram(this.program);

    if (this.willRender) this.willRender(this);

    // Bind the buffers for the instance
    for (let i = 0; i < this.buffers.length; i += 1) {
      const { location, buffer, size } = this.buffers[i];
      gl.enableVertexAttribArray(location);
      gl.bindBuffer(34962, buffer);
      gl.vertexAttribPointer(location, size, 5126, false, false, 0);
    }

    // Update the shared uniforms from the renderer
    Object.keys(renderUniforms).forEach((key) => {
      uniforms[key].value = renderUniforms[key].value;
    });

    // Map the uniforms to the context
    Object.keys(uniforms).forEach((key) => {
      const { type, location, value } = uniforms[key];
      this.uniformMap[type](location, value);
    });

    // Draw the magic to the screen
    gl.drawArrays(this.mode, 0, multiplier * this.geometry.vertices.length);

    // Execute the optional `will render` hook
    if (this.didRender) this.didRender(this);
  }

  /**
   * Destroy the instance.
   */
  destroy() {
    for (let i = 0; i < this.buffers.length; i += 1) {
      this.gl.deleteBuffer(this.buffers.buffer);
    }
    this.gl.deleteProgram(this.program);
    this.gl = null;
  }
}

/**
 * Class representing a Renderer.
 */
class Renderer {
  /**
   * Create a renderer.
   * @param {HTMLElement} canvas - The element on which the scene will be rendered.
   * @param {object} [context={}] - Options used when getting the context.
   * @param {object} [settings={}] - Options used when creating the renderer.
   */
  constructor({ canvas = document.querySelector('canvas'), context = {}, settings = {} }) {
    // Get context with optional parameters
    const gl = canvas.getContext(
      'webgl',
      Object.assign(
        {
          alpha: false,
          antialias: false,
        },
        context,
      ),
    );

    // Assign program parameters
    Object.assign(this, {
      gl,
      canvas,
      uniforms: {},
      instances: new Map(),
      shouldRender: true,
    });

    // Assign default parameters
    Object.assign(this, {
      devicePixelRatio: 1,
      clearColor: [1, 1, 1, 1],
      position: { x: 0, y: 0, z: 2 },
    });

    // Assign optional parameters
    Object.assign(this, settings);

    // Create uniform mapping object
    this.uniformMap = {
      float: (loc, val) => gl.uniform1f(loc, val),
      vec2: (loc, val) => gl.uniform2fv(loc, val),
      vec3: (loc, val) => gl.uniform3fv(loc, val),
      vec4: (loc, val) => gl.uniform4fv(loc, val),
      mat2: (loc, val) => gl.uniformMatrix2fv(loc, false, val),
      mat3: (loc, val) => gl.uniformMatrix3fv(loc, false, val),
      mat4: (loc, val) => gl.uniformMatrix4fv(loc, false, val),
    };

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Set clear values
    if (gl.getContextAttributes().alpha === false) {
      gl.clearColor(...this.clearColor);
      gl.clearDepth(1.0);
    }

    // Handle resize events
    window.addEventListener('resize', () => this.resize());

    // Start the renderer
    this.resize();
    this.render();
  }

  /**
   * Handle resize events.
   */
  resize() {
    const {
      gl, canvas, devicePixelRatio, position,
    } = this;

    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    const bufferWidth = gl.drawingBufferWidth;
    const bufferHeight = gl.drawingBufferHeight;
    const ratio = bufferWidth / bufferHeight;

    gl.viewport(0, 0, bufferWidth, bufferHeight);

    const angle = Math.tan(45 * 0.5 * (Math.PI / 180));

    // prettier-ignore
    const projectionMatrix = [
      0.5 / angle, 0, 0, 0,
      0, 0.5 * (ratio / angle), 0, 0,
      0, 0, -(100 + 0.001) / (100 - 0.001), -1, 0, 0,
      -2 * 100 * (0.001 / (100 - 0.001)), 0,
    ];

    // prettier-ignore
    const viewMatrix = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];

    // prettier-ignore
    const modelMatrix = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      position.x, position.y, (ratio < 1 ? 1 : ratio) * -position.z, 1,
    ];

    this.uniforms.uProjectionMatrix = {
      type: 'mat4',
      value: projectionMatrix,
    };

    this.uniforms.uViewMatrix = {
      type: 'mat4',
      value: viewMatrix,
    };

    this.uniforms.uModelMatrix = {
      type: 'mat4',
      value: modelMatrix,
    };
  }

  /**
   * Toggle the active state of the renderer.
   * @param {bool} shouldRender
   */
  toggle(shouldRender) {
    if (shouldRender === this.shouldRender) return;
    this.shouldRender = typeof shouldRender !== 'undefined' ? shouldRender : !this.shouldRender;
    if (this.shouldRender) this.render();
  }

  /**
   * Render the total scene.
   */
  render() {
    this.gl.clear(16640);

    if (this.willRender) this.willRender(this);

    this.instances.forEach((instance) => {
      instance.render(this.uniforms);
    });

    if (this.didRender) this.didRender(this);

    if (this.shouldRender) requestAnimationFrame(() => this.render());
  }

  /**
   * Add an instance to the renderer.
   * @param {string} key
   * @param {object} instanceParams
   */
  add(key, settings) {
    const instanceSettings = settings;

    instanceSettings.uniforms = Object.assign(
      settings.uniforms || {},
      JSON.parse(JSON.stringify(this.uniforms)),
    );

    Object.assign(settings, {
      gl: this.gl,
      uniformMap: this.uniformMap,
    });

    const instance = new Instance(settings);
    this.instances.set(key, instance);
  }

  /**
   * Remove an instance from the renderer.
   * @param {string} key
   */
  remove(key) {
    const instance = this.instances.get(key);
    if (typeof instance === 'undefined') return;
    instance.destroy();
    this.instances.delete(key);
  }

  /**
   * Destroy the renderer and its instances.
   */
  destroy() {
    this.instances.forEach((instance, key) => {
      instance.destroy();
      this.instances.delete(key);
    });
  }
}

export default Renderer;
