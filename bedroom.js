//Christopher Klein
//CSCI 4250
//Project 4

var canvas, gl;
var program;
var ambientColor, diffuseColor, specularColor;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var mvMatrixStack=[];
var indices = [];

var zoomFactor = .78;
var translateFactorX = 0;
var translateFactorY = 0.2;

var numTimesToSubdivide = 5;
var slices = 24, stacks = 10;

var pointsArray = [];
var normalsArray = [];

var isBlinking = false;

var left = -1;
var right = 1;
var ytop = 1;
var bottom = -1;
var near = -10;
var far = 10;
var deg = 5;
var eye = [.3, .6, .6];
var at = [.1, .1, 0];
var up = [0, 1, 0];
var radius = 1;
var phi = 90;
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var theta =[0, 0, 0];

var N, N_Triangle;

var sphereCount = 0;

//18 points
var vertices = [
      vec4( -0.5, -0.5,  0.5, 1.0 ),
      vec4( -0.5,  0.5,  0.5, 1.0 ),
      vec4( 0.5,  0.5,  0.5, 1.0 ),
      vec4( 0.5, -0.5,  0.5, 1.0 ),
      vec4( -0.5, -0.5, -0.5, 1.0 ),
      vec4( -0.5,  0.5, -0.5, 1.0 ),
      vec4( 0.5,  0.5, -0.5, 1.0 ),
      vec4( 0.5, -0.5, -0.5, 1.0 ),

       ];

//vertices of the lamp
var lampProfile = [
    vec2(0.5, 0.0), // Base of the lamp
    vec2(0.5, 0.2),
    vec2(0.4, 0.4),
    vec2(0.3, 0.6),
    vec2(0.2, 0.8),
    vec2(0.1, 1.0), // Top of the lamp
];

var va = vec4(0.0, 0.0, -1.0,1);
var vb = vec4(0.0, 0.942809, 0.333333, 1);
var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
var vd = vec4(0.816497, -0.471405, 0.333333,1);


var lightPosition = vec4(-4, 3, 4, 0.0 );
var lightAmbient = vec4(.8, 0.8, 0.8, 1.0 );
var lightDiffuse = vec4( .5, .5, .5, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 0.1, 0.1, 0.1, 1.0 );
var materialDiffuse = vec4( 0.1, 0.1, 0.1, 1.0);
var materialSpecular = vec4( .327, .771, .86, 1.0 );
var materialShininess = 1.5;


window.onload = function init(){

    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );


    // set up lighting and material
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    // generate the points/normals
    colorCube();
    tetrahedron(va, vb, vc, vd, numTimesToSubdivide);
    //12324
    GenPillowPoints(); //14124
    GenBeanBagPoints(); //17706
    generateLampSurface(); //18234

    // pass data onto GPU
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );

    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    changeColors();


    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    document.getElementById("zoomIn").onclick=function(){zoomFactor *= 0.95;};
     document.getElementById("zoomOut").onclick=function(){zoomFactor *= 1.05;};
     document.getElementById("left").onclick=function(){translateFactorX -= 0.1;};
     document.getElementById("right").onclick=function(){translateFactorX += 0.1;};
     document.getElementById("up").onclick=function(){translateFactorY += 0.1;};
     document.getElementById("down").onclick=function(){translateFactorY -= 0.1;};
    // keyboard handle


    document.onkeydown = function HandleKeyboard(event)
      {
          //alert(event.keyCode);
          switch (event.keyCode)
          {
          case 37:  // left cursor key
                    translateFactorX -= 0.1;
                    break;
          case 39:   // right cursor key
                    translateFactorX += 0.1;
                    break;
          case 38:   // up cursor key
                    translateFactorY += 0.1;
                    break;
          case 40:    // down cursor key
                    translateFactorY -= 0.1;
                    break;
          case 107:  // + cursor key
                    zoomFactor *= 0.95;
                    break;
          case 109:  // - cursor key
                    zoomFactor *= 1.05;
                    break;
          case 66:  // b cursor key

                    zoomFactor = 0.78;
                    translateFactorX = 0.;
                    translateFactorY = 0.2;
                    break;
          case 65:  // a cursor key
                    roFlag = !roFlag;
                    break;
          default:
                break;
          }
      }


    render();
}

