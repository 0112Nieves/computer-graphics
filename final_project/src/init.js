function init_shadow_program() {
    shadowProgram = compileShader(gl, VSHADER_SHADOW_SOURCE, FSHADER_SHADOW_SOURCE);
    shadowProgram.a_Position = gl.getAttribLocation(shadowProgram, 'a_Position');
    shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, 'u_MvpMatrix');
}

function init_cubemap_program(){
    var quad = new Float32Array(
    [
        -1, -1, 1,
        1, -1, 1,
        -1, 1, 1,
        -1, 1, 1,
        1, -1, 1,
        1, 1, 1
    ]); //just a quad

    programEnvCube = compileShader(gl, VSHADER_SOURCE_ENVCUBE, FSHADER_SOURCE_ENVCUBE);
    programEnvCube.a_Position = gl.getAttribLocation(programEnvCube, 'a_Position');
    programEnvCube.u_envCubeMap = gl.getUniformLocation(programEnvCube, 'u_envCubeMap');
    programEnvCube.u_viewDirectionProjectionInverse = gl.getUniformLocation(programEnvCube, 'u_viewDirectionProjectionInverse');

    cubeMapTex = initCubeTexture("./cubemap/pos-x.png", "./cubemap/neg-x.png", "./cubemap/pos-y.png", "./cubemap/neg-y.png",
        "./cubemap/pos-z.png", "./cubemap/neg-z.png", 512, 512)

    quadObj = initVertexBufferForLaterUse(gl, quad);
}

function init_texture_program() {
    programTexture = compileShader(gl, VSHADER_SOURCE_TEXTURE, FSHADER_SOURCE_TEXTURE);
    programTexture.a_Position = gl.getAttribLocation(programTexture, 'a_Position');
    programTexture.a_Normal = gl.getAttribLocation(programTexture, 'a_Normal');
    programTexture.a_TexCoord = gl.getAttribLocation(programTexture, 'a_TexCoord');
    programTexture.u_MvpMatrix = gl.getUniformLocation(programTexture, 'u_MvpMatrix');
    programTexture.u_modelMatrix = gl.getUniformLocation(programTexture, 'u_modelMatrix');
    programTexture.u_normalMatrix = gl.getUniformLocation(programTexture, 'u_normalMatrix');
    programTexture.u_LightPosition = gl.getUniformLocation(programTexture, 'u_LightPosition');
    programTexture.u_Ka = gl.getUniformLocation(programTexture, 'u_Ka');
    programTexture.u_Kd = gl.getUniformLocation(programTexture, 'u_Kd');
    programTexture.u_Ks = gl.getUniformLocation(programTexture, 'u_Ks');
    programTexture.u_Shininess = gl.getUniformLocation(programTexture, 'u_Shininess');
    programTexture.u_Sampler = gl.getUniformLocation(programTexture, 'u_Sampler');
    programTexture.u_ViewPosition = gl.getUniformLocation(programTexture, 'u_ViewPosition');
    programTexture.u_ShadowMap = gl.getUniformLocation(programTexture, 'u_ShadowMap');
    programTexture.u_ShadowMatrix = gl.getUniformLocation(programTexture, 'u_ShadowMatrix');
}

function init_normal_program() {
    program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    program.a_Position = gl.getAttribLocation(program, 'a_Position'); 
    program.a_Normal = gl.getAttribLocation(program, 'a_Normal'); 
    program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix'); 
    program.u_modelMatrix = gl.getUniformLocation(program, 'u_modelMatrix'); 
    program.u_normalMatrix = gl.getUniformLocation(program, 'u_normalMatrix');
    program.u_LightPosition = gl.getUniformLocation(program, 'u_LightPosition');
    program.u_ViewPosition = gl.getUniformLocation(program, 'u_ViewPosition');
    program.u_MvpMatrixOfLight = gl.getUniformLocation(program, 'u_MvpMatrixOfLight'); 
    program.u_Ka = gl.getUniformLocation(program, 'u_Ka'); 
    program.u_Kd = gl.getUniformLocation(program, 'u_Kd');
    program.u_Ks = gl.getUniformLocation(program, 'u_Ks');
    program.u_shininess = gl.getUniformLocation(program, 'u_shininess');
    program.u_ShadowMap = gl.getUniformLocation(program, "u_ShadowMap");
    program.u_envCubeMap = gl.getUniformLocation(program, 'u_envCubeMap');
}