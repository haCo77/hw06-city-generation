#version 300 es
precision highp float;

in vec4 fs_Col;
in vec4 fs_Pos;
in vec2 fs_UV;
uniform sampler2D u_Texture;

out vec4 out_Col;

void main()
{
    out_Col = vec4(228.0 / 255.0, 216.0 / 255.0, 192.0 / 255.0, 1.0);
}
