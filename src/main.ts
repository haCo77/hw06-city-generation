import {vec2, vec3, vec4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import ScreenQuad from './geometry/ScreenQuad';
import Plane from './geometry/Plane';
import Poly from './geometry/poly'
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

import {loadTexture} from './Texture';
import TerrainMap from './terrainMap';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  Map: 'Terrain Elevation',
  'Water Level': 0.15,
  'Roads Density': 0.8,
  'Block Size': 1.7,
  'Grid(n by n)' : 100,
};

let tm: TerrainMap;
let screenQuad: ScreenQuad;
let square: Square;
let buildings: Poly[] = [];
let plane : Plane;
let time: number = 0.0;

let preMap: String = 'Terrain Elevation';
let minl = 1.2;
let maxl = 5.0;
let cellW = 0.3 / 0.022;
let cellH = 0.2 / 0.022;
var roads:vec4[] = [];
let types:number[] = [];
let tfArray: number[] = [];
let tstack: vec2[] = [];
let recordMap: boolean[] = [];
let reliveRate = 0.8;
let preWaterLevel = 0.15;
let gridN = 100;

function buildTransMat(p0: vec2, p1: vec2, tfArray: number[], type: number) {
  let center = vec2.create();
  let dir = vec2.create();
  let len = vec2.dist(p0, p1) * 0.022;

  if(type == 0) {
    if(len > minl && len < maxl) {
      vec2.add(center, p0, p1);
      vec2.scale(center, center, 0.5);
      vec2.sub(dir, p0, p1);
      vec2.normalize(dir, dir);
      tfArray.push(len * dir[0]);
      tfArray.push(len * dir[1]);
      tfArray.push(0.0);
      tfArray.push(0.0);
      tfArray.push(-0.06 * dir[1]);
      tfArray.push(0.06 * dir[0]);
      tfArray.push(0.0);
      tfArray.push(0.0);
      tfArray.push(0.0);
      tfArray.push(0.0);
      tfArray.push(1.0);
      tfArray.push(0.0);
      tfArray.push((center[0] / 256.0 - 1.0) * 5.5);
      tfArray.push((center[1] / 256.0 - 1.0) * 5.5);
      tfArray.push(0.0);
      tfArray.push(1.0);
    }
  } else {
    vec2.add(center, p0, p1);
    vec2.scale(center, center, 0.5);
    vec2.sub(dir, p0, p1);
    vec2.normalize(dir, dir);
    tfArray.push(len * dir[0]);
    tfArray.push(len * dir[1]);
    tfArray.push(0.0);
    tfArray.push(0.0);
    tfArray.push(-0.02 * dir[1]);
    tfArray.push(0.02 * dir[0]);
    tfArray.push(0.0);
    tfArray.push(0.0);
    tfArray.push(0.0);
    tfArray.push(0.0);
    tfArray.push(1.0);
    tfArray.push(0.0);
    tfArray.push((center[0] / 256.0 - 1.0) * 5.5);
    tfArray.push((center[1] / 256.0 - 1.0) * 5.5);
    tfArray.push(0.0);
    tfArray.push(1.0);
  }
}

