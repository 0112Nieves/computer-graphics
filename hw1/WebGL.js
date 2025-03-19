//shader
var VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec3 a_Color;
    varying vec4 v_Color;
    void main(){
        gl_Position = a_Position;
        gl_PointSize = 5.0;
        v_Color = vec4(a_Color, 1.0);
    }
`;

var FSHADER_SOURCE = `
    precision mediump float;
    varying vec4 v_Color;
    void main(){
        gl_FragColor = v_Color;
    }
`;

var canvas;
var gl;
var shapeFlag = 'p'; //p: point, h: hori line: v: verti line, t: triangle, q: square, c: circle
var colorFlag = 'r'; //r g b 
var g_points = [];
var g_horiLines = [];
var g_vertiLines = [];
var g_triangles = [];
var g_squares = [];
var g_circles = [];
var shapeArray = [];
//var ... of course you may need more variables

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

function main(){
    //////Get the canvas context
    canvas = document.getElementById('webgl');
    gl = canvas.getContext('webgl2');
    if(!gl){
        console.log('Failed to get the rendering context for WebGL');
        return ;
    }

    // compile shader and use program
    program = compileShader(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    gl.useProgram(program);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // mouse and key event...
    canvas.onmousedown = function(ev){click(ev)};
    document.onkeydown = function(ev){keydown(ev)};
}



function keydown(ev){ //you may want to define more arguments for this function
    //implment keydown event here
    if (ev.key == 'r') colorFlag = 'r';
    else if (ev.key == 'g') colorFlag = 'g';
    else if (ev.key == 'b') colorFlag = 'b';
    
    if(ev.key == 'p') shapeFlag = 'p';
    else if(ev.key == 'h') shapeFlag = 'h';
    else if(ev.key == 'v') shapeFlag = 'v';
    else if(ev.key == 't') shapeFlag = 't';
    else if(ev.key == 'q') shapeFlag = 'q';
    else if(ev.key == 'c') shapeFlag = 'c';
}

function click(ev){ //you may want to define more arguments for this function
    //mouse click: recall our quiz1 in calss
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.height/2)/(canvas.height/2)
    y = (canvas.width/2 - (y - rect.top))/(canvas.height/2)

    let color;
    if (colorFlag === 'r') color = [1.0, 0.0, 0.0];
    else if (colorFlag === 'g') color = [0.0, 1.0, 0.0];
    else if(colorFlag == 'b') color = [0.0, 0.0, 1.0];

    function checkMaxShapes(shapeArray, times) {
        if (shapeArray.length >= 5 * times) {
            for(let i = 0; i < times; i++) shapeArray.shift();
        }
    }
    
    if(shapeFlag == 'p'){
        checkMaxShapes(g_points, 1);
        g_points.push({ position: [x, y], color });
    }
    else if (shapeFlag === 'h') {
        checkMaxShapes(g_horiLines, 2);
        g_horiLines.push({ position: [-1, y], color });
        g_horiLines.push({ position: [1, y], color });
    } 
    else if (shapeFlag === 'v') {
        checkMaxShapes(g_vertiLines, 2);
        g_vertiLines.push({ position: [x, 1], color });
        g_vertiLines.push({ position: [x, -1], color });
    } 
    else if (shapeFlag === 't') {
        checkMaxShapes(g_triangles, 3);
        let size = 0.1;
        g_triangles.push({ position: [x, y + size / 2], color });
        g_triangles.push({ position: [x - size / 2, y - size / 2], color });
        g_triangles.push({ position: [x + size / 2, y - size / 2], color });
    } 
    else if (shapeFlag === 'q') {
        checkMaxShapes(g_squares, 6);
        let size = 0.1;
        let x1 = x - size / 2, y1 = y + size / 2;
        let x2 = x + size / 2, y2 = y + size / 2;
        let x3 = x - size / 2, y3 = y - size / 2;
        let x4 = x + size / 2, y4 = y - size / 2;

        g_squares.push({ position: [x1, y1], color });
        g_squares.push({ position: [x3, y3], color });
        g_squares.push({ position: [x2, y2], color });

        g_squares.push({ position: [x2, y2], color });
        g_squares.push({ position: [x3, y3], color });
        g_squares.push({ position: [x4, y4], color });
    } 
    else if (shapeFlag === 'c') {
        let numSegments = 20;
        let radius = 0.05;
        let circleVertices = [];
        let circleColors = [];
        checkMaxShapes(g_circles, 1);
    
        circleVertices.push(x, y);
        circleColors.push(...color);
    
        for (let i = 0; i <= numSegments; i++) {
            let angle = (i / numSegments) * 2 * Math.PI;
            let xPos = x + radius * Math.cos(angle);
            let yPos = y + radius * Math.sin(angle);
            circleVertices.push(xPos, yPos);
            circleColors.push(...color);
        }
    
        g_circles.push({ position: circleVertices, color: circleColors });
    }
    
    draw();
}

function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    function drawShape(vertices, colors, mode) {
        if (vertices.length === 0) return;

        let vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        let a_Position = gl.getAttribLocation(program, 'a_Position');
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        let colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

        let a_Color = gl.getAttribLocation(program, 'a_Color');
        gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Color);

        gl.drawArrays(mode, 0, vertices.length / 2);
    }

    let pointVertices = [];
    let pointColors = [];
    g_points.forEach(point => {
        pointVertices.push(...point.position);
        pointColors.push(...point.color);
    });

    let lineVertices = [];
    let lineColors = [];
    g_horiLines.forEach(line => {
        lineVertices.push(...line.position);
        lineColors.push(...line.color);
    });
    g_vertiLines.forEach(line => {
        lineVertices.push(...line.position);
        lineColors.push(...line.color);
    });

    let triangleVertices = [];
    let triangleColors = [];
    g_triangles.forEach(triangle => {
        triangleVertices.push(...triangle.position);
        triangleColors.push(...triangle.color);
    });

    let squareVertices = [];
    let squareColors = [];
    g_squares.forEach(square => {
        squareVertices.push(...square.position);
        squareColors.push(...square.color);
    });
    
    g_circles.forEach(circle => {
        let positionLocation = gl.getAttribLocation(program, 'a_Position');
        let colorLocation = gl.getAttribLocation(program, 'a_Color');
    
        let positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circle.position), gl.STATIC_DRAW);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLocation);
    
        let colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(circle.color), gl.STATIC_DRAW);
        gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorLocation);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, circle.position.length / 2);
    });
    

    drawShape(pointVertices, pointColors, gl.POINTS);
    drawShape(lineVertices, lineColors, gl.LINES);
    drawShape(triangleVertices, triangleColors, gl.TRIANGLES);
    drawShape(squareVertices, squareColors, gl.TRIANGLES);
}