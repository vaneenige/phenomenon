interface AttributeProps {
  name: string;
  size: number;
  data?: any;
}

interface UniformProps {
  type: string;
  value: Array<number>;
  location?: WebGLUniformLocation;
}

interface GeometryProps {
  vertices?: Array<Array<object>>;
  normal?: Array<Array<object>>;
}

interface BufferProps {
  location: number;
  buffer: WebGLBuffer;
  size: number;
}

interface InstanceProps {
  attributes?: Array<AttributeProps>;
  vertex?: string;
  fragment?: string;
  geometry?: GeometryProps;
  mode?: number;
  modifiers?: object;
  multiplier?: number;
  uniforms: {
    [key: string]: UniformProps;
  };
}

interface RendererProps {
  canvas?: HTMLCanvasElement;
  context?: object;
  contextType?: string;
  settings?: object;
}

const positionMap = ['x', 'y', 'z'];

/**
 * Class representing an instance.
 */
class Instance {
  public gl: WebGLRenderingContext;
  public vertex: string;
  public fragment: string;
  public program: WebGLProgram;
  public uniforms: {
    [key: string]: UniformProps;
  };
  public geometry: GeometryProps;
  public attributes: Array<AttributeProps>;
  public attributeKeys: Array<string>;
  public multiplier: number;
  public modifiers: Array<Function>;
  public buffers: Array<BufferProps>;
  public uniformMap: object;
  public mode: number;
  public onRender?: Function;

  /**
   * Create an instance.
   */
  constructor(props: InstanceProps) {
    // Assign default parameters
    Object.assign(this, {
      uniforms: {},
      geometry: { vertices: [{ x: 0, y: 0, z: 0 }] },
      mode: 0,
      modifiers: {},
      attributes: [],
      multiplier: 1,
      buffers: [],
    });

    // Assign optional parameters
    Object.assign(this, props);

    // Prepare all required pieces
    this.prepareProgram();
    this.prepareUniforms();
    this.prepareAttributes();
  }

  /**
   * Compile a shader.
   */
  compileShader(type: number, source: string) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    return shader;
  }

  /**
   * Create a program.
   */
  prepareProgram() {
    const { gl, vertex, fragment } = this;

    // Create a new shader program
    const program = gl.createProgram();

    // Attach the vertex shader
    gl.attachShader(program, this.compileShader(35633, vertex));

    // Attach the fragment shader
    gl.attachShader(program, this.compileShader(35632, fragment));

    // Link the program
    gl.linkProgram(program);

    // Use the program
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
    if (typeof this.geometry.vertices !== 'undefined') {
      this.attributes.push({
        name: 'aPosition',
        size: 3,
      });
    }
    if (typeof this.geometry.normal !== 'undefined') {
      this.attributes.push({
        name: 'aNormal',
        size: 3,
      });
    }
    this.attributeKeys = [];
    // Convert all attributes to be useable in the shader
    for (let i = 0; i < this.attributes.length; i += 1) {
      this.attributeKeys.push(this.attributes[i].name);
      this.prepareAttribute(this.attributes[i]);
    }
  }

  /**
   * Prepare a single attribute.
   */
  prepareAttribute(attribute: AttributeProps) {
    const { geometry, multiplier } = this;
    const { vertices, normal } = geometry;
    // Create an array for the attribute to store data
    const attributeBufferData = new Float32Array(multiplier * vertices.length * attribute.size);
    // Repeat the process for the provided multiplier
    for (let j = 0; j < multiplier; j += 1) {
      // Set data used as default or the attribute modifier
      const data = attribute.data && attribute.data(j, multiplier);
      // Calculate the offset for the right place in the array
      let offset = j * vertices.length * attribute.size;
      // Loop over vertices length
      for (let k = 0; k < vertices.length; k += 1) {
        // Loop over attribute size
        for (let l = 0; l < attribute.size; l += 1) {
          // Check if a modifier is provided
          const modifier = this.modifiers[attribute.name];
          if (typeof modifier !== 'undefined') {
            // Handle attribute modifier
            attributeBufferData[offset] = modifier(data, k, l, this);
          } else if (attribute.name === 'aPosition') {
            // Handle position values
            attributeBufferData[offset] = vertices[k][positionMap[l]];
          } else if (attribute.name === 'aNormal') {
            // Handle normal values
            attributeBufferData[offset] = normal[k][positionMap[l]];
          } else {
            // Handle other attributes
            attributeBufferData[offset] = data[l];
          }
          offset += 1;
        }
      }
    }
    this.attributes[this.attributeKeys.indexOf(attribute.name)].data = attributeBufferData;
    this.prepareBuffer(this.attributes[this.attributeKeys.indexOf(attribute.name)]);
  }

  /**
   * Create a buffer with an attribute.
   */
  prepareBuffer(attribute: AttributeProps) {
    const { data, name, size } = attribute;

    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(34962, buffer);
    this.gl.bufferData(34962, data, 35044);

    const location = this.gl.getAttribLocation(this.program, name);
    this.gl.enableVertexAttribArray(location);
    this.gl.vertexAttribPointer(location, size, 5126, false, 0, 0);

    this.buffers[this.attributeKeys.indexOf(attribute.name)] = { buffer, location, size };
  }

  /**
   * Render the instance.
   */
  render(renderUniforms: object) {
    const { uniforms, multiplier, gl } = this;

    // Use the program of the instance
    gl.useProgram(this.program);

    // Bind the buffers for the instance
    for (let i = 0; i < this.buffers.length; i += 1) {
      const { location, buffer, size } = this.buffers[i];
      gl.enableVertexAttribArray(location);
      gl.bindBuffer(34962, buffer);
      gl.vertexAttribPointer(location, size, 5126, false, 0, 0);
    }

    // Update the shared uniforms from the renderer
    Object.keys(renderUniforms).forEach(key => {
      uniforms[key].value = renderUniforms[key].value;
    });

    // Map the uniforms to the context
    Object.keys(uniforms).forEach(key => {
      const { type, location, value } = uniforms[key];
      this.uniformMap[type](location, value);
    });

    // Draw the magic to the screen
    gl.drawArrays(this.mode, 0, multiplier * this.geometry.vertices.length);

    // Hook for uniform updates
    if (this.onRender) this.onRender(this);
  }

  /**
   * Destroy the instance.
   */
  destroy() {
    for (let i = 0; i < this.buffers.length; i += 1) {
      this.gl.deleteBuffer(this.buffers[i].buffer);
    }
    this.gl.deleteProgram(this.program);
    this.gl = null;
  }
}

