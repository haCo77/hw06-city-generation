#version 300 es

uniform mat4 u_ViewProj;
uniform float u_Time;

uniform mat3 u_CameraAxes; // Used for rendering particles as billboards (quads that are always looking at the camera)
// gl_Position = center + vs_Pos.x * camRight + vs_Pos.y * camUp;
uniform vec2 u_Dimensions;

in vec4 vs_Pos; // Non-instanced; each particle is the same quad drawn in a different place
in vec4 vs_Nor; // Non-instanced, and presently unused
// in vec4 vs_Col; // An instanced rendering attribute; each particle instance has a different color
in vec4 vs_TransformC1;
in vec4 vs_TransformC2;
in vec4 vs_TransformC3;
in vec4 vs_TransformC4;
in vec2 vs_UV; // Non-instanced, and presently unused in main(). Feel free to use it for your meshes.

out vec4 fs_Col;
out vec4 fs_Pos;
out vec2 fs_UV;

void main()
{
    // fs_Col = vs_Col;
    fs_Pos = vs_Pos;
    fs_UV = vs_UV;
    mat4 trans = mat4(vs_TransformC1, vs_TransformC2, vs_TransformC3, vs_TransformC4);
    vec4 tmp = u_ViewProj * trans * fs_Pos;
    tmp.x *= u_Dimensions.x / u_Dimensions.y;
    gl_Position = tmp;
}
