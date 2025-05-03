let cubeObj = [];
let sphereObj = [];
let cylinderObj = [];
let pyramidObj = [];

async function load_all_model() {
    cubeObj = await load_one_model("./object/cube.obj");
    sphereObj = await load_one_model("./object/sphere.obj");
    cylinderObj = await load_one_model("./object/cylinder.obj");
    pyramidObj = await load_one_model("./object/pyramid.obj");
}

let lightMdlMatrix = new Matrix4();
let groundMdlMatrix = new Matrix4();
let carMdlMatrix = new Matrix4();
let rbtireMdlMatrix = new Matrix4();
let lbtireMdlMatrix = new Matrix4();
let rftireMdlMatrix = new Matrix4();
let lftireMdlMatrix = new Matrix4();
let carboxMdlMatrix = new Matrix4();
let arm1MdlMatrix = new Matrix4();
let joint1MdlMatrix = new Matrix4();
let arm2MdlMatrix = new Matrix4();
let joint2MdlMatrix = new Matrix4();
let pawMatrix = new Matrix4();

function set_mdl(){
    lightMdlMatrix.setTranslate(lightX, lightY, lightZ);
    lightMdlMatrix.scale(0.1, 0.1, 0.1);

    groundMdlMatrix.setScale(4.0, 0.1, 4.0);

    carMdlMatrix.setTranslate(tx, 0, tz);
    carMdlMatrix.scale(0.5, 0.35, 1);
    carMdlMatrix.translate(0, 1.6, 0);

    carboxMdlMatrix.setTranslate(tx, 1, tz - 0.4);
    carboxMdlMatrix.scale(0.4, 0.35, 0.5);

    rbtireMdlMatrix.setTranslate(tx, 0, tz);
    rbtireMdlMatrix.rotate(90.0, 0.0, 1.0, 0.0);
    rbtireMdlMatrix.translate(0.7, 0.1, 0.65);
    rbtireMdlMatrix.scale(0.2, 0.2, 0.2);

    lbtireMdlMatrix.setTranslate(tx, 0, tz);
    lbtireMdlMatrix.rotate(90.0, 0.0, 1.0, 0.0);
    lbtireMdlMatrix.translate(0.7, 0.1, -0.65);
    lbtireMdlMatrix.scale(0.2, 0.2, 0.2);

    rftireMdlMatrix.setTranslate(tx, 0, tz);
    rftireMdlMatrix.rotate(90.0, 0.0, 1.0, 0.0);
    rftireMdlMatrix.translate(-0.7, 0.1, 0.65);
    rftireMdlMatrix.scale(0.2, 0.2, 0.2);

    lftireMdlMatrix.setTranslate(tx, 0, tz);
    lftireMdlMatrix.rotate(90.0, 0.0, 1.0, 0.0);
    lftireMdlMatrix.translate(-0.7, 0.1, -0.65);
    lftireMdlMatrix.scale(0.2, 0.2, 0.2);

    arm1MdlMatrix.setTranslate(tx, 0, tz);
    arm1MdlMatrix.rotate((tz + 5) * 4, 1.0, 0.0, 0.0);
    arm1MdlMatrix.translate(0, 1.5, 0.5);
    arm1MdlMatrix.scale(0.2, 1, 0.2);

    joint1MdlMatrix.setTranslate(tx, 0.5, tz + 0.7);
    joint1MdlMatrix.rotate(90, 0.0, 0.0, 1.0);
    joint1MdlMatrix.rotate(tz * 5.5, 0.0, -1.0, 0.0);
    joint1MdlMatrix.translate(1.7, 0, 0.65);
    joint1MdlMatrix.scale(0.025, 0.01, 0.025);

    arm2MdlMatrix.setTranslate(tx, 0.5, tz + 0.7);
    arm2MdlMatrix.rotate(tz * 5.5, 1.0, 0.0, 0.0);
    arm2MdlMatrix.translate(0, 1.8, 0.7);
    arm2MdlMatrix.rotate((tx + 10) * 5, 1.0, 0.0, 0.0);
    arm2MdlMatrix.translate(0, 0.6, 0);
    arm2MdlMatrix.scale(0.2 * 0.9, 1 * 0.6, 0.2 * 0.9);

    joint2MdlMatrix.setTranslate(tx, 0.5, tz + 0.7);
    joint2MdlMatrix.rotate(90, 0.0, 0.0, 1.0);
    joint2MdlMatrix.rotate(tz * 5.5, 0.0, -1.0, 0.0);
    joint2MdlMatrix.translate(1.8, 0, 0.7);
    joint2MdlMatrix.rotate((tx + 10) * 5, 0.0, -1.0, 0.0);
    joint2MdlMatrix.translate(1.2, 0.0, 0.0);
    joint2MdlMatrix.scale(0.025, 0.01, 0.025);

    // set paw
}

function draw_all_object() {
    drawOneObject(
        cubeObj,
        lightMdlMatrix,
        1.0,
        1.0,
        1.0
    );
    drawOneObject(
        cubeObj,
        groundMdlMatrix,
        1.0,
        0.4,
        0.4
    );
    drawOneObject(
        cubeObj,
        carMdlMatrix,
        0.4,
        0.4,
        1.0
    );
    drawOneObject(
        cubeObj,
        carboxMdlMatrix,
        0.4,
        0.4,
        1.0
    );
    drawOneObject(
        sphereObj,
        rbtireMdlMatrix,
        0.0,
        0.0,
        0.0
    );
    drawOneObject(
        sphereObj,
        lbtireMdlMatrix,
        0.0,
        0.0,
        0.0
    );
    drawOneObject(
        sphereObj,
        rftireMdlMatrix,
        0.0,
        0.0,
        0.0
    );
    drawOneObject(
        sphereObj,
        lftireMdlMatrix,
        0.0,
        0.0,
        0.0
    );
    drawOneObject(
        cubeObj,
        arm1MdlMatrix,
        0.4,
        1.0,
        0.4
    );
    drawOneObject(
        cylinderObj,
        joint1MdlMatrix,
        1.0,
        1.0,
        0.4
    );
    drawOneObject(
        cubeObj,
        arm2MdlMatrix,
        0.4,
        1.0,
        1.0
    );
    drawOneObject(
        cylinderObj,
        joint2MdlMatrix,
        1.0,
        1.0,
        0.4
    );
    // set paw
}