function changeColors(){
    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, "shininess"),materialShininess );
}

//Generate the bean bag points
function GenBeanBagPoints() {
    var slices = 2;
    var stacks = 198;
    var sliceInc = 2 * Math.PI / slices;
    var stackInc = Math.PI / stacks;

    for (var phi = 0; phi <= Math.PI; phi += stackInc) {
        for (var theta = 0; theta <= 2 * Math.PI; theta += sliceInc) {
            var distortFactor = 0.5 + 0.3 * Math.sin(1 * phi) * Math.cos(5 * theta); // Distortion factor

            // Calculate distorted sphere points
            var x = distortFactor * Math.sin(phi) * Math.cos(theta);
            var y = distortFactor * Math.cos(phi);
            var z = distortFactor * Math.sin(phi) * Math.sin(theta);

            // Calculate points for the next slice and stack
            var xNext = distortFactor * Math.sin(phi + stackInc) * Math.cos(theta);
            var yNext = distortFactor * Math.cos(phi + stackInc);
            var zNext = distortFactor * Math.sin(phi + stackInc) * Math.sin(theta);

            var xThetaNext = distortFactor * Math.sin(phi) * Math.cos(theta + sliceInc);
            var yThetaNext = distortFactor * Math.cos(phi);
            var zThetaNext = distortFactor * Math.sin(phi) * Math.sin(theta + sliceInc);

            // Define two triangles for each quad on the bean bag surface
            pointsArray.push(vec4(x, y, z, 1));
            pointsArray.push(vec4(xNext, yNext, zNext, 1));
            pointsArray.push(vec4(xThetaNext, yThetaNext, zThetaNext, 1));

            var xNextThetaNext = distortFactor * Math.sin(phi + stackInc) * Math.cos(theta + sliceInc);
            var yNextThetaNext = distortFactor * Math.cos(phi + stackInc);
            var zNextThetaNext = distortFactor * Math.sin(phi + stackInc) * Math.sin(theta + sliceInc);

            pointsArray.push(vec4(xNext, yNext, zNext, 1));
            pointsArray.push(vec4(xNextThetaNext, yNextThetaNext, zNextThetaNext, 1));
            pointsArray.push(vec4(xThetaNext, yThetaNext, zThetaNext, 1));
        }
    }
}


function GenPillowPoints() {
    var slices = 24;
    var stacks = 12;
    var sliceInc = 2 * Math.PI / slices;
    var stackInc = Math.PI / stacks;

    for (var phi = 0; phi <= Math.PI; phi += stackInc) {
        for (var theta = 0; theta <= 2 * Math.PI; theta += sliceInc) {
            var x = 1.5 * Math.sin(phi) * Math.cos(theta); // Elongate in X
            var y = 0.6 * Math.cos(phi); // Flatten in Y
            var z = Math.sin(phi) * Math.sin(theta); // Regular Z

            var xNext = 1.5 * Math.sin(phi + stackInc) * Math.cos(theta);
            var yNext = 0.6 * Math.cos(phi + stackInc);
            var zNext = Math.sin(phi + stackInc) * Math.sin(theta);

            var xThetaNext = 1.5 * Math.sin(phi) * Math.cos(theta + sliceInc);
            var yThetaNext = 0.6 * Math.cos(phi);
            var zThetaNext = Math.sin(phi) * Math.sin(theta + sliceInc);

            // Define two triangles for each quad on the pillow surface
            pointsArray.push(vec4(x, y, z, 1));
            pointsArray.push(vec4(xNext, yNext, zNext, 1));
            pointsArray.push(vec4(xThetaNext, yThetaNext, zThetaNext, 1));

            var xNextThetaNext = 1.5 * Math.sin(phi + stackInc) * Math.cos(theta + sliceInc);
            var yNextThetaNext = 0.6 * Math.cos(phi + stackInc);
            var zNextThetaNext = Math.sin(phi + stackInc) * Math.sin(theta + sliceInc);

            pointsArray.push(vec4(xNext, yNext, zNext, 1));
            pointsArray.push(vec4(xNextThetaNext, yNextThetaNext, zNextThetaNext, 1));
            pointsArray.push(vec4(xThetaNext, yThetaNext, zThetaNext, 1));
        }
    }
}


