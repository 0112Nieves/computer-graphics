var mouseLastX, mouseLastY;
var mouseDragging = false;
var angleX = 0, angleY = 0;
var gl, canvas;
var mvpMatrix;
var modelMatrix = new Matrix4();
var normalMatrix = new Matrix4();
var nVertex = new Matrix4();
var cubeMapTex;
var objComponents = [];
var quadObj;
var boardPosition = 0.5;
let boardDirection = 1;
var lightX = 5.0, lightY = 5.0, lightZ = 5.0;

let cubeObj = [];
let bottleObj = [];
let catObj = [];
var boardMatrix = new Matrix4();
var bottleMatrix = new Matrix4();
var catMatrix = new Matrix4();
var MainControlMatrix = new Matrix4();
var textures = {};

async function main() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl2');
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

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

  program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
  program.a_Position = gl.getAttribLocation(program, 'a_Position');
  program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
  program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
  program.u_modelMatrix = gl.getUniformLocation(program, 'u_modelMatrix');
  program.u_normalMatrix = gl.getUniformLocation(program, 'u_normalMatrix');
  program.u_ViewPosition = gl.getUniformLocation(program, 'u_ViewPosition');
  program.u_envCubeMap = gl.getUniformLocation(program, 'u_envCubeMap');
  program.u_LightPosition = gl.getUniformLocation(program, 'u_LightPosition');
  program.u_Ka = gl.getUniformLocation(program, 'u_Ka');
  program.u_Kd = gl.getUniformLocation(program, 'u_Kd');
  program.u_Ks = gl.getUniformLocation(program, 'u_Ks');
  program.u_Shininess = gl.getUniformLocation(program, 'u_Shininess');

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

  response = await fetch('./object/cube.obj');
  text = await response.text();
  obj = parseOBJ(text);

  for (let i = 0; i < obj.geometries.length; i++) {
    let o = initVertexBufferForLaterUse(gl,
      obj.geometries[i].data.position,
      obj.geometries[i].data.normal,
      obj.geometries[i].data.texcoord);
    cubeObj.push(o);
  }

  response = await fetch('./object/sercups_vodka_glass.obj');
  text = await response.text();
  obj = parseOBJ(text);

  for (let i = 0; i < obj.geometries.length; i++) {
    let o = initVertexBufferForLaterUse(gl,
      obj.geometries[i].data.position,
      obj.geometries[i].data.normal,
      obj.geometries[i].data.texcoord);
    bottleObj.push(o);
  }

  response = await fetch('./object/cat.obj');
  text = await response.text();
  obj = parseOBJ(text);

  for (let i = 0; i < obj.geometries.length; i++) {
    let o = initVertexBufferForLaterUse(gl,
      obj.geometries[i].data.position,
      obj.geometries[i].data.normal,
      obj.geometries[i].data.texcoord);
    catObj.push(o);
  }

  cubeMapTex = initCubeTexture("./cubemap/pos-x.png", "./cubemap/neg-x.png", "./cubemap/pos-y.png", "./cubemap/neg-y.png",
    "./cubemap/pos-z.png", "./cubemap/neg-z.png", 512, 512)

  quadObj = initVertexBufferForLaterUse(gl, quad);

  gl.enable(gl.DEPTH_TEST);

  await load_all_texture();
  draw();

  canvas.onmousedown = function (ev) { mouseDown(ev) };
  canvas.onmousemove = function (ev) { mouseMove(ev) };
  canvas.onmouseup = function (ev) { mouseUp(ev) };
  document.onkeydown = function (ev) {
      keydown(ev); 
      interface(ev);
  };

  var tick = function () {
    boardPosition += 0.013 * boardDirection;

    if (boardPosition >= 1.3) {
      boardPosition = 1.3;
      boardDirection = -1;
    } else if (boardPosition <= -1.3) {
      boardPosition = -1.3;
      boardDirection = 1;
    }
    draw();
    requestAnimationFrame(tick);
  }
  tick();
}

