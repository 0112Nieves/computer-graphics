// 折射/反射
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_modelMatrix;
    uniform mat4 u_normalMatrix;
    uniform mat4 u_MvpMatrixOfLight;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    varying vec4 v_PositionFromLight;
    void main(){
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionInWorld = (u_modelMatrix * a_Position).xyz; 
        v_Normal = normalize(vec3(u_normalMatrix * a_Normal));
        v_PositionFromLight = u_MvpMatrixOfLight * a_Position;
    }    
`;

var FSHADER_SOURCE = `
    precision mediump float;
    uniform vec3 u_ViewPosition;
    uniform samplerCube u_envCubeMap;
    uniform sampler2D u_ShadowMap;
    uniform vec3 u_LightPosition;
    uniform float u_Ka;
    uniform float u_Kd;
    uniform float u_Ks;
    uniform float u_Shininess;

    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    varying vec4 v_PositionFromLight;

    float getShadow(vec4 positionFromLight) {
        vec3 projCoords = positionFromLight.xyz / positionFromLight.w;
        projCoords = projCoords * 0.5 + 0.5;
        
        float currentDepth = projCoords.z;
        float shadow = 1.0;
        
        // PCF
        vec2 texelSize = 1.0 / vec2(512.0, 512.0);
        for(int x = -1; x <= 1; ++x) {
            for(int y = -1; y <= 1; ++y) {
                float pcfDepth = texture2D(u_ShadowMap, projCoords.xy + vec2(x, y) * texelSize).r;
                shadow -= currentDepth > pcfDepth ? 0.0 : 0.111;
            }
        }
        
        return shadow;
    }

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

        float shadow = getShadow(v_PositionFromLight);
        vec3 lightingColor = ambient + (diffuse + specularColor) * shadow;
        
        gl_FragColor = vec4(lightingColor, 0.65);
    }
`;