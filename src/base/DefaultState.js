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
    
    vec3 col = vec3(0.8, 0.2, 0.1);
    for(int j=-2;j<=2;j++){
        for(int k=-2;k<=2;k++){
            vec2 uv = (fc)/iResolution.xy;
            uv += sin(uv.x*(2.0+sin(iTime*0.39))+iTime*0.12)*vec2(j,k)*13.0/iResolution.xy;

            //float i = iTime*0.4+float(j)*0.03;
            float i = iTime*0.1+float(j)*0.03;
            uv.x *= 0.8;            
            
            float y = sin(uv.x*3.0+uv.x*sin(uv.x+i*0.37)*1.0+i*2.0+cos(uv.x*0.6+i*0.71)*0.75)*0.25+uv.y-0.5;
            float ys = sign(y);
			col += abs(vec3(max((1.0-pow(y,0.13+sin(uv.x+iTime*0.21)*0.1))*vec3(1.1,0.6,0.15),(1.0-pow(-y,0.13))*vec3(0.9,0.2,0.2))));
        }
    }
	//col /= 3.0;
    // Output to screen
    //fragColor = vec4(col.r / 2.9, col.r / 1.2, col.r/ 1.9,1.0);
    fragColor = vec4(col.r * 0.125, col.r * 0.027, col.r * 0.22 ,1.0);
}

void main() 
{
    mainImage( gl_FragColor, gl_FragCoord.xy );
}
`;

    async enter( params = {} )
    {
        this.app.container.innerHTML = `
            <div style="margin: 0; padding: 0; width: 100%; height: 100%; min-height: 200px;position: relative">
                <canvas id="ds" style="margin: 0; padding: 0; width: 100%; height: 100%;position: absolute; top: 0; left: 0; z-index: 1"></canvas>;
                <div style="position: absolute;top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2; width: 30%; min-width: 320px; display: inline-block">