function findNearest(pos: vec2, ignoreType: number): vec3 {
  let tmin = 100.0;
  let pmin = vec2.create();
  let flag = true;
  if(ignoreType == 4) {
    flag = false;
  }
  for(let i = 0; i < roads.length; i++) {
    if(ignoreType == types[i]) {
      continue;
    }
    if((roads[i][0] - pos[0]) * (roads[i][0] - pos[0]) + (roads[i][1] - pos[1]) * (roads[i][1] - pos[1]) > 9.0 * cellW * cellW) {
      if(types[i] == 1) {
        continue;
      }
    }
    if(types[i] == 1 && flag) {
      flag = false;
      if(tmin <= cellW / 2.0) {
        break;
      }
    }
    if(roads[i][0] != roads[i][2]) {
      let k = (roads[i][3] - roads[i][1]) / (roads[i][2] - roads[i][0]);
      let b = roads[i][3] - k * roads[i][2];
      let s = 1 / Math.sqrt(1 + k * k);
      let c = -k * s;
      let t = (b + k * pos[0] - pos[1]) * s;
      let p = vec2.create();
      vec2.add(p, pos, vec2.fromValues(c * t, s * t));
      if((p[0] <= roads[i][0] && p[0] >= roads[i][2]) || (p[0] >= roads[i][0] && p[0] <= roads[i][2])) {
        if(tmin > Math.abs(t)) {
          tmin = Math.abs(t);
          pmin = p;
        }
      } else {
        let dis1 = Math.sqrt((pos[0] - roads[i][0]) * (pos[0] - roads[i][0]) + (pos[1] - roads[i][1]) * (pos[1] - roads[i][1]));
        let dis2 = Math.sqrt((pos[0] - roads[i][2]) * (pos[0] - roads[i][2]) + (pos[1] - roads[i][3]) * (pos[1] - roads[i][3]));
        if(dis1 < dis2) {
          if(tmin > dis1) {
            tmin = dis1;
            pmin = vec2.fromValues(roads[i][0], roads[i][1]);
          }
        } else {
          if(tmin > dis2) {
            tmin = dis2;
            pmin = vec2.fromValues(roads[i][2], roads[i][3]);
          }
        }
      }
    } else {
      let t = roads[i][0] - pos[0];
      if(tmin > Math.abs(t)) {
        tmin = Math.abs(t);
        pmin = vec2.fromValues(roads[i][0], pos[1]);
      }
    }
  }
  return vec3.fromValues(tmin, pmin[0], pmin[1]);
}

