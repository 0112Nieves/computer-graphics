var mouseLastX, mouseLastY;
var mouseDragging = false;
var angleX = 0, angleY = 0;
var gl, canvas;
var mvpMatrix;
var modelMatrix;
var normalMatrix;
var nVertex;
var cameraX = 0, cameraY = 0, cameraZ = 5;
var cameraDirX = 0, cameraDirY = 0, cameraDirZ = -1;
var cubeMapTex;
var objComponents = [];
var quadObj;
var boardPosition = 0.5;
let boardDirection = 1; 

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
    objComponents.push(o);
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

    if (boardPosition >= 1.5) {
      boardPosition = 1.5;
      boardDirection = -1;
    } else if (boardPosition <= -1.5) {
      boardPosition = -1.5;
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

  //rotate the camera view direction
  let rotateMatrix = new Matrix4();
  rotateMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
  rotateMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
  var viewDir = new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
  var newViewDir = rotateMatrix.multiplyVector3(viewDir);

  var viewMatrix = new Matrix4();
  var projMatrix = new Matrix4();
  projMatrix.setPerspective(60, 1, 1, 15);
  viewMatrix.setLookAt(cameraX, cameraY, cameraZ,
    cameraX + newViewDir.elements[0],
    cameraY + newViewDir.elements[1],
    cameraZ + newViewDir.elements[2],
    0, 1, 0);
  var viewMatrixRotationOnly = new Matrix4();
  viewMatrixRotationOnly.set(viewMatrix);
  viewMatrixRotationOnly.elements[12] = 0; //ignore translation
  viewMatrixRotationOnly.elements[13] = 0;
  viewMatrixRotationOnly.elements[14] = 0;
  var vpFromCameraRotationOnly = new Matrix4();
  vpFromCameraRotationOnly.set(projMatrix).multiply(viewMatrixRotationOnly);
  var vpFromCameraInverse = vpFromCameraRotationOnly.invert();

  //draw the background quad
  gl.useProgram(programEnvCube);
  gl.depthFunc(gl.LEQUAL);
  gl.uniformMatrix4fv(programEnvCube.u_viewDirectionProjectionInverse,
    false, vpFromCameraInverse.elements);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
  gl.uniform1i(programEnvCube.u_envCubeMap, 0);
  initAttributeVariable(gl, programEnvCube.a_Position, quadObj.vertexBuffer);
  gl.drawArrays(gl.TRIANGLES, 0, quadObj.numVertices);


  //Draw the reflective cube
  gl.useProgram(program);
  gl.depthFunc(gl.LESS);
  //model Matrix (part of the mvp matrix)
  var modelMatrix = new Matrix4();
  modelMatrix.setScale(0.6, 0.2, 0.1);
  modelMatrix.translate(boardPosition, 12, 0);
  //mvp: projection * view * model matrix  
  var mvpMatrix = new Matrix4();
  mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

  //normal matrix
  var normalMatrix = new Matrix4();
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();

  gl.uniform3f(program.u_ViewPosition, cameraX, cameraY, cameraZ);
  gl.uniform1i(program.u_envCubeMap, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);

  gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
  gl.uniformMatrix4fv(program.u_modelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(program.u_normalMatrix, false, normalMatrix.elements);

  for (let i = 0; i < objComponents.length; i++) {
    initAttributeVariable(gl, program.a_Position, objComponents[i].vertexBuffer);
    initAttributeVariable(gl, program.a_Normal, objComponents[i].normalBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, objComponents[i].numVertices);
  }
}

function mouseDown(ev) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();
  if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
    mouseLastX = x;
    mouseLastY = y;
    mouseDragging = true;
  }
}

function mouseUp(ev) {
  mouseDragging = false;
}

function mouseMove(ev) {
  var x = ev.clientX;
  var y = ev.clientY;
  if (mouseDragging) {
    var factor = 100 / canvas.height; //100 determine the spped you rotate the object
    var dx = factor * (x - mouseLastX);
    var dy = factor * (y - mouseLastY);

    angleX += dx; //yes, x for y, y for x, this is right
    angleY += dy;
  }
  mouseLastX = x;
  mouseLastY = y;
  draw();
}

function keydown(ev) {
  //implment keydown event here
  let rotateMatrix = new Matrix4();
  rotateMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
  rotateMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
  var viewDir = new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
  var newViewDir = rotateMatrix.multiplyVector3(viewDir);

  if (ev.key == 'w') {
    cameraX += (newViewDir.elements[0] * 0.1);
    cameraY += (newViewDir.elements[1] * 0.1);
    cameraZ += (newViewDir.elements[2] * 0.1);
  }
  else if (ev.key == 's') {
    cameraX -= (newViewDir.elements[0] * 0.1);
    cameraY -= (newViewDir.elements[1] * 0.1);
    cameraZ -= (newViewDir.elements[2] * 0.1);
  }
  draw();
}