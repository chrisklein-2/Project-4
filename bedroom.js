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

var zoomFactor = .8;
var translateFactorX = 0;
var translateFactorY = 0.2;

var numTimesToSubdivide = 5;
var slices = 24, stacks = 10;

var pointsArray = [];
var normalsArray = [];

var animateFlag = 0;

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
var theta = 0;
var verticesx = [vec4(2, 0, 0, 1),
                 vec4(0, 0, 2, 1),
                 vec4(0, 0, 0, 1)
				 ];


var N, N_Triangle;

var sphereCount = 0;

var vertices = [
        vec4( -0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5,  0.5,  0.5, 1.0 ),
        vec4( 0.5,  0.5,  0.5, 1.0 ),
        vec4( 0.5, -0.5,  0.5, 1.0 ),
        vec4( -0.5, -0.5, -0.5, 1.0 ),
        vec4( -0.5,  0.5, -0.5, 1.0 ),
        vec4( 0.5,  0.5, -0.5, 1.0 ),
        vec4( 0.5, -0.5, -0.5, 1.0 ),
        vec4( 0, 0, 1, 1),  //A(8)
        vec4( 1, 0, 0, 1),  //B(9)
        vec4( 1, 1 ,0, 1),  //C(10)
        vec4( .5, 1,5, 0, 1),  //D(11)
        vec4( 0, 1, 0, 1),  //E(12)
        vec4( 0, 0, 1, 1),  //F(13)
        vec4( 1, 0, 1, 1),  //G(14)
        vec4( 1, 1 ,1, 1),  //H(15)
        vec4( .5, 1,5, 1, 1),  //I(16)
        vec4( 0, 1, 1, 1)   //J(17)

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
var materialShininess = 1;


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


    window.addEventListener("keydown", function () {

          //makes the a key animate
          if (event.keyCode == 65) {
              if(animateFlag == 0)
                animateFlag = 1;
              else {
                animateFlag = 0;
              }
              render();
          }
        });


    render();
}

function changeColors(){
    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, "shininess"),materialShininess );
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

    t = translate(.4, .3, 0);
    s = scale4(.3,.04,.3);
    modelViewMatrix = mult(mult(modelViewMatrix, t),s);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    DrawSolidCube(1);
    modelViewMatrix = mvMatrixStack.pop();

    //draw legs
    mvMatrixStack.push(modelViewMatrix);

    //front left
    t = translate(.32, 0, 0);
    r = rotate(90,-9,0,1);
    modelViewMatrix = mult(modelViewMatrix, t);
    modelViewMatrix = mult(modelViewMatrix, r);
    drawDeskLeg(0, .1);

    //front right
    t = translate(.25, -.4, 0);
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

function drawBeanBag(){
  var sliceInc = 2*Math.PI/slices;
  var stackInc = Math.PI/stacks;

  var prev, curr;
  var curr1, curr2, prev1, prev2;


  var half=[];
  var count=0;
      // generate half circle: PI/2 (0) --> -PI/2 (stack)
  for (var phi=Math.PI/2; phi>=-Math.PI/2; phi-=stackInc) {
      half.push(vec4(radius*Math.cos(phi), radius*Math.sin(phi), 0, 1));
  }

  prev = half;
      // rotate around y axis
  var m = rotate(360/slices, 0, 1, 0);
  for (var i=1; i<=slices; i++) {
      var curr=[]

          // compute the new set of points with one rotation
      for (var j=0; j<=stacks; j++) {
          var v4 = multiply(m, prev[j]);
          curr.push( v4 );
      }

          // top of the sphere j=0 case
          //triangle(prev[0], prev[1], curr[1]);
      triangle(prev[0], curr[1], prev[1]);

          // create the triangles for this slice
      for (var j=1; j<stacks-1; j++) {
          prev1 = prev[j];
          prev2 = prev[j+1];

          curr1 = curr[j];
          curr2 = curr[j+1];

          quadBag(prev1, curr1, curr2, prev2);
      }

          // bottom of the sphere j=stacks case
      triangle(prev[stacks], prev[stacks-1], curr[stacks-1]);

      prev = curr;
    }

}

function ExtrudedTriangle(){
    // for a different extruded object,
    // only change these two variables: vertices and height

    var height=2;

    N=N_Triangle = verticesx.length;

    // add the second set of points
    for (var i=0; i<N; i++)
    {
        verticesx.push(vec4(verticesx[i][0], verticesx[i][1]+height, verticesx[i][2], 1));
    }

    ExtrudedShape();
}

function starLightFixture(){

    ExtrudedTriangle();
    N=N_Triangle;

    var count = vertices.length;
    var r,s,t;
    
    for(var i = 0; i<verticesx.length; i++){
        vertices.push(verticesx[i]);
    }

    mvMatrixStack.push(modelViewMatrix);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));


  //	r = rotate(90.0, 0.0, 0.0, 1.0);
    t = translate(-1,-10,0);
    modelViewMatrix = mult(modelViewMatrix, t);
    //modelViewMatrix = mult(modelViewMatrix, r);

//count + (6*N+1*3*2)
    gl.drawArrays(gl.TRIANGLES, count, 4);

    mvMatrixStack.pop();
}

function render(){
	 var s, t, r;

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
    if(animateFlag == 0)
        materialSpecular = vec4( .14, .0, .0, 1.0 );  //this chooses the color
    else {
        materialSpecular = vec4( .3, .0, .0, 1.0 );  //this chooses the color

    }
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    changeColors();

    //draws desk
    DrawDesk();
	  modelViewMatrix = mvMatrixStack.pop();

    mvMatrixStack.push(modelViewMatrix);

    //drawBeanBag();


    //gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    //gl.drawArrays(gl.TRIANGLES, 12324, 1295);

    //starLightFixture();

    modelViewMatrix = mvMatrixStack.pop();

    //changes wall colors
    materialAmbient = vec4( 0.1, 0.1, 0.1, 1.0 );
    materialDiffuse = vec4( 0.1, 0.1, 0.1, 1.0);
    materialSpecular = vec4( .327, .771, .86, 1.0 ); //this chooses the color

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    changeColors();

  	// Floor
  	DrawWall(0.02);

  	// Left wall
  	mvMatrixStack.push(modelViewMatrix);
  	r = rotate(90.0, 0.0, 0.0, 1.0);
    modelViewMatrix = mult(modelViewMatrix, r);
  	DrawWall(0.02);
  	modelViewMatrix = mvMatrixStack.pop();

  	// Back Wall
  	mvMatrixStack.push(modelViewMatrix);
  	r = rotate(-90, 1.0, 0.0, 0.0);

    modelViewMatrix = mult(modelViewMatrix, r);
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
   	var normal = Newell(points);

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
       index=i;
       nextIndex = (i+1)%L;


       x += (verticesx[index][1] - verticesx[nextIndex][1])*
            (verticesx[index][2] + verticesx[nextIndex][2]);
       y += (verticesx[index][2] - verticesx[nextIndex][2])*
            (verticesx[index][0] + verticesx[nextIndex][0]);
       z += (verticesx[index][0] - verticesx[nextIndex][0])*
            (verticesx[index][1] + verticesx[nextIndex][1]);

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
        pointsArray.push(verticesx[indices1[0]]);
        normalsArray.push(normal);

        pointsArray.push(verticesx[indices1[prev]]);
        normalsArray.push(normal);

        pointsArray.push(verticesx[indices1[next]]);
        normalsArray.push(normal);

        prev=next;
        next=next+1;
    }
}
