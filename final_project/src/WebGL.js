var mouseLastX, mouseLastY;
var mouseDragging = false;
var angleX = 0, angleY = 0;
var gl, canvas;
var modelMatrix;
var nVertex;
var cameraX = 0, cameraY = 0, cameraZ = 0;
var cameraDirX = 0, cameraDirY = 0, cameraDirZ = 1;
var cubeMapTex;

async function main() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl2');
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  program = compileShader(gl, VSHADER_SOURCE_ENVCUBE, FSHADER_SOURCE_ENVCUBE);
  program.a_Position = gl.getAttribLocation(program, 'a_Position');
  program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
  program.u_envCubeMap = gl.getUniformLocation(program, 'u_envCubeMap');

  // gl.useProgram(program);
  init_cubemap_program();
  // init_normal_porgram();

  load_all_model();
  draw_all();

  canvas.onmousedown = function (ev) { mouseDown(ev) };
  canvas.onmousemove = function (ev) { mouseMove(ev) };
  canvas.onmouseup = function (ev) { mouseUp(ev) };
  document.onkeydown = function (ev) { keydown(ev) };
}

function draw() {
  gl.useProgram(program);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.4, 0.4, 0.4, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  var mvpFromCamera = new Matrix4();
  // //model Matrix (part of the mvp matrix)
  let modelMatrix = new Matrix4();
  modelMatrix.setScale(2.0, 2.0, 2.0);
  // //mvp: projection * view * model matrix  
  mvpFromCamera.setPerspective(60, 1, 1, 15);
  let rotateMatrix = new Matrix4();
  rotateMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
  rotateMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
  var viewDir = new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
  var newViewDir = rotateMatrix.multiplyVector3(viewDir);
  mvpFromCamera.lookAt(cameraX, cameraY, cameraZ,
    cameraX + newViewDir.elements[0],
    cameraY + newViewDir.elements[1],
    cameraZ + newViewDir.elements[2],
    0, 1, 0);
  mvpFromCamera.multiply(modelMatrix);

  gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpFromCamera.elements);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTex);
  gl.uniform1i(program.u_envCubeMap, 0);

  //cube
  gl.useProgram(program);
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpFromCamera.elements);
  for (let i = 0; i < cubeObj.length; i++) {
    initAttributeVariable(gl, program.a_Position, cubeObj[i].vertexBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, cubeObj[i].numVertices);
  }
}

function draw_all() {
    var viewDir = new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
    var rotateMatrix = new Matrix4();
    rotateMatrix.setRotate(angleX, 0, -1, 0); //for mouse rotation
    rotateMatrix.rotate(angleY, 0, 0, -1); //for mouse rotation
    var newViewDir = rotateMatrix.multiplyVector3(viewDir);

    var vMatrix = new Matrix4();
    var pMatrix = new Matrix4();
    // pMatrix.setPerspective(view_size, 1, 1, 1000);

    // if (third_view) {
    //     vMatrix.lookAt(
    //         thirdcameraX,
    //         thirdcameraY,
    //         thirdcameraZ,
    //         thirdcameraX + newViewDir.elements[0],
    //         thirdcameraY + newViewDir.elements[1],
    //         thirdcameraZ + newViewDir.elements[2],
    //         0,
    //         1,
    //         0
    //     );
    // } else {
    //     vMatrix.lookAt(
    //         firstcameraX,
    //         firstcameraY,
    //         firstcameraZ,
    //         firstcameraX + newViewDir.elements[0],
    //         firstcameraY + newViewDir.elements[1],
    //         firstcameraZ + newViewDir.elements[2],
    //         0,
    //         1,
    //         0
    //     );
    // }

    var vpMatrix = new Matrix4();
    vpMatrix.set(pMatrix);
    vpMatrix.multiply(vMatrix);

    set_model();
    // gl.bindFramebuffer(gl.FRAMEBUFFER, shadowfbo);
    // gl.viewport(0, 0, offScreenWidth, offScreenHeight);
    // draw_shadow();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, -275, canvas.width, canvas.width);
    drawObject(gl, program, cubeObj[0], boardMatrix);
    // draw_world(vMatrix, pMatrix, vpMatrix);

    // draw_all_reflection_object(vpMatrix);
}

function draw_world(vMatrix, pMatrix, vpMatrix) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    draw_cubemap(cubeMapTex, vMatrix, pMatrix);

    draw_all_object(vpMatrix);
}

function draw_shadow() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    draw_all_shadow();
}