function loadScene() {
  for(let i = 0; i < 512 * 512; i++) {
    recordMap.push(false);
  }
  if(roads.length > 0) {
    roads = [];
    types = [];
    tfArray = [];
    buildings = [];
  } else {
    square = new Square();
    square.create();
    plane = new Plane(vec3.fromValues(0,0,-0.31), vec2.fromValues(11.3,11.3), 20);
    plane.create();
    screenQuad = new ScreenQuad();
    screenQuad.create();
  }

  // Set up instanced rendering data arrays here.
  // This example creates a set of positional
  // offsets and gradiated colors for a 100x100 grid
  // of squares, even though the VBO data for just
  // one square is actually passed to the GPU
  let posmax: vec2[] = [];
  for(let ci = 0; ci < 8; ci++) {
    for(let cj = 0; cj < 8; cj++) {
      let maxp = 100.0;
      let px = 0;
      let py = 0;
      for(let i = 0; i < 64; i++) {
        for(let j = 0; j < 64; j++) {
          let cp = tm.populationMap.data[4 * ((i + ci * 64) + (j + cj * 64) * 512)];
          let ce = tm.elevationMap.data[4 * ((i + ci * 64) + (j + cj * 64) * 512)];
          if(cp > maxp && ce / 255.0 > (controls['Water Level'] + 0.05)) {
            maxp = cp;
            px = i;
            py = j;
          }
        }
      }
      posmax.push(vec2.fromValues(px + ci * 64, py + cj * 64));
    }
  }

  let len: number;
  let center = vec2.create();

  for(let n = 0; n < 1; n++) {
    for(let ci = 0; ci < 7; ci++) {
      for(let cj = 0; cj < 7; cj++) {
        let p = posmax[ci * 8 + cj];
        if(p[0] != ci * 64 || p[1] != cj * 64) {
          let p_ = posmax[ci * 8 + cj + 1];
          if(p_[0] != ci * 64 || p_[1] != (cj + 1) * 64) {
            len = vec2.dist(p_, p) * 0.022;
            if(len < minl) {
              vec2.add(center, p_, p);
              vec2.scale(p, center, 0.5);
              posmax[ci * 8 + cj + 1] = p;
            }
          }

          p_ = posmax[ci * 8 + cj + 8];
          if(p_[0] != (ci + 1) * 64 || p_[1] != cj * 64) {
            len = vec2.dist(p_, p) * 0.022;
            if(len < minl) {
              vec2.add(center, p_, p);
              vec2.scale(p, center, 0.5);
              posmax[ci * 8 + cj + 8] = p;
            }
          }

          p_ = posmax[ci * 8 + cj + 9];
          if(p_[0] != (ci + 1) * 64 || p_[1] != (cj + 1) * 64) {
            len = vec2.dist(p_, p) * 0.022;
            if(len < minl) {
              vec2.add(center, p_, p);
              vec2.scale(p, center, 0.5);
              posmax[ci * 8 + cj + 9] = p;
            }
          }

          if(ci > 0) {
            p_ = posmax[ci * 8 + cj - 7];
            if(p_[0] != (ci - 1) * 64 || p_[1] != (cj + 1) * 64) {
              len = vec2.dist(p_, p) * 0.022;
              if(len < minl) {
                vec2.add(center, p_, p);
                vec2.scale(p, center, 0.5);
                posmax[ci * 8 + cj - 7] = p;
              }
            }
          }
        }
      }
    }
  }

  for(let ci = 0; ci < 7; ci++) {
    for(let cj = 0; cj < 7; cj++) {
      let p0 = posmax[ci * 8 + cj];
      if(p0[0] != ci * 64 || p0[1] != cj * 64) {
        let p1 = posmax[ci * 8 + cj + 1];
        let p2 = posmax[(ci + 1) * 8 + cj];
        if(p1[0] != ci * 64 || p1[1] != (cj + 1) * 64) {
          let len = vec2.dist(p0, p1) * 0.022;
          if(len >= minl && len <= maxl) {
            roads.push(vec4.fromValues(p0[0], p0[1], p1[0], p1[1]));
            types.push(0);
            recordMap[p0[0] + 512 * p0[1]] = true;
            recordMap[p1[0] + 512 * p1[1]] = true;
          }
        }
        if(p2[0] != (ci + 1) * 64 || p2[1] != cj * 64) {
          let len = vec2.dist(p0, p2) * 0.022;
          if(len >= minl && len <= maxl) {
            roads.push(vec4.fromValues(p0[0], p0[1], p2[0], p2[1]));
            types.push(0);
            recordMap[p0[0] + 512 * p0[1]] = true;
            recordMap[p2[0] + 512 * p2[1]] = true;
          }
        }
      }
    }
  }

  for(let id = 0; id < 100; id++) {
    if(types[id] == 1) {
      break;
    }
    let d1: number;
    let d2: number;
    let dir = vec2.create();
    let rp1 = vec2.fromValues(roads[id][0], roads[id][1]);
    let rp2 = vec2.fromValues(roads[id][2], roads[id][3]);
    let tpos =  vec2.create();
    let tnextpos = vec2.create();
    vec2.sub(dir, rp2, rp1);
    vec2.normalize(dir, dir);
    let dir2 = vec2.fromValues(-dir[1], dir[0]);
    if(dir[0] < 0.732) {
      d1 = cellW;
      d2 = cellH;
    } else {
      d1 = cellH;
      d2 = cellW;
    }
    vec2.scaleAndAdd(rp2, rp2, dir, -d1 / 2.0);
    for(let i = 1; i < 100; i++) {
      tstack = [];
      vec2.scaleAndAdd(tpos, rp1, dir, Math.floor((i + 1) / 2) * d1);
      if((rp2[0] - tpos[0]) * dir[0] < 0 ||
        (rp2[1] - tpos[1]) * dir[1] < 0) {
          break;
      }
      if(tm.sampleE(tpos) < controls["Water Level"] + 0.02) {
        continue;
      }
      let nearest = vec3.create();
      nearest = findNearest(tpos, 0);
      if(nearest[0] <= cellW / 2.0 && nearest[0] > 0.05) {
        continue;
      }
      if((i % 2) == 1) {
        vec2.scaleAndAdd(tnextpos, tpos, dir2, d2);
      } else {
        vec2.scaleAndAdd(tnextpos, tpos, dir2, -d2);
      }
      nearest = findNearest(tnextpos, 3);
      if(nearest[0] <= cellW / 2.0) {
        if(tm.sampleE(vec2.fromValues(nearest[1], nearest[2])) > controls["Water Level"] + 0.02) {
          roads.push(vec4.fromValues(tpos[0], tpos[1], nearest[1], nearest[2]));
          types.push(1);
          recordMap[Math.round(nearest[1]) + 512 * Math.round(nearest[2])] = true;
        }
        continue;
      } else {
        if(tm.sampleE(tnextpos) < controls["Water Level"] + 0.02) {
          continue;
        }
        recordMap[Math.round(tnextpos[0]) + 512 * Math.round(tnextpos[1])] = true;
        roads.push(vec4.fromValues(tpos[0], tpos[1], tnextpos[0], tnextpos[1]));
        types.push(1);
        tpos[0] = tnextpos[0];
        tpos[1] = tnextpos[1];
      
        for(let j = 1; j < 100; j++) {
          if(Math.random() < reliveRate) {
            let tmp = vec2.create();
            tmp[0] = tpos[0];
            tmp[1] = tpos[1];
            tstack.push(tmp);
          }
          if(Math.random() < 0.5) {
            if(Math.random() < 0.5) {
              vec2.scaleAndAdd(tnextpos, tpos, dir2, d2);
              if(recordMap[Math.round(tnextpos[0]) + 512 * Math.round(tnextpos[1])]) {
                vec2.scaleAndAdd(tnextpos, tpos, dir2, -d2);
              }
            } else {
              vec2.scaleAndAdd(tnextpos, tpos, dir2, -d2);
              if(recordMap[Math.round(tnextpos[0]) + 512 * Math.round(tnextpos[1])]) {
                vec2.scaleAndAdd(tnextpos, tpos, dir2, d2);
              }
            }
            let nearest = findNearest(tnextpos, 3);
            if(nearest[0] <= cellW / 2.0) {
              if(tm.sampleE(vec2.fromValues(nearest[1], nearest[2])) > controls["Water Level"] + 0.02) {
                roads.push(vec4.fromValues(tpos[0], tpos[1], nearest[1], nearest[2]));
                recordMap[Math.round(nearest[1]) + 512 * Math.round(nearest[2])] = true;
                types.push(1);
              }
              if(tstack.length == 0) {
                break;
              } else {
                tpos = tstack.pop();
                continue;
              }
            } else {
              if(tm.sampleE(tnextpos) < controls["Water Level"] + 0.02) {
                if(tstack.length == 0) {
                  break;
                } else {
                  tpos = tstack.pop();
                  continue;
                }
              }
              roads.push(vec4.fromValues(tpos[0], tpos[1], tnextpos[0], tnextpos[1]));
              recordMap[Math.round(tnextpos[0]) + 512 * Math.round(tnextpos[1])] = true;
              types.push(1);
              tpos[0] = tnextpos[0];
              tpos[1] = tnextpos[1];
            }
          } else {
            vec2.scaleAndAdd(tnextpos, tpos, dir, d1);
            if(recordMap[Math.round(tnextpos[0]) + 512 * Math.round(tnextpos[1])]) {
              vec2.scaleAndAdd(tnextpos, tpos, dir, -d1);
            }
            let nearest = findNearest(tnextpos, 3);
            if(nearest[0] < cellW / 2.0) {
              if(tm.sampleE(vec2.fromValues(nearest[1], nearest[2])) > controls["Water Level"] + 0.02) {
                roads.push(vec4.fromValues(tpos[0], tpos[1], nearest[1], nearest[2]));
                types.push(1);
                recordMap[Math.round(nearest[1]) + 512 * Math.round(nearest[2])] = true;
              }
              if(tstack.length == 0) {
                break;
              } else {
                tpos = tstack.pop();
                continue;
              }
            } else {
              if(tm.sampleE(tnextpos) < controls["Water Level"] + 0.02) {
                if(tstack.length == 0) {
                  break;
                } else {
                  tpos = tstack.pop();
                  continue;
                }
              }
              roads.push(vec4.fromValues(tpos[0], tpos[1], tnextpos[0], tnextpos[1]));
              recordMap[Math.round(tnextpos[0]) + 512 * Math.round(tnextpos[1])] = true;
              types.push(1);
              tpos[0] = tnextpos[0];
              tpos[1] = tnextpos[1];
            }
          }
        }
      }
    }
  }
  let buildinggrid: boolean[] = [];
  let gsize = gridN;
  for(let i = 0; i < gsize * gsize; i++) {
    buildinggrid.push(false);
  }

  let buildlist:vec2[] = [];
  let ginv = 512 / gsize;
  let roadWidth = 0.12 / 0.022;
  for(let i = 0.5; i < gsize; i++) {
    for(let j = 0.5; j < gsize; j++) {
      if(tm.sampleE(vec2.fromValues(i * ginv, j * ginv)) > controls["Water Level"] + 0.05) {
        let pd = tm.sampleP(vec2.fromValues(i * ginv, j * ginv));
        if(pd > 0.2) {
          let nd = findNearest(vec2.fromValues(i * ginv, j * ginv), 4);
          if(nd[0] > (1.5 * ginv + roadWidth) / 2) {
            buildinggrid[i - 0.5 + (j - 0.5) * gsize] = true;
            if(Math.random() < Math.sqrt(pd - 0.2)) {
              buildlist.push(vec2.fromValues(i * ginv, j * ginv));
            }
          }
        }
      }
    }
  }

  /*
  for(let i = 0; i < 1000; i++) {
    let bx = Math.floor(Math.random() * gsize);
    let by = Math.floor(Math.random() * gsize);
    if(buildinggrid[bx + by * gsize]) {
      buildinggrid[bx + by * gsize] = false;
      buildlist.push(vec2.fromValues((bx + 0.5) * ginv, (by + 0.5) * ginv));
    }
  }
  */

  let i = 0;
  for(let bpos of buildlist) {
    let n = Math.floor(Math.random() * 3) + 4; 
    let h = tm.sampleP(bpos) * tm.sampleP(bpos) * 2;
    let bd: Poly = new Poly(vec3.fromValues((bpos[0] / 256.0 - 1.0) * 5.5,(bpos[1] / 256.0 - 1.0) * 5.5, h), ginv / 707.0 * 5.5, n, h);
    buildings.push(bd);
    buildings[i].create();
    i++;

    if(Math.random() < 0.15 && h > 0.2) {
      n = Math.floor(Math.random() * 3) + 4; 
      h = h - 0.01;
      bd = new Poly(vec3.fromValues((bpos[0] / 256.0 - 1.0) * 5.5,(bpos[1] / 256.0 - 1.0) * 5.5, h), ginv / 512.0 * 5.5, n, h);
      buildings.push(bd);
      buildings[i].create();
      i++;
    }

    if(Math.random() < 0.6 && h > 0.2) {
      let randD = Math.floor(Math.random() * n) / n * 2 * 3.1415926;
      let size = ginv / 512.0 * 5.5;
      n = Math.floor(Math.random() * 3) + 4; 
      h *= (Math.random() * 0.7 + 0.3);
      bd = new Poly(vec3.fromValues((bpos[0] / 256.0 - 1.0) * 5.5 + Math.cos(randD) * size,(bpos[1] / 256.0 - 1.0) * 5.5 + Math.sin(randD) * size, h), size, n, h);
      buildings.push(bd);
      buildings[i].create();
      i++;
    }
    if(Math.random() < 0.6 && h > 0.2) {
      let randD = Math.floor(Math.random() * n) / n * 2 * 3.1415926;
      let size = ginv / 512.0 * 5.5;
      n = Math.floor(Math.random() * 3) + 4; 
      h *= (Math.random() * 0.7 + 0.3);
      bd = new Poly(vec3.fromValues((bpos[0] / 256.0 - 1.0) * 5.5 + Math.cos(randD) * size,(bpos[1] / 256.0 - 1.0) * 5.5 + Math.sin(randD) * size, h), size, n, h);
      buildings.push(bd);
      buildings[i].create();
      i++;
    }
  }
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'Map', ['Terrain Elevation', 'Population Density', 'Overlapping']);
  gui.add(controls, 'Water Level', 0, 0.5);
  gui.add(controls, 'Roads Density', 0.2, 0.99);
  gui.add(controls, 'Block Size', 1.0, 3.0);
  gui.add(controls, 'Grid(n by n)', 50, 100);

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2', { alpha: false });
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);

  // Initial call to load scene
  tm = new TerrainMap();
  tm.genEMap();
  tm.genPMap();
  loadScene();
  for(let i = 0; i < roads.length; i++) {
    buildTransMat(vec2.fromValues(roads[i][0], roads[i][1]), vec2.fromValues(roads[i][2], roads[i][3]), tfArray, types[i]);
  }
  square.destoryTF()
  square.setInstanceTFs(new Float32Array(tfArray));
  square.setNumInstances(tfArray.length / 16);

  const textureT = loadTexture(gl, tm.elevationMap);
  const textureP = loadTexture(gl, tm.populationMap);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, textureT);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, textureP);

  const camera = new Camera(vec3.fromValues(0.0, 0.0, 1.0), vec3.fromValues(0.0, 0.0, 0.0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  const ground = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/ground-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/ground-frag.glsl')),
  ]);
  ground.setMode(0);
  ground.setWaterL(preWaterLevel);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  const buildingShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/building-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/building-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    if(preMap != controls.Map) {
      preMap = controls.Map;
      if(preMap == 'Terrain Elevation') {
        ground.setMode(0);
      } else if(preMap == 'Population Density'){
        ground.setMode(1);
      } else {
        ground.setMode(2);
      }
    }

    if(preWaterLevel != controls["Water Level"]) {
      preWaterLevel = controls["Water Level"];
      loadScene();
      for(let i = 0; i < roads.length; i++) {
        buildTransMat(vec2.fromValues(roads[i][0], roads[i][1]), vec2.fromValues(roads[i][2], roads[i][3]), tfArray, types[i]);
      }
      square.destoryTF()
      square.setInstanceTFs(new Float32Array(tfArray));
      square.setNumInstances(tfArray.length / 16);
      ground.setWaterL(preWaterLevel);
    }

    if(reliveRate != controls["Roads Density"]) {
      reliveRate = controls["Roads Density"];
      loadScene();
      for(let i = 0; i < roads.length; i++) {
        buildTransMat(vec2.fromValues(roads[i][0], roads[i][1]), vec2.fromValues(roads[i][2], roads[i][3]), tfArray, types[i]);
      }
      square.destoryTF()
      square.setInstanceTFs(new Float32Array(tfArray));
      square.setNumInstances(tfArray.length / 16);
    }

    if(Math.abs(cellW - 0.3 / 0.022 * controls["Block Size"]) > 0.0001) {
      cellW = 0.3 / 0.022 * controls["Block Size"];
      cellH = 0.2 / 0.022 * controls["Block Size"];
      loadScene();
      for(let i = 0; i < roads.length; i++) {
        buildTransMat(vec2.fromValues(roads[i][0], roads[i][1]), vec2.fromValues(roads[i][2], roads[i][3]), tfArray, types[i]);
      }
      square.destoryTF()
      square.setInstanceTFs(new Float32Array(tfArray));
      square.setNumInstances(tfArray.length / 16);
    }

    if(controls["Grid(n by n)"] != gridN) {
      gridN = controls["Grid(n by n)"];
      loadScene();
      for(let i = 0; i < roads.length; i++) {
        buildTransMat(vec2.fromValues(roads[i][0], roads[i][1]), vec2.fromValues(roads[i][2], roads[i][3]), tfArray, types[i]);
      }
      square.destoryTF()
      square.setInstanceTFs(new Float32Array(tfArray));
      square.setNumInstances(tfArray.length / 16);
    }

    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    ground.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    renderer.render(camera, ground, [plane], 0);
    renderer.render(camera, flat, [screenQuad], 0);
    renderer.render(camera, buildingShader, buildings, 0);
    renderer.render(camera, instancedShader, [
      square,
    ], 0);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    ground.setDimensions(window.innerWidth, window.innerHeight);
    buildingShader.setDimensions(window.innerWidth, window.innerHeight);
    instancedShader.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  ground.setDimensions(window.innerWidth, window.innerHeight);
  buildingShader.setDimensions(window.innerWidth, window.innerHeight);
  instancedShader.setDimensions(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();
