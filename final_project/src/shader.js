// 環境貼圖
var VSHADER_SOURCE_ENVCUBE = `
  attribute vec4 a_Position;
  varying vec4 v_Position;
  void main() {
    v_Position = a_Position;
    gl_Position = a_Position;
  } 
`;

var FSHADER_SOURCE_ENVCUBE = `
  precision mediump float;
  uniform samplerCube u_envCubeMap;
  uniform mat4 u_viewDirectionProjectionInverse;
  varying vec4 v_Position;
  void main() {
    vec4 t = u_viewDirectionProjectionInverse * v_Position;
    gl_FragColor = textureCube(u_envCubeMap, normalize(t.xyz / t.w));
  }
`;

// refraction
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
    }    
`;

var FSHADER_SOURCE = `
    precision mediump float;
    uniform vec3 u_ViewPosition;
    uniform samplerCube u_envCubeMap;

    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;

    void main(){
        vec3 V = normalize(u_ViewPosition - v_PositionInWorld);
        vec3 normal = normalize(v_Normal);
        float eta = 1.0 / 1.31;
        vec3 refractDir = refract(-V, normal, eta);
        vec3 refractedColor = textureCube(u_envCubeMap, refractDir).rgb;

        vec3 iceTint = vec3(0.8, 0.9, 1.0);
        refractedColor *= iceTint;

        gl_FragColor = vec4(refractedColor, 0.45);
    }
`;