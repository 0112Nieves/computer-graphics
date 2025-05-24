var cameraX = 0, cameraY = 0, cameraZ = 5;
var cameraDirX = 0, cameraDirY = 0, cameraDirZ = -1;
var third_view = false;
var playerX = 0, playerY = 0, playerZ = 0;
var player_step = 0.3;
var firstcameraX = 0, firstcameraY = 0, firstcameraZ = 5;
var thirdcameraX = -5.0, thirdcameraY = 2.0, thirdcameraZ = 3.0;

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

function keydown(ev) {
    //implment keydown event here
    let rotateMatrix = new Matrix4();
    rotateMatrix.setRotate(angleY, 0, 0, -1); //for mouse rotation
    rotateMatrix.rotate(angleX, 0, -1, 0); //for mouse rotation
    let orthrotateMatrix = new Matrix4();
    orthrotateMatrix.setRotate(angleY, 0, 0, -1); //for mouse rotation
    orthrotateMatrix.rotate(angleX - 90, 0, -1, 0); //for mouse rotation

    var viewDir = new Vector3([cameraDirX, cameraDirY, cameraDirZ]);
    var newViewDir = rotateMatrix.multiplyVector3(viewDir);
    var orthnewViewDir = orthrotateMatrix.multiplyVector3(viewDir);

    var vdx = 0, vdz = 0;
    if (ev.key == "w" || ev.key == "ArrowUp") {
        vdx = newViewDir.elements[0];
        vdz = newViewDir.elements[2];
    }
    else if (ev.key == "s" || ev.key == "ArrowDown") {
        vdx = newViewDir.elements[0] * -1;
        vdz = newViewDir.elements[2] * -1;
    }
    else if (ev.key == "a" || ev.key == "ArrowLeft") {
        vdx = orthnewViewDir.elements[0];
        vdz = orthnewViewDir.elements[2];
    }
    else if (ev.key == "d" || ev.key == "ArrowRight") {
        vdx = orthnewViewDir.elements[0] * -1;
        vdz = orthnewViewDir.elements[2] * -1;
    }

    vdx *= player_step;
    vdz *= player_step;
    playerX += vdx;
    playerZ += vdz;
    firstcameraX += vdx;
    firstcameraZ += vdz;
    thirdcameraX += vdx;
    thirdcameraZ += vdz;
    if (playerX < -10 || 10 < playerX || playerZ < -15 || 15 < playerZ) {
        playerX -= vdx;
        playerZ -= vdz;
        firstcameraX -= vdx;
        firstcameraZ -= vdz;
        thirdcameraX -= vdx;
        thirdcameraZ -= vdz;
    }
    if (third_view) {
        cameraX = thirdcameraX;
        cameraY = thirdcameraY;
        cameraZ = thirdcameraZ;
    } else {
        cameraX = firstcameraX;
        cameraY = firstcameraY;
        cameraZ = firstcameraZ;
    }
}

function interface(ev){
    if (ev.key == "c") {
        third_view = !third_view;
        if (third_view) {
            cameraX = thirdcameraX;
            cameraY = thirdcameraY;
            cameraZ = thirdcameraZ;
            
            let dx = firstcameraX - thirdcameraX;
            let dy = firstcameraY - thirdcameraY;
            let dz = firstcameraZ - thirdcameraZ;
            
            angleX = -Math.atan2(dx, dz) * 180 / Math.PI;
            let dist = Math.sqrt(dx * dx + dz * dz);
            angleY = -Math.atan2(dy, dist) * 180 / Math.PI;
        } else {
            cameraX = firstcameraX;
            cameraY = firstcameraY;
            cameraZ = firstcameraZ;
            angleX = 0;
            angleY = 0;
        }
    }
}