<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 1217.59 390.24" style="enable-background:new 0 0 1217.59 390.24;" xml:space="preserve">
<style type="text/css">
	.st0{fill:#272727;}
	.st1{fill:#A4CE39;}
	.st2{fill:none;stroke:#FFF200;stroke-miterlimit:10;}
	.st3{fill:#708739;}
	.st4{fill:#FFFFFF;}
</style>
<g>
	<path class="st4" d="M584.13,213.38c18.31,0,33.2-14.8,33.2-32.98c0-18.31-14.89-33.2-33.2-33.2c-18.23,0-33.06,14.89-33.06,33.2
		C551.07,198.58,565.9,213.38,584.13,213.38z"/>
	<path class="st4" d="M457.76,167.74c5.31-0.71,9.73-5.24,9.73-10.27c0-3.86-5.09-6.99-11.34-6.99h-9.42v17.37l9.51,0L457.76,167.74
		z"/>
	<path class="st4" d="M1217.59,0h-69.69H64.05H0l0,0v390.24h61.77l0,0h1155.82l0,0v-38.5v-315V0z M919.19,204.54
		c4.21,3.58,10.26,5.64,16.58,5.64h0.68c15.32,0,28.26-13.12,28.26-28.65l-0.36-71.07H949.4h-27.11V73.49h85.46v2.66l0.53,105.52
		c0,19.42-7.44,37.54-20.95,51.06c-13.48,13.49-31.48,20.92-50.7,20.92h-1.06c-14.29,0-29.01-4.53-40.4-12.42l-7.23-5.01
		l22.47-39.14L919.19,204.54z M796.54,113.89h100.88v36.96h-32v99.55h-36.88v-99.55h-32V113.89z M668,110.08h8.38l67.84,64.99
		v-63.24h36.89v138.57h-8.31l-67.99-65.14v63.24H668V110.08z M584.2,110.22c38.68,0,70.16,31.54,70.16,70.32
		c0,38.52-31.51,69.87-70.23,69.87c-38.6,0-70.02-31.35-70.02-69.87C514.11,141.77,545.55,110.22,584.2,110.22z M409.81,113.74h45.9
		c27.15,0,49.24,21.17,49.24,47.18c0,14.64-7.38,28.25-18.88,36.26l38.7,53.23H479.2l-31.87-45.82h-0.6v45.82h-36.88l-0.03-9.15
		V113.74z M306.69,113.74h84.46v36.75H343.4l-0.2,17.35h47.95l0.02,36.75h-47.99l0.41,45.83h-36.89V113.74z M175.2,110.08h8.38
		l67.84,64.99v-63.24h36.89v138.57h-8.31l-67.99-65.14v63.24H175.2V110.08z M73.49,216.69h23.2V110.45h-23.2V73.49h85.46v36.96
		h-23.2v106.24h23.2v36.96h-27.11H100.6H73.49V216.69z M1144.1,315H73.49v-39.07H1144.1V315z M1129.07,239.24
		c-11.69,9.29-27.87,14.41-45.55,14.41c-28.18,0-51.53-13.18-62.45-35.26l-3.61-7.3l34.56-24.71l5.26,9.2
		c5.19,9.08,14.86,14.29,26.53,14.29c11.65,0,21.12-4.8,21.12-10.7c0-7.95-19.46-16.34-32.34-21.89l-0.49-0.21
		c-17.7-7.87-44.3-19.69-44.3-50.78c0-30.11,25.65-52.82,59.68-52.82c25.96,0,46.2,12.72,54.15,34.03l2.6,6.98l-33.67,23.28
		l-4.76-10.38c-3.06-6.68-10.01-10.83-18.13-10.83c-9.63,0-16.1,5.33-16.1,10.31c0,4.04,7.88,7.61,20.84,13.01
		c2.14,0.89,4.36,1.82,6.65,2.8c21.67,9.52,44.57,21.74,48.83,47.28v17.48C1145.85,220.01,1139.34,231.08,1129.07,239.24z"/>
</g>
</svg>

            
                </div>
            </div>        
        `
        this.canvas = null;
        this.gl = null;
        this.vp_size = null;
        this.progDraw = null;
        this.bufObj = {};
        this.initScene();
    }

    async exit()
    {
        this.destroyScene();
        this.app.container.innerHTML = '';
    }

    destroyScene()
    {
        if ( this.RAF_ID )
        {
            cancelAnimationFrame( this.RAF_ID );
        }
        if ( !this.gl )
        {
            return;
        }

        if ( this.FRAG_ID )
        {
            this.gl.deleteShader( this.FRAG_ID );
        }

        if ( this.VERTEX_ID )
        {
            this.gl.deleteShader( this.VERTEX_ID );
        }

    }

    initScene()
    {
        this.canvas = document.getElementById( "ds" );
        this.gl = this.canvas.getContext( "experimental-webgl" );
        if ( !this.gl )
            return;

        this.progDraw = this.gl.createProgram();
        for ( let i = 0; i < 2; ++i )
        {
            let source = i == 0 ? DefaultState.VERTEX_SHADER : DefaultState.FRAGMENT_SHADER;
            let shaderObj = this.gl.createShader( i == 0 ? this.gl.VERTEX_SHADER : this.gl.FRAGMENT_SHADER );
            if ( i === 0 )
            {
                this.VERTEX_ID = shaderObj;
            }
            else
            {
                this.FRAG_ID = shaderObj;
            }
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
        this.RAF_ID = requestAnimationFrame( this.render.bind( this ) );
    }

    resize() {
        //vp_size = [gl.drawingBufferWidth, gl.drawingBufferHeight];
        //this.vp_size = [window.innerWidth, window.innerHeight];
        this.vp_size = [512, 512];
        this.canvas.width = this.vp_size[0];
        this.canvas.height = this.vp_size[1];
    }

    render(deltaMS) {

        this.gl.viewport( 0, 0, this.canvas.width, this.canvas.height );
        this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT );

        this.gl.uniform1f(this.progDraw.iTime, deltaMS/1000.0);
        this.gl.uniform2f(this.progDraw.iResolution, this.canvas.width, this.canvas.height);
        this.gl.drawElements( this.gl.TRIANGLES, this.bufObj.inx.len, this.gl.UNSIGNED_SHORT, 0 );

        this.RAF_ID = requestAnimationFrame(this.render.bind( this ));
    }

}

export { DefaultState };
