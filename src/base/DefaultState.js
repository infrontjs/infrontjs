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
                <div style="position: absolute;top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2; width: 36%; min-width: 360px; display: inline-block">
                    <?xml version="1.0" encoding="utf-8"?>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 504.23 181.11" style="max-width: 100%; max-height: 100%"><path fill="#ffffff" d="M493.78,10.44V170.66H10.44V10.44H493.78m2-1.95H8.49V172.62H495.73V8.49Z"/><path fill="#ffffff" d="M242.48,97.68A12.92,12.92,0,1,0,229.57,84.8,12.94,12.94,0,0,0,242.48,97.68Z"/><path fill="#ffffff" d="M193.13,79.86a4.31,4.31,0,0,0,3.79-4c0-1.51-2-2.73-4.42-2.73h-3.68V79.9h3.71Z"/><path fill="#ffffff" d="M489.88,14.35H14.35V166.76H489.88V14.35ZM373.34,94.23a10.06,10.06,0,0,0,6.47,2.2h.27a11.26,11.26,0,0,0,11-11.19L391,57.49H374.55V43.05h33.38v1l.2,41.21a27.91,27.91,0,0,1-28,28.11h-.41A28.34,28.34,0,0,1,364,108.56l-2.82-2,8.77-15.29Zm-47.9-35.4h39.4V73.27h-12.5v38.88H337.93V73.27H325.44Zm-50.21-1.49h3.28L305,82.73V58h14.41v54.12h-3.24L289.61,86.71V111.4H275.23Zm-32.72.06a27.38,27.38,0,1,1-27.38,27.46A27.46,27.46,0,0,1,242.51,57.4ZM174.4,58.77h17.93c10.6,0,19.23,8.27,19.23,18.43a17.37,17.37,0,0,1-7.37,14.16l15.11,20.79H201.5l-12.45-17.9h-.23v17.9H174.41V58.77Zm-40.27,0h33V73.12H148.46l-.07,6.78h18.72V94.25H148.38l.16,17.9H134.13ZM82.77,57.34h3.28l26.49,25.39V58H127v54.12h-3.24L97.15,86.71V111.4H82.77ZM43.05,99h9.06V57.49H43.05V43.05H76.43V57.49H67.37V99h9.06v14.43H43.05Zm418.13,38.39H43.05V122.11H461.18Zm-5.87-29.58c-4.57,3.62-10.89,5.62-17.79,5.62-11,0-20.13-5.14-24.39-13.77l-1.41-2.85,13.49-9.65,2.06,3.6c2,3.55,5.8,5.58,10.36,5.58s8.25-1.87,8.25-4.18c0-3.1-7.6-6.38-12.63-8.54l-.19-.09c-6.91-3.07-17.3-7.69-17.3-19.83,0-11.76,10-20.63,23.3-20.63,10.14,0,18.05,5,21.15,13.29l1,2.73-13.15,9.09-1.86-4a7.58,7.58,0,0,0-7.08-4.23c-3.76,0-6.29,2.08-6.29,4,0,1.57,3.08,3,8.14,5.08l2.6,1.09c8.46,3.72,17.41,8.49,19.07,18.47v6.82A19.79,19.79,0,0,1,455.31,107.79Z"/></svg>
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
