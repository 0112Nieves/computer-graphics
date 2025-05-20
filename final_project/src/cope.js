function compileShader(gl, vShaderText, fShaderText) {
  //////Build vertex and fragment shader objects
  var vertexShader = gl.createShader(gl.VERTEX_SHADER)
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
  //The way to  set up shader text source
  gl.shaderSource(vertexShader, vShaderText)
  gl.shaderSource(fragmentShader, fShaderText)
  //compile vertex shader
  gl.compileShader(vertexShader)
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.log('vertex shader ereror');
    var message = gl.getShaderInfoLog(vertexShader);
    console.log(message);//print shader compiling error message
  }
  //compile fragment shader
  gl.compileShader(fragmentShader)
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
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
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    alert(gl.getProgramInfoLog(program) + "");
    gl.deleteProgram(program);
  }

  return program;
}

function initAttributeVariable(gl, a_attribute, buffer) {
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

function initVertexBufferForLaterUse(gl, vertices, normals, texCoords) {
  var nVertices = vertices.length / 3;

  var o = new Object();
  o.vertexBuffer = initArrayBufferForLaterUse(gl, new Float32Array(vertices), 3, gl.FLOAT);
  if (normals != null) o.normalBuffer = initArrayBufferForLaterUse(gl, new Float32Array(normals), 3, gl.FLOAT);
  if (texCoords != null) o.texCoordBuffer = initArrayBufferForLaterUse(gl, new Float32Array(texCoords), 2, gl.FLOAT);
  //you can have error check here
  o.numVertices = nVertices;

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return o;
}

async function load_one_model(file_path) {
    obj_data = [];
    response = await fetch(file_path);
    text = await response.text();
    obj = parseOBJ(text);
    for (let i = 0; i < obj.geometries.length; i++) {
        let o = initVertexBufferForLaterUse(
            gl,
            obj.geometries[i].data.position,
            obj.geometries[i].data.normal,
            obj.geometries[i].data.texcoord
        );
        obj_data.push(o);
    }
    return obj_data;
}