function DrawSolidCube(length){
	mvMatrixStack.push(modelViewMatrix);
	s=scale4(length, length, length );   // scale to the given width/height/depth
  modelViewMatrix = mult(modelViewMatrix, s);
  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
  gl.drawArrays( gl.TRIANGLES, 0, 36);

	modelViewMatrix=mvMatrixStack.pop();
}

// start drawing the wall
function DrawWall(thickness){
	var s, t, r;

	// draw thin wall with top = xz-plane, corner at origin
	mvMatrixStack.push(modelViewMatrix);

	t = translate(0.65, 0.5*thickness, 0.5);
	s = scale4(1.3, thickness, 1.4);
  modelViewMatrix = mult(mult(modelViewMatrix, t), s);
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	DrawSolidCube(1);

	modelViewMatrix = mvMatrixStack.pop();
}

//draws a single leg
function drawDeskLeg(x, y){
    var s, t, r;

    mvMatrixStack.push(modelViewMatrix);

    t = translate(-.1, y, 0);
    s = scale4(.02, .02, .2);
    r = rotate(-90, 1, 0, 0);

    modelViewMatrix = mult(mult(modelViewMatrix, t), s);
    modelViewMatrix = mult(modelViewMatrix, r);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    DrawSolidCube(1);

    modelViewMatrix = mvMatrixStack.pop();
}

function DrawDesk(){

    var s, t, r;

    //draw desk
    mvMatrixStack.push(modelViewMatrix);

    t = translate(.75, .35, 0);
    s = scale4(.3,.04,.3);
    modelViewMatrix = mult(mult(modelViewMatrix, t),s);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    DrawSolidCube(1);
    modelViewMatrix = mvMatrixStack.pop();

    //draw legs
    mvMatrixStack.push(modelViewMatrix);

    //front left
    t = translate(.57, .09, .03);
    r = rotate(95,-9,0,1);
    modelViewMatrix = mult(modelViewMatrix, t);
    modelViewMatrix = mult(modelViewMatrix, r);
    drawDeskLeg(0, .1);

    //front right
    t = translate(.25, -.4, 0);
    modelViewMatrix = mult(modelViewMatrix, t);
    drawDeskLeg(0, .5);

    //back right
    t = translate(.05, .18, 0);
    modelViewMatrix = mult(modelViewMatrix, t);
    drawDeskLeg(0, .5);

    //back left
    t = translate(-.2, 0, 0);
    modelViewMatrix = mult(modelViewMatrix, t);
    drawDeskLeg(0, .5);

    modelViewMatrix = mvMatrixStack.pop();

}

function drawChair(){

    var t,r,s;
    mvMatrixStack.push(modelViewMatrix);

    //back of chair
    t = translate(1.1, 0.4, 0.7);
    r = rotate(180,-1,0,1);
    s = scale4(.02,.25,.15);
    modelViewMatrix = mult(modelViewMatrix, t);
    modelViewMatrix = mult(modelViewMatrix, r);
    modelViewMatrix = mult(modelViewMatrix, s);

    DrawSolidCube(1);

    modelViewMatrix = mvMatrixStack.pop();
    mvMatrixStack.push(modelViewMatrix);

    t = translate(1.1, 0.28, .63);
    s = scale4(.15,.04,0.15);
    modelViewMatrix = mult(mult(modelViewMatrix, t),s);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));


    DrawSolidCube(1);
    modelViewMatrix = mvMatrixStack.pop();

    //draw legs
    mvMatrixStack.push(modelViewMatrix);

    //front left
    t = translate(1.02, .15, 0.65);
    r = rotate(95,-9,0,1);
    s = scale4(.46,.4,.5);
    modelViewMatrix = mult(modelViewMatrix, t);
    modelViewMatrix = mult(modelViewMatrix, r);
    modelViewMatrix = mult(modelViewMatrix, s);

    drawDeskLeg(0, .1);

    //front right
    t = translate(.3, -.5, 0);
    modelViewMatrix = mult(modelViewMatrix, t);
    drawDeskLeg(0, .5);

    //back right
    t = translate(.05, .2, 0);
    modelViewMatrix = mult(modelViewMatrix, t);
    drawDeskLeg(0, .5);

    //back left
    t = translate(-.2, 0, 0);
    modelViewMatrix = mult(modelViewMatrix, t);
    drawDeskLeg(0, .5);

    modelViewMatrix = mvMatrixStack.pop();


}

