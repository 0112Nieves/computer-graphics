var mouseLastX, mouseLastY;
var mouseDragging = false;
var angleX = 0, angleY = 0;
var gl, canvas;
var modelMatrix;
var nVertex;
var cameraX = 0, cameraY = 0, cameraZ = 7;
var lightX = 0, lightY = 0, lightZ = 7;
var cubeMapTex;
var cubeObj;
var rotateAngle = 0;
var textures = {};
var texCount = 0;
var numTextures = 1;

async function main(){

    canvas.onmousedown = function(ev){mouseDown(ev)};
    canvas.onmousemove = function(ev){mouseMove(ev)};
    canvas.onmouseup = function(ev){mouseUp(ev)};
}

function draw(){
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.4,0.4,0.4,1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  let vpMatrix = new Matrix4();
  vpMatrix.setPerspective(70, 1, 1, 100);
  vpMatrix.lookAt(cameraX, cameraY, cameraZ,   
                  0, 0, 0, 
                  0, 1, 0);

  let mdlMatrix = new Matrix4();
  mdlMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
  mdlMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
  mdlMatrix.scale(2, 2, 2);
  drawOneRegularObject(cubeObj, mdlMatrix, vpMatrix, 0.92, 1.0, 1.0);
}