window.onload = function () {
  console.log("This is working");
  var canvas = document.getElementById("game-surface");
  var maxWidthHeight = 500;
  canvas.width = maxWidthHeight;
  canvas.height = maxWidthHeight;

  var gl = canvas.getContext("webgl");

  if (!gl) {
    console.log("WebGL not supported, falling back on experimental-webgl");
    gl = canvas.getContext("experimental-webgl");
  }

  if (!gl) {
    alert("Your browser does not support WebGL");
  }

  // bring glsl text source, glsl 텍스트 소스 가져오기
  var vertexShaderSource = document.getElementById("vertex-shader-2d").text;
  var fragmentShaderSource = document.getElementById("fragment-shader-2d").text;

  // create and compile shaders and check vaildations, 쉐이더 생성과 컴파일 검증까지
  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );

  // make program, 프로그램 만들기
  var program = createProgram(gl, vertexShader, fragmentShader);

  var positionLocation = gl.getAttribLocation(program, "a_position");
  var colorLocation = gl.getAttribLocation(program, "a_color");
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");

  // create and bind buffer, and add buffer data, 버퍼 생성 바인드 및 데이터 구성
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  setGeometry(gl);

  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  setColors(gl);

  var translation = [1, 1, 1];
  var rotation = [1, 1, 1];
  var scale = [1, 1, 1];
  var color = [Math.random(), Math.random(), Math.random(), 1];

  // 위치 슬라이드바 설정
  function updatePosition(ele, index) {
    translation[index] = ele.target.value;
    ele.target.previousSibling.innerHTML =
      ele.target.previousSibling.getAttribute("name") + ele.target.value;
    drawScene();
  }

  makeSliderAndRedraw("translation X: ", "translationSlider", 0, 400, (ele) => {
    return updatePosition(ele, 0);
  });

  makeSliderAndRedraw("translation Y: ", "translationSlider", 0, 400, (ele) => {
    return updatePosition(ele, 1);
  });

  makeSliderAndRedraw("translation Z: ", "translationSlider", 0, 400, (ele) => {
    return updatePosition(ele, 2);
  });

  // 회전 슬라이드 x 바 설정
  function updateAngle(ele, index) {
    rotation[index] = degreesToRadians(360 - ele.target.value);

    ele.target.previousSibling.innerHTML =
      ele.target.previousSibling.getAttribute("name") + ele.target.value;
    drawScene();
  }

  makeSliderAndRedraw("angle X: ", "rotationSlider", 0, 360, (ele) => {
    return updateAngle(ele, 0);
  });

  makeSliderAndRedraw("angle Y: ", "rotationSlider", 0, 360, (ele) => {
    return updateAngle(ele, 1);
  });


  makeSliderAndRedraw("angle Z: ", "rotationSlider", 0, 360, (ele) => {
    return updateAngle(ele, 2);
  });


  // 스케일 슬라이드 x 바 설정
  function updateScale(ele, index) {
    scale[index] = ele.target.value;

    ele.target.previousSibling.innerHTML =
      ele.target.previousSibling.getAttribute("name") + ele.target.value;
    drawScene();
  }

  makeSliderAndRedraw("scale X: ", "scaleSlider", 0, 10, (ele) => {
    return updateScale(ele, 0);
  });

  makeSliderAndRedraw("scale Y: ", "scaleSlider", 0, 10, (ele) => {
    return updateScale(ele, 1);
  });

  makeSliderAndRedraw("scale Z: ", "scaleSlider", 0, 10, (ele) => {
    return updateScale(ele, 2);
  });

  function makeSliderAndRedraw(eleName, parentDivId, min, max, func) {
    var parentDiv = document.getElementById(parentDivId);

    var division = document.createElement("d");

    var tempSlider = document.createElement("input");
    tempSlider.className = "slider";
    tempSlider.type = "range";
    tempSlider.min = min;
    tempSlider.max = max;
    tempSlider.value = 1;

    var text = document.createElement("p");
    text.setAttribute("name", eleName);
    text.innerHTML = eleName + tempSlider.value;

    division.appendChild(text);
    division.appendChild(tempSlider);
    parentDiv.appendChild(division);

    tempSlider.oninput = function (ele) {
      func(ele);
    };
  }

  drawScene();

  function drawScene() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 3; // 2 components per iteration
    var type = gl.FLOAT; // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0; // start at the beginning of the buffer
    gl.vertexAttribPointer(
      positionLocation,
      size,
      type,
      normalize,
      stride,
      offset
    );

    gl.enableVertexAttribArray(colorLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    var colorSize = 3;
    var colorType = gl.UNSIGNED_BYTE;
    var colorNormalize = true;
    var colorStride = 0;
    var colorOffset = 0;
    gl.vertexAttribPointer(
      colorLocation, colorSize, colorType, colorNormalize, colorStride, colorOffset);

    // Compute the matrices
    var matrix = m4.projection(gl.canvas.clientWidth, gl.canvas.clientHeight, 400);
    matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);

    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 15 * 2 * 6;
    gl.drawArrays(primitiveType, offset, count);
  }
};

