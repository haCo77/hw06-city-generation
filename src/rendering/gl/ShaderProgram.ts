import {vec3, vec4, mat4, mat3} from 'gl-matrix';
import Drawable from './Drawable';
import {gl} from '../../globals';

var activeProgram: WebGLProgram = null;

export class Shader {
  shader: WebGLShader;

  constructor(type: number, source: string) {
    this.shader = gl.createShader(type);
    gl.shaderSource(this.shader, source);
    gl.compileShader(this.shader);

    if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(this.shader);
    }
  }
};

class ShaderProgram {
  prog: WebGLProgram;

  attrPos: number;
  attrNor: number;
  attrCol: number; // This time, it's an instanced rendering attribute, so each particle can have a unique color. Not per-vertex, but per-instance.
  attrTFC1: number; // Used in the vertex shader during instanced rendering to transform the vertex positions to the particle's drawn position.
  attrTFC2: number; // Used in the vertex shader during instanced rendering to transform the vertex positions to the particle's drawn position.
  attrTFC3: number; // Used in the vertex shader during instanced rendering to transform the vertex positions to the particle's drawn position.
  attrTFC4: number; // Used in the vertex shader during instanced rendering to transform the vertex positions to the particle's drawn position. 
  attrUV: number;
  attrCenter: number;

  unifModel: WebGLUniformLocation;
  unifModelInvTr: WebGLUniformLocation;
  unifViewProj: WebGLUniformLocation;
  unifCameraAxes: WebGLUniformLocation;
  unifTime: WebGLUniformLocation;
  unifRef: WebGLUniformLocation;
  unifEye: WebGLUniformLocation;
  unifUp: WebGLUniformLocation;
  unifDimensions: WebGLUniformLocation;
  unifSampler2D1: WebGLUniformLocation;
  unifSampler2D2: WebGLUniformLocation;
  unifMode: WebGLUniformLocation;
  unifWaterL: WebGLUniformLocation;

  constructor(shaders: Array<Shader>) {
    this.prog = gl.createProgram();

    for (let shader of shaders) {
      gl.attachShader(this.prog, shader.shader);
    }
    gl.linkProgram(this.prog);
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(this.prog);
    }