function ExtrudedTriangle(){
    // for a different extruded object,
    // only change these two variables: vertices and height

    var height=2;
    verticesx = [    vec4(2, 0, 0, 1),
                     vec4(0, 0, 2, 1),
                     vec4(0, 0, 0, 1)
    				 ];
    N=N_Triangle = verticesx.length;

    // add the second set of points
    for (var i=0; i<N; i++)
    {
        verticesx.push(vec4(verticesx[i][0], verticesx[i][1]+height, verticesx[i][2], 1));
    }

    ExtrudedShape();
}

function wallProjector(){

    ExtrudedTriangle();

    mvMatrixStack.push(modelViewMatrix);

    N=N_Triangle;
    var count = vertices.length;
    var r,s,t;
    for(var i = 0; i<verticesx.length; i++){
        vertices.push(verticesx[i]);
    }

  	r = rotate(50.0, 1.0, 0.0, 1.0);
    t = translate(2, 2.5, 2);
    s = scale4(.15, .15, .1);
    modelViewMatrix = mult(modelViewMatrix, t);
    modelViewMatrix = mult(modelViewMatrix, r);
    modelViewMatrix = mult(modelViewMatrix, s);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    gl.drawArrays(gl.TRIANGLES, 12, 24);
    t = translate(2.9, 1.9, 0.9);
    s = scale4(1.9,.2,.1);
    r = rotate(140, -1, 0,1);
    modelViewMatrix = mult(mult(modelViewMatrix, t),r);
    modelViewMatrix = mult(modelViewMatrix, s);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    DrawSolidCube(1);
    modelViewMatrix = mvMatrixStack.pop();

}

function drawBedLeg(x, y){
    var s, t, r;

    mvMatrixStack.push(modelViewMatrix);

    t = translate(-1, y, 0);
    s = scale4(.9, .1, .06);
    r = rotate(75, 1, 0, 0);

    modelViewMatrix = mult(mult(modelViewMatrix, t), s);
    //modelViewMatrix = mult(modelViewMatrix, r);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    DrawSolidCube(1);

    modelViewMatrix=mvMatrixStack.pop();
}

function DrawBed(bedLength, bedWidth, bedHeight) {
    var t,r,s;


    materialAmbient = vec4( 0.1, 0.1, 0.1, 1.0 );
    materialDiffuse = vec4( 0.1, 0.1, 0.1, 1.0);
    materialSpecular = vec4( .26, .168, .0, 1.0 ); //this chooses the color
    materialShininess = 30;

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    changeColors();

    //draw legs
    mvMatrixStack.push(modelViewMatrix);


    //front left
    t = translate(0, 0, .3);
    r = rotate(90,0,0,1);
    s = scale4(.1,.5,.6);
    modelViewMatrix = mult(modelViewMatrix, t);
    modelViewMatrix = mult(modelViewMatrix,r);
    modelViewMatrix = mult(modelViewMatrix,s);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    drawBedLeg(0, .1);

    //front right
    t = translate(0.2, -1., 0);
    modelViewMatrix = mult(modelViewMatrix, t);
    drawBedLeg(0, .5);

    //back right
    t = translate(0, 0, -.95);
    modelViewMatrix = mult(modelViewMatrix, t);
    drawBedLeg(0, .5);

    modelViewMatrix = mvMatrixStack.pop();

    // Draw the bed as a long cube (mattress)
    mvMatrixStack.push(modelViewMatrix);
    materialAmbient = vec4( 0.2, 0.2, 0.2, 1.0);
    materialDiffuse = vec4( 0.8, 0.4, 0.4, 1.0);
    materialSpecular = vec4( .86, .72, .09, 1.0 );  //this chooses the color
    materialShininess = 5;

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
    changeColors();


    s = scale4(bedLength, bedHeight, bedWidth); // Scale to the bed dimensions
    t = translate(.256, 0 ,0);

    modelViewMatrix = mult(modelViewMatrix, s);
    modelViewMatrix = mult(modelViewMatrix,t);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    DrawSolidCube(1); // Assuming you have a unit cube drawing function
    modelviewMatrix = mvMatrixStack.pop();

}