/**
 * Class representing a Renderer.
 */
class Renderer {
  public clearColor: Array<GLclampf>;
  public onRender: Function;
  public onSetup: Function;
  public uniformMap: object;
  public gl: WebGLRenderingContext;
  public canvas: HTMLCanvasElement;
  public devicePixelRatio: number;
  public clip: Array<number>;
  public instances: Map<string, Instance>;
  public position: {
    x: number;
    y: number;
    z: number;
  };
  public uniforms: {
    [key: string]: UniformProps;
  };
  public shouldRender: boolean;

  /**
   * Create a renderer.
   */
  constructor(props: RendererProps) {
    const {
      canvas = document.querySelector('canvas'),
      context = {},
      contextType = 'experimental-webgl',
      settings = {},
    } = props || {};

    // Get context with optional parameters
    const gl = <WebGLRenderingContext>canvas.getContext(
      contextType,
      Object.assign(
        {
          alpha: false,
          antialias: false,
        },
        context
      )
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
      clip: [0.001, 100]
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

    // Enable depth
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Set clear values
    if (gl.getContextAttributes().alpha === false) {
      // @ts-ignore
      gl.clearColor(...this.clearColor);
      gl.clearDepth(1.0);
    }

    // Hook for gl context changes before first render
    if (this.onSetup) this.onSetup(gl);

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
    const { gl, canvas, devicePixelRatio, position } = this;

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
      0, 0, -(this.clip[1] + this.clip[0]) / (this.clip[1] - this.clip[0]), -1, 0, 0,
      -2 * this.clip[1] * (this.clip[0] / (this.clip[1] - this.clip[0])), 0,
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
   */
  toggle(shouldRender: boolean) {
    if (shouldRender === this.shouldRender) return;
    this.shouldRender = typeof shouldRender !== 'undefined' ? shouldRender : !this.shouldRender;
    if (this.shouldRender) this.render();
  }

  /**
   * Render the total scene.
   */
  render() {
    this.gl.clear(16640);

    this.instances.forEach(instance => {
      instance.render(this.uniforms);
    });

    if (this.onRender) this.onRender(this);

    if (this.shouldRender) requestAnimationFrame(() => this.render());
  }

  /**
   * Add an instance to the renderer.
   */
  add(key: string, settings: InstanceProps) {
    if (typeof settings === 'undefined') {
      settings = { uniforms: {} };
    }

    if (typeof settings.uniforms === 'undefined') {
      settings.uniforms = {};
    }

    Object.assign(settings.uniforms, JSON.parse(JSON.stringify(this.uniforms)));

    Object.assign(settings, {
      gl: this.gl,
      uniformMap: this.uniformMap,
    });

    const instance = new Instance(settings);
    this.instances.set(key, instance);

    return instance;
  }

  /**
   * Remove an instance from the renderer.
   */
  remove(key: string) {
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
    this.toggle(false);
  }
}

export default Renderer;
