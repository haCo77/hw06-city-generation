import {vec3, vec4, mat4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';
import * as Loader from 'webgl-obj-loader';

class Mesh extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  tfs: Float32Array;
  uvs: Float32Array;
  center: vec4;

  objString: string;

  constructor(objString: string, center: vec3) {
    super(); // Call the constructor of the super class. This is required.
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);

    this.objString = objString;
  }

  create() {  
    let posTemp: Array<number> = [];
    let norTemp: Array<number> = [];
    let uvsTemp: Array<number> = [];
    let idxTemp: Array<number> = [];

    var loadedMesh = new Loader.Mesh(this.objString);

    //posTemp = loadedMesh.vertices;
    for (var i = 0; i < loadedMesh.vertices.length; i += 3) {
      let p = loadedMesh.vertices[i + 1];
      let noise = (loadedMesh.vertices[i] * 1103515245 + loadedMesh.vertices[i + 2] * 1349991317) % 0x80000000;
      noise /= (0x80000000 - 1);
      if(loadedMesh.vertices.length > 1000) {
        posTemp.push(loadedMesh.vertices[i] / 20);
        posTemp.push(p / 32);
        posTemp.push(loadedMesh.vertices[i + 2] / 20);
        posTemp.push(1.0);
      } else {
        posTemp.push(loadedMesh.vertices[i] / (p / 5.5 + 1.5 + noise));
        posTemp.push(p / 2.5);
        posTemp.push(loadedMesh.vertices[i + 2] / (p / 5.5 + 1.5 + noise));
        posTemp.push(1.0);
      }
    }

    for (var i = 0; i < loadedMesh.vertexNormals.length; i++) {
      norTemp.push(loadedMesh.vertexNormals[i]);
      if (i % 3 == 2) norTemp.push(0.0);
    }

    uvsTemp = loadedMesh.textures;
    idxTemp = loadedMesh.indices;

    // white vert color for now
    this.colors = new Float32Array(posTemp.length);
    for (var i = 0; i < posTemp.length; ++i){
      this.colors[i] = 1.0;
    }

    this.indices = new Uint32Array(idxTemp);
    this.normals = new Float32Array(norTemp);
    this.positions = new Float32Array(posTemp);
    this.uvs = new Float32Array(uvsTemp);

    this.generateIdx();
    this.generatePos();
    this.generateNor();
    this.generateUV();
    // this.generateCol();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    // gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
    // gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufUV);
    gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW);

    console.log(`Created Mesh from OBJ`);
    this.objString = ""; // hacky clear
  }

  setInstanceTFs(tfs: Float32Array) {
    this.tfs = tfs;
    this.generateTF();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTF);
    gl.bufferData(gl.ARRAY_BUFFER, this.tfs, gl.STATIC_DRAW);
  }
};

export default Mesh;
