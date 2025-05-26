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

// 折射/反射
// var VSHADER_SOURCE = `
//     attribute vec4 a_Position;
//     attribute vec4 a_Normal;
//     uniform mat4 u_MvpMatrix;
//     uniform mat4 u_modelMatrix;
//     uniform mat4 u_normalMatrix;
//     uniform mat4 u_MvpMatrixOfLight;
//     varying vec3 v_Normal;
//     varying vec3 v_PositionInWorld;
//     varying vec4 v_PositionFromLight;
//     void main(){
//         gl_Position = u_MvpMatrix * a_Position;
//         v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
//         v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
//         v_PositionFromLight = u_MvpMatrixOfLight * a_Position;
//     }    
// `;

// var FSHADER_SOURCE = `
//     precision mediump float;
//     uniform vec3 u_ViewPosition;
//     uniform samplerCube u_envCubeMap;
//     uniform sampler2D u_ShadowMap;
//     uniform vec3 u_LightPosition;
//     uniform float u_Ka;
//     uniform float u_Kd;
//     uniform float u_Ks;
//     uniform float u_Shininess;

//     varying vec3 v_Normal;
//     varying vec3 v_PositionInWorld;
//     varying vec4 v_PositionFromLight;

//     float getShadow(vec4 positionFromLight) {
//         vec3 projCoords = positionFromLight.xyz / positionFromLight.w;
//         projCoords = projCoords * 0.5 + 0.5;
        
//         float currentDepth = projCoords.z;
//         float shadow = 1.0;
        
//         // PCF
//         vec2 texelSize = 1.0 / vec2(512.0, 512.0);
//         for(int x = -1; x <= 1; ++x) {
//             for(int y = -1; y <= 1; ++y) {
//                 float pcfDepth = texture2D(u_ShadowMap, projCoords.xy + vec2(x, y) * texelSize).r;
//                 shadow -= currentDepth > pcfDepth ? 0.0 : 0.111;
//             }
//         }
        
//         return shadow;
//     }

//     void main() {
//         vec3 V = normalize(u_ViewPosition - v_PositionInWorld);
//         vec3 N = normalize(v_Normal);
        
//         float eta = 1.0 / 1.52;

//         vec3 refractDir = refract(-V, N, eta);
//         vec3 refractedColor = textureCube(u_envCubeMap, refractDir).rgb;

//         float fresnel = pow(1.0 - dot(V, N), 3.0);
//         vec3 reflectDir = reflect(-V, N);
//         vec3 reflectedColor = textureCube(u_envCubeMap, reflectDir).rgb;
//         vec3 baseColor = mix(refractedColor, reflectedColor, fresnel * 0.4);

//         vec3 lightDirection = normalize(u_LightPosition - v_PositionInWorld);
//         vec3 ambient = baseColor * u_Ka;
//         float nDotL = max(dot(N, lightDirection), 0.0);
//         vec3 diffuse = baseColor * u_Kd * nDotL;
//         vec3 reflectLightDir = reflect(-lightDirection, N);
//         float specular = pow(max(dot(V, reflectLightDir), 0.0), u_Shininess);
//         vec3 specularColor = vec3(1.0, 1.0, 1.0) * u_Ks * specular;

//         float shadow = getShadow(v_PositionFromLight);
//         vec3 lightingColor = ambient + (diffuse + specularColor) * shadow;
        
//         gl_FragColor = vec4(lightingColor, 0.65);
//     }
// `;

// normal + 陰影
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    uniform mat4 u_ProjMatrixFromLight;
    uniform mat4 u_MvpMatrixOfLight;
    varying vec4 v_PositionFromLight;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
        v_PositionFromLight = u_MvpMatrixOfLight * a_Position; //for shadow
    }    
`;

var FSHADER_SOURCE = `
    precision mediump float;
    uniform vec3 u_LightPosition;
    uniform vec3 u_ViewPosition;
    uniform float u_Ka;
    uniform float u_Kd;
    uniform float u_Ks;
    uniform float u_shininess;
    uniform vec3 u_Color;
    uniform sampler2D u_ShadowMap;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    varying vec2 v_TexCoord;
    varying vec4 v_PositionFromLight;
    const float deMachThreshold = 0.005; //0.001 if having high precision depth
    void main(){ 
        vec3 ambientLightColor = u_Color;
        vec3 diffuseLightColor = u_Color;
        vec3 specularLightColor = vec3(1.0, 1.0, 1.0);        

        vec3 ambient = ambientLightColor * u_Ka;

        vec3 normal = normalize(v_Normal);
        vec3 lightDirection = normalize(u_LightPosition - v_PositionInWorld);
        float nDotL = max(dot(lightDirection, normal), 0.0);
        vec3 diffuse = diffuseLightColor * u_Kd * nDotL;

        vec3 specular = vec3(0.0, 0.0, 0.0);
        if(nDotL > 0.0) {
            vec3 R = reflect(-lightDirection, normal);
            // V: the vector, point to viewer       
            vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
            float specAngle = clamp(dot(R, V), 0.0, 1.0);
            specular = u_Ks * pow(specAngle, u_shininess) * specularLightColor; 
        }

        //***** shadow
        vec3 shadowCoord = (v_PositionFromLight.xyz/v_PositionFromLight.w)/2.0 + 0.5;
        vec4 rgbaDepth = texture2D(u_ShadowMap, shadowCoord.xy);
        /////////******** LOW precision depth implementation ********///////////
        float depth = rgbaDepth.r;
        float visibility = (shadowCoord.z > depth + deMachThreshold) ? 0.3 : 1.0;

        gl_FragColor = vec4( (ambient + diffuse + specular)*visibility, 1.0);
    }
`;

// texture
var VSHADER_SOURCE_TEXTURE = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    attribute vec2 a_TexCoord;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    varying vec2 v_TexCoord;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
        v_TexCoord = a_TexCoord;
    }    
`;

var FSHADER_SOURCE_TEXTURE = `
    precision mediump float;
    uniform vec3 u_LightPosition;
    uniform vec3 u_ViewPosition;
    uniform float u_Ka;
    uniform float u_Kd;
    uniform float u_Ks;
    uniform float u_Shininess;
    uniform sampler2D u_Sampler;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    varying vec2 v_TexCoord;

    void main() {
        vec3 texColor = texture2D(u_Sampler, v_TexCoord).rgb;

        vec3 ambient = texColor * u_Ka;
        vec3 normal = normalize(v_Normal);
        vec3 lightDirection = normalize(u_LightPosition - v_PositionInWorld);
        float nDotL = max(dot(normal, lightDirection), 0.0);
        vec3 diffuse = texColor * u_Kd * nDotL;

        vec3 viewDirection = normalize(u_ViewPosition - v_PositionInWorld); // 改這裡
        vec3 reflectDirection = reflect(-lightDirection, normal);
        float specular = pow(max(dot(viewDirection, reflectDirection), 0.0), u_Shininess);
        vec3 specularColor = vec3(1.0) * u_Ks * specular;

        vec3 finalColor = ambient + diffuse + specularColor;

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

// shadow
var VSHADER_SHADOW_SOURCE = `
      attribute vec4 a_Position;
      uniform mat4 u_MvpMatrix;
      void main(){
          gl_Position = u_MvpMatrix * a_Position;
      }
  `;

var FSHADER_SHADOW_SOURCE = `
      precision mediump float;
      void main(){
        /////////** LOW precision depth implementation **/////
        gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 1.0);
      }
  `;