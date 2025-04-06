var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    varying vec4 v_Color;
    uniform mat4 u_modelMatrix;
    void main(){
        gl_Position = u_modelMatrix * a_Position;
        v_Color = a_Color;
    }    
`;

var FSHADER_SOURCE = `
    precision mediump float;
    varying vec4 v_Color;
    void main(){
        gl_FragColor = v_Color;
    }
`;

function createProgram(gl, vertexShader, fragmentShader){
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if(gl.getProgramParameter(program, gl.LINK_STATUS)){
        return program;
    }
    alert(gl.getProgramInfoLog(program) + "");
    gl.deleteProgram(program);
}

function compileShader(gl, vShaderText, fShaderText){
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(vertexShader, vShaderText);
    gl.shaderSource(fragmentShader, fShaderText);
    gl.compileShader(vertexShader);
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)){
        console.log('Vertex shader error:', gl.getShaderInfoLog(vertexShader));
    }
    gl.compileShader(fragmentShader);
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)){
        console.log('Fragment shader error:', gl.getShaderInfoLog(fragmentShader));
    }
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
        console.log('Program link error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }
    return program;
}

function initArrayBuffer( gl, data, num, type, attribute){
    var buffer = gl.createBuffer();
    if(!buffer){
        console.log("failed to create the buffere object");
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    var a_attribute = gl.getAttribLocation(gl.getParameter(gl.CURRENT_PROGRAM), attribute);

    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);

    return true;
}

function createCircleVertices(radius, segments, isSemiCircle = false) {
    const vertices = [0.0, 0.0]; // 圓心
    const angleStep = (isSemiCircle ? Math.PI : Math.PI * 2) / segments;

    for (let i = 0; i <= segments; i++) {
        const angle = i * angleStep;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        vertices.push(x, y);
    }

    return new Float32Array(vertices);
}

function drawCircleAtPosition(gl, transformMat, color = [1.0, 0.3, 0.2], radius = 1.0, segments = 30, isSemiCircle = false) {
    const vertices = createCircleVertices(radius, segments, isSemiCircle);

    const colorData = [];
    for (let i = 0; i <= segments + 1; i++) {
        colorData.push(...color); // 展開顏色 RGB
    }

    initArrayBuffer(gl, vertices, 2, gl.FLOAT, 'a_Position');
    initArrayBuffer(gl, new Float32Array(colorData), 3, gl.FLOAT, 'a_Color');

    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 2);
}


var transformMat = new Matrix4();
var matStack = [];
var transformationX = -0.5;
var transformationY = -0.5;
var scale = 0.7;
var joint1 = 0.0;
var joint2 = 0.0;
var joint3 = 0.9;
var u_modelMatrix;
function pushMatrix(){
    matStack.push(new Matrix4(transformMat));
}
function popMatrix(){
    transformMat = matStack.pop();
}

function updateJointAngles(joint1, joint2, joint3) {
    // 將這些值傳遞給 WebGL.js，更新 WebGL 中的變數
    // 假設 WebGL.js 中有三個變數來處理這些關節的旋轉
    window.joint1Angle = joint1;
    window.joint2Angle = joint2;
    window.joint3Angle = joint3;

    // 這裡可以調用 WebGL 渲染更新函數
    // 假設 WebGL.js 中有一個函數 updateScene() 來更新場景
    updateScene();
}

// 當使用者改變範圍條時，實時更新變數
document.getElementById('joint1').addEventListener('input', function() {
    let joint1 = parseInt(this.value);
    let joint2 = parseInt(document.getElementById('joint2').value);
    let joint3 = parseInt(document.getElementById('joint3').value);
    updateJointAngles(joint1, joint2, joint3);
});

document.getElementById('joint2').addEventListener('input', function() {
    let joint1 = parseInt(document.getElementById('joint1').value);
    let joint2 = parseInt(this.value);
    let joint3 = parseInt(document.getElementById('joint3').value);
    updateJointAngles(joint1, joint2, joint3);
});

document.getElementById('joint3').addEventListener('input', function() {
    let joint1 = parseInt(document.getElementById('joint1').value);
    let joint2 = parseInt(document.getElementById('joint2').value);
    let joint3 = parseInt(this.value);
    updateJointAngles(joint1, joint2, joint3);
});

function main(){
    var canvas = document.getElementById('webgl');
    var gl = canvas.getContext('webgl2');
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return ;
    }

    program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    document.addEventListener('keydown', function(event) {
        switch(event.key) {
            case 'ArrowUp':
                if(transformationY <= 0.75)
                    transformationY += 0.05;
                break;
            case 'ArrowDown':
                if(transformationY >= -1.0)
                    transformationY -= 0.05;
                break;
            case 'ArrowLeft':
                if(transformationX >= -1.0)
                    transformationX -= 0.05;
                break;
            case 'ArrowRight':
                if(transformationX <= 1.0)
                    transformationX += 0.05;
                break;
        }
    });
    document.addEventListener('wheel', function(event) {
        if (event.deltaY < 0) {
            if (scale < 2.0) {
                scale += 0.05;
            }
        }
        else if (event.deltaY > 0) {
            if (scale > 0.3) {
                scale -= 0.05;
            }
        }
    });
    document.getElementById('joint1').addEventListener('input', function() {
        joint1 = parseInt(this.value);
        joint1 /= 10;
    });
    document.getElementById('joint2').addEventListener('input', function() {
        joint2 = parseInt(this.value);
        joint2 /= 10;
    });
    document.getElementById('joint3').addEventListener('input', function() {
        joint3 = parseInt(this.value);
        joint3 /= 10;
    });

    var tick = function() {
        draw(gl);
        requestAnimationFrame(tick);
    }
    tick();
}

function draw(gl){
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    u_modelMatrix = gl.getUniformLocation(gl.getParameter(gl.CURRENT_PROGRAM), 'u_modelMatrix');
    
    var rectVertices = [ -0.5, 0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5 ]; 
    var triVertices = [ 0.0, 0.5, -0.5, -0.5, 0.5, -0.5 ];

    var orange = [ 1.0, 0.3, 0.2, 1.0, 0.3, 0.2, 1.0, 0.3, 0.2, 1.0, 0.3, 0.2 ];
    var navyBlue = [ 0.0, 0.6, 0.6, 0.0, 0.6, 0.6, 0.0, 0.6, 0.6, 0.0, 0.6, 0.6 ];
    var navyDarkBlue = [ 0.0, 0.4, 0.4, 0.0, 0.4, 0.4, 0.0, 0.4, 0.4, 0.0, 0.4, 0.4 ];
    var darkBlue = [ 0.03, 0.12, 0.43, 0.03, 0.12, 0.43, 0.03, 0.12, 0.43, 0.03, 0.12, 0.43 ];
    var yellow = [ 1.0, 0.84, 0.35, 1.0, 0.84, 0.35, 1.0, 0.84, 0.35, 1.0, 0.84, 0.35 ];
    var gray = [ 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6 ];

    // 底座
    square_position = initArrayBuffer(gl, new Float32Array(rectVertices), 2, gl.FLOAT, 'a_Position');
    square_color = initArrayBuffer(gl, new Float32Array(navyBlue), 3, gl.FLOAT, 'a_Color');
    transformMat.setIdentity();
    transformMat.translate(transformationX, transformationY, 0.0);
    transformMat.scale(scale, scale, 0.0);
    pushMatrix();
    transformMat.scale(0.7, 0.1, 0.0);
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectVertices.length/2);
    popMatrix();

    // 深藍身體
    square_color = initArrayBuffer(gl, new Float32Array(darkBlue), 3, gl.FLOAT, 'a_Color');
    transformMat.translate(0.0, 0.2, 0.0);
    // transformMat.rotate(-20, 0.0, 0.0, 1.0);
    pushMatrix();
    transformMat.scale(0.3, 0.3, 0.0);
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectVertices.length/2);
    popMatrix();

    // 橘色身體
    transformMat.translate(0.0, 0.10, 0.0);
    pushMatrix();
    square_color = initArrayBuffer(gl, new Float32Array(orange), 3, gl.FLOAT, 'a_Color');
    transformMat.scale(0.50, 0.28, 0.0);
    var left_joint = new Matrix4(transformMat);
    var right_joint_1 = new Matrix4(transformMat);
    //// 第一個長方形
    right_joint_1.rotate(joint1, 0.0, 0.0);
    right_joint_1.translate(0.7, 0.15, 0.0);
    right_joint_1.scale(0.5, 0.2, 0.0);
    square_color = initArrayBuffer(gl, new Float32Array(yellow), 3, gl.FLOAT, 'a_Color');
    gl.uniformMatrix4fv(u_modelMatrix, false, right_joint_1.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectVertices.length/2);
    square_color = initArrayBuffer(gl, new Float32Array(orange), 3, gl.FLOAT, 'a_Color');
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectVertices.length/2);
    right_joint_1.translate(0.5, 0.0, 0.0);
    right_joint_1.scale(0.04, 0.7, 0.0);
    //// 關節 + 第二個長方形
    var right_joint_2 = new Matrix4(right_joint_1);
    right_joint_2.scale(4.0, 1.0, 0.0);
    drawCircleAtPosition(gl, right_joint_2, [0.03, 0.12, 0.43], 1.0, 50, false);
    right_joint_2.rotate(joint2, 0.0, 0.0);
    right_joint_2.translate(4.0, 0.0, 0.0);
    right_joint_2.scale(6.0, 1.5, 0.0);
    square_position = initArrayBuffer(gl, new Float32Array(rectVertices), 2, gl.FLOAT, 'a_Position');
    square_color = initArrayBuffer(gl, new Float32Array(yellow), 3, gl.FLOAT, 'a_Color');
    gl.uniformMatrix4fv(u_modelMatrix, false, right_joint_2.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectVertices.length/2);
    right_joint_2.translate(3.5, 0.0, 0.0);
    right_joint_2.scale(5.0, 1.3, 0.0);
    //// 關節 + 三角形
    var right_joint_3 = new Matrix4(right_joint_2);
    right_joint_2.rotate(joint3, 0.0, 0.0);
    right_joint_3.translate(-0.6, 0.0, 0.0);
    right_joint_3.scale(0.04, 0.5, 0.0);
    drawCircleAtPosition(gl, right_joint_3, [0.03, 0.12, 0.43], 1.0, 50, false);
    triangle_position = initArrayBuffer(gl, new Float32Array(triVertices), 2, gl.FLOAT, 'a_Position');
    triangle_color = initArrayBuffer(gl, new Float32Array(gray), 3, gl.FLOAT, 'a_Color');
    right_joint_3.translate(1.0, 0.0, 0.0);
    right_joint_3.scale(2.2, 2.2, 0.0);
    gl.uniformMatrix4fv(u_modelMatrix, false, right_joint_3.elements);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    //// 左手臂
    left_joint.translate(-0.35, 0.15, 0.0);
    left_joint.scale(0.09, 0.15, 1.0);
    drawCircleAtPosition(gl, left_joint, [0.03, 0.12, 0.43], 1.0, 50, false);
    square_position = initArrayBuffer(gl, new Float32Array(rectVertices), 2, gl.FLOAT, 'a_Position');
    square_color = initArrayBuffer(gl, new Float32Array(yellow), 3, gl.FLOAT, 'a_Color');
    left_joint.translate(0.0, -3.6, 0.0);
    left_joint.scale(1.2, 5.3, 0.0);
    gl.uniformMatrix4fv(u_modelMatrix, false, left_joint.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectVertices.length/2);
    popMatrix();
    

    // 脖子
    square_position = initArrayBuffer(gl, new Float32Array(rectVertices), 2, gl.FLOAT, 'a_Position');
    square_color = initArrayBuffer(gl, new Float32Array(darkBlue), 3, gl.FLOAT, 'a_Color');
    transformMat.translate(0.0, 0.20, 0.0);
    pushMatrix();
    transformMat.scale(0.12, 0.12, 0.0);
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectVertices.length/2);
    popMatrix();

    // 頭
    transformMat.translate(0.0, 0.015, 0.0);
    pushMatrix();
    transformMat.scale(0.23, 0.30, 0.0);
    drawCircleAtPosition(gl, transformMat, [1.0, 0.3, 0.2], 1.0, 30, true);
    popMatrix();

    // 臉
    square_position = initArrayBuffer(gl, new Float32Array(rectVertices), 2, gl.FLOAT, 'a_Position');
    square_color = initArrayBuffer(gl, new Float32Array(navyDarkBlue), 3, gl.FLOAT, 'a_Color');
    transformMat.translate(0.0, 0.13, 0.0);
    pushMatrix();
    transformMat.scale(0.25, 0.15, 0.0);
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectVertices.length/2);
    popMatrix();

    // 眼睛
    pushMatrix();
    transformMat.translate(-0.07, 0.0, 0.0);
    transformMat.scale(0.7, 0.8, 0.0);
    drawCircleAtPosition(gl, transformMat, [0.976, 0.945, 0.878], 0.03, 40, false);
    popMatrix();

    pushMatrix();
    transformMat.translate(0.07, 0.0, 0.0);
    transformMat.scale(0.7, 0.8, 0.0);
    drawCircleAtPosition(gl, transformMat, [0.976, 0.945, 0.878], 0.03, 40, false);
    popMatrix();

    // 天線 + 觸角
    square_position = initArrayBuffer(gl, new Float32Array(rectVertices), 2, gl.FLOAT, 'a_Position');
    square_color = initArrayBuffer(gl, new Float32Array(darkBlue), 3, gl.FLOAT, 'a_Color');
    transformMat.translate(0.0, 0.2, 0.0);
    pushMatrix();
    transformMat.translate(-0.1, 0.015, 0.0);
    var antennaLeftMat = new Matrix4(transformMat);
    transformMat.scale(0.02, 0.15, 0.0);
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectVertices.length/2);
    antennaLeftMat.translate(0.0, 0.05, 0.0);
    antennaLeftMat.scale(0.03, 0.03, 1.0);
    drawCircleAtPosition(gl, antennaLeftMat, [0.0, 0.6, 0.6], 1.0, 40, false);
    popMatrix();

    square_position = initArrayBuffer(gl, new Float32Array(rectVertices), 2, gl.FLOAT, 'a_Position');
    square_color = initArrayBuffer(gl, new Float32Array(darkBlue), 3, gl.FLOAT, 'a_Color');
    pushMatrix();
    transformMat.translate(0.1, 0.015, 0.0);
    var antennaLeftMat = new Matrix4(transformMat);
    transformMat.scale(0.02, 0.15, 0.0);
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectVertices.length/2);
    antennaLeftMat.translate(0.0, 0.05, 0.0);
    antennaLeftMat.scale(0.03, 0.03, 1.0);
    drawCircleAtPosition(gl, antennaLeftMat, [0.0, 0.6, 0.6], 1.0, 40, false);
    popMatrix();
}