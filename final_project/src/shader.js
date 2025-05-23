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
    uniform vec3 u_LightPosition;
    uniform float u_Ka;
    uniform float u_Kd;
    uniform float u_Ks;
    uniform float u_Shininess;

    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;

    void main() {
        vec3 V = normalize(u_ViewPosition - v_PositionInWorld);
        vec3 N = normalize(v_Normal);
        
        float eta = 1.0 / 1.52;

        vec3 refractDir = refract(-V, N, eta);
        vec3 refractedColor = textureCube(u_envCubeMap, refractDir).rgb;

        float fresnel = pow(1.0 - dot(V, N), 3.0);
        vec3 reflectDir = reflect(-V, N);
        vec3 reflectedColor = textureCube(u_envCubeMap, reflectDir).rgb;
        vec3 baseColor = mix(refractedColor, reflectedColor, fresnel * 0.4);

        vec3 lightDirection = normalize(u_LightPosition - v_PositionInWorld);
        vec3 ambient = baseColor * u_Ka;
        float nDotL = max(dot(N, lightDirection), 0.0);
        vec3 diffuse = baseColor * u_Kd * nDotL;
        vec3 reflectLightDir = reflect(-lightDirection, N);
        float specular = pow(max(dot(V, reflectLightDir), 0.0), u_Shininess);
        vec3 specularColor = vec3(1.0, 1.0, 1.0) * u_Ks * specular;

        vec3 lightingColor = ambient + diffuse + specularColor;
        
        gl_FragColor = vec4(lightingColor, 0.65);
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

        // Ambient Light
        vec3 ambient = texColor * u_Ka;

        // Diffuse Light
        vec3 normal = normalize(v_Normal);
        vec3 lightDirection = normalize(u_LightPosition - v_PositionInWorld);
        float nDotL = max(dot(normal, lightDirection), 0.0);
        vec3 diffuse = texColor * u_Kd * nDotL;

        // Specular Light (Phong)
        vec3 viewDirection = normalize(-v_PositionInWorld); // 假設相機在原點
        vec3 reflectDirection = reflect(-lightDirection, normal);
        float specular = pow(max(dot(viewDirection, reflectDirection), 0.0), u_Shininess);
        vec3 specularColor = vec3(1.0, 1.0, 1.0) * u_Ks * specular; // 白色高光

        // Final color = ambient + diffuse + specular
        vec3 finalColor = ambient + diffuse + specularColor;

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;