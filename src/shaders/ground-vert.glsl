#version 300 es
precision highp float;

// The vertex shader used to render the background of the scene
uniform vec2 u_Dimensions;
uniform mat4 u_ViewProj;
uniform sampler2D u_Texture1;
uniform float u_waterL;

in vec4 vs_Pos;
out vec2 fs_Pos;

void main() {
  fs_Pos = vs_Pos.xy / 5.65;
  vec4 ele = texture(u_Texture1, (fs_Pos.xy + 1.0) / 2.0);
  float height;
  height = smoothstep(u_waterL, u_waterL + 0.1, ele.x) * 0.3;
  vec4 tmp = u_ViewProj * vec4(vs_Pos.xy, vs_Pos.z + height, 1.0);
  tmp.x *= u_Dimensions.x / u_Dimensions.y;
  gl_Position = tmp;
}
