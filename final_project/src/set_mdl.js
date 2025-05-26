let cubeObj = [];
let bottleObj = [];
let catObj = [];

async function load_all_model() {
    cubeObj = await load_one_model("./object/cube.obj");
    bottleObj = await load_one_model('./object/sercups_vodka_glass.obj');
    catObj = await load_one_model("./object/cat.obj");
}