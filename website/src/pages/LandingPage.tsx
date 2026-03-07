import { Copy, Check } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import beamzLogo from '../BEAMZ_logo_new.svg'

function CopyableSnippet() {
  const [copied, setCopied] = useState(false)
  const command = 'pip install beamz'

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(command)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black/30 backdrop-blur border border-white/10 font-mono text-sm text-white hover:bg-black/40 transition-colors"
    >
      <span className="opacity-50">$</span>
      <span>{command}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-400" />
      ) : (
        <Copy className="h-3.5 w-3.5 opacity-50" />
      )}
    </button>
  )
}

const VERTEX = `
  attribute vec2 a_position;
  void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`

const FRAGMENT = `
#extension GL_OES_standard_derivatives : enable
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

#define PI 3.14159265359

float vmin(vec2 v) {
    return min(v.x, v.y);
}

float vmax(vec2 v) {
    return max(v.x, v.y);
}

float ellip(vec2 p, vec2 s) {
    float m = vmin(s);
    return (length(p / s) * m) - m;
}

float halfEllip(vec2 p, vec2 s) {
    p.x = max(0., p.x);
    float m = vmin(s);
    return (length(p / s) * m) - m;
}

float fBox(vec2 p, vec2 b) {
    return vmax(abs(p) - b);
}

float dvd_d(vec2 p) {
    float d = halfEllip(p, vec2(.8, .5));
    d = max(d, -p.x - .5);
    float d2 = halfEllip(p, vec2(.45, .3));
    d2 = max(d2, min(-p.y + .2, -p.x - .15));
    d = max(d, -d2);
    return d;
}

float dvd_v(vec2 p) {
    vec2 pp = p;
    p.y += .7;
    p.x = abs(p.x);
    vec2 a = normalize(vec2(1,-.55));
    float d = dot(p, a);
    float d2 = d + .3;
    p = pp;
    d = min(d, -p.y + .3);
    d2 = min(d2, -p.y + .5);
    d = max(d, -d2);
    d = max(d, abs(p.x + .3) - 1.1);
    return d;
}

float dvd_c(vec2 p) {
    p.y += .95;
    float d = ellip(p, vec2(1.8,.25));
    float d2 = ellip(p, vec2(.45,.09));
    d = max(d, -d2);
    return d;
}

float dvd(vec2 p) {
    p.y -= .345;
    p.x -= .035;
    p *= mat2(1,-.2,0,1);
    float d = dvd_v(p);
    d = min(d, dvd_c(p));
    p.x += 1.3;
    d = min(d, dvd_d(p));
    p.x -= 2.4;
    d = min(d, dvd_d(p));
    return d;
}

float range(float vmin, float vmax, float value) {
    return (value - vmin) / (vmax - vmin);
}

float rangec(float a, float b, float t) {
    return clamp(range(a, b, t), 0., 1.);
}

// https://www.shadertoy.com/view/ll2GD3
vec3 pal(in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d) {
    return a + b*cos(6.28318*(c*t+d));
}
vec3 spectrum(float n) {
    return pal(n, vec3(0.5,0.5,0.5), vec3(0.5,0.5,0.5), vec3(1.0,1.0,1.0), vec3(0.0,0.33,0.67));
}

void drawHit(inout vec4 col, vec2 p, vec2 hitPos, float hitDist) {
    float d = length(p - hitPos);

    float wavefront = d - hitDist * 1.5;
    float freq = 2.;

    vec3 spec = (1. - spectrum(-wavefront * freq + hitDist * freq));
    float ripple = sin((wavefront * freq) * PI*2. - PI/2.);

    float blend = smoothstep(3., 0., hitDist);
    blend *= smoothstep(.2, -.5, wavefront);
    blend *= rangec(-4., .0, wavefront);

    col.rgb *= mix(vec3(1), spec, pow(blend, 4.));
    float height = (ripple * blend);
    col.a -= height * 1.9 / freq;
}

vec2 ref(vec2 p, vec2 planeNormal, float offset) {
    float t = dot(p, planeNormal) + offset;
    p -= (2. * t) * planeNormal;
    return p;
}

void drawReflectedHit(inout vec4 col, vec2 p, vec2 hitPos, float hitDist, vec2 screenSize) {
    col.a += length(p) * .0001;
    drawHit(col, p, ref(hitPos, vec2(0,1), 1.), hitDist);
    drawHit(col, p, ref(hitPos, vec2(0,-1), 1.), hitDist);
    drawHit(col, p, ref(hitPos, vec2(1,0), screenSize.x/screenSize.y), hitDist);
    drawHit(col, p, ref(hitPos, vec2(-1,0), screenSize.x/screenSize.y), hitDist);
}

void flip(inout vec2 pos) {
    vec2 fl = mod(floor(pos), 2.);
    pos = abs(fl - mod(pos, 1.));
}

float stepSign(float a) {
    return step(0., a) * 2. - 1.;
}

vec2 compassDir(vec2 p) {
    vec2 a = vec2(stepSign(p.x), 0);
    vec2 b = vec2(0, stepSign(p.y));
    float s = stepSign(p.x - p.y) * stepSign(-p.x - p.y);
    return mix(a, b, s * .5 + .5);
}

vec2 calcHitPos(vec2 move, vec2 dir, vec2 size) {
    vec2 hitPos = mod(move, 1.);
    vec2 xCross = hitPos - hitPos.x / (size / size.x) * (dir / dir.x);
    vec2 yCross = hitPos - hitPos.y / (size / size.y) * (dir / dir.y);
    hitPos = max(xCross, yCross);
    hitPos += floor(move);
    return hitPos;
}

// Simple hash for dithering (replaces texture-based banding fix)
float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 p = (-u_resolution.xy + 2.0*fragCoord)/u_resolution.y;

    vec2 screenSize = vec2(u_resolution.x/u_resolution.y, 1.) * 2.;

    float t = u_time;
    vec2 dir = normalize(vec2(9.,16) * screenSize);
    vec2 move = dir * t / 1.5;
    float logoScale = .1;
    vec2 logoSize = vec2(2.,.85) * logoScale * 1.;

    vec2 size = screenSize - logoSize * 2.;

    move = move / size + .5;

    vec2 lastHitPos = calcHitPos(move, dir, size);
    vec4 col = vec4(1,1,1,0);
    vec4 colFx = vec4(1,1,1,0);
    vec4 colFy = vec4(1,1,1,0);
    vec2 e = vec2(.8,0)/u_resolution.y;

    const int limit = 5;

    for (int i = 0; i < limit; i++) {
        vec2 hitPos = lastHitPos;

        if (i > 0) {
            hitPos = calcHitPos(hitPos - .00001/size, dir, size);
        }

        lastHitPos = hitPos;

        float hitDist = distance(hitPos, move);

        flip(hitPos);

        hitPos = (hitPos - .5) * size;

        hitPos += logoSize * compassDir(hitPos / size);

        drawReflectedHit(col, p, hitPos, hitDist, screenSize);
        drawReflectedHit(colFx, p + e, hitPos, hitDist, screenSize);
        drawReflectedHit(colFy, p + e.yx, hitPos, hitDist, screenSize);
    }

    flip(move);

    move = (move - .5) * size;

    // Calc normals
    float bf = .1;
    float fx = (col.a - colFx.a) * 2.;
    float fy = (col.a - colFy.a) * 2.;
    vec3 nor = normalize(vec3(fx, fy, e.x/bf));
    float ff = length(vec2(fx, fy));
    float ee = rangec(0., 10./u_resolution.y, ff);
    nor = normalize(vec3(vec2(fx, fy)*ee, ff));

    // invert colours
    col.rgb = clamp(1. - col.rgb, vec3(0), vec3(1));
    col.rgb /= 3.;

    // lighting
    vec3 lig = normalize(vec3(1,2,2.));
    vec3 rd = normalize(vec3(p, -10.));
    vec3 hal = normalize(lig - rd);

    float dif = clamp(dot(lig, nor), 0., 1.);
    float spe = pow(clamp(dot(nor, hal), 0.0, 1.0), 16.0) *
                dif *
                (0.04 + 0.96*pow(clamp(1.0+dot(hal,rd),0.0,1.0), 5.0));

    vec3 lin = vec3(0.);
    lin += 5. * dif;
    lin += .2;
    col.rgb = col.rgb * lin;
    col.rgb += 5. * spe;

    // dvd logo
    float d = dvd((p - move) / logoScale);
    d /= fwidth(d);
    d = 1. - clamp(d, 0., 1.);
    col.rgb = mix(col.rgb, vec3(1), d);

    // dithering (replaces texture-based banding fix)
    col.rgb += (hash21(fragCoord * 0.7 + u_time * 3.0) * 2. - 1.) * .005;

    // gamma
    col.rgb = pow(col.rgb, vec3(1./1.5));

    gl_FragColor = vec4(col.rgb, 1.0);
}
`

