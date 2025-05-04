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
    uniform vec3 u_LightPosition;
    uniform vec3 u_ViewPosition;
    uniform float u_Ka;
    uniform float u_Kd;
    uniform float u_Ks;
    uniform float u_shininess;
    uniform vec3 u_Color;
    varying vec3 v_Normal;
    varying vec3 v_PositionInWorld;
    void main(){
        // let ambient and diffuse color are u_Color 
        // (you can also input them from ouside and make them different)
        vec3 ambientLightColor = u_Color;
        vec3 diffuseLightColor = u_Color;
        // assume white specular light (you can also input it from ouside)
        vec3 specularLightColor = vec3(1.0, 1.0, 1.0);        

        vec3 ambient = ambientLightColor * u_Ka;

        vec3 normal = normalize(v_Normal);
        vec3 lightDirection = normalize(u_LightPosition - v_PositionInWorld);
        float nDotL = max(dot(lightDirection, normal), 0.0);
        vec3 diffuse = diffuseLightColor * u_Kd * nDotL;

        vec3 specular = vec3(0.0, 0.0, 0.0);
        if(nDotL > 0.0) {
            vec3 R = reflect(-lightDirection, normal);
            // V: the vector, point to viewer       
            vec3 V = normalize(u_ViewPosition - v_PositionInWorld); 
            float specAngle = clamp(dot(R, V), 0.0, 1.0);
            specular = u_Ks * pow(specAngle, u_shininess) * specularLightColor; 
        }

        gl_FragColor = vec4( ambient + diffuse + specular, 1.0 );
    }
