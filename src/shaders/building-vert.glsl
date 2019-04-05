#version 300 es
precision highp float;

// The vertex shader used to render the background of the scene
uniform vec2 u_Dimensions;
uniform mat4 u_ViewProj;
uniform sampler2D u_Texture1;
uniform float u_waterL;

in vec4 vs_Pos;
in vec4 vs_Nor;
in vec2 vs_UV;
in vec2 vs_Center;
out vec2 fs_Center;
out vec4 fs_Nor;
out vec2 fs_Pos;
out vec2 fs_UV;

void main() {
  fs_Center = vs_Center / 5.65;
  fs_Nor = vs_Nor;
  fs_UV = vs_UV;
  fs_Pos = vs_Pos.xy / 5.65;
  vec4 tmp = u_ViewProj * vec4(vs_Pos.xy, vs_Pos.z, 1.0);
  tmp.x *= u_Dimensions.x / u_Dimensions.y;
  gl_Position = tmp;
}