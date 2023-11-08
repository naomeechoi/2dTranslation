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
  var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");
  var colorLocation = gl.getUniformLocation(program, "u_color");

  // create and bind buffer, and add buffer data, 버퍼 생성 바인드 및 데이터 구성
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  setGeometry(gl);

  var translation = [0, 0];
  var angleInDegrees = 0;
  var scale = [1, 1];
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

  // 회전 슬라이드 x 바 설정
  function updateAngle(ele) {
    angleInDegrees = 360 - ele.target.value;

    ele.target.previousSibling.innerHTML =
      ele.target.previousSibling.getAttribute("name") + ele.target.value;
    drawScene();
  }

  makeSliderAndRedraw("rotation Angle: ", "rotationSlider", 0, 360, (ele) => {
    return updateAngle(ele);
  });

  // 스케일 슬라이드 x 바 설정
  function updateScale(ele, index) {
    scale[index] = ele.target.value;

    ele.target.previousSibling.innerHTML =
      ele.target.previousSibling.getAttribute("name") + ele.target.value;
    drawScene();
  }

  makeSliderAndRedraw("scale X: ", "scaleSlider", -5, 5, (ele) => {
    return updateScale(ele, 0);
  });

  makeSliderAndRedraw("scale Y: ", "scaleSlider", -5, 5, (ele) => {
    return updateScale(ele, 1);
  });

  function makeSliderAndRedraw(eleName, parentDivId, min, max, func) {
    var parentDiv = document.getElementById(parentDivId);

    var division = document.createElement("d");

    var tempSlider = document.createElement("input");
    tempSlider.className = "slider";
    tempSlider.type = "range";
    tempSlider.min = min;
    tempSlider.max = max;

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

    gl.useProgram(program);

    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 2; // 2 components per iteration
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

    // set the resolution
    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

    var translationMatirx = m3.translation(translation[0], translation[1]);
    var rotationMatrix = m3.rotation(angleInDegrees);
    var scaleMatrix = m3.scailing(scale[0], scale[1]);

    var matrix = m3.identity();
    var projectionMatrix = m3.projection(
      gl.canvas.clientWidth,
      gl.canvas.clientHeight
    );

    matrix = m3.multiply(projectionMatrix, translationMatirx);
    matrix = m3.multiply(matrix, rotationMatrix);
    matrix = m3.multiply(matrix, scaleMatrix);

    gl.uniformMatrix3fv(matrixLocation, false, matrix);

    // set the color
    gl.uniform4fv(colorLocation, color);

    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset = 0;
    var count = 6 * 3;
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
      // left column
      0, 0, 30, 0, 0, 150, 0, 150, 30, 0, 30, 150,

      // right column
      50, 0, 80, 0, 50, 150, 50, 150, 80, 0, 80, 150,

      // middle
      0, 0, 30, 0, 80, 150, 80, 150, 50, 150, 0, 0,
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
