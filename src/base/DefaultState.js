import { State } from "./State.js";

class DefaultState extends State
{
    static ID = 'INFRONT_DEFAULT_INDEX_STATE';

    static VERTEX_SHADER = `
attribute vec2 inPos;

void main() 
{
    gl_Position = vec4(inPos, 0.0, 1.0);
}
`;
    static FRAGMENT_SHADER = `
precision mediump float;

uniform vec2 iResolution;
uniform vec2 iMouse;
uniform float iTime;

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 fc = fragCoord;
    
    vec3 col = vec3(0.0);
    for(int j=-2;j<=2;j++){
        for(int k=-2;k<=2;k++){
            vec2 uv = (fc)/iResolution.xy;
            uv += sin(uv.x*(2.0+sin(iTime*0.39))+iTime*0.12)*vec2(j,k)*13.0/iResolution.xy;

            //float i = iTime*0.08+float(j)*0.03;
            float i = iTime*0.16+float(j)*0.03;
            uv.x *= 0.8;
            
            float y = sin(uv.x*3.0+uv.x*sin(uv.x+i*0.37)*1.0+i*2.0+cos(uv.x*0.6+i*0.71)*0.75)*0.25+uv.y-0.5;
            float ys = sign(y);
			col += abs(vec3(max((1.0-pow(y,0.13+sin(uv.x+iTime*0.21)*0.1))*vec3(1.1,0.6,0.15),(1.0-pow(-y,0.13))*vec3(0.9,0.2,0.2))));
        }
    }
	col /= 15.0;
    // Output to screen
    fragColor = vec4(col.r / 2.9, col.r / 1.2, col.r/ 1.9,1.0);
}

void main() 
{
    mainImage( gl_FragColor, gl_FragCoord.xy );
}
`;

    async enter( params = {} )
    {
        this.app.container.innerHTML = `
        <style>
            * { margin: 0; padding: 0;overflow: hidden;}
        </style>
        <canvas id="ds" style="position: fixed; top:0; left:0; z-index: 2;"></canvas>;

            <div style="position: fixed;
                        z-index: 9; 
                        top: 50%; 
                        left: 50%; 
                        transform: translate(-50%, -50%);
                        text-align: center;;
                        font-family: Tahoma; 
                        font-size: 4em;
                        font-weight: bolder;
                        padding: .5em; 
                        background-color: white; 
                        color: black;
                        mix-blend-mode: screen;
                        display: inline-block;">
                        I<span style="font-size: 0.8em">NFRONT</span>JS
                        <h2 style="font-family: 'Courier New'; background-color: black; color: white; margin-top: 0px; font-size: 0.3em;padding: 3px">Version ${this.app.getVersion()}</h2>
            </div>        
        `
        this.canvas = null;
        this.gl = null;
        this.vp_size = null;
        this.progDraw = null;
        this.bufObj = {};
        this.mousepos = [0,0];
        this.initScene();
    }

    initScene()
    {
        this.canvas = document.getElementById( "ds" );
        this.gl = this.canvas.getContext( "experimental-webgl" );
        if ( !this.gl )
            return;

        this.canvas.addEventListener( 'mousemove', ( e ) =>
        {
            this.mousepos = [ e.clientX, e.clientY ];
        } );

        this.progDraw = this.gl.createProgram();
        for ( let i = 0; i < 2; ++i )
        {
            let source = i == 0 ? DefaultState.VERTEX_SHADER : DefaultState.FRAGMENT_SHADER;
            let shaderObj = this.gl.createShader( i == 0 ? this.gl.VERTEX_SHADER : this.gl.FRAGMENT_SHADER );
            this.gl.shaderSource( shaderObj, source );
            this.gl.compileShader( shaderObj );
            let status = this.gl.getShaderParameter( shaderObj, this.gl.COMPILE_STATUS );
            if ( !status ) { console.error( this.gl.getShaderInfoLog( shaderObj ) ); continue; }
            this.gl.attachShader( this.progDraw, shaderObj );
            this.gl.linkProgram( this.progDraw );
        }
        const status = this.gl.getProgramParameter( this.progDraw, this.gl.LINK_STATUS );
        //if ( !status ) alert( this.gl.getProgramInfoLog( this.progDraw ) );
        if ( !status ) { console.error( this.gl.getProgramInfoLog( this.progDraw ) ); return; }
        this.progDraw.inPos = this.gl.getAttribLocation( this.progDraw, "inPos" );
        this.progDraw.iTime = this.gl.getUniformLocation( this.progDraw, "iTime" );
        this.progDraw.iMouse = this.gl.getUniformLocation( this.progDraw, "iMouse" );
        this.progDraw.iResolution = this.gl.getUniformLocation( this.progDraw, "iResolution" );
        this.gl.useProgram( this.progDraw );

        let pos = [ -1, -1, 1, -1, 1, 1, -1, 1 ];
        let inx = [ 0, 1, 2, 0, 2, 3 ];
        this.bufObj.pos = this.gl.createBuffer();
        this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.bufObj.pos );
        this.gl.bufferData( this.gl.ARRAY_BUFFER, new Float32Array( pos ), this.gl.STATIC_DRAW );
        this.bufObj.inx = this.gl.createBuffer();
        this.bufObj.inx.len = inx.length;
        this.gl.bindBuffer( this.gl.ELEMENT_ARRAY_BUFFER, this.bufObj.inx );
        this.gl.bufferData( this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( inx ), this.gl.STATIC_DRAW );
        this.gl.enableVertexAttribArray( this.progDraw.inPos );
        this.gl.vertexAttribPointer( this.progDraw.inPos, 2, this.gl.FLOAT, false, 0, 0 );

        this.gl.enable( this.gl.DEPTH_TEST );
        this.gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

        window.onresize = this.resize.bind( this );
        this.resize();
        requestAnimationFrame( this.render.bind( this ) );
    }

    resize() {
        //vp_size = [gl.drawingBufferWidth, gl.drawingBufferHeight];
        //this.vp_size = [window.innerWidth, window.innerHeight];
        this.vp_size = [512, 512]
        this.canvas.width = this.vp_size[0];
        this.canvas.height = this.vp_size[1];
        this.canvas.style.width = "100vw";
        this.canvas.style.height = "100vh";
    }

    render(deltaMS) {

        this.gl.viewport( 0, 0, this.canvas.width, this.canvas.height );
        this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT );

        this.gl.uniform1f(this.progDraw.iTime, deltaMS/1000.0);
        this.gl.uniform2f(this.progDraw.iResolution, this.canvas.width, this.canvas.height);
        this.gl.uniform2f(this.progDraw.iMouse, this.mousepos[0], this.mousepos[1]);
        this.gl.drawElements( this.gl.TRIANGLES, this.bufObj.inx.len, this.gl.UNSIGNED_SHORT, 0 );

        requestAnimationFrame(this.render.bind( this ));
    }

}

export { DefaultState };