function draw() {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.4, 0.4, 0.4, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  // rotate the camera view direction
  let rotateMatrix = new Matrix4();
  rotateMatrix.setRotate(angleY, 1, 0, 0);
  rotateMatrix.rotate(angleX, 0, 1, 0);
  let viewDir = new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
  let newViewDir = rotateMatrix.multiplyVector3(viewDir);

  let viewMatrix = new Matrix4();
  let projMatrix = new Matrix4();
  projMatrix.setPerspective(60, canvas.width / canvas.height, 1, 100);
  viewMatrix.setLookAt(cameraX, cameraY, cameraZ,
    cameraX + newViewDir.elements[0],
    cameraY + newViewDir.elements[1],
    cameraZ + newViewDir.elements[2],
    0, 1, 0);

  let viewMatrixRotationOnly = new Matrix4();
  viewMatrixRotationOnly.set(viewMatrix);
  let vpFromCameraRotationOnly = new Matrix4();
  vpFromCameraRotationOnly.set(projMatrix).multiply(viewMatrixRotationOnly);
  let vpFromCameraInverse = vpFromCameraRotationOnly.invert();

  // === Skybox ===
  gl.useProgram(programEnvCube);
  gl.depthFunc(gl.LEQUAL);
  gl.uniformMatrix4fv(programEnvCube.u_viewDirectionProjectionInverse,
    false, vpFromCameraInverse.elements);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
  gl.uniform1i(programEnvCube.u_envCubeMap, 0);
  initAttributeVariable(gl, programEnvCube.a_Position, quadObj.vertexBuffer);
  gl.drawArrays(gl.TRIANGLES, 0, quadObj.numVertices);

  // === Main object rendering ===
  gl.useProgram(program);
  gl.depthFunc(gl.LESS);
  gl.uniform3f(program.u_ViewPosition, cameraX, cameraY, cameraZ);
  gl.uniform1i(program.u_envCubeMap, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);

  // mobile board
  boardMatrix.setIdentity();
  boardMatrix.translate(boardPosition, 2.0, -2.5);
  boardMatrix.scale(0.6, 0.25, 0.25);
  drawOneObject(cubeObj, boardMatrix, viewMatrix, projMatrix);

  // vodka bottle
  bottleMatrix.setIdentity();
  bottleMatrix.translate(0.0, -1.0, -2.0);
  bottleMatrix.scale(2.5, 2.5, 1.0);
  drawOneObject(bottleObj, bottleMatrix, viewMatrix, projMatrix);

  // cat
  gl.useProgram(programTexture);
  gl.depthFunc(gl.LESS);
  catMatrix.setIdentity();
  catMatrix.translate(2.5, -2.0, -2.0);
  catMatrix.rotate(-90, 1, 0, 0);
  catMatrix.scale(5.0, 5.0, 5.0);
  drawOneObjectWithTex(catObj, catMatrix, viewMatrix, projMatrix, programTexture);

  // main control
  if (third_view) {
    MainControlMatrix.setIdentity();
    MainControlMatrix.translate(firstcameraX, firstcameraY, firstcameraZ);
    MainControlMatrix.scale(0.1, 0.1, 0.1);
    drawOneObject(cubeObj, MainControlMatrix, viewMatrix, projMatrix);
  }
}

function drawOneObject(obj, mdlMatrix, viewMatrix, projMatrix) {
  gl.useProgram(program);
  gl.depthFunc(gl.LESS);
  
  let modelMatrix = new Matrix4();
  modelMatrix.set(mdlMatrix);

  let mvpMatrix = new Matrix4();
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

  let normalMatrix = new Matrix4();
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();

  gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(program.u_modelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(program.u_normalMatrix, false, normalMatrix.elements);
  gl.uniform3f(program.u_ViewPosition, cameraX, cameraY, cameraZ);
  gl.uniform3f(program.u_LightPosition, lightX, lightY, lightZ);
  gl.uniform1f(program.u_Ka, 0.2);
  gl.uniform1f(program.u_Kd, 0.7);
  gl.uniform1f(program.u_Ks, 0.5);
  gl.uniform1f(program.u_Shininess, 32.0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
  gl.uniform1i(program.u_envCubeMap, 0);

  for (let i = 0; i < obj.length; i++) {
    initAttributeVariable(gl, program.a_Position, obj[i].vertexBuffer);
    initAttributeVariable(gl, program.a_Normal, obj[i].normalBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
  }
}

async function load_all_texture() {
    return new Promise((resolve) => {
        var cat = new Image();
        cat.onload = function () {
            initTexture(gl, cat, "catTex");
            resolve();
        };
        cat.src = "./texture/cat.jpg";
    });
}

function initTexture(gl, img, texKey) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

    textures[texKey] = tex;
}

function drawOneObjectWithTex(obj, mdlMatrix, viewMatrix, projMatrix, program) {
    modelMatrix.set(mdlMatrix);

    let mvpMatrix = new Matrix4();
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

    let normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(program.u_normalMatrix, false, normalMatrix.elements);

    gl.uniform3f(program.u_LightPosition, lightX, lightY, lightZ);
    gl.uniform3f(program.u_ViewPosition, cameraX, cameraY, cameraZ);
    gl.uniform1f(program.u_Ka, 0.2);
    gl.uniform1f(program.u_Kd, 0.7);
    gl.uniform1f(program.u_Ks, 0.5);
    gl.uniform1f(program.u_Shininess, 32.0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures["catTex"]);
    gl.uniform1i(program.u_Sampler, 0);

    for (let i = 0; i < obj.length; i++) {
        initAttributeVariable(gl, program.a_Position, obj[i].vertexBuffer);
        initAttributeVariable(gl, program.a_Normal, obj[i].normalBuffer);
        if (obj[i].texCoordBuffer) {
            initAttributeVariable(gl, program.a_TexCoord, obj[i].texCoordBuffer);
        }
        gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
    }
}