//make the Surface of Revolutions lamp
function generateLampSurface() {
  var slices = 15;
   var stacks = 7;
   var sliceInc = 3 * Math.PI / slices;
   var stackInc = Math.PI / stacks;

   for (var phi = 0; phi <= Math.PI; phi += stackInc) {
       for (var theta = 0; theta <= 2 * Math.PI; theta += sliceInc) {
           var distortFactor = 0.2 + 0.3 * Math.sin(1 * phi) * Math.cos(5 * theta); // Distortion factor

           // Calculate distorted sphere points
           var x = distortFactor * Math.sin(phi) * Math.cos(theta);
           var y = distortFactor * Math.cos(phi);
           var z = distortFactor * Math.sin(phi) * Math.sin(theta);

           // Calculate points for the next slice and stack
           var xNext = distortFactor * Math.sin(phi + stackInc) * Math.cos(theta);
           var yNext = distortFactor * Math.cos(phi + stackInc);
           var zNext = distortFactor * Math.sin(phi + stackInc) * Math.sin(theta);

           var xThetaNext = distortFactor * Math.sin(phi) * Math.cos(theta + sliceInc);
           var yThetaNext = distortFactor * Math.cos(phi);
           var zThetaNext = distortFactor * Math.sin(phi) * Math.sin(theta + sliceInc);

           // Define two triangles for each quad on the bean bag surface
           pointsArray.push(vec4(x, y, z, 1));
           pointsArray.push(vec4(xNext, yNext, zNext, 1));
           pointsArray.push(vec4(xThetaNext, yThetaNext, zThetaNext, 1));

           var xNextThetaNext = distortFactor * Math.sin(phi + stackInc) * Math.cos(theta + sliceInc);
           var yNextThetaNext = distortFactor * Math.cos(phi + stackInc);
           var zNextThetaNext = distortFactor * Math.sin(phi + stackInc) * Math.sin(theta + sliceInc);

           pointsArray.push(vec4(xNext, yNext, zNext, 1));
           pointsArray.push(vec4(xNextThetaNext, yNextThetaNext, zNextThetaNext, 1));
           pointsArray.push(vec4(xThetaNext, yThetaNext, zThetaNext, 1));
       }
   }
}

//roatate for the lamp
function rotateY(point, angle) {
    var x = point[0];
    var z = point[1];
    var c = Math.cos(angle);
    var s = Math.sin(angle);

    return vec4(x * c - z * s, 0, x * s + z * c, 1);
}

//create radians
function radians(degrees) {
    return degrees * Math.PI / 180.0;
}


