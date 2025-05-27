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
var fbo;
var offScreenWidth = 8192, offScreenHeight = 8192;

var textures = {};

async function main() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl2');
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  init_cubemap_program();
  init_texture_program();
  init_normal_program();
  init_shadow_program();

  load_all_model();
  gl.enable(gl.DEPTH_TEST);

  await load_all_texture();
  fbo = initFrameBuffer(gl);
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

  // === Shadow map rendering ===
  gl.useProgram(shadowProgram);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.viewport(0, 0, offScreenWidth, offScreenHeight);
  gl.clearColor(0.0, 0.0, 0.0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  // Floor
  let floorMatrix = new Matrix4();
  floorMatrix.setIdentity();
  floorMatrix.translate(0.0, -2.5, -2.0);
  floorMatrix.scale(4.0, 0.1, 4.0);
  let floorMvpFromLight = drawOffScreen(cubeObj, floorMatrix);

  // mobile board
  let boardMatrix = new Matrix4();
  boardMatrix.setIdentity();
  boardMatrix.translate(boardPosition, 3.7, -2.5);
  boardMatrix.scale(0.6, 0.25, 0.25);
  let boardMvpFromLight = drawOffScreen(cubeObj, boardMatrix);

  // vodka bottle
  let bottleMatrix = new Matrix4();
  bottleMatrix.setIdentity();
  bottleMatrix.translate(0.0, 0.3, -2.0);
  bottleMatrix.scale(2.5, 2.5, 1.0);
  let bottleMvpFromLight = drawOffScreen(bottleObj, bottleMatrix);

  let MainControlMatrix = new Matrix4();
  let MainControlMvpFromLight = new Matrix4();
  if(third_view){
    MainControlMatrix.setIdentity();
    MainControlMatrix.translate(firstcameraX, firstcameraY, firstcameraZ);
    MainControlMatrix.scale(0.1, 0.1, 0.1);
    drawOffScreen(cubeObj, MainControlMatrix);
  }

  // cat
  let catMatrix = new Matrix4();
  catMatrix.setIdentity();
  catMatrix.translate(2.5, -2.3, -2.0);
  catMatrix.rotate(-90, 1, 0, 0);
  catMatrix.scale(5.0, 5.0, 5.0);
  let catMvpFromLight = drawOffScreen(catObj, catMatrix);

  // === Main object rendering ===
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.4, 0.4, 0.4, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  gl.useProgram(program);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.4,0.4,0.4,1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  drawOneObjectOnScreen(cubeObj, floorMatrix, floorMvpFromLight, projMatrix, viewMatrix);
  drawOneObjectOnScreen(cubeObj, boardMatrix, boardMvpFromLight, projMatrix, viewMatrix);
  drawOneObjectOnScreen(bottleObj, bottleMatrix, bottleMvpFromLight, projMatrix, viewMatrix);

  // cat
  gl.useProgram(programTexture);
  gl.depthFunc(gl.LESS);
  drawOneObjectWithTex(catObj, catMatrix, viewMatrix, projMatrix, programTexture);

  // main control
  if (third_view) {
    drawOneObjectOnScreen(cubeObj, MainControlMatrix, MainControlMvpFromLight, projMatrix, viewMatrix);
  }

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