function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef<[number, number]>([0, 0])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
    if (!gl) return

    gl.getExtension('OES_standard_derivatives')

    const vertShader = gl.createShader(gl.VERTEX_SHADER)!
    gl.shaderSource(vertShader, VERTEX)
    gl.compileShader(vertShader)

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!
    gl.shaderSource(fragShader, FRAGMENT)
    gl.compileShader(fragShader)

    if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
      console.error('Fragment shader error:', gl.getShaderInfoLog(fragShader))
      return
    }

    const program = gl.createProgram()!
    gl.attachShader(program, vertShader)
    gl.attachShader(program, fragShader)
    gl.linkProgram(program)
    gl.useProgram(program)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)

    const aPos = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(program, 'u_time')
    const uRes = gl.getUniformLocation(program, 'u_resolution')
    const uMouse = gl.getUniformLocation(program, 'u_mouse')

    let animId: number

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas!.width = canvas!.clientWidth * dpr
      canvas!.height = canvas!.clientHeight * dpr
      gl!.viewport(0, 0, canvas!.width, canvas!.height)
    }

    function render(time: number) {
      gl!.uniform1f(uTime, time * 0.001)
      gl!.uniform2f(uRes, canvas!.width, canvas!.height)
      gl!.uniform2f(uMouse, mouseRef.current[0], mouseRef.current[1])
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
      animId = requestAnimationFrame(render)
    }

    function onMouseMove(e: MouseEvent) {
      mouseRef.current = [e.clientX, e.clientY]
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', onMouseMove)
    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  )
}

export function LandingPage() {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center overflow-hidden">
      <ShaderBackground />
      <div className="absolute inset-0 bg-black/50 z-[1]" />
      <div className="relative z-10 text-center px-4">
        <img
          src={beamzLogo}
          alt="BEAMZ"
          className="h-20 w-auto mx-auto mb-6 brightness-0 invert"
        />
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-white">
          Simulate Light. Design Photonics.
        </h1>
        <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
        BEAMZ is an electromagnetic simulation and inverse / generative design package with support for multiple backends. It features a high-level API that enables fast prototyping and design with just a few lines of code, ideal for engineers. For researchers, BEAMZ also exposes low-level functionality, making it a flexible playground for developing and testing novel simulation and optimization methods.
        </p>
        <CopyableSnippet />
      </div>
    </div>
  )
}
