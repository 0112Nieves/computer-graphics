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

// 折射 + 反射 + 陰影
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    uniform mat4 u_MvpMatrixOfLight;
    uniform vec3 u_ViewPosition;

    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    varying vec4 v_PositionFromLight;
    varying vec3 v_ViewDirection;

    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        vec4 worldPos = u_modelMatrix * a_Position;
        v_PositionInWorld = worldPos.xyz;
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
        v_PositionFromLight = u_MvpMatrixOfLight * a_Position;

        v_ViewDirection = normalize(u_ViewPosition - v_PositionInWorld);
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
    uniform sampler2D u_ShadowMap;
    uniform samplerCube u_envCubeMap;

    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    varying vec3 v_ViewDirection;
    varying vec4 v_PositionFromLight;

    const float deMachThreshold = 0.002;
    const float refractiveIndex = 1.25;
    const float fresnelPower = 5.0;

    float getShadow(vec4 positionFromLight) {
        vec3 projCoords = positionFromLight.xyz / positionFromLight.w;
        projCoords = projCoords * 0.5 + 0.5;

        float currentDepth = projCoords.z;
        float shadow = 1.0;

        vec2 texelSize = 1.0 / vec2(512.0, 512.0);
        for (int x = -3; x <= 3; ++x) {
            for (int y = -3; y <= 3; ++y) {
                float pcfDepth = texture2D(u_ShadowMap, projCoords.xy + vec2(x, y) * texelSize).r;
                float diff = currentDepth - pcfDepth;
                float weight = smoothstep(deMachThreshold, deMachThreshold * 3.0, diff);
                shadow += 1.0 - weight;
            }
        }
        shadow /= 49.0;
        shadow = smoothstep(0.0, 1.0, shadow);
        return shadow;
    }

    void main() {
        vec3 normal = normalize(v_Normal);
        vec3 viewDir = normalize(v_ViewDirection);
        vec3 refractDir = refract(-viewDir, normal, 1.0 / refractiveIndex);
        vec3 refractColor = textureCube(u_envCubeMap, refractDir).rgb;

        // 反射
        vec3 reflectDir = reflect(viewDir, normal);
        vec3 reflectColor = textureCube(u_envCubeMap, reflectDir).rgb;

        // Fresnel（邊緣高反射）
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), fresnelPower);
        vec3 glassColor = mix(refractColor, reflectColor, fresnel);

        // 陰影遮蔽
        float shadow = getShadow(v_PositionFromLight);
        glassColor *= shadow;

        // 高光
        vec3 lightDir = normalize(u_LightPosition - v_PositionInWorld);
        vec3 halfDir = normalize(lightDir + viewDir);
        float specular = pow(max(dot(normal, halfDir), 0.0), u_shininess);
        glassColor += vec3(1.0) * specular * u_Ks;

        // 最終顏色（半透明玻璃）
        gl_FragColor = vec4(glassColor, 0.5);
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