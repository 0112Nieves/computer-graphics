let cubeObj = [];

function draw_all_shadow() {
    // groundMdlFromLight = drawOneObjectOnShadowfbo(cubeObj, groundMdlMatrix);
    // playerMdlFromLight = drawOneObjectOnShadowfbo(playerObj, playerMdlMatrix);
    // targetMdlFromLight = drawOneObjectOnShadowfbo(cubeObj, targetMdlMatrix);
    // gunMdlFromLight = drawOneObjectOnShadowfbo(gunObj, gunMdlMatrix);
    // wall1MdlFromLight = drawOneObjectOnShadowfbo(cubeObj, wall1MdlMatrix);
    // wall2MdlFromLight = drawOneObjectOnShadowfbo(cubeObj, wall2MdlMatrix);
}

async function load_all_model() {
    cubeObj = await load_one_model("./object/cube.obj");
}

let boardMatrix = new Matrix4();

function set_model(){
    boardMatrix.setIdentity();
    boardMatrix.scale(10, 10, 10);
}

function drawObject(gl, program, obj, mvpMatrix) {
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, obj.vertexBuffer);
  gl.vertexAttribPointer(program.a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(program.a_Position);

  gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 0, obj.numVertices);
}
