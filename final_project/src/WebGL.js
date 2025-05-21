var mouseLastX, mouseLastY;
var mouseDragging = false;
var angleX = 0, angleY = 0;
var gl, canvas;
var mvpMatrix;
var modelMatrix = new Matrix4();
var normalMatrix = new Matrix4();
var nVertex = new Matrix4();
var cameraX = 0, cameraY = 0, cameraZ = 5;
var cameraDirX = 0, cameraDirY = 0, cameraDirZ = -1;
var cubeMapTex;
var objComponents = [];
var quadObj;
var boardPosition = 0.5;
let boardDirection = 1;

let cubeObj = [];
let bottleObj = [];
var boardMatrix = new Matrix4();
var bottleMatrix = new Matrix4();

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

  cubeMapTex = initCubeTexture("./cubemap/pos-x.png", "./cubemap/neg-x.png", "./cubemap/pos-y.png", "./cubemap/neg-y.png",
    "./cubemap/pos-z.png", "./cubemap/neg-z.png", 512, 512)

  quadObj = initVertexBufferForLaterUse(gl, quad);

  gl.enable(gl.DEPTH_TEST);

  draw();//draw it once before mouse move

  canvas.onmousedown = function (ev) { mouseDown(ev) };
  canvas.onmousemove = function (ev) { mouseMove(ev) };
  canvas.onmouseup = function (ev) { mouseUp(ev) };
  document.onkeydown = function (ev) { keydown(ev) };

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
  viewMatrixRotationOnly.elements[12] = 0;
  viewMatrixRotationOnly.elements[13] = 0;
  viewMatrixRotationOnly.elements[14] = 0;
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
  boardMatrix.translate(boardPosition, 2.0, 0.0);
  boardMatrix.scale(0.6, 0.2, 0.1);
  drawOneObject(cubeObj, boardMatrix, viewMatrix, projMatrix, 0.8, 0.9, 1.0);

  // vodka bottle
  bottleMatrix.setIdentity();
  bottleMatrix.translate(0.0, -1.0, -2.0);
  bottleMatrix.scale(2.5, 2.5, 0.1);
  drawOneObject(bottleObj, bottleMatrix, viewMatrix, projMatrix, 0.6, 0.6, 0.9);
}

function drawOneObject(obj, mdlMatrix, viewMatrix, projMatrix, colorR, colorG, colorB) {
  modelMatrix.setRotate(angleY, 1, 0, 0);
  modelMatrix.rotate(angleX, 0, 1, 0);
  modelMatrix.multiply(mdlMatrix);

  let mvpMatrix = new Matrix4();
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

  let normalMatrix = new Matrix4();
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();

  gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(program.u_modelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(program.u_normalMatrix, false, normalMatrix.elements);

  gl.uniform3f(program.u_LightPosition, 0, 5, 3);
  gl.uniform3f(program.u_Color, colorR, colorG, colorB);
  gl.uniform1f(program.u_Ka, 0.2);
  gl.uniform1f(program.u_Kd, 0.7);
  gl.uniform1f(program.u_Ks, 1.0);
  gl.uniform1f(program.u_shininess, 10.0);

  for (let i = 0; i < obj.length; i++) {
    initAttributeVariable(gl, program.a_Position, obj[i].vertexBuffer);
    initAttributeVariable(gl, program.a_Normal, obj[i].normalBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
  }
}
