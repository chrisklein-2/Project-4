var canvas;
var gl;

var zoomFactor = 1;
var translateFactorX = 0;
var translateFactorY = 0.2;

var numTimesToSubdivide = 5;
 
var pointsArray = [];
var normalsArray = [];

var left = -1;
var right = 1;
var ytop = 1;
var bottom = -1;
var near = -10;
var far = 10;
var deg=5;
var eye=[.3, .6, .6];
var at=[.1, .1, 0];
var up=[0, 1, 0];

var cubeCount=36;
var sphereCount=0;


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

var ambientColor, diffuseColor, specularColor;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var mvMatrixStack=[];
var program;

window.onload = function init() 
{
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
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



    render();
}

function changeColors(){
    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, "shininess"),materialShininess );
}


// ******************************************
// Draw simple and primitive objects
// ******************************************

function DrawSolidCube(length)
{
	mvMatrixStack.push(modelViewMatrix);
	s=scale4(length, length, length );   // scale to the given width/height/depth 
    modelViewMatrix = mult(modelViewMatrix, s);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	
    gl.drawArrays( gl.TRIANGLES, 0, 36);

	modelViewMatrix=mvMatrixStack.pop();
}

// start drawing the wall
function DrawWall(thickness)
{
	var s, t, r;

	// draw thin wall with top = xz-plane, corner at origin
	mvMatrixStack.push(modelViewMatrix);

	t=translate(0.5, 0.5*thickness, 0.5);
	s=scale4(1.0, thickness, 1.0);
    modelViewMatrix=mult(mult(modelViewMatrix, t), s);
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
	DrawSolidCube(1);

	modelViewMatrix=mvMatrixStack.pop();
}

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

    modelViewMatrix=mvMatrixStack.pop();
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
    t= translate(.32, 0, 0);
    r = rotate(90,-9,0,1);
    modelViewMatrix = mult(modelViewMatrix, t);
    modelViewMatrix = mult(modelViewMatrix,r);
    drawDeskLeg(0, .1);

    //front right
    t= translate(.25, -.4, 0);
    modelViewMatrix = mult(modelViewMatrix, t);
    drawDeskLeg(0, .5);

    //back right
    t= translate(.05, .2, 0);
    modelViewMatrix = mult(modelViewMatrix, t);
    drawDeskLeg(0, .5);

    //back left
    t= translate(-.2, 0, 0);
    modelViewMatrix = mult(modelViewMatrix, t);
    drawDeskLeg(0, .5);


    modelViewMatrix = mvMatrixStack.pop();


}

function drawBeanBag(){

    quad(8, 9, 10, 11);   // AFJE left side
    quad(3, 1, 2, 3);   // DEJI left roof
    quad(0, 3, 1, 3);
    quad(1, 2, 2, 1);
    quad(0, 1, 2, 3);

}

function render()
{
	var s, t, r;

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 

   	// set up view and projection
   	projectionMatrix = ortho(left*zoomFactor-translateFactorX, right*zoomFactor-translateFactorX, bottom*zoomFactor-translateFactorY, ytop*zoomFactor-translateFactorY, near, far);
   	modelViewMatrix=lookAt(eye, at, up);
 	gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
	gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));


    mvMatrixStack.push(modelViewMatrix);
    t=translate(0.4, 0, 0.4);
    modelViewMatrix=mult(modelViewMatrix, t);

    //changes desk colors
    materialAmbient = vec4( 0.2, 0.2, 0.2, 1.0);
    materialDiffuse = vec4( 0.8, 0.4, 0.4, 1.0);
    materialSpecular = vec4( .14, .0, .0, 1.0 );  //this chooses the color

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    changeColors();

    //draws desk
    DrawDesk();
	modelViewMatrix=mvMatrixStack.pop();

    mvMatrixStack.push(modelViewMatrix);

    drawBeanBag();

    modelViewMatrix = mvMatrixStack.pop();

    //changes wall colors
    materialAmbient = vec4( 0.1, 0.1, 0.1, 1.0 );
    materialDiffuse = vec4( 0.1, 0.1, 0.1, 1.0);
    materialSpecular = vec4( .327, .771, .86, 1.0 ); //this chooses the color
   
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    changeColors();

	// wall # 1: in xz-plane
	DrawWall(0.02); 
	
	// wall #2: in yz-plane
	mvMatrixStack.push(modelViewMatrix);
	r=rotate(90.0, 0.0, 0.0, 1.0);
    modelViewMatrix=mult(modelViewMatrix, r);
	DrawWall(0.02); 
	modelViewMatrix=mvMatrixStack.pop();
	
	// wall #3: in xy-plane
	mvMatrixStack.push(modelViewMatrix);
	r=rotate(-90, 1.0, 0.0, 0.0);

    modelViewMatrix=mult(modelViewMatrix, r);
	DrawWall(0.02); 
	modelViewMatrix=mvMatrixStack.pop();

}

// ******************************************
// supporting functions below this:
// ******************************************
function triangle(a, b, c) 
{
     normalsArray.push(vec3(a[0], a[1], a[2]));
     normalsArray.push(vec3(b[0], b[1], b[2]));
     normalsArray.push(vec3(c[0], c[1], c[2]));
     
     pointsArray.push(a);
     pointsArray.push(b);      
     pointsArray.push(c);

     sphereCount += 3;
}

function divideTriangle(a, b, c, count) 
{
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

function tetrahedron(a, b, c, d, n) 
{
    	divideTriangle(a, b, c, n);
    	divideTriangle(d, c, b, n);
    	divideTriangle(a, d, b, n);
    	divideTriangle(a, c, d, n);
}

function quad(a, b, c, d) 
{
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

function colorCube()
{
    	quad( 1, 0, 3, 2 );
    	quad( 2, 3, 7, 6 );
    	quad( 3, 0, 4, 7 );
    	quad( 6, 5, 1, 2 );
    	quad( 4, 5, 6, 7 );
    	quad( 5, 4, 0, 1 );
}

function scale4(a, b, c) {
   	var result = mat4();
   	result[0][0] = a;
   	result[1][1] = b;
   	result[2][2] = c;
   	return result;
}
