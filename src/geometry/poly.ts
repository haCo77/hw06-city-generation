import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Poly extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  uvs: Float32Array;
  normals: Float32Array;
  centers: Float32Array;
  center: vec3;
  radius: number;
  n: number;
  height: number;

  constructor(center: vec3, radius: number, n: number, height: number) {
    super(); // Call the constructor of the super class. This is required.
    this.center = vec3.fromValues(center[0], center[1], center[2]);
    this.radius = radius;
    this.n = n;
    this.height = height;
  }

  create() {
    this.positions = new Float32Array(5 * this.n * 4);
    this.normals = new Float32Array(5 * this.n * 4);
    this.indices = new Uint32Array(9 * this.n - 3);
    this.uvs = new Float32Array(10 * this.n);
    this.centers = new Float32Array(10 * this.n);

    let rd = 2 * 3.1415926 / this.n;
    for(let i = 0; i < this.n; i++) {
      this.positions[16 * i] = this.center[0] + this.radius * Math.cos(rd * i);
      this.positions[16 * i + 1] = this.center[1] + this.radius * Math.sin(rd * i);
      this.positions[16 * i + 2] = this.center[2];
      this.positions[16 * i + 3] = 1;
      this.uvs[8 * i] = 0;
      this.uvs[8 * i + 1] = 0;

      this.positions[16 * i + 4] = this.center[0] + this.radius * Math.cos(rd * i);
      this.positions[16 * i + 5] = this.center[1] + this.radius * Math.sin(rd * i);
      this.positions[16 * i + 6] = this.center[2] - this.height;
      this.positions[16 * i + 7] = 1;
      this.uvs[8 * i + 2] = 0;
      this.uvs[8 * i + 3] = 1;

      this.positions[16 * i + 8] = this.center[0] + this.radius * Math.cos(rd * (i + 1));
      this.positions[16 * i + 9] = this.center[1] + this.radius * Math.sin(rd * (i + 1));
      this.positions[16 * i + 10] = this.center[2] - this.height;
      this.positions[16 * i + 11] = 1;
      this.uvs[8 * i + 4] = 1;
      this.uvs[8 * i + 5] = 1;

      this.positions[16 * i + 12] = this.center[0] + this.radius * Math.cos(rd * (i + 1));
      this.positions[16 * i + 13] = this.center[1] + this.radius * Math.sin(rd * (i + 1));
      this.positions[16 * i + 14] = this.center[2];
      this.positions[16 * i + 15] = 1;
      this.uvs[8 * i + 6] = 1;
      this.uvs[8 * i + 7] = 0;
      
      for(let j = 0; j < 4; j++) {
        this.normals[16 * i + 4 * j] = Math.cos(rd * (i + 0.5));
        this.normals[16 * i + 4 * j + 1] = Math.sin(rd * (i + 0.5));
        this.normals[16 * i + 4 * j + 2] = 0;
        this.normals[16 * i + 4 * j + 3] = 0;
      }
    }

    for(let i = 0; i < this.n; i++) {
      this.positions[16 * this.n + 4 * i] = this.center[0] + this.radius * Math.cos(rd * i);
      this.positions[16 * this.n + 4 * i + 1] = this.center[1] + this.radius * Math.sin(rd * i);
      this.positions[16 * this.n + 4 * i + 2] = this.center[2];
      this.positions[16 * this.n + 4 * i + 3] = 1;

      this.normals[16 * this.n + 4 * i] = 0;
      this.normals[16 * this.n + 4 * i + 1] = 0;
      this.normals[16 * this.n + 4 * i + 2] = 1;
      this.normals[16 * this.n + 4 * i + 3] = 0;

      this.uvs[8 * this.n + 2 * i] = Math.cos(rd * i) - 2;
      this.uvs[8 * this.n + 2 * i + 1] = Math.sin(rd * i) - 2;
    }

    for(let i = 0; i < this.n; i++) {
      this.indices[6 * i] = 4 * i;
      this.indices[6 * i + 1] = 4 * i + 1;
      this.indices[6 * i + 2] = 4 * i + 2;

      this.indices[6 * i + 3] = 4 * i;
      this.indices[6 * i + 4] = 4 * i + 2;
      this.indices[6 * i + 5] = 4 * i + 3;
    }

    for(let i = 1; i < this.n - 1; i++) {
      this.indices[6 * this.n + 3 * i] = 4 * this.n;
      this.indices[6 * this.n + 3 * i + 1] = 4 * this.n + i;
      this.indices[6 * this.n + 3 * i + 2] = 4 * this.n + i + 1;
    }

    for(let i = 0; i < 5 * this.n; i++) {
      this.centers[2 * i] = this.center[0];
      this.centers[2 * i + 1] = this.center[1];
    }


    this.generateIdx();
    this.generatePos();
    this.generateNor();
    this.generateUV();
    this.generateCenter();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufUV);
    gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCenter);
    gl.bufferData(gl.ARRAY_BUFFER, this.centers, gl.STATIC_DRAW);

    this.numInstances = 1;

    console.log(`Created poly`);
  }
};

export default Poly;
