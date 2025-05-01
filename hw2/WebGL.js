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

function initAttributeVariable(gl, a_attribute, buffer){
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
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
var vertices = [];
function drawCircleAtPosition(gl, transformMat, color = [1.0, 0.3, 0.2], radius = 1.0, segments = 30, isSemiCircle = false) {
    vertices = createCircleVertices(radius, segments, isSemiCircle);

    const colorData = [];
    for (let i = 0; i <= segments + 1; i++) {
        colorData.push(...color); // 展開顏色 RGB
    }

    initArrayBuffer(gl, vertices, 2, gl.FLOAT, 'a_Position');
    initArrayBuffer(gl, new Float32Array(colorData), 3, gl.FLOAT, 'a_Color');

    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 2);
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

function initVertexBufferForLaterUse(gl, vertices, colors){
    var nVertices = vertices.length / 3;

    var o = new Object();
    o.vertexBuffer = initArrayBufferForLaterUse(gl, new Float32Array(vertices), 3, gl.FLOAT);
    o.colorBuffer = initArrayBufferForLaterUse(gl, new Float32Array(colors), 3, gl.FLOAT);
    if (!o.vertexBuffer || !o.colorBuffer) 
        console.log("Error: in initVertexBufferForLaterUse(gl, vertices, colors)"); 
    o.numVertices = nVertices;

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return o;
}

var transformMat = new Matrix4();
var circle = new Matrix4();
var matStack = [];
var transformationX = -0.5;
var transformationY = -0.5;
var scale = 0.7;
var joint1 = 0.0;
var joint2 = 0.0;
var joint3 = 15.0;
var grab = false;
var canGrab = false;
const circleRadius = 0.08;
var u_modelMatrix;
function pushMatrix(){
    matStack.push(new Matrix4(transformMat));
}
function popMatrix(){
    transformMat = matStack.pop();
}

function main(){
    var canvas = document.getElementById('webgl');
    var pink = [ 1.0, 0.58, 0.85 ]
    var gl = canvas.getContext('webgl2');
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return ;
    }

    program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);

    circleModel = initVertexBufferForLaterUse(gl, vertices, pink);
    circleModelTouch = initVertexBufferForLaterUse(gl, vertices, pink);
    circleModelGrab = initVertexBufferForLaterUse(gl, vertices, pink);
    circle.setIdentity();
    circle.translate(0.5, -0.5, 0.0);

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
            case ' ':
                if(canGrab) grab = !grab;
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
        joint2 /= 5;
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
    clipVertices1 = [ 0.3, 0.0, 0.3, -0.3, 0.2, -0.3, 0.2, -0.1, 0.0, -0.1, 0.0, 0.0 ];
    clipVertices2 = [ -0.3, 0.0, -0.3, -0.3, -0.2, -0.3, -0.2, -0.1, 0.0, -0.1, 0.0, 0.0 ];

    var orange = [ 1.0, 0.3, 0.2, 1.0, 0.3, 0.2, 1.0, 0.3, 0.2, 1.0, 0.3, 0.2 ];
    var navyBlue = [ 0.0, 0.6, 0.6, 0.0, 0.6, 0.6, 0.0, 0.6, 0.6, 0.0, 0.6, 0.6 ];
    var navyDarkBlue = [ 0.0, 0.4, 0.4, 0.0, 0.4, 0.4, 0.0, 0.4, 0.4, 0.0, 0.4, 0.4 ];
    var darkBlue = [ 0.03, 0.12, 0.43, 0.03, 0.12, 0.43, 0.03, 0.12, 0.43, 0.03, 0.12, 0.43 ];
    var yellow = [ 1.0, 0.84, 0.35, 1.0, 0.84, 0.35, 1.0, 0.84, 0.35, 1.0, 0.84, 0.35 ];
    var gray = [ 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6 ];

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
    right_joint_1.translate(0.6, 0.15, 0.0);
    right_joint_1.scale(0.6, 0.2, 1.0);
    square_color = initArrayBuffer(gl, new Float32Array(yellow), 3, gl.FLOAT, 'a_Color');
    gl.uniformMatrix4fv(u_modelMatrix, false, right_joint_1.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectVertices.length/2);
    square_color = initArrayBuffer(gl, new Float32Array(orange), 3, gl.FLOAT, 'a_Color');
    gl.uniformMatrix4fv(u_modelMatrix, false, transformMat.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectVertices.length/2);
    //// 關節 + 第二個長方形
    var right_joint_2 = new Matrix4(right_joint_1);
    right_joint_2.translate(0.5, 0.0, 0.0);
    right_joint_2.scale(0.2, 0.8, 0.0);
    drawCircleAtPosition(gl, right_joint_2, [0.03, 0.12, 0.43], 1.0, 50, false);
    right_joint_2.rotate(joint2, 0.0, 0.0);
    right_joint_2.translate(4.0, 0.0, 0.0);
    right_joint_2.scale(6.0, 1.5, 0.0);
    square_position = initArrayBuffer(gl, new Float32Array(rectVertices), 2, gl.FLOAT, 'a_Position');
    square_color = initArrayBuffer(gl, new Float32Array(yellow), 3, gl.FLOAT, 'a_Color');
    gl.uniformMatrix4fv(u_modelMatrix, false, right_joint_2.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, rectVertices.length/2);
    //// 關節 + 爪子
    right_joint_2.translate(0.7, 0.0, 0.0);
    right_joint_2.scale(0.2, 0.8, 0.0);
    right_joint_2.rotate(joint3, 0, 0);
    var right_joint_3 = new Matrix4(right_joint_2);
    drawCircleAtPosition(gl, right_joint_3, [0.03, 0.12, 0.43], 1.0, 50, false);
    right_joint_3.scale(8.0, 8.0, 0.0);
    right_joint_3.translate(0.4, 0.0, 0.0);
    clip_position1 = initArrayBuffer(gl, new Float32Array(clipVertices1), 2, gl.FLOAT, 'a_Position');
    gl.drawArrays(gl.TRIANGLE_FAN, 0, clipVertices1.length / 2);
    clip_position2 = initArrayBuffer(gl, new Float32Array(clipVertices2), 2, gl.FLOAT, 'a_Position');
    clip_color = initArrayBuffer(gl, new Float32Array(gray), 3, gl.FLOAT, 'a_Color');
    gl.uniformMatrix4fv(u_modelMatrix, false, right_joint_3.elements);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, clipVertices2.length / 2);
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

    var robotX = right_joint_3.elements[12];
    var robotY = right_joint_3.elements[13];
    var circleX = circle.elements[12];
    var circleY = circle.elements[13];

    var distance = Math.sqrt(Math.pow(robotX - circleX, 2) + Math.pow(robotY - circleY, 2));
    if (distance <= circleRadius + 0.02) {
        canGrab = true;
        if (grab) { // 深綠色
            circle.setTranslate(robotX, robotY, 0);
            initAttributeVariable(gl, program.a_Position, circleModelGrab.vertexBuffer);
            initAttributeVariable(gl, program.a_Color, circleModelGrab.colorBuffer);
        } else { // 淺綠色
            initAttributeVariable(gl, program.a_Position, circleModelTouch.vertexBuffer);
            initAttributeVariable(gl, program.a_Color, circleModelTouch.colorBuffer);
        }
    } else {
        canGrab = false;
        if (!grab) {
            initAttributeVariable(gl, program.a_Position, circleModel.vertexBuffer);
            initAttributeVariable(gl, program.a_Color, circleModel.colorBuffer);
        }
    }
    
    if (grab) {
        circle.setTranslate(robotX, robotY, 0);
    }
    
    drawCircleAtPosition(gl, circle, [1.0, 0.58, 0.85], 0.08, 50, false);
}