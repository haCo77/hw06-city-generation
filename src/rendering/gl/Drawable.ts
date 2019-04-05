import {gl} from '../../globals';

abstract class Drawable {
  count: number = 0;

  bufIdx: WebGLBuffer;
  bufPos: WebGLBuffer;
  bufNor: WebGLBuffer;
  bufCenter: WebGLBuffer;
  bufTF: WebGLBuffer;
  bufCol: WebGLBuffer;
  bufUV: WebGLBuffer;

  idxGenerated: boolean = false;
  posGenerated: boolean = false;
  norGenerated: boolean = false;
  centerGenerated: boolean = false;
  colGenerated: boolean = false;
  TFGenerated: boolean = false;
  uvGenerated: boolean = false;

  numInstances: number = 0; // How many instances of this Drawable the shader program should draw

  abstract create() : void;

  destory() {
    if(this.idxGenerated)
      gl.deleteBuffer(this.bufIdx);
    if(this.posGenerated)
      gl.deleteBuffer(this.bufPos);
    if(this.norGenerated)
      gl.deleteBuffer(this.bufNor);
    if(this.centerGenerated)
      gl.deleteBuffer(this.bufCenter);
    if(this.colGenerated)  
      gl.deleteBuffer(this.bufCol);
    if(this.TFGenerated)
      gl.deleteBuffer(this.bufTF);
    if(this.uvGenerated)
      gl.deleteBuffer(this.bufUV);
  }

  destoryTF() {
    if(this.TFGenerated)
      gl.deleteBuffer(this.bufTF);
  }

  generateIdx() {
    this.idxGenerated = true;
    this.bufIdx = gl.createBuffer();
  }

  generatePos() {
    this.posGenerated = true;
    this.bufPos = gl.createBuffer();
  }

  generateNor() {
    this.norGenerated = true;
    this.bufNor = gl.createBuffer();
  }

  generateCenter() {
    this.centerGenerated = true;
    this.bufCenter = gl.createBuffer();
  }

  generateCol() {
    this.colGenerated = true;
    this.bufCol = gl.createBuffer();
  }

  generateTF() {
    this.TFGenerated = true;
    this.bufTF = gl.createBuffer();
  }

  generateUV() {
    this.uvGenerated = true;
    this.bufUV = gl.createBuffer();
  }

  bindIdx(): boolean {
    if (this.idxGenerated) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    }
    return this.idxGenerated;
  }

  bindPos(): boolean {
    if (this.posGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    }
    return this.posGenerated;
  }

  bindNor(): boolean {
    if (this.norGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    }
    return this.norGenerated;
  }

  bindCenter(): boolean {
    if (this.centerGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCenter);
    }
    return this.centerGenerated;
  }

  bindCol(): boolean {
    if (this.colGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
    }
    return this.colGenerated;
  }

  bindTF(): boolean {
    if (this.TFGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTF);
    }
    return this.TFGenerated;
  }

  bindUV(): boolean {
    if (this.uvGenerated) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bufUV);
    }
    return this.uvGenerated;
  }

  elemCount(): number {
    return this.count;
  }

  drawMode(): GLenum {
    return gl.TRIANGLES;
  }

  setNumInstances(num: number) {
    this.numInstances = num;
  }
};

export default Drawable;
