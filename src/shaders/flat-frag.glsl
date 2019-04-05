#version 300 es
precision highp float;

uniform vec2 u_Dimensions;

in vec2 fs_Pos;
out vec4 out_Col;

void main() {
    float scale1 = 0.2;
    float scale2 = scale1 / 1.732 * 3.0; 
    float xb = floor(fs_Pos.x / scale1);
    float x = mod(fs_Pos.x, scale1);
    float yb = floor(fs_Pos.y / scale2);
    float y = mod(fs_Pos.y, scale2);
    vec3 col = vec3(252.0, 250.0, 249.0) / 255.0;
    if(mod(xb - yb, 2.0) != 0.0) {
      y -= scale2;
    }
    if(abs(1.732 * y - x + 2.0 * scale1) < scale1) {
      out_Col = vec4(col * 0.18, 1.0);
    } else if(abs(1.732 * y + x - 2.0 * scale1) < scale1){
      out_Col = vec4(col * 0.15, 1.0);
    } else {
      out_Col = vec4(col * 0.2, 1.0);
    }
}

