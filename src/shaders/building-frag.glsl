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
in vec4 fs_Nor;
in vec2 fs_UV;
in vec2 fs_Center;
out vec4 out_Col;

void main() {
  vec3 color;
  /*
  float rrn = sin(dot(fs_Center, vec2(-195.63, 247.67)));
  if(rrn < -0.866) {
    color = vec3(188.0, 215.0, 255.0) / 255.0;
  } else if(rrn < -0.5) {
    color = vec3(204.0, 215.0, 255.0) / 255.0;
  } else if(rrn < 0.0) {
    color = vec3(220.0, 215.0, 255.0) / 255.0;
  } else if(rrn < 0.5){
    color = vec3(236.0, 215.0, 255.0) / 255.0;
  } else if(rrn < 0.866){
    color = vec3(252.0, 215.0, 255.0) / 255.0;
  } else {
    color = vec3(220.0, 215.0, 255.0) / 255.0;
  }
  */
  color = vec3(220.0, 215.0, 217.0) / 255.0;

  vec3 col;
  if(fs_UV.x < 0.0) {
    vec2 uv = fs_UV + vec2(2.0);
    if(length(uv) > 0.9) {
      col = vec3(69.0, 67.0, 67.0) / 255.0;
    } else {
      col = color;
    }
  } else {
    vec4 tmp = texture(u_Texture2, (fs_Center + 1.0) / 2.0);
    float h = tmp.x * tmp.x * 2.0;
    if(abs(0.5 - fs_UV.x) > 0.45 || abs(0.5 - fs_UV.y) > 0.5 - 0.005 / h) {
      col = vec3(69.0, 67.0, 67.0) / 255.0;
    } else {
      float rn = sin(dot(fs_Center, vec2(157.63, 242.55)));
      if(rn < -0.732) {
        if(mod(fs_UV.y, 0.04 / h) < 0.003 / h && abs(0.5 - fs_UV.x) < 0.35) {
          col = vec3(129.0, 127.0, 127.0) / 255.0;
        } else {
          col = color;
        }
      } else if(rn < 0.0) {
        if(abs(abs(mod(fs_UV.y, 0.04 / h) - 0.02 / h) - 0.016 / h) < 0.001 / h) {
          col = vec3(129.0, 127.0, 127.0) / 255.0;
        } else {
          col = color;
        }
      } else if(rn < 0.732){
        float dis = abs(mod(fs_UV.y, 0.09 / h) - 0.045 / h) - 0.042 / h;
        if(abs(dis) < 0.001 / h) {
          col = vec3(129.0, 127.0, 127.0) / 255.0;
        } else if(dis < 0.0 && mod(fs_UV.x, 0.08) < 0.04){
          col = vec3(129.0, 127.0, 127.0) / 255.0;
        } else {
          col = color;
        }
      } else {
        if(abs(mod(fs_UV.y, 0.03 / h) - 0.015 / h) < 0.007 / h && abs(mod(abs(fs_UV.x - 0.5), 0.3) - 0.15) > 0.06) {
          col = vec3(129.0, 127.0, 127.0) / 255.0;
        } else {
          col = color;
        }
      }
    }
  }
  float diffuse1 = clamp(dot(fs_Nor, normalize(vec4(0.5, 0.0, 0.2, 0.0))), 0.0, 1.0);
  float diffuse2 = clamp(dot(fs_Nor, normalize(vec4(-0.2, 0.4, 0.2, 0.0))), 0.0, 1.0);
  float diffuse3 = clamp(dot(fs_Nor, normalize(vec4(-0.2, -0.4, 0.2, 0.0))), 0.0, 1.0);
  out_Col = vec4(clamp(col * ((diffuse1 + diffuse2 * 0.8 + diffuse3 * 0.9) + 0.2), 0.0, 1.0), 1.0);
}