function render(){
	 var s, t, r;
   var count = 2000;
	  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   	// set up view and projection
   	projectionMatrix = ortho(left*zoomFactor-translateFactorX, right*zoomFactor-translateFactorX, bottom*zoomFactor-translateFactorY, ytop*zoomFactor-translateFactorY, near, far);
   	modelViewMatrix = lookAt(eye, at, up);
 	  gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
	  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    mvMatrixStack.push(modelViewMatrix);
    t = translate(0.4, 0, 0.4);
    modelViewMatrix = mult(modelViewMatrix, t);


    //changes desk colors
    materialAmbient = vec4( 0.2, 0.2, 0.2, 1.0);
    materialDiffuse = vec4( 0.8, 0.4, 0.4, 1.0);
    materialShininess = 50;
    materialSpecular = vec4( .14, .0, .0, 1.0 );  //this chooses the color

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    changeColors();

//draws desk
    DrawDesk();
	  modelViewMatrix = mvMatrixStack.pop();

//draws chair
    mvMatrixStack.push(modelViewMatrix);
    materialAmbient = vec4( 0.1, 0.1, 0.1, 1.0 );
    materialDiffuse = vec4( 0.1, 0.1, 0.1, 1.0);
    materialSpecular = vec4( .26, .168, .0, 1.0 ); //this chooses the color
    materialShininess = 30;

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    changeColors();
    drawChair();

    modelViewMatrix = mvMatrixStack.pop();

//draws wall projector
    mvMatrixStack.push(modelViewMatrix);

    eye = [2, 2, 2];
    at = [0, 0, 0];
    up = [0, 1, 0];

    modelViewMatrix = lookAt(eye, at, up);

    materialAmbient = vec4( 0.1, 0.1, 0.1, 1. );
    materialDiffuse = vec4( 0.1, 0.1, .1, 1.0);
    materialSpecular = vec4( .9, .855, .855, 1.0 ); //this chooses the color
    materialShininess = 10;

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    changeColors();

    wallProjector();

    modelViewMatrix = mvMatrixStack.pop();

// draw the bed
    mvMatrixStack.push(modelViewMatrix);
    t=translate(0.2, 0.2, 0.5);
    modelViewMatrix=mult(modelViewMatrix, t);
    DrawBed(0.4, 0.7, 0.1);
    modelViewMatrix=mvMatrixStack.pop();


//draws pillow
    mvMatrixStack.push(modelViewMatrix);

    modelViewMatrix = mat4();

    materialAmbient = vec4( .9, .9, 1, 1.0 );
    materialDiffuse = vec4( 1, .9, 1, 1.0);
    materialSpecular = vec4( .8, .8, .9, 1.0 ); //this chooses the color
    materialShininess = 1;

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

//points start at 12324 ends at 14124
    changeColors();
    s = scale4(.1,.07,.09);
    t = translate(0.2,.3,0);
  //  modelViewMatrix = mult(modelViewMatrix,s);
    //modelViewMatrix = mult(modelViewMatrix,t);
  //  s = scale4(.1,.1,0);
  //  t = translate(0.2,.2,.5);
    modelViewMatrix = mult(modelViewMatrix,s);
    modelViewMatrix = mult(modelViewMatrix,t);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.drawArrays(gl.TRIANGLES, 0,12000);
    //gl.drawArrays(gl.TRIANGLES, 12324, 1800);

    modelViewMatrix = mvMatrixStack.pop();

//draws bean bag
    mvMatrixStack.push(modelViewMatrix);

    modelViewMatrix = mat4();

    materialAmbient = vec4( 0.1, 0.1, 0.1, 1. );
    materialDiffuse = vec4( 0.1, 0.1, .1, 1.0);
    materialSpecular = vec4( .9, .1, .1, 1.0 ); //this chooses the color
    materialShininess = 10;

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    changeColors();

    s = scale4(.2,.2,.2);
    t = translate(-1,-3,-0.5);
    modelViewMatrix = mult(modelViewMatrix,s);
    modelViewMatrix = mult(modelViewMatrix,t);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.drawArrays(gl.TRIANGLES, 14124, 3582);
    modelViewMatrix = mvMatrixStack.pop();


//draws lampProfile
    mvMatrixStack.push(modelViewMatrix);

    modelViewMatrix = mat4();
    if(isBlinking == false){
      materialAmbient = vec4( 0.1, 0.1, 0.1, 1. );
      materialDiffuse = vec4( 0.1, 0.1, .1, 1.0);
      materialSpecular = vec4( .9, .1, .1, 1.0 ); //this chooses the color
      materialShininess = 20;

      ambientProduct = mult(lightAmbient, materialAmbient);
      diffuseProduct = mult(lightDiffuse, materialDiffuse);
      specularProduct = mult(lightSpecular, materialSpecular);

      changeColors();
    }
    else{
      materialAmbient = vec4( 0.1, 0.1, 0.1, 1. );
      materialDiffuse = vec4( 0.1, 0.1, .1, 1.0);
      materialSpecular = vec4( .1, .9, .1, 1.0 ); //this chooses the color
      materialShininess = 20;

      ambientProduct = mult(lightAmbient, materialAmbient);
      diffuseProduct = mult(lightDiffuse, materialDiffuse);
      specularProduct = mult(lightSpecular, materialSpecular);

      changeColors();
    }

    s = scale4(.2,.2,.2);
    t = translate(2.7,-1.3,-0.5);
    modelViewMatrix = mult(modelViewMatrix,s);
    modelViewMatrix = mult(modelViewMatrix,t);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.drawArrays(gl.TRIANGLES, 17706, 528);
    modelViewMatrix = mvMatrixStack.pop();

    //changes wall colors
    materialAmbient = vec4( 0.1, 0.1, 0.1, 1.0 );
    materialDiffuse = vec4( 0.1, 0.1, 0.1, 1.0);
    materialSpecular = vec4( .74, .679, .407, 1.0 ); //this chooses the color
    materialShininess = 3;

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    changeColors();

  	// Floor
  	DrawWall(0.02);

    materialAmbient = vec4( 0.1, 0.1, 0.1, 1.0 );
    materialDiffuse = vec4( 0.1, 0.1, 0.1, 1.0);
    materialSpecular = vec4( .327, .771, .86, 1.0 ); //this chooses the color
    materialShininess = 7;

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    changeColors();

  	// Left wall
  	mvMatrixStack.push(modelViewMatrix);
  	r = rotate(90.0, 0.0, 0.0, 1.0);
    modelViewMatrix = mult(modelViewMatrix, r);
	  DrawWall(0.02);
  	modelViewMatrix = mvMatrixStack.pop();

  	//Right Wall
  	mvMatrixStack.push(modelViewMatrix);
  	r = rotate(-90, 1.0, 0.0, 0.0);
    t = translate(-0.01,.2,.15);
    modelViewMatrix = mult(modelViewMatrix, r);
    modelViewMatrix = mult(modelViewMatrix, t);

  	DrawWall(0.02);
  	modelViewMatrix = mvMatrixStack.pop();

    requestAnimationFrame(render);

}

