let cubeObj = [];
let boardMatrix = new Matrix4();

async function load_all_model() {
    cubeObj = await load_one_model("./object/cube.obj");
    set_model();
}

function set_model(){
    boardMatrix.setIdentity();
    boardMatrix.scale(3, 3, 3);
}