`;

function compileShader(gl, vShaderText, fShaderText){
    //////Build vertex and fragment shader objects
    var vertexShader = gl.createShader(gl.VERTEX_SHADER)
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    //The way to  set up shader text source
    gl.shaderSource(vertexShader, vShaderText)
    gl.shaderSource(fragmentShader, fShaderText)
    //compile vertex shader
    gl.compileShader(vertexShader)
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        console.log('vertex shader ereror');
        var message = gl.getShaderInfoLog(vertexShader); 
        console.log(message);//print shader compiling error message
    }
    //compile fragment shader
    gl.compileShader(fragmentShader)
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        console.log('fragment shader ereror');
        var message = gl.getShaderInfoLog(fragmentShader);
        console.log(message);//print shader compiling error message
    }

    /////link shader to program (by a self-define function)
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    //if not success, log the program info, and delete it.
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
        alert(gl.getProgramInfoLog(program) + "");
        gl.deleteProgram(program);
    }

    return program;
}

/////BEGIN:///////////////////////////////////////////////////////////////////////////////////////////////
/////The folloing three function is for creating vertex buffer, but link to shader to user later//////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////
function initAttributeVariable(gl, a_attribute, buffer){
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
  gl.enableVertexAttribArray(a_attribute);
}

function initArrayBufferForLaterUse(gl, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // Store the necessary information to assign the object to the attribute variable later
  buffer.num = num;
  buffer.type = type;

  return buffer;
}

function initVertexBufferForLaterUse(gl, vertices, normals, texCoords){
  var nVertices = vertices.length / 3;

  var o = new Object();
  o.vertexBuffer = initArrayBufferForLaterUse(gl, new Float32Array(vertices), 3, gl.FLOAT);
  if( normals != null ) o.normalBuffer = initArrayBufferForLaterUse(gl, new Float32Array(normals), 3, gl.FLOAT);
  if( texCoords != null ) o.texCoordBuffer = initArrayBufferForLaterUse(gl, new Float32Array(texCoords), 2, gl.FLOAT);
  //you can have error check here
  o.numVertices = nVertices;

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}
/////END://///////////////////////////////////////////////////////////////////////////////////////////////
/////The folloing three function is for creating vertex buffer, but link to shader to user later//////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////

///// normal vector calculation (for the cube)
function getNormalOnVertices(vertices){
  var normals = [];
  var nTriangles = vertices.length/9;
  for(let i=0; i < nTriangles; i ++ ){
      var idx = i * 9 + 0 * 3;
      var p0x = vertices[idx+0], p0y = vertices[idx+1], p0z = vertices[idx+2];
      idx = i * 9 + 1 * 3;
      var p1x = vertices[idx+0], p1y = vertices[idx+1], p1z = vertices[idx+2];
      idx = i * 9 + 2 * 3;
      var p2x = vertices[idx+0], p2y = vertices[idx+1], p2z = vertices[idx+2];

      var ux = p1x - p0x, uy = p1y - p0y, uz = p1z - p0z;
      var vx = p2x - p0x, vy = p2y - p0y, vz = p2z - p0z;

      var nx = uy*vz - uz*vy;
      var ny = uz*vx - ux*vz;
      var nz = ux*vy - uy*vx;

      var norm = Math.sqrt(nx*nx + ny*ny + nz*nz);
      nx = nx / norm;
      ny = ny / norm;
      nz = nz / norm;

      normals.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
  }
  return normals;
}

var mouseLastX, mouseLastY;
var mouseDragging = false;
var angleX = 0, angleY = 0;
var gl, canvas;
var mvpMatrix;
var modelMatrix;
var normalMatrix;
var nVertex;
var cameraX = 3, cameraY = 3, cameraZ = 16;
var cube = [];
var sphere = [];
var cylinder = [];
var pyramid = [];
var matStack = [];
var moveDistance = 0;
var rotateAngle = 0;
var Radius = 0.7;

var grab = false;
var canGrab = false;

var tx = 0;
var tz = 0;
var ox = 0;
var oz = 1.5;
var zoom = 0;
let maxZ = 30;

var CarJoint1 = 0.0;
var CarJoint2 = 0.0;
var CarJoint3 = 0.0;
var ObjectJointRight = 0.0;
var ObjectJointLeft = 0.0;

async function main(){
    canvas = document.getElementById('webgl');
    gl = canvas.getContext('webgl2');
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return ;
    }

    program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);

    gl.useProgram(program);

    program.a_Position = gl.getAttribLocation(program, 'a_Position'); 
    program.a_Normal = gl.getAttribLocation(program, 'a_Normal'); 
    program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix'); 
    program.u_modelMatrix = gl.getUniformLocation(program, 'u_modelMatrix'); 
    program.u_normalMatrix = gl.getUniformLocation(program, 'u_normalMatrix');
    program.u_LightPosition = gl.getUniformLocation(program, 'u_LightPosition');
    program.u_ViewPosition = gl.getUniformLocation(program, 'u_ViewPosition');
    program.u_Ka = gl.getUniformLocation(program, 'u_Ka'); 
    program.u_Kd = gl.getUniformLocation(program, 'u_Kd');
    program.u_Ks = gl.getUniformLocation(program, 'u_Ks');
    program.u_shininess = gl.getUniformLocation(program, 'u_shininess');
    program.u_Color = gl.getUniformLocation(program, 'u_Color'); 

    response = await fetch('./object/cube.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for( let i=0; i < obj.geometries.length; i ++ ){
      let o = initVertexBufferForLaterUse(gl, 
                                          obj.geometries[i].data.position,
                                          obj.geometries[i].data.normal, 
                                          obj.geometries[i].data.texcoord);
      cube.push(o);
    }

    response = await fetch('./object/pyramid.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for( let i=0; i < obj.geometries.length; i ++ ){
      let o = initVertexBufferForLaterUse(gl, 
                                          obj.geometries[i].data.position,
                                          obj.geometries[i].data.normal, 
                                          obj.geometries[i].data.texcoord);
      pyramid.push(o);
    }

    response = await fetch('./object/sphere.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for( let i=0; i < obj.geometries.length; i ++ ){
      let o = initVertexBufferForLaterUse(gl, 
                                          obj.geometries[i].data.position,
                                          obj.geometries[i].data.normal, 
                                          obj.geometries[i].data.texcoord);
      sphere.push(o);
    }

    response = await fetch('./object/cylinder.obj');
    text = await response.text();
    obj = parseOBJ(text);
    for( let i=0; i < obj.geometries.length; i ++ ){
      let o = initVertexBufferForLaterUse(gl, 
                                          obj.geometries[i].data.position,
                                          obj.geometries[i].data.normal, 
                                          obj.geometries[i].data.texcoord);
      cylinder.push(o);
    }

    mvpMatrix = new Matrix4();
    modelMatrix = new Matrix4();
    normalMatrix = new Matrix4();

    gl.enable(gl.DEPTH_TEST);

    document.getElementById('CarJoint1').addEventListener('input', function() {
        CarJoint1 = parseInt(this.value);
        CarJoint1 /= 2;
    });
    document.getElementById('CarJoint2').addEventListener('input', function() {
        CarJoint2 = parseInt(this.value);
        CarJoint2 /= 3;
    });
    document.getElementById('CarJoint3').addEventListener('input', function() {
        CarJoint3 = parseInt(this.value);
        CarJoint3 /= 5;
    });
    document.getElementById('tx').addEventListener('input', function() {
        tx = parseInt(this.value);
        tx /= 90;
    });
    document.getElementById('tz').addEventListener('input', function() {
        tz = parseInt(this.value);
        tz /= 90;
    });
    document.getElementById('ox').addEventListener('input', function() {
        ox = parseInt(this.value);
        ox /= 90;
    });
    document.getElementById('oz').addEventListener('input', function() {
        oz = parseInt(this.value);
        oz /= 90;
    });
    document.getElementById('ObjectJointRight').addEventListener('input', function() {
        ObjectJointRight = parseInt(this.value);
        ObjectJointRight /= 8;
    });
    document.getElementById('ObjectJointLeft').addEventListener('input', function() {
        ObjectJointLeft = parseInt(this.value);
        ObjectJointLeft /= 8;
    });
    document.getElementById('zoom').addEventListener('input', function() {
        cameraZ = maxZ - parseFloat(this.value);
    });

    document.addEventListener('keydown', (event)=> {    
        if ( event.key == ' '){
            if(canGrab) grab = !grab;
            draw(gl)
        }
    });

    var tick = function() {
        draw(gl);
        requestAnimationFrame(tick);
    }
    tick();

    canvas.onmousedown = function(ev){mouseDown(ev)};
    canvas.onmousemove = function(ev){mouseMove(ev)};
    canvas.onmouseup = function(ev){mouseUp(ev)};

    var slider1 = document.getElementById("move");
    slider1.oninput = function() {
        moveDistance = this.value/60.0
        draw();
    }

    var slider2 = document.getElementById("rotate");
    slider2.oninput = function() {
        rotateAngle = this.value 
        draw();
    }
}

/////Call drawOneObject() here to draw all object one by one 
////   (setup the model matrix and color to draw)drawOneObject
function draw(){
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let groundMatrix = new Matrix4();
    let CarMatrix = new Matrix4();
    let rbtireMdlMatrix = new Matrix4();
    let lbtireMdlMatrix = new Matrix4();
    let rftireMdlMatrix = new Matrix4();
    let lftireMdlMatrix = new Matrix4();
    let lightMarkerMatrix = new Matrix4();

    lightMarkerMatrix.setTranslate(0, 5, 3);
    lightMarkerMatrix.scale(0.1, 0.1, 0.1);
    drawOneObject(cube, lightMarkerMatrix, 1.0, 1.0, 0.4);

    groundMatrix.scale(2.5, 0.2, 2.5);
    drawOneObject(cube, groundMatrix, 1.0, 0.4, 0.4);

    // Car Body
    CarMatrix.setTranslate(tx, 0, tz);
    CarMatrix.translate(0, 0.7, 0);
    matStack.push(new Matrix4(CarMatrix));
    CarMatrix.scale(0.5, 0.35, 0.9);
    drawOneObject(cube, CarMatrix, 0.4, 0.4, 1.0);
    CarMatrix = matStack.pop();

    // Car Top
    CarMatrix.translate(0.0, 0.5, 0.0);
    matStack.push(new Matrix4(CarMatrix));
    CarMatrix.scale(0.45, 0.3, 0.45);
    drawOneObject(pyramid, CarMatrix, 0.4, 0.4, 1.0);
    CarMatrix = matStack.pop();

    // Tire
    rbtireMdlMatrix.setTranslate(tx, 0, tz);
    rbtireMdlMatrix.translate(0.55, 0.4, 0.6);
    rbtireMdlMatrix.rotate(-90.0, 0.0, 0.0, 1.0);
    rbtireMdlMatrix.scale(0.02, 0.003, 0.02);
    drawOneObject(cylinder, rbtireMdlMatrix, 0.0, 0.0, 0.0);

    lbtireMdlMatrix.setTranslate(tx, 0, tz);
    lbtireMdlMatrix.translate(0.55, 0.4, -0.6);
    lbtireMdlMatrix.rotate(-90.0, 0.0, 0.0, 1.0);
    lbtireMdlMatrix.scale(0.02, 0.003, 0.02);
    drawOneObject(cylinder, lbtireMdlMatrix, 0.0, 0.0, 0.0);

    rftireMdlMatrix.setTranslate(tx, 0, tz);
    rftireMdlMatrix.translate(-0.55, 0.4, 0.6);
    rftireMdlMatrix.rotate(-90.0, 0.0, 0.0, 1.0);
    rftireMdlMatrix.scale(0.02, 0.003, 0.02);
    drawOneObject(cylinder, rftireMdlMatrix, 0.0, 0.0, 0.0);

    lftireMdlMatrix.setTranslate(tx, 0, tz);
    lftireMdlMatrix.translate(-0.55, 0.4, -0.6);
    lftireMdlMatrix.rotate(-90.0, 0.0, 0.0, 1.0);
    lftireMdlMatrix.scale(0.02, 0.003, 0.02);
    drawOneObject(cylinder, lftireMdlMatrix, 0.0, 0.0, 0.0);

    // Joint 1
    CarMatrix.translate(0.0, 0.35, 0.0);
    CarMatrix.rotate(CarJoint1, 1.0, 0.0, 0.0);
    matStack.push(new Matrix4(CarMatrix));
    CarMatrix.scale(0.1, 0.1, 0.1);
    drawOneObject(sphere, CarMatrix, 1.0, 0.4, 0.4);
    CarMatrix = matStack.pop();

    // Arm 1
    CarMatrix.translate(0.0, 0.65, 0.0);
    matStack.push(new Matrix4(CarMatrix));
    CarMatrix.scale(0.01, 0.02, 0.01);
    drawOneObject(cylinder, CarMatrix, 0.4, 1.0, 0.4);
    CarMatrix = matStack.pop();

    // Joint 2
    CarMatrix.translate(0.0, 0.65, 0.0);
    CarMatrix.rotate(CarJoint2, 1.0, 0.0, 0.0);
    matStack.push(new Matrix4(CarMatrix));
    CarMatrix.scale(0.1, 0.1, 0.1);
    drawOneObject(sphere, CarMatrix, 1.0, 0.4, 0.4);
    CarMatrix = matStack.pop();

    // Arm 2
    CarMatrix.translate(0.0, 0.5, 0.0);
    matStack.push(new Matrix4(CarMatrix));
    CarMatrix.scale(0.01, 0.015, 0.01);
    drawOneObject(cylinder, CarMatrix, 0.4, 1.0, 0.4);
    CarMatrix = matStack.pop();

    // Joint 3
    CarMatrix.translate(0.0, 0.5, 0.0);
    CarMatrix.rotate(CarJoint3, 1.0, 0.0, 0.0);
    matStack.push(new Matrix4(CarMatrix));
    CarMatrix.scale(0.1, 0.1, 0.1);
    drawOneObject(sphere, CarMatrix, 1.0, 0.4, 0.4);
    CarMatrix = matStack.pop();

    // Paw
    CarMatrix.translate(0.0, 0.2, 0.0);
    matStack.push(new Matrix4(CarMatrix));
    CarMatrix.scale(0.1, 0.1, 0.1);
    drawOneObject(pyramid, CarMatrix, 1.0, 1.0, 0.4);
    CarMatrix = matStack.pop();

    // 初始化階段 (建議放在外層初始化一次)
    let objectPositionMatrix = new Matrix4();  // 物體位置
    let scaleMatrix = new Matrix4();           // 固定縮放
    scaleMatrix.setScale(0.2, 0.2, 0.2);

    // 更新物體位置矩陣
    objectPositionMatrix.setIdentity();
    objectPositionMatrix.setTranslate(ox, 0, oz);
    objectPositionMatrix.translate(0, 0.4, 0); // 垂直抬高物體

    // 計算物體完整變換矩陣
    let ObjectMatrix = new Matrix4(objectPositionMatrix);
    ObjectMatrix.multiply(scaleMatrix);

    // 取得車子與物體的世界座標
    let carPos = CarMatrix.elements;
    let carX = carPos[12], carY = carPos[13], carZ = carPos[14];

    let objPos = ObjectMatrix.elements;
    let objX = objPos[12], objY = objPos[13], objZ = objPos[14];

    let distance = Math.sqrt((carX - objX)**2 + (carY - objY)**2 + (carZ - objZ)**2);

    // 判斷距離與抓取狀態
    if (distance <= Radius) {
        canGrab = true;
    
        if (grab) {
            ObjectMatrix.setIdentity();
            ObjectMatrix.setTranslate(carX, 0, carZ);
            ObjectMatrix.translate(0, 0.4, 0);
            ObjectMatrix.scale(0.2, 0.2, 0.2);
            objPos.x = carX; objPos.z = carZ;
            ox = carX; oz = carZ;
        }        
        else{
            ObjectMatrix.setIdentity();
            ObjectMatrix.setTranslate(ox, 0, oz);
            ObjectMatrix.translate(0, 0.4, 0);
            ObjectMatrix.scale(0.2, 0.2, 0.2);
        }
    } else {
        canGrab = false;
    }
    
    // 畫物體，根據狀態決定顏色
    if (grab && distance <= Radius) {
        drawOneObject(sphere, ObjectMatrix, 0.2, 0.8, 0.2); // 綠色（已抓住）
    } else if (!grab && distance <= Radius) {
        drawOneObject(sphere, ObjectMatrix, 0.6, 1.0, 0.6); // 淺綠（可抓但未抓）
    } else if (!grab && distance > Radius) {
        drawOneObject(sphere, ObjectMatrix, 1.0, 1.0, 0.4); // 黃色（太遠不能抓）
    }

    var Objectright = new Matrix4(ObjectMatrix);
    Objectright.setTranslate(ox, 0.0, oz);
    Objectright.rotate(ObjectJointRight, 0.0, 1.0, 0.0);
    Objectright.translate(0.0, 0.4, -0.3);
    Objectright.scale(0.05, 0.05, 0.1);
    drawOneObject(cube, Objectright, 1.0, 1.0, 0.4);

    var Objectleft = new Matrix4(ObjectMatrix);
    Objectleft.setTranslate(ox, 0.0, oz);
    Objectleft.rotate(ObjectJointLeft, 0.0, 1.0, 0.0);
    Objectleft.translate(0.0, 0.4, 0.3);
    Objectleft.scale(0.05, 0.05, 0.1);
    drawOneObject(cube, Objectleft, 1.0, 1.0, 0.4);
}

function drawOneObject(obj, mdlMatrix, colorR, colorG, colorB){
    //model Matrix (part of the mvp matrix)
    modelMatrix.setRotate(angleY, 1, 0, 0);//for mouse rotation
    modelMatrix.rotate(angleX, 0, 1, 0);//for mouse rotation
    modelMatrix.multiply(mdlMatrix);
    //mvp: projection * view * model matrix  
    mvpMatrix.setPerspective(30, 1, 1, 100);
    mvpMatrix.lookAt(cameraX, cameraY, cameraZ, 0, 0, 0, 0, 1, 0);
    mvpMatrix.multiply(modelMatrix);

    //normal matrix
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();

    gl.uniform3f(program.u_LightPosition, 0, 5, 3);
    gl.uniform3f(program.u_ViewPosition, cameraX, cameraY, cameraZ);
    gl.uniform1f(program.u_Ka, 0.2);
    gl.uniform1f(program.u_Kd, 0.7);
    gl.uniform1f(program.u_Ks, 1.0);
    gl.uniform1f(program.u_shininess, 10.0);
    gl.uniform3f(program.u_Color, colorR, colorG, colorB);


    gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
    gl.uniformMatrix4fv(program.u_modelMatrix, false, modelMatrix.elements);
    gl.uniformMatrix4fv(program.u_normalMatrix, false, normalMatrix.elements);

    for( let i=0; i < obj.length; i ++ ){
      initAttributeVariable(gl, program.a_Position, obj[i].vertexBuffer);
      initAttributeVariable(gl, program.a_Normal, obj[i].normalBuffer);
      gl.drawArrays(gl.TRIANGLES, 0, obj[i].numVertices);
    }
}

function interface() {
    canvas.onmousedown = function (ev) {
        mouseDown(ev);
    };
    canvas.onmousemove = function (ev) {
        mouseMove(ev);
    };
    canvas.onmouseup = function (ev) {
        mouseUp(ev);
    };
    var Slider = document.getElementById("Room");
    Slider.oninput = function () {
        room = this.value;
        draw();
    };
    //setup the call back function of tx Sliders
    var Slider = document.getElementById("Translate-X");
    Slider.oninput = function () {
        tx = this.value / 100.0;
        draw();
    };

    //setup the call back function of ty Sliders
    var Slider = document.getElementById("Translate-Z");
    Slider.oninput = function () {
        tz = this.value / 100.0;
        draw();
    };
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

  const noop = () => {};

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

function mouseDown(ev){ 
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();
    if( rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom){
        mouseLastX = x;
        mouseLastY = y;
        mouseDragging = true;
    }
}

function mouseUp(ev){ 
    mouseDragging = false;
}

function mouseMove(ev){ 
    var x = ev.clientX;
    var y = ev.clientY;
    if( mouseDragging ){
        var factor = 100/canvas.height; //100 determine the spped you rotate the object
        var dx = factor * (x - mouseLastX);
        var dy = factor * (y - mouseLastY);

        angleX += dx; //yes, x for y, y for x, this is right
        angleY += dy;
    }
    mouseLastX = x;
    mouseLastY = y;

    draw();
}