// ******************************************
// supporting functions below this:
// ******************************************
function triangle(a, b, c){
     normalsArray.push(vec3(a[0], a[1], a[2]));
     normalsArray.push(vec3(b[0], b[1], b[2]));
     normalsArray.push(vec3(c[0], c[1], c[2]));

     pointsArray.push(a);
     pointsArray.push(b);
     pointsArray.push(c);

     sphereCount += 3;
}

function divideTriangle(a, b, c, count){
    if ( count > 0 )
    {
        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else {
        triangle( a, b, c );
    }
}

function tetrahedron(a, b, c, d, n){
    	divideTriangle(a, b, c, n);
    	divideTriangle(d, c, b, n);
    	divideTriangle(a, d, b, n);
    	divideTriangle(a, c, d, n);
}

function quad(a, b, c, d){
    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[b]);
    var normal = cross(t1, t2);
    var normal = vec3(normal);
    normal = normalize(normal);

     	pointsArray.push(vertices[a]);
     	normalsArray.push(normal);
     	pointsArray.push(vertices[b]);
     	normalsArray.push(normal);
     	pointsArray.push(vertices[c]);
     	normalsArray.push(normal);
    	pointsArray.push(vertices[a]);
     	normalsArray.push(normal);
     	pointsArray.push(vertices[c]);
     	normalsArray.push(normal);
     	pointsArray.push(vertices[d]);
     	normalsArray.push(normal);
}

