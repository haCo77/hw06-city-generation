import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Square extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  colors: Float32Array;
  tfs: Float32Array;

  constructor() {
    super(); // Call the constructor of the super class. This is required.
  }

  create() {

  this.indices = new Uint32Array([0, 1, 2,
                                  0, 2, 3]);
  this.positions = new Float32Array([-0.5, -0.5, 0, 1,
                                     0.5, -0.5, 0, 1,
                                     0.5, 0.5, 0, 1,
                                     -0.5, 0.5, 0, 1]);

    this.generateIdx();
    this.generatePos();
    this.generateCol();
    // this.generateTranslate();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    console.log(`Created square`);
  }

  setInstanceTFs(tfs: Float32Array) {
    this.tfs = tfs;
    this.generateTF();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTF);
    gl.bufferData(gl.ARRAY_BUFFER, this.tfs, gl.STATIC_DRAW);
  }
};

export default Square;