function createShader(gl, type, source) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }

  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("ERROR linking program", gl.getProgramInfoLog(program));
    return;
  }

  gl.validateProgram(program);
  if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
    console.error("ERROR validating program", gl.getProgramInfoLog(program));
    return;
  }

  gl.useProgram(program);
  return program;
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function setRectangle(gl, x, y, width, height) {
  var x1 = parseInt(x);
  var x2 = x1 + parseInt(width);
  var y1 = parseInt(y);
  var y2 = y1 + parseInt(height);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
    gl.STATIC_DRAW
  );
}

function setGeometry(gl) {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([

      //front
      // left column
      0, 0, 0,
      0, 150, 0,
      30, 150, 0,
      30, 150, 0,
      30, 0, 0,
      0, 0,0,

      // right column
      50, 0, 0,
      50, 150, 0,
      80, 150, 0,
      80, 150, 0,
      80, 0, 0,
      50, 0,0,

      // middle
      0, 0, 0,
      50, 150, 0,
      80, 150, 0,
      80, 150, 0,
      30, 0, 0,
      0, 0, 0,

      //back
      // left column
      80, 0, 30,
      80, 150, 30,
      50, 150, 30,
      50, 150, 30,
      50, 0, 30,
      80, 0,30,
      
      // right column
      30, 0, 30,
      30, 150, 30,
      0, 150, 30,
      0, 150, 30,
      0, 0, 30,
      30, 0, 30,
      
      // middle
      30, 0, 30,
      80, 150, 30,
      50, 150, 30,
      50, 150, 30,
      0, 0, 30,
      30, 0, 30,

      //up
      0, 0, 30,
      0, 0, 0,
      30, 0, 0,
      30, 0, 0,
      30, 0, 30,
      0, 0, 30,

      50, 0, 30,
      50, 0, 0,
      80, 0, 0,
      80, 0, 0,
      80, 0, 30,
      50, 0, 30,

      //down
      0, 150, 0,
      0, 150, 30,
      30, 150, 30,
      30, 150, 30,
      30, 150, 0,
      0, 150, 0,

      50, 150, 0,
      50, 150, 30,
      80, 150, 30,
      80, 150, 30,
      80, 150, 0,
      50, 150, 0,

      //right side
      30, 0, 30,
      30, 0, 0,
      50, 60, 0,
      50, 60, 0,
      50, 60, 30,
      30, 0, 30,

      80, 0, 0,
      80, 150, 0,
      80, 150, 30,
      80, 150, 30,
      80, 0, 30,
      80, 0, 0,

      30, 90, 0,
      30, 150, 0,
      30, 150, 30,
      30, 150, 30,
      30, 90, 30,
      30, 90, 0,

      //left side
      0, 0, 0,
      0, 0, 30,
      0, 150, 30,
      0, 150, 30,
      0, 150, 0,
      0, 0, 0,

      30, 90, 0,
      30, 90, 30,
      50, 150, 30,
      50, 150, 30,
      50, 150, 0,
      30, 90, 0,

      50, 0, 0,
      50, 0, 30,
      50, 60, 30,
      50, 60, 30,
      50, 60, 0,
      50, 0, 0,
    ]),
    gl.STATIC_DRAW
  );
}

function setColors(gl) {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Uint8Array([

      //front
      // left column
      200,  70, 120,
      200,  70, 120,
      200,  70, 120,
      200,  70, 120,
      200,  70, 120,
      200,  70, 120,

      // right column
      200,  70, 120,
      200,  70, 120,
      200,  70, 120,
      200,  70, 120,
      200,  70, 120,
      200,  70, 120,

      // middle
      200,  70, 120,
      200,  70, 120,
      200,  70, 120,
      200,  70, 120,
      200,  70, 120,
      200,  70, 120,

       //back
      // left column
      10, 210, 70,
      10, 210, 70,
      10, 210, 70,
      10, 210, 70,
      10, 210, 70,
      10, 210, 70,
      
      // right column
      10, 210, 70,
      10, 210, 70,
      10, 210, 70,
      10, 210, 70,
      10, 210, 70,
      10, 210, 70,
      
      // middle
      10, 210, 70,
      10, 210, 70,
      10, 210, 70,
      10, 210, 70,
      10, 210, 70,
      10, 210, 70,

      //up left
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,

      // up right
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,

      //down left
      70, 200, 210,
      70, 200, 210,
      70, 200, 210,
      70, 200, 210,
      70, 200, 210,
      70, 200, 210,

      // down right
      70, 200, 210,
      70, 200, 210,
      70, 200, 210,
      70, 200, 210,
      70, 200, 210,
      70, 200, 210,

      // right side
      80, 160, 120,
      80, 160, 120,
      80, 160, 120,
      80, 160, 120,
      80, 160, 120,
      80, 160, 120,

      80, 160, 120,
      80, 160, 120,
      80, 160, 120,
      80, 160, 120,
      80, 160, 120,
      80, 160, 120,

      80, 160, 120,
      80, 160, 120,
      80, 160, 120,
      80, 160, 120,
      80, 160, 120,
      80, 160, 120,

      // left side
      110, 60, 0,
      110, 60, 0,
      110, 60, 0,
      110, 60, 0,
      110, 60, 0,
      110, 60, 0,

      110, 60, 0,
      110, 60, 0,
      110, 60, 0,
      110, 60, 0,
      110, 60, 0,
      110, 60, 0,

      110, 60, 0,
      110, 60, 0,
      110, 60, 0,
      110, 60, 0,
      110, 60, 0,
      110, 60, 0,
      
    ]),
    gl.STATIC_DRAW
  );
}