function colorCube(){
    	quad( 1, 0, 3, 2 );
    	quad( 2, 3, 7, 6 );
    	quad( 3, 0, 4, 7 );
    	quad( 6, 5, 1, 2 );
    	quad( 4, 5, 6, 7 );
    	quad( 5, 4, 0, 1 );
}

function extQuad(a, b, c, d) {

     var indices=[a, b, c, d];

     var normal = Newell(indices);

     // triangle a-b-c
     pointsArray.push(verticesx[a]);
     normalsArray.push(normal);

     pointsArray.push(verticesx[b]);
     normalsArray.push(normal);

     pointsArray.push(verticesx[c]);
     normalsArray.push(normal);

     // triangle a-c-d
     pointsArray.push(verticesx[a]);
     normalsArray.push(normal);

     pointsArray.push(verticesx[c]);
     normalsArray.push(normal);

     pointsArray.push(verticesx[d]);
     normalsArray.push(normal);
}

function scale4(a, b, c) {
   	var result = mat4();
   	result[0][0] = a;
   	result[1][1] = b;
   	result[2][2] = c;
   	return result;
}

function multiply(m, v){
    var vv=vec4(
     m[0][0]*v[0] + m[0][1]*v[1] + m[0][2]*v[2]+ m[0][3]*v[3],
     m[1][0]*v[0] + m[1][1]*v[1] + m[1][2]*v[2]+ m[1][3]*v[3],
     m[2][0]*v[0] + m[2][1]*v[1] + m[2][2]*v[2]+ m[2][3]*v[3],
     1);
    return vv;
}

function quadBag(a, b, c, d) {
  var points=[a, b, c, d];
   	var normal = bagNewll(points);

        // triangle abc
   	pointsArray.push(a);
   	normalsArray.push(normal);
   	pointsArray.push(b);
   	normalsArray.push(normal);
   	pointsArray.push(c);
   	normalsArray.push(normal);

        // triangle acd
   	pointsArray.push(a);
   	normalsArray.push(normal);
   	pointsArray.push(c);
   	normalsArray.push(normal);
   	pointsArray.push(d);
   	normalsArray.push(normal);
}

function Newell(vertices1){

   var L=vertices1.length;

   var x=0, y=0, z=0;
   var index, nextIndex;


   for (var i=0; i<L; i++)
   {
       index=vertices1[i];
       nextIndex = vertices1[(i+1)%L];

       x += (vertices[index][1] - vertices[nextIndex][1])*
            (vertices[index][2] + vertices[nextIndex][2]);
       y += (vertices[index][2] - vertices[nextIndex][2])*
            (vertices[index][0] + vertices[nextIndex][0]);
       z += (vertices[index][0] - vertices[nextIndex][0])*
            (vertices[index][1] + vertices[nextIndex][1]);

   }

   return (normalize(vec3(x, y, z)));
}

function ExtrudedShape(){
    var basePoints=[];
    var topPoints=[];


    // create the face list
    // add the side faces first --> N quads
    for (var j=0; j<N; j++)
    {
        extQuad(j, j+N, (j+1)%N+N, (j+1)%N);
    }

    // the first N vertices come from the base
    basePoints.push(0);
    for (var i=N-1; i>0; i--)
    {
        basePoints.push(i);  // index only
    }
    // add the base face as the Nth face
    polygon(basePoints);

    // the next N vertices come from the top
    for (var i=0; i<N; i++)  {
        topPoints.push(i+N); // index only
    }
    // add the top face
    polygon(topPoints);
}

function polygon(indices1){
    // for indices=[a, b, c, d, e, f, ...]
    var M=indices1.length;
    var normal=Newell(indices1);

    var prev=1;
    var next=2;
    // triangles:
    // a-b-c
    // a-c-d
    // a-d-e
    // ...
    for (var i=0; i<M-2; i++)
    {
        pointsArray.push(vertices[indices1[0]]);
        normalsArray.push(normal);

        pointsArray.push(vertices[indices1[prev]]);
        normalsArray.push(normal);

        pointsArray.push(vertices[indices1[next]]);
        normalsArray.push(normal);

        prev=next;
        next=next+1;
    }
}