    this.attrPos = gl.getAttribLocation(this.prog, "vs_Pos");
    this.attrCol = gl.getAttribLocation(this.prog, "vs_Col");
    this.attrTFC1 = gl.getAttribLocation(this.prog, "vs_TransformC1");
    this.attrTFC2 = gl.getAttribLocation(this.prog, "vs_TransformC2");
    this.attrTFC3 = gl.getAttribLocation(this.prog, "vs_TransformC3");
    this.attrTFC4 = gl.getAttribLocation(this.prog, "vs_TransformC4");
    this.attrUV = gl.getAttribLocation(this.prog, "vs_UV");
    this.unifModel      = gl.getUniformLocation(this.prog, "u_Model");
    this.unifModelInvTr = gl.getUniformLocation(this.prog, "u_ModelInvTr");
    this.unifViewProj   = gl.getUniformLocation(this.prog, "u_ViewProj");
    this.unifCameraAxes      = gl.getUniformLocation(this.prog, "u_CameraAxes");
    this.unifTime      = gl.getUniformLocation(this.prog, "u_Time");
    this.unifEye   = gl.getUniformLocation(this.prog, "u_Eye");
    this.unifRef   = gl.getUniformLocation(this.prog, "u_Ref");
    this.unifUp   = gl.getUniformLocation(this.prog, "u_Up");
    this.attrNor = gl.getAttribLocation(this.prog, "vs_Nor");
    this.attrCenter = gl.getAttribLocation(this.prog, "vs_Center");
    this.unifSampler2D1  = gl.getUniformLocation(this.prog, "u_Texture1");
    this.unifSampler2D2  = gl.getUniformLocation(this.prog, "u_Texture2");
    this.unifMode = gl.getUniformLocation(this.prog, "u_Mode");
    this.unifDimensions = gl.getUniformLocation(this.prog, "u_Dimensions");
    this.unifWaterL = gl.getUniformLocation(this.prog, "u_waterL");
  }

  use() {
    if (activeProgram !== this.prog) {
      gl.useProgram(this.prog);
      activeProgram = this.prog;
    }
  }

  setEyeRefUp(eye: vec3, ref: vec3, up: vec3) {
    this.use();
    if(this.unifEye !== -1) {
      gl.uniform3f(this.unifEye, eye[0], eye[1], eye[2]);
    }
    if(this.unifRef !== -1) {
      gl.uniform3f(this.unifRef, ref[0], ref[1], ref[2]);
    }
    if(this.unifUp !== -1) {
      gl.uniform3f(this.unifUp, up[0], up[1], up[2]);
    }
  }

  setDimensions(width: number, height: number) {
    this.use();
    if(this.unifDimensions !== -1) {
      gl.uniform2f(this.unifDimensions, width, height);
    }
  }

  setModelMatrix(model: mat4) {
    this.use();
    if (this.unifModel !== -1) {
      gl.uniformMatrix4fv(this.unifModel, false, model);
    }

    if (this.unifModelInvTr !== -1) {
      let modelinvtr: mat4 = mat4.create();
      mat4.transpose(modelinvtr, model);
      mat4.invert(modelinvtr, modelinvtr);
      gl.uniformMatrix4fv(this.unifModelInvTr, false, modelinvtr);
    }
  }

  setViewProjMatrix(vp: mat4) {
    this.use();
    if (this.unifViewProj !== -1) {
      gl.uniformMatrix4fv(this.unifViewProj, false, vp);
    }
  }

  setCameraAxes(axes: mat3) {
    this.use();
    if (this.unifCameraAxes !== -1) {
      gl.uniformMatrix3fv(this.unifCameraAxes, false, axes);
    }
  }

  setTime(t: number) {
    this.use();
    if (this.unifTime !== -1) {
      gl.uniform1f(this.unifTime, t);
    }
  }

  setMode(m: number) {
    this.use();
    if (this.unifTime !== -1) {
      gl.uniform1f(this.unifMode, m);
    }
  }

  setWaterL(m: number) {
    this.use();
    if (this.unifWaterL !== -1) {
      gl.uniform1f(this.unifWaterL, m);
    }
  }

  draw(d: Drawable, textureSlot: number = 0) {
    if(d == undefined) 
      return;

    this.use();

    if(this.unifSampler2D1 != -1 && textureSlot >= 0)
    {
        gl.uniform1i(this.unifSampler2D1, /*GL_TEXTURE*/0);
    }

    if(this.unifSampler2D2 != -1 && textureSlot >= 0)
    {
        gl.uniform1i(this.unifSampler2D2, /*GL_TEXTURE*/1);
    }

    if (this.attrPos != -1 && d.bindPos()) {
      gl.enableVertexAttribArray(this.attrPos);
      gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(this.attrPos, 0); // Advance 1 index in pos VBO for each vertex
    }

    if (this.attrNor != -1 && d.bindNor()) {
      gl.enableVertexAttribArray(this.attrNor);
      gl.vertexAttribPointer(this.attrNor, 4, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(this.attrNor, 0); // Advance 1 index in nor VBO for each vertex
    }

    if (this.attrCenter != -1 && d.bindCenter()) {
      gl.enableVertexAttribArray(this.attrCenter);
      gl.vertexAttribPointer(this.attrCenter, 2, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(this.attrCenter, 0); // Advance 1 index in nor VBO for each vertex
    }

    if (this.attrCol != -1 && d.bindCol()) {
      gl.enableVertexAttribArray(this.attrCol);
      gl.vertexAttribPointer(this.attrCol, 4, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(this.attrCol, 1); // Advance 1 index in col VBO for each drawn instance
    }

    if (this.attrTFC1 != -1 && this.attrTFC2 != -1 && this.attrTFC3 != -1 && this.attrTFC4 != -1 && d.bindTF()) {
      gl.enableVertexAttribArray(this.attrTFC1);
      gl.vertexAttribPointer(this.attrTFC1, 4, gl.FLOAT, false, 16 * 4, 0);
      gl.vertexAttribDivisor(this.attrTFC1, 1); // Advance 1 index in translate VBO for each drawn instance

      gl.enableVertexAttribArray(this.attrTFC2);
      gl.vertexAttribPointer(this.attrTFC2, 4, gl.FLOAT, false, 16 * 4, 4 * 4);
      gl.vertexAttribDivisor(this.attrTFC2, 1); // Advance 1 index in translate VBO for each drawn instance

      gl.enableVertexAttribArray(this.attrTFC3);
      gl.vertexAttribPointer(this.attrTFC3, 4, gl.FLOAT, false, 16 * 4, 8 * 4);
      gl.vertexAttribDivisor(this.attrTFC3, 1); // Advance 1 index in translate VBO for each drawn instance

      gl.enableVertexAttribArray(this.attrTFC4);
      gl.vertexAttribPointer(this.attrTFC4, 4, gl.FLOAT, false, 16 * 4, 12 * 4);
      gl.vertexAttribDivisor(this.attrTFC4, 1); // Advance 1 index in translate VBO for each drawn instance
    }

    if (this.attrUV != -1 && d.bindUV()) {
      gl.enableVertexAttribArray(this.attrUV);
      gl.vertexAttribPointer(this.attrUV, 2, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(this.attrUV, 0); // Advance 1 index in pos VBO for each vertex
    }

    // TODO: Set up attribute data for additional instanced rendering data as needed

    d.bindIdx();
    // drawElementsInstanced uses the vertexAttribDivisor for each "in" variable to
    // determine how to link it to each drawn instance of the bound VBO.
    // For example, the index used to look in the VBO associated with
    // vs_Pos (attrPos) is advanced by 1 for each thread of the GPU running the
    // vertex shader since its divisor is 0.
    // On the other hand, the index used to look in the VBO associated with
    // vs_Translate (attrTranslate) is advanced by 1 only when the next instance
    // of our drawn object (in the base code example, the square) is processed
    // by the GPU, thus being the same value for the first set of four vertices,
    // then advancing to a new value for the next four, then the next four, and
    // so on.
    gl.drawElementsInstanced(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0, d.numInstances);

    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
    if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
    if (this.attrCenter != -1) gl.disableVertexAttribArray(this.attrCenter);
    if (this.attrCol != -1) gl.disableVertexAttribArray(this.attrCol);
    if (this.attrTFC1 != -1) gl.disableVertexAttribArray(this.attrTFC1);
    if (this.attrTFC2 != -1) gl.disableVertexAttribArray(this.attrTFC2);
    if (this.attrTFC3 != -1) gl.disableVertexAttribArray(this.attrTFC3);
    if (this.attrTFC4 != -1) gl.disableVertexAttribArray(this.attrTFC4);
    if (this.attrUV != -1) gl.disableVertexAttribArray(this.attrUV);
  }
};

export default ShaderProgram;