var m3 = {
  multiply: function (a, b) {
    var a00 = a[0 * 3 + 0];
    var a01 = a[0 * 3 + 1];
    var a02 = a[0 * 3 + 2];
    var a10 = a[1 * 3 + 0];
    var a11 = a[1 * 3 + 1];
    var a12 = a[1 * 3 + 2];
    var a20 = a[2 * 3 + 0];
    var a21 = a[2 * 3 + 1];
    var a22 = a[2 * 3 + 2];
    var b00 = b[0 * 3 + 0];
    var b01 = b[0 * 3 + 1];
    var b02 = b[0 * 3 + 2];
    var b10 = b[1 * 3 + 0];
    var b11 = b[1 * 3 + 1];
    var b12 = b[1 * 3 + 2];
    var b20 = b[2 * 3 + 0];
    var b21 = b[2 * 3 + 1];
    var b22 = b[2 * 3 + 2];

    return [
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ];
  },

  identity: function () {
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  },

  translation: function (tx, ty) {
    return [1, 0, 0, 0, 1, 0, tx, ty, 1];
  },

  rotation: function (angleInDegrees) {
    var angleInRadians = (angleInDegrees * Math.PI) / 180;
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    return [c, -s, 0, s, c, 0, 0, 0, 1];
  },

  scailing: function (sx, sy) {
    return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
  },

  projection: function (width, height) {
    return [2 / width, 0, 0, 0, -2 / height, 0, -1, 1, 1];
  },
};

var m4 = {

  projection: function(width, height, depth) {
    // Note: This matrix flips the Y axis so 0 is at the top.
    return [
       2 / width, 0, 0, 0,
       0, -2 / height, 0, 0,
       0, 0, 2 / depth, 0,
      -1, 1, 0, 1,
    ];
  },

  multiply: function(a, b) {
    var a00 = a[0 * 4 + 0];
    var a01 = a[0 * 4 + 1];
    var a02 = a[0 * 4 + 2];
    var a03 = a[0 * 4 + 3];
    var a10 = a[1 * 4 + 0];
    var a11 = a[1 * 4 + 1];
    var a12 = a[1 * 4 + 2];
    var a13 = a[1 * 4 + 3];
    var a20 = a[2 * 4 + 0];
    var a21 = a[2 * 4 + 1];
    var a22 = a[2 * 4 + 2];
    var a23 = a[2 * 4 + 3];
    var a30 = a[3 * 4 + 0];
    var a31 = a[3 * 4 + 1];
    var a32 = a[3 * 4 + 2];
    var a33 = a[3 * 4 + 3];
    var b00 = b[0 * 4 + 0];
    var b01 = b[0 * 4 + 1];
    var b02 = b[0 * 4 + 2];
    var b03 = b[0 * 4 + 3];
    var b10 = b[1 * 4 + 0];
    var b11 = b[1 * 4 + 1];
    var b12 = b[1 * 4 + 2];
    var b13 = b[1 * 4 + 3];
    var b20 = b[2 * 4 + 0];
    var b21 = b[2 * 4 + 1];
    var b22 = b[2 * 4 + 2];
    var b23 = b[2 * 4 + 3];
    var b30 = b[3 * 4 + 0];
    var b31 = b[3 * 4 + 1];
    var b32 = b[3 * 4 + 2];
    var b33 = b[3 * 4 + 3];
    return [
      b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
      b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
      b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
      b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
      b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
      b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
      b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
      b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
      b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
      b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
      b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
      b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
      b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
      b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
      b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
      b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
    ];
  },

  translation: function(tx, ty, tz) {
    return [
       1,  0,  0,  0,
       0,  1,  0,  0,
       0,  0,  1,  0,
       tx, ty, tz, 1,
    ];
  },

  xRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ];
  },

  yRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
  },

  zRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
       c, s, 0, 0,
      -s, c, 0, 0,
       0, 0, 1, 0,
       0, 0, 0, 1,
    ];
  },

  scaling: function(sx, sy, sz) {
    return [
      sx, 0,  0,  0,
      0, sy,  0,  0,
      0,  0, sz,  0,
      0,  0,  0,  1,
    ];
  },

  translate: function(m, tx, ty, tz) {
    return m4.multiply(m, m4.translation(tx, ty, tz));
  },

  xRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.xRotation(angleInRadians));
  },

  yRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.yRotation(angleInRadians));
  },

  zRotate: function(m, angleInRadians) {
    return m4.multiply(m, m4.zRotation(angleInRadians));
  },

  scale: function(m, sx, sy, sz) {
    return m4.multiply(m, m4.scaling(sx, sy, sz));
  },

};

function degreesToRadians(degree)
{
  return degree * Math.PI / 180;
}