function draw_cubemap(Tex, vMatrix, pMatrix) {
  var vpFromCamera = new Matrix4();
  vpFromCamera.set(pMatrix);
  vMatrix.elements[12] = 0; //ignore translation
  vMatrix.elements[13] = 0;
  vMatrix.elements[14] = 0;
  vpFromCamera.multiply(vMatrix);
  var vpFromCameraInverse = vpFromCamera.invert();

  //quad
  gl.useProgram(programEnvCube);
  gl.depthFunc(gl.LEQUAL);
  gl.uniformMatrix4fv(
    programEnvCube.u_viewDirectionProjectionInverse,
    false,
    vpFromCameraInverse.elements
  );
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, Tex);
  gl.uniform1i(programEnvCube.u_envCubeMap, 0);
  initAttributeVariable(gl, programEnvCube.a_Position, quadObj.vertexBuffer);
  gl.drawArrays(gl.TRIANGLES, 0, quadObj.numVertices);
}


function parseOBJ(text) {
  // because indices are base 1 let's just fill in the 0th data
  const objPositions = [[0, 0, 0]];
  const objTexcoords = [[0, 0]];
  const objNormals = [[0, 0, 0]];

  // same order as `f` indices
  const objVertexData = [
    objPositions,
    objTexcoords,
    objNormals,
  ];

  // same order as `f` indices
  let webglVertexData = [
    [],   // positions
    [],   // texcoords
    [],   // normals
  ];

  const materialLibs = [];
  const geometries = [];
  let geometry;
  let groups = ['default'];
  let material = 'default';
  let object = 'default';

  const noop = () => { };

  function newGeometry() {
    // If there is an existing geometry and it's
    // not empty then start a new one.
    if (geometry && geometry.data.position.length) {
      geometry = undefined;
    }
  }

  function setGeometry() {
    if (!geometry) {
      const position = [];
      const texcoord = [];
      const normal = [];
      webglVertexData = [
        position,
        texcoord,
        normal,
      ];
      geometry = {
        object,
        groups,
        material,
        data: {
          position,
          texcoord,
          normal,
        },
      };
      geometries.push(geometry);
    }
  }

  function addVertex(vert) {
    const ptn = vert.split('/');
    ptn.forEach((objIndexStr, i) => {
      if (!objIndexStr) {
        return;
      }
      const objIndex = parseInt(objIndexStr);
      const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
      webglVertexData[i].push(...objVertexData[i][index]);
    });
  }

  const keywords = {
    v(parts) {
      objPositions.push(parts.map(parseFloat));
    },
    vn(parts) {
      objNormals.push(parts.map(parseFloat));
    },
    vt(parts) {
      // should check for missing v and extra w?
      objTexcoords.push(parts.map(parseFloat));
    },
    f(parts) {
      setGeometry();
      const numTriangles = parts.length - 2;
      for (let tri = 0; tri < numTriangles; ++tri) {
        addVertex(parts[0]);
        addVertex(parts[tri + 1]);
        addVertex(parts[tri + 2]);
      }
    },
    s: noop,    // smoothing group
    mtllib(parts, unparsedArgs) {
      // the spec says there can be multiple filenames here
      // but many exist with spaces in a single filename
      materialLibs.push(unparsedArgs);
    },
    usemtl(parts, unparsedArgs) {
      material = unparsedArgs;
      newGeometry();
    },
    g(parts) {
      groups = parts;
      newGeometry();
    },
    o(parts, unparsedArgs) {
      object = unparsedArgs;
      newGeometry();
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; ++lineNo) {
    const line = lines[lineNo].trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }
    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);
    const handler = keywords[keyword];
    if (!handler) {
      console.warn('unhandled keyword:', keyword);  // eslint-disable-line no-console
      continue;
    }
    handler(parts, unparsedArgs);
  }

  // remove any arrays that have no entries.
  for (const geometry of geometries) {
    geometry.data = Object.fromEntries(
      Object.entries(geometry.data).filter(([, array]) => array.length > 0));
  }

  return {
    geometries,
    materialLibs,
  };
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

function initCubeTexture(posXName, negXName, posYName, negYName,
  posZName, negZName, imgWidth, imgHeight) {
  var texture = gl.createTexture();

  const faceInfos = [
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      fName: posXName,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      fName: negXName,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      fName: posYName,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      fName: negYName,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      fName: posZName,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      fName: negZName,
    },
  ];
  faceInfos.forEach((faceInfo) => {
    const { target, fName } = faceInfo;
    // setup each face so it's immediately renderable (avoid error message)
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texImage2D(target, 0, gl.RGBA, imgWidth, imgHeight, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, null);

    var image = new Image();
    image.onload = function () {
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      // gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
      // gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    };
    image.src = fName;
  });

  return texture;
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