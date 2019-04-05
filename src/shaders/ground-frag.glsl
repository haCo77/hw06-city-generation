#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;
uniform sampler2D u_Texture1;
uniform sampler2D u_Texture2;
uniform float u_Mode;
uniform float u_waterL;

in vec2 fs_Pos;
out vec4 out_Col;

void main() {
  vec4 tmp;
  tmp = texture(u_Texture1, (fs_Pos.xy + 1.0) / 2.0);
  if(u_Mode == 0.0) {  
    if(tmp.x < u_waterL) {
      out_Col = vec4(80.0, 93.0, 90.0, 255.0) / 255.0;
    } else {
      out_Col = vec4(floor(20.0 * (smoothstep(u_waterL, 1.0, tmp.x) * 0.3 + 0.7)) / 20.0 * vec3(250.0 / 255.0, 248.0 / 255.0, 242.0 / 255.0), 1.0);
    }
  } else if (u_Mode == 1.0) {
    if(tmp.x < u_waterL) {
      out_Col = vec4(0.18, 0.2, 0.18, 1.0);
    } else {
      tmp = texture(u_Texture2, (fs_Pos.xy + 1.0) / 2.0);
      out_Col = vec4(0.2, smoothstep(0.0, 1.0, vec2(tmp.x * tmp.x)) * 0.8 + 0.1, 1.0);
    }
  } else {
    if(tmp.x < u_waterL) {
      out_Col = vec4(0.18, 0.2, 0.18, 1.0);
    } else {
      tmp = vec4((smoothstep(u_waterL / 2.0, 1.0, tmp.x) * 0.7 + 0.3) * vec3(170.0 / 255.0, 108.0 / 255.0, 86.0 / 255.0) * 1.3, 1.0);
      vec4 tmp2 = texture(u_Texture2, (fs_Pos.xy + 1.0) / 2.0);
      tmp2 = vec4(0.2, smoothstep(0.0, 1.0, vec2(tmp2.x * tmp2.x)) * 0.8 + 0.1, 1.0);
      out_Col = 0.5 * (tmp2 + tmp);
    }
  }
}
