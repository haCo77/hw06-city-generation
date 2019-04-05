import {vec2, vec3} from 'gl-matrix';

export default class TerrainMap {
  elevationMap: ImageData;
  populationMap: ImageData;

  random2(p: vec2, seed: vec2): vec2 {
    let tmp = vec2.fromValues(313.244, 139.71);
    vec2.scale(tmp, vec2.fromValues(Math.sin(vec2.dot(p, seed)), Math.sin(vec2.dot(p, tmp))), 853.545);
    return vec2.fromValues(Math.abs(tmp[0] % 1.0) * 2.0 - 1.0, (Math.abs(tmp[1]) % 1.0) * 2.0 - 1.0);
  }

  falloff(dis: number): number {
    return 1.0 - dis * dis * dis * (dis * (dis * 6.0 - 15.0) + 10.0); 
  }

  perlin(p: vec2, seed: vec2): number {
    let lbpos = vec2.create();
    vec2.floor(lbpos, p);
    let pfrac = vec2.create();
    vec2.scaleAndAdd(pfrac, p, lbpos, -1.0);
    if(pfrac[0] == 0.0 && pfrac[1] == 0.0) {
      return 0.0;
    }
    
    let tmp = vec2.create();
    let lbvec = vec2.create();
    vec2.normalize(lbvec, this.random2(lbpos, seed));
    let luvec = vec2.create();
    vec2.add(tmp, lbpos, vec2.fromValues(0.0, 1.0));
    vec2.normalize(luvec, this.random2(tmp, seed));
    let rbvec = vec2.create();
    vec2.add(tmp, lbpos, vec2.fromValues(1.0, 0.0));
    vec2.normalize(rbvec, this.random2(tmp, seed));
    let ruvec = vec2.create();
    vec2.add(tmp, lbpos, vec2.fromValues(1.0, 1.0));
    vec2.normalize(ruvec, this.random2(tmp, seed));
    let lbdot = vec2.dot(lbvec, pfrac);
    vec2.add(tmp, pfrac, vec2.fromValues(0.0, -1.0));
    let ludot = vec2.dot(luvec, tmp);
    vec2.add(tmp, pfrac, vec2.fromValues(-1.0, 0.0));
    let rbdot = vec2.dot(rbvec, tmp);
    vec2.add(tmp, pfrac, vec2.fromValues(-1.0, -1.0));
    let rudot = vec2.dot(ruvec, tmp);
    let lbw = this.falloff(pfrac[0]) * this.falloff(pfrac[1]);
    let luw = this.falloff(pfrac[0]) * this.falloff(1.0 - pfrac[1]);
    let rbw = this.falloff(1.0 - pfrac[0]) * this.falloff(pfrac[1]);
    let ruw = this.falloff(1.0 - pfrac[0]) * this.falloff(1.0 - pfrac[1]);
    return lbdot * lbw + ludot * luw + rbdot * rbw + rudot * ruw;
  }

  genEMap() {
      let noisearray: number[] = [];
      for(let i = 0; i < 512; i++) {
          for(let j = 0; j < 512; j++) {
              let p = vec2.fromValues(i, j);
              vec2.scale(p, p, 0.011415926);
              let ib = Math.abs(i - 256);
              let jb = Math.abs(j - 256);
              let nb = vec2.fromValues(ib, jb);
              vec2.scale(nb, nb, 0.004015926);
              let val = 127.5 * (this.perlin(p, vec2.fromValues(57.93, 173.21)) - 
                        (nb[0] * nb[0] + nb[1] * nb[1]) + 1.0);
              if(val < 0.0) {
                  val = 0.0;
              }
              if(val > 255.0) {
                  val = 255.0;
              }
              noisearray.push(val);
              noisearray.push(0.0);
              noisearray.push(0.0);
              noisearray.push(0.0);
          }
      }
      let tmp = Uint8ClampedArray.from(noisearray);
      this.elevationMap = new ImageData(tmp, 512, 512);
  }

  genPMap() {
    let noisearray: number[] = [];
    for(let i = 0; i < 512; i++) {
        for(let j = 0; j < 512; j++) {
            let p = vec2.fromValues(i, j);
            vec2.scale(p, p, 0.011415926);
            noisearray.push(127.5 * (this.perlin(p, vec2.fromValues(754.93, 377.21)) + 1.0));
            noisearray.push(0.0);
            noisearray.push(0.0);
            noisearray.push(0.0);
        }
    }
    let tmp = Uint8ClampedArray.from(noisearray);
    this.populationMap = new ImageData(tmp, 512, 512);
  }

  sampleP(uv: vec2): number {
    return this.populationMap.data[4.0 * (Math.round(uv[0]) + 512 * Math.round(uv[1]))] / 256.0;
  }

  sampleE(uv: vec2): number {
    if(uv[0] < 0 || uv[0] > 512 || uv[1] < 0 || uv[1] > 512) {
      return -1;
    }
    return this.elevationMap.data[4.0 * (Math.round(uv[0]) + 512 * Math.round(uv[1]))] / 256.0;
  }
}