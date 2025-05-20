uniform float iTime;
uniform float iTimeDelta;
uniform int iFrame;
uniform vec2 iResolution;
uniform vec3 iMouse;
uniform int numberOfShapes;
uniform int numberOfMaterials;
uniform int numberOfLights;
uniform int maxRays;
uniform float giLength;
uniform float giStrength;
uniform float aoStrength;
uniform float shadowRange;
uniform int shadowAccuracy;
uniform int roughReflectSamples;
uniform int roughRefractSamples;
uniform vec3 camTgt;
uniform float camHeight;
uniform float camDist;
uniform float orbit;
uniform int marchingSteps;
uniform float distanceThreshold;
uniform bool devMode;

// Performance visualization controls
uniform bool showPerformance;   // Toggle performance overlay
uniform bool showBoxes;  
uniform int perfMode;          // 0=steps, 1=heat map, 2=termination reasons
uniform float perfScale;       // Scale for heat map

// Features
uniform bool globalIllumination;
uniform bool lighting;
uniform bool shadows;

//------------------------------------------------------------------
float dot2( in vec2 v ) { return dot(v,v); }
float dot2( in vec3 v ) { return dot(v,v); }
float ndot( in vec2 a, in vec2 b ) { return a.x*b.x - a.y*b.y; }

const int MAX_SHAPES = 10;
const int MAX_MATERIALS = 10;
const int MAX_LIGHTS = 5;
const int MAX_RAYS = 20;

//Shapes
const int   PLANE          = 0;
const int   SPHERE         = 1;
const int   BOX            = 2;
const int   ROUND_BOX      = 3;
const int   TORUS          = 4;
const int   LINK           = 5;
const int   CONE           = 6;
const int   HEX_PRISM      = 7;
const int   TRI_PRISM      = 8;
const int   CAPSULE        = 9;
const int   CYLINDER       = 10;
const int   ROUND_CYLINDER = 11;
const int   CUT_CONE       = 12;
const int   SOLID_ANGLE    = 13;
const int   CUT_SPHERE     = 14;
const int   ROUND_CONE     = 15;
const int   ELLIPSOID      = 16;
const int   FOOTBALL       = 17;
const int   OCTAHEDRON     = 18;
const int   PYRAMID        = 19;
const int   BOX_FRAME      = 20;


// Lights
const int   OMNI           = 0;
const int   DIRECTIONAL    = 1;
const int   POINT          = 2;
const int   SKY            = 3;

const float FUDGE_FACTOR   = 0.9;

const float PI             = 3.14159265359;

bool override = false;
vec4 overrideColor = vec4(1.,0.,0.,1.);

// Performance tracking structure
struct PerformanceStats {
    int stepCount;
    int stallCount;
    int bounceCount;
    int terminationReason; // 0=surface, 1=max steps, 2=escaped, 3=stalled
    float minDistance;
    float totalDistance;
};

PerformanceStats perfStats;

struct Material {
  bool emissive, intRef;
  vec3 color, innerColor, glowColor;
  float kd, ior, reflectivity, roughness, reflectRoughness, refractRoughness, metallic, transparency, attenuation, attenuationStrength, glow;
};

<% if(devMode) { %>
struct Shape {
  int type, id;
  vec2 l, c;
  vec3 a, b, n, pos;
  float h, r, r1, r2;
  int mat;
  mat3 rot;
  bool isRot;
};
<% } %>

/*
struct Light {
  int type;
  float strength;
  vec3 color;
  bool ranged;
  float r;
  vec3 dir;
  vec3 pos;
};
*/

<% if(devMode) { %>
uniform Shape shapes[MAX_SHAPES];
Shape debugShapes[MAX_SHAPES];
<% } else { %>
uniform vec3 shapes[MAX_SHAPES];
<% } %>
uniform Material materials[MAX_MATERIALS];

Material debugMaterial;

// Performance visualization functions
vec3 heatmapColor(float value, float maxValue) {
    float t = clamp(value / maxValue, 0.0, 1.0);
    // Blue (cool) -> Green -> Yellow -> Red (hot)
    if (t < 0.33) {
        return mix(vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 0.0), t * 3.0);
    } else if (t < 0.66) {
        return mix(vec3(0.0, 1.0, 0.0), vec3(1.0, 1.0, 0.0), (t - 0.33) * 3.0);
    } else {
        return mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), (t - 0.66) * 3.0);
    }
}

vec3 terminationReasonColor(int reason) {
    if (reason == 0) return vec3(0.0, 1.0, 0.0);      // Green: Hit surface
    else if (reason == 1) return vec3(1.0, 0.0, 0.0); // Red: Max steps
    else if (reason == 2) return vec3(0.0, 0.0, 1.0); // Blue: Escaped
    else return vec3(1.0, 0.0, 1.0);                  // Magenta: Stalled
}

float sdSphere( vec3 p, float r )
{
  return length(p)-r;
}

float sdBox( vec3 p, vec3 a )
{
  vec3 q = abs(p) - a;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float sdRoundBox( vec3 p, vec3 a, float r )
{
  vec3 q = abs(p) - a + r;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}

float sdBoxFrame( vec3 p, vec3 a, float r )
{
       p = abs(p  )-a;
  vec3 q = abs(p+r)-r;
  return min(min(
      length(max(vec3(p.x,q.y,q.z),0.0))+min(max(p.x,max(q.y,q.z)),0.0),
      length(max(vec3(q.x,p.y,q.z),0.0))+min(max(q.x,max(p.y,q.z)),0.0)),
      length(max(vec3(q.x,q.y,p.z),0.0))+min(max(q.x,max(q.y,p.z)),0.0));
}

float sdTorus( vec3 p, float r1, float r2)
{
  vec2 q = vec2(length(p.xz)-r1,p.y);
  return length(q)-r2;
}

float sdLink( vec3 p, float h, float r1, float r2 )
{
  vec3 q = vec3( p.x, max(abs(p.y)-h,0.0), p.z );
  return length(vec2(length(q.xy)-r1,q.z)) - r2;
}

float sdCone( vec3 p, vec2 c, float h )
{
  // c is the sin/cos of the angle, h is height
  // Alternatively pass q instead of (c,h),
  // which is the point at the base in 2D
  vec2 q = h*vec2(c.x/c.y,-1.0);
    
  vec2 w = vec2( length(p.xz), p.y );
  vec2 a = w - q*clamp( dot(w,q)/dot(q,q), 0.0, 1.0 );
  vec2 b = w - q*vec2( clamp( w.x/q.x, 0.0, 1.0 ), 1.0 );
  float k = sign( q.y );
  float d = min(dot( a, a ),dot(b, b));
  float s = max( k*(w.x*q.y-w.y*q.x),k*(w.y-q.y)  );
  return sqrt(d)*sign(s);
}

float sdPlane( vec3 p, vec3 n, float h )
{
  // n must be normalized
  return dot(p,n) + h;
}

float sdHexPrism( vec3 p, vec2 l )
{
  const vec3 k = vec3(-0.8660254, 0.5, 0.57735);
  p = abs(p);
  p.xy -= 2.0*min(dot(k.xy, p.xy), 0.0)*k.xy;
  vec2 d = vec2(
       length(p.xy-vec2(clamp(p.x,-k.z*l.x,k.z*l.x), l.x))*sign(p.y-l.x),
       p.z-l.y );
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float sdTriPrism( vec3 p, vec2 l )
{
  vec3 q = abs(p);
  return max(q.z-l.y,max(q.x*0.866025+p.y*0.5,-p.y)-l.x*0.5);
}

float sdCapsule( vec3 p, float h, float r)
{
  p.y -= clamp( p.y, 0.0, h );
  return length( p ) - r;
}

float sdCylinder( vec3 p, float h, float r )
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - vec2(r,h);
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float sdRoundCylinder( vec3 p, float radius, float height, float rounding )
{
    // Create the main cylinder shape
    vec2 d = vec2( length(p.xz) - radius, abs(p.y) - height );
    
    // Add rounding to the edges
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - rounding;
}


float sdCutCone( vec3 p, float h, float r1, float r2 )
{
  vec2 q = vec2( length(p.xz), p.y );
  vec2 k1 = vec2(r2,h);
  vec2 k2 = vec2(r2-r1,2.0*h);
  vec2 ca = vec2(q.x-min(q.x,(q.y<0.0)?r1:r2), abs(q.y)-h);
  vec2 cb = q - k1 + k2*clamp( dot(k1-q,k2)/dot2(k2), 0.0, 1.0 );
  float s = (cb.x<0.0 && ca.y<0.0) ? -1.0 : 1.0;
  return s*sqrt( min(dot2(ca),dot2(cb)) );
}

float sdSolidAngle( vec3 p, vec2 c, float r1 )
{
  // c is the sin/cos of the angle
  vec2 q = vec2( length(p.xz), p.y );
  float l = length(q) - r1;
  float m = length(q - c*clamp(dot(q,c),0.0,r1) );
  return max(l,m*sign(c.y*q.x-c.x*q.y));
}

float sdCutSphere( vec3 p, float r, float h )
{
  // sampling independent computations (only depend on shape)
  float w = sqrt(r*r-h*h);

  // sampling dependant computations
  vec2 q = vec2( length(p.xz), p.y );
  float s = max( (h-r)*q.x*q.x+w*w*(h+r-2.0*q.y), h*q.x-w*q.y );
  return (s<0.0) ? length(q)-r :
         (q.x<w) ? h - q.y     :
                   length(q-vec2(w,h));
}

float sdRoundCone( vec3 p, float r1, float r2, float h )
{
  // sampling independent computations (only depend on shape)
  float b = (r1-r2)/h;
  float a = sqrt(1.0-b*b);

  // sampling dependant computations
  vec2 q = vec2( length(p.xz), p.y );
  float k = dot(q,vec2(-b,a));
  if( k<0.0 ) return length(q) - r1;
  if( k>a*h ) return length(q-vec2(0.0,h)) - r2;
  return dot(q, vec2(a,b) ) - r1;
}

float sdEllipsoid( vec3 p, float r, float r1, float r2 )
{
  vec3 r3 = vec3(r, r1, r2);
  float k0 = length(p/r3);
  float k1 = length(p/(r3*r3));
  return k0*(k0-1.0)/k1;
}

float sdFootball( in vec3 p, in vec3 a, in vec3 b, in float h )
{
    vec3  c = (a+b)*0.5;
    float l = length(b-a);
    vec3  v = (b-a)/l;
    float y = dot(p-c,v);
    vec2  q = vec2(length(p-c-y*v),abs(y));
    
    float r = 0.5*l;
    float d = 0.5*(r*r-h*h)/h;
    vec3  h2 = (r*q.x<d*(q.y-r)) ? vec3(0.0,r,0.0) : vec3(-d,0.0,d+h);
 
    return length(q-h2.xy) - h2.z;
}

float sdOctahedron( vec3 p, float r )
{
  p = abs(p);
  float m = p.x+p.y+p.z-r;
  vec3 q;
       if( 3.0*p.x < m ) q = p.xyz;
  else if( 3.0*p.y < m ) q = p.yzx;
  else if( 3.0*p.z < m ) q = p.zxy;
  else return m*0.57735027;
    
  float k = clamp(0.5*(q.z-q.y+r),0.0,r); 
  return length(vec3(q.x,q.y-r+k,q.z-k)); 
}

float sdPyramid( in vec3 p, in float h )
{
    if (p.y <= 0.0)
        return length(max(abs(p)-vec3(0.5,0.0,0.5),0.0));
    float m2 = h*h + 0.25;
    
    // symmetry
    p.xz = abs(p.xz); // do p=abs(p) instead for double pyramid
    p.xz = (p.z>p.x) ? p.zx : p.xz;
    p.xz -= 0.5;
	
    // project into face plane (2D)
    vec3 q = vec3( p.z, h*p.y-0.5*p.x, h*p.x+0.5*p.y);
        
    float s = max(-q.x,0.0);
    float t = clamp( (q.y-0.5*q.x)/(m2+0.25), 0.0, 1.0 );
    
    float a = m2*(q.x+s)*(q.x+s) + q.y*q.y;
	float b = m2*(q.x+0.5*t)*(q.x+0.5*t) + (q.y-m2*t)*(q.y-m2*t);
    
    float d2 = max(-q.y,q.x*m2+q.y*0.5) < 0.0 ? 0.0 : min(a,b);
    
    // recover 3D and scale, and add sign
    return sqrt( (d2+q.z*q.z)/m2 ) * sign(max(q.z,-p.y));;
}


float sdU( in vec3 p, in float r, in float le, vec2 w )
{
    p.x = (p.y>0.0) ? abs(p.x) : length(p.xy);
    p.x = abs(p.x-r);
    p.y = p.y - le;
    float k = max(p.x,p.y);
    vec2 q = vec2( (k<0.0) ? -k : length(max(p.xy,0.0)), abs(p.z) ) - w;
    return length(max(q,0.0)) + min(max(q.x,q.y),0.0);
}

//------------------------------------------------------------------

vec3 opU( vec3 d1, vec3 d2 )
{
	return (d1.x<d2.x) ? d1 : d2;
}

// Simple hash function based on the input value
float random(vec2 seed) {
    // Use a hashing algorithm to create a pseudo-random number
    return fract(sin(dot(seed ,vec2(12.9898,78.233))) * 43758.5453123);
}

mat3 makeTBN(vec3 n) {
    vec3 tangent = normalize(abs(n.y) < 0.999 ? cross(n, vec3(0.0, 1.0, 0.0)) : cross(n, vec3(1.0, 0.0, 0.0)));
    vec3 bitangent = cross(n, tangent);
    return mat3(tangent, bitangent, n);
}

vec3 randomSpherePoint(vec3 rand) {
  float ang1 = (rand.x + 1.0) * PI; // [-1..1) -> [0..2*PI)
  float u = rand.y; // [-1..1), cos and acos(2v-1) cancel each other out, so we arrive at [-1..1)
  float u2 = u * u;
  float sqrt1MinusU2 = sqrt(1.0 - u2);
  float x = sqrt1MinusU2 * cos(ang1);
  float y = sqrt1MinusU2 * sin(ang1);
  float z = u;
  return vec3(x, y, z);
}

vec3 randomHemispherePoint(vec3 rand, vec3 dir) {
    vec3 v = randomSpherePoint(rand);
    if (dot(v, vec3(0, 0, 1)) < 0.0) v = -v; // ensure it's in the upper hemisphere
    mat3 tbn = makeTBN(normalize(dir)); // align Z-axis with dir
    return normalize(tbn * v); // rotate to world space
}

//------------------------------------------------------------------

#define ZERO (min(iFrame,0))

//------------------------------------------------------------------

<% if(devMode) { %>
float getApproximateRadius(Shape s) {
    switch(s.type) {
        case SPHERE: 
            return s.r;
        case BOX: 
        case ROUND_BOX: 
        case BOX_FRAME:
            return length(s.a) + s.r;
        case TORUS: 
            return s.r1 + s.r2;
        case LINK:
            return s.r1 + s.r2;
        case CYLINDER:
        case ROUND_CYLINDER:
        case CAPSULE: 
            return max(s.r + s.r1, s.h);
        case CONE:
        case CUT_CONE:
        case ROUND_CONE:
            // Estimate based on height and max radius
            float maxR = max(s.r1, s.r2);
            return max(maxR, s.h);
        case HEX_PRISM:
        case TRI_PRISM:
            return max(s.l.x, s.l.y);
        case ELLIPSOID:
            return max(s.r, max(s.r1, s.r2));
        case FOOTBALL:
            return length(s.b - s.a) * 0.5 + s.h;
        case OCTAHEDRON:
            return s.r;
        case PYRAMID:
            return max(0.71, s.r); // Base diagonal ~1.414/2, height s.r
        case SOLID_ANGLE:
        case CUT_SPHERE:
            return s.r1;
        default: 
            return 1.5; // Conservative estimate
    }
}

vec3 getShapeBounds(Shape s) {
    const float padding = 0.02;
    switch(s.type) {
        case SPHERE:
            return vec3(s.r + padding);
        case BOX:
            return s.a + padding;
        case ROUND_BOX:
            return s.a + s.r + padding;
        case BOX_FRAME:
            return s.a + s.r + padding;
        case TORUS:
            return vec3(s.r1 + s.r2 + padding, s.r2 + padding, s.r1 + s.r2 + padding);
        case LINK: 
            return vec3(s.r1 + s.r2 + padding, s.h + s.r2 + padding, s.r1 + s.r2 + padding);
        case CYLINDER:
            return vec3(s.r + padding, s.h + padding, s.r + padding);
        case ROUND_CYLINDER:
            return vec3(s.r + s.r1 + padding, s.h + s.r1 + padding, s.r + s.r1 + padding);
        case CAPSULE:
            return vec3(s.r + padding, s.h + s.r + padding, s.r + padding);
        case CONE:
            // For sdCone, s.c is sin/cos of angle, s.h is height
            // Base radius = h * c.x/c.y = h * tan(angle)
            float baseRadius = s.h * (s.c.x / s.c.y);
            return vec3(abs(baseRadius) + padding, s.h + padding, abs(baseRadius) + padding);
        case CUT_CONE:
            float maxCutR = max(s.r1, s.r2);
            return vec3(maxCutR + padding, s.h + padding, maxCutR + padding);
        case SOLID_ANGLE:
            // Based on sin/cos angle and radius
            return vec3(s.r1 + padding, s.r1 + padding, s.r1 + padding);
        case CUT_SPHERE:
            // Sphere with radius s.r, cut at height s.h
            return vec3(s.r + padding, s.r + padding, s.r + padding);
        case ROUND_CONE:
            // Similar to cut cone but with rounded edges
            float maxRoundR = max(s.r1, s.r2);
            return vec3(maxRoundR + padding, s.h + padding, maxRoundR + padding);
        case ELLIPSOID:
            // Use max of the three radii
            float maxEllipseR = max(s.r, max(s.r1, s.r2));
            return vec3(maxEllipseR + padding);
        case FOOTBALL:
            // Football shape - analyze the sdFootball function parameters
            // It uses s.a, s.b (endpoints) and s.h (height/thickness)
            float footballLength = length(s.b - s.a) * 0.5;
            return vec3(footballLength + s.h + padding);
        case OCTAHEDRON:
            // Regular octahedron with "radius" s.r
            return vec3(s.r + padding);
        case PYRAMID:
            // Pyramid with height s.r and base 1x1 (from sdPyramid)
            return vec3(0.71 + padding, s.r + padding, 0.71 + padding);
        case HEX_PRISM:
            return vec3(s.l.x * 1.16, s.l.y + padding, s.l.x * 1.16);
        case TRI_PRISM:
            return vec3(s.l.x + padding, s.l.y + padding, s.l.x + padding);
        case PLANE:
            // Plane extends infinitely, but we can use a large bound
            return vec3(100.0);
        default:
            // For unknown shapes, use conservative bound
            return vec3(1.5);
    }
}
<% } %>

<% if(devMode) { %>
vec3 map( in vec3 pos, float rayDistance)
{
    vec3 res = vec3( pos.y, 0.0, -1.0 );
    
    float earlyExitThreshold = distanceThreshold * rayDistance;

    for(int i = 0; i < numberOfShapes * (int(showBoxes) + 1) + ZERO; i++)
    {
        Shape s;
        if(i < numberOfShapes)
        {
          s = shapes[i];
        }
        else
        {
          s = debugShapes[i - numberOfShapes];
        }
        vec3 delta = pos - s.pos;

        float approxRadius = getApproximateRadius(s);
        if (length(delta) - approxRadius > res.x) {
            continue; // Skip this shape entirely
        }

        vec3 rotatedDelta = s.rot * delta;
        vec3 newPos = rotatedDelta;

        vec3 bounds = getShapeBounds(s);

        if( sdBox( newPos,bounds ) < res.x )
        {
            switch(s.type)
            {
              case PLANE:
                break;
              case SPHERE:
                res = opU( res, vec3( sdSphere(newPos, s.r) * FUDGE_FACTOR, s.mat, i ) );
                break;
              case BOX:
                res = opU( res, vec3( sdBox(newPos, s.a) * FUDGE_FACTOR, s.mat, i ) );
                break;
              case ROUND_BOX:
                res = opU( res, vec3( sdRoundBox(newPos, s.a, s.r) * FUDGE_FACTOR, s.mat, i) );
                break;
              case BOX_FRAME:
                res = opU( res, vec3( sdBoxFrame(newPos, s.a, s.r) * FUDGE_FACTOR, s.mat, i) );
                break;
              case TORUS:
                res = opU( res, vec3( sdTorus(newPos, s.r1, s.r2) * FUDGE_FACTOR, s.mat, i) );
                break;
              case LINK:
                res = opU( res, vec3( sdLink(newPos, s.h, s.r1, s.r2) * FUDGE_FACTOR, s.mat, i) );
                break;
              case CONE:
                res = opU( res, vec3( sdCone(newPos, s.c, s.h) * FUDGE_FACTOR, s.mat, i) );
                break;
              case HEX_PRISM:
                res = opU( res, vec3( sdHexPrism(newPos, s.l) * FUDGE_FACTOR, s.mat, i) );
                break;
              case TRI_PRISM:
                res = opU( res, vec3( sdTriPrism(newPos, s.l) * FUDGE_FACTOR, s.mat, i) );
                break;
              case CAPSULE:
                res = opU( res, vec3( sdCapsule(newPos, s.h, s.r) * FUDGE_FACTOR, s.mat, i) );
                break;
              case ROUND_CYLINDER:
                res = opU( res, vec3( sdRoundCylinder(newPos, s.r1, s.r2, s.h) * FUDGE_FACTOR, s.mat, i) );
                break;
              case CUT_CONE:
                res = opU( res, vec3( sdCutCone(newPos, s.h, s.r1, s.r2) * FUDGE_FACTOR, s.mat, i) );
                break;
              case SOLID_ANGLE:
                res = opU( res, vec3( sdSolidAngle(newPos, s.c, s.r1) * FUDGE_FACTOR, s.mat, i) );
                break;
              case CUT_SPHERE:
                res = opU( res, vec3( sdCutSphere(newPos, s.r, s.h) * FUDGE_FACTOR, s.mat, i) );
                break;
              case ROUND_CONE:
                res = opU( res, vec3( sdRoundCone(newPos, s.h, s.r1, s.r2) * FUDGE_FACTOR, s.mat, i) );
                break;
              case ELLIPSOID:
                res = opU( res, vec3( sdEllipsoid(newPos, s.r, s.r1, s.r2) * FUDGE_FACTOR, s.mat, i) );
                break;
              case FOOTBALL:
                res = opU( res, vec3( sdFootball(newPos, s.a, s.b, s.h) * FUDGE_FACTOR, s.mat, i) );
                break;
              case PYRAMID:
                res = opU( res, vec3( sdPyramid(newPos, s.r) * FUDGE_FACTOR, s.mat, i) );
                break;
            }
        }
        if (res.x < earlyExitThreshold) {
          break;
        }
    }

    return res;
}
<% } else { %>
vec3 map( in vec3 pos, float rayDistance)
{
    vec3 res = vec3( pos.y, 0.0, -1.0 );

    float earlyExitThreshold = distanceThreshold * rayDistance;

    const float boundsPadding = 0.02;
    <% const allShapes = showBoxes ? [...shapes, ...shapes] : shapes;
      allShapes.forEach((_s, i) => {
        if(showBoxes) {
          if(i < shapes.length)
          {
            s = _s;
          } 
          else
          {
            let bounds;
            let boundsPadding = 0.02;
            switch(_s.type) {
              case 1: //SPHERE:
                  bounds = {x: _s.r + boundsPadding, y: _s.r + boundsPadding, z: _s.r + boundsPadding};
                  break;
              case 2: //BOX:
                  bounds = {x: _s.a.x + boundsPadding, y: _s.a.y + boundsPadding, z: _s.a.z + boundsPadding};
                  break;
              case 3: //ROUND_BOX:
                  bounds = {x: _s.a.x + _s.r + boundsPadding, y: _s.a.y + _s.r + boundsPadding, z: _s.a.z + _s.r + boundsPadding};
                  break;
              case 20: //BOX_FRAME:
                  bounds = {x: _s.a.x + _s.r + boundsPadding, y: _s.a.y + _s.r + boundsPadding, z: _s.a.z + _s.r + boundsPadding};
                  break;
              case 4: //TORUS:
                  bounds = {x: _s.r1 + _s.r2 + boundsPadding, y: _s.r2 + boundsPadding, z: _s.r1 + _s.r2 + boundsPadding};
                  break;
              case 5: //LINK:
                  bounds = {x: _s.r1 + _s.r2 + boundsPadding, y: _s.h + _s.r2 + boundsPadding, z: _s.r1 + _s.r2 + boundsPadding};
                  break;
              case 10: //CYLINDER:
                  bounds = {x: _s.r + boundsPadding, y: _s.h + boundsPadding, z: _s.r + boundsPadding};
                  break;
              case 11: //ROUND_CYLINDER:
                  bounds = {x: _s.r + _s.r1 + boundsPadding, y: _s.h + _s.r1 + boundsPadding, z: _s.r + _s.r1 + boundsPadding};
                  break;
              case 9: //CAPSULE:
                  bounds = {x: _s.r + boundsPadding, y: _s.h + _s.r + boundsPadding, z: _s.r + boundsPadding};
                  break;
              case 6: //CONE:
                  // For sdCone, s.c is sin/cos of angle, s.h is height
                  // Base radius = h * c.x/c.y = h * tan(angle)
                  const baseRadius = _s.h * (_s.c.x / _s.c.y);
                  bounds = {x: Math.abs(baseRadius) + boundsPadding, y: _s.h + boundsPadding, z: Math.abs(baseRadius) + boundsPadding};
              case 12: //CUT_CONE:
                  const maxCutR = Math.max(_s.r1, _s.r2);
                  bounds = {x: maxCutR + boundsPadding, y: _s.h + boundsPadding, z: maxCutR + boundsPadding};
                  break;
              case 13: //SOLID_ANGLE:
                  // Based on sin/cos angle and radius
                  bounds = {x: _s.r1 + boundsPadding, y: _s.r1 + boundsPadding, z: _s.r1 + boundsPadding};
                  break;
              case 14: //CUT_SPHERE:
                  // Sphere with radius s.r, cut at height s.h
                  bounds = {x: _s.r + boundsPadding, y: _s.r + boundsPadding, z: _s.r + boundsPadding};
                  break;
              case 15: //ROUND_CONE:
                  // Similar to cut cone but with rounded edges
                  const maxRoundR = Math.max(_s.r1, _s.r2);
                  bounds = {x: maxRoundR + boundsPadding, y: _s.h + boundsPadding, z: maxRoundR + boundsPadding};
                  break;
              case 16: //ELLIPSOID:
                  // Use max of the three radii
                  const maxEllipseR = Math.max(_s.r, max(_s.r1, _s.r2));
                  bounds = {x: maxEllipseR + boundsPadding, y: maxEllipseR + boundsPadding, z: maxEllipseR + boundsPadding};
                  break;
              case 17: //FOOTBALL:
                  // Football shape - analyze the sdFootball function parameters
                  // It uses s.a, s.b (endpoints) and s.h (height/thickness)
                  const footballLength = Math.sqrt(Math.pow(_s.b.x - _s.a.x, 2) +Math.pow(_s.b.y - _s.a.y, 2) + Math.pow(_s.b.z - _s.a.z, 2)) * 0.5;
                  bounds = {x: footballLength + _s.h + boundsPadding, y: footballLength + _s.h + boundsPadding, z: footballLength + _s.h + boundsPadding};
                  break;
              case 18: //OCTAHEDRON:
                  // Regular octahedron with "radius" s.r
                  bounds = {x: _s.r + boundsPadding, y: _s.r + boundsPadding, z: _s.r + boundsPadding};
                  break;
              case 19: //PYRAMID:
                  // Pyramid with height s.r and base 1x1 (from sdPyramid)
                  bounds = {x: 0.71 + boundsPadding, y: _s.r + boundsPadding, z: 0.71 + boundsPadding};
                  break;
              case 7: //HEX_PRISM:
                  bounds = {x: _s.l.x * 1.16, y: _s.l.y + boundsPadding, z: _s.l.x * 1.16};
                  break;
              case 8: //TRI_PRISM:
                  bounds = {x: _s.l.x + boundsPadding, y: _s.l.y + boundsPadding, z: _s.l.x + boundsPadding};
                  break;
              case 0: //PLANE:
                  //Plane extends infinitely, but we can use a large bound
                  bounds = {x: 100.0, y: 100.0, z: 100.0};
                  break;
              default:
                  // For unknown shapes, use conservative bound
                  bounds = {x: 1.5, y: 1.5, z: 1.5};
            };
            s = {
              ..._s,
              type: 20,
              mat: 1,
              a: bounds,
              r: 0.005
            };
          }
        } else {
          s = _s;
        } %>
        vec3 delta<%= i %> = pos - vec3(<%= _f(s.pos.x) %>,<%= _f(s.pos.y) %>,<%= _f(s.pos.z) %>);

        <% switch(s.type) { 
            case 1: // SPHERE: %>
                float approxRadius<%= i %> = <%= _f(s.r) %>;
            <%
                break;
            case 2: //BOX: %>
                float approxRadius<%= i %> = length(vec3(<%= _f(s.a.x) %>, <%= _f(s.a.y) %>, <%= _f(s.a.z) %>));
            <%    
                break;
            case 3: //ROUND_BOX: 
            case 20: //BOX_FRAME: %>
                float approxRadius<%= i %> = length(vec3(<%= _f(s.a.x) %>, <%= _f(s.a.y) %>, <%= _f(s.a.z) %>)) + <%= _f(s.r) %>;
            <%    
              break;
            case 4: //TORUS: %>
                float approxRadius<%= i %> = <%= _f(s.r1) %> + <%= _f(s.r2) %>;
            <%     
                break;
            case 5: //LINK: %>
                float approxRadius<%= i %> = <%= _f(s.r1) %> + <%= _f(s.r2) %>;
            <%    
                break;
            case 10: //CYLINDER:
            case 11: //ROUND_CYLINDER:
            case 9: //CAPSULE: %>
                float approxRadius<%= i %> = max(<%= _f(s.r) %> + <%= _f(s.r1) %>, <%= _f(s.h) %>);
            <%    
                break;
            case 6: //CONE:
            case 12: //CUT_CONE:
            case 15: //ROUND_CONE: %>
                float approxRadius<%= i %> = max(max(<%= _f(s.r1) %>, <%= _f(s.r2) %>), <%= _f(s.h) %>);
            <%
                break;
            case 7: //HEX_PRISM:
            case 8: //TRI_PRISM: %>
                float approxRadius<%= i %> = max(<%= _f(s.l.x) %>, <%= _f(s.l.y) %>);
            <%
                break;
            case 16: //ELLIPSOID: %>
                float approxRadius<%= i %> = max(<%= _f(s.r) %>, max(<%= _f(s.r1) %>, <%= _f(s.r2) %>));
            <%
                break;
            case 17: //FOOTBALL: %>
                float approxRadius<%= i %> = length(vec3(<%= _f(s.b.x - s.a.x) %>, <%= _f(s.b.y - s.a.y) %>, <%= _f(s.b.z - s.a.z) %>)) * 0.5 + <%= _f(s.h) %>;
            <%     
                break;
            case 18: //OCTAHEDRON: %>
                float approxRadius<%= i %> = <%= _f(s.r) %>;
            <% 
                break;    
            case 19: //PYRAMID: %>
                float approxRadius<%= i %> = max(0.71, <%= _f(s.r) %>);
            <% 
                break;    
            case 13: //SOLID_ANGLE:
            case 14: //CUT_SPHERE: %>
                float approxRadius<%= i %> = <%= _f(s.r1) %>;
            <%     
              break;
            default: %>
                float approxRadius<%= i %> = 1.5; // Conservative estimate
        <% } %>

        if (length(delta<%= i %>) - approxRadius<%= i %> <= res.x) {
          vec3 rotatedDelta<%= i %> = mat3(<%= s.rot.map(_f).join(",") %>) * delta<%= i %>;
          vec3 newPos<%= i %> = rotatedDelta<%= i %>;

          <% switch(s.type) {
              case 1: //SPHERE: %>
                  vec3 bounds<%= i %> = vec3(<%= _f(s.r) %> + boundsPadding);
              <%     
                  break;
              case 2: //BOX: %>
                  vec3 bounds<%= i %> = vec3(<%= _f(s.a.x) %>, <%= _f(s.a.y) %>, <%= _f(s.a.z) %>) + boundsPadding;
              <%     
                  break;
              case 3: //ROUND_BOX: %>
                  vec3 bounds<%= i %> = vec3(<%= _f(s.a.x) %>, <%= _f(s.a.y) %>, <%= _f(s.a.z) %>) + <%= _f(s.r) %> + boundsPadding;
              <%     
                  break;
              case 20: //BOX_FRAME: %>
                  vec3 bounds<%= i %> = vec3(<%= _f(s.a.x) %>, <%= _f(s.a.y) %>, <%= _f(s.a.z) %>) + <%= _f(s.r) %> + boundsPadding;
              <%     
                  break;
              case 4: //TORUS: %>
                  vec3 bounds<%= i %> = vec3(<%= _f(s.r1) %> + <%= _f(s.r2) %> + boundsPadding, <%= _f(s.r2) %> + boundsPadding, <%= _f(s.r1) %> + <%= _f(s.r2) %> + boundsPadding);
              <%     
                  break;
              case 5: //LINK:  %>
                  vec3 bounds<%= i %> = vec3(<%= _f(s.r1) %> + <%= _f(s.r2) %> + boundsPadding, <%= _f(s.h) %> + <%= _f(s.r2) %> + boundsPadding, <%= _f(s.r1) %> + <%= _f(s.r2) %> + boundsPadding);
              <%     
                  break;
              case 10: //CYLINDER: %>
                  vec3 bounds<%= i %> = vec3(<%= _f(s.r) %> + boundsPadding, <%= _f(s.h) %> + boundsPadding, <%= _f(s.r) %> + boundsPadding);
              <%     
                  break;
              case 11: //ROUND_CYLINDER: %>
                  vec3 bounds<%= i %> = vec3(<%= _f(s.r) %> + <%= _f(s.r1) %> + boundsPadding, <%= _f(s.h) %> + <%= _f(s.r1) %> + boundsPadding, <%= _f(s.r) %> + <%= _f(s.r1) %> + boundsPadding);
              <%     
                  break;
              case 9: //CAPSULE: %>
                  vec3 bounds<%= i %> = vec3(<%= _f(s.r) %> + boundsPadding, <%= _f(s.h) %> + <%= _f(s.r) %> + boundsPadding, <%= _f(s.r) %> + boundsPadding);
              <%     
                  break;
              case 6: //CONE: %>
                  // For sdCone, s.c is sin/cos of angle, s.h is height
                  // Base radius = h * c.x/c.y = h * tan(angle)
                  float baseRadius<%= i %> = <%= _f(s.h) %> * (<%= _f(s.c.x) %> / <%= _f(s.c.y) %>);
                  vec3 bounds<%= i %> = vec3(abs(baseRadius<%= i %>) + boundsPadding, <%= _f(s.h) %> + boundsPadding, abs(baseRadius<%= i %>) + boundsPadding);
              <%     
                  break;
              case 12: //CUT_CONE: %>
                  float maxCutR<%= i %> = max(<%= _f(s.r1) %>, <%= _f(s.r2) %>);
                  vec3 bounds<%= i %> = vec3(maxCutR<%= i %> + boundsPadding, <%= _f(s.h) %> + boundsPadding, maxCutR<%= i %> + boundsPadding);
              <%     
                  break;
              case 13: //SOLID_ANGLE: %>
                  // Based on sin/cos angle and radius
                  vec3 bounds<%= i %> = vec3(<%= _f(s.r1) %> + boundsPadding, <%= _f(s.r1) %> + boundsPadding, <%= _f(s.r1) %> + boundsPadding);
              <%     
                  break;
              case 14: //CUT_SPHERE: %>
                  // Sphere with radius s.r, cut at height s.h
                  vec3 bounds<%= i %> = vec3(<%= _f(s.r) %> + boundsPadding, <%= _f(s.r) %> + boundsPadding, <%= _f(s.r) %> + boundsPadding);
              <%     
                  break;
              case 15: //ROUND_CONE: %>
                  // Similar to cut cone but with rounded edges
                  float maxRoundR<%= i %> = max(<%= _f(s.r1) %>, <%= _f(s.r2) %>);
                  vec3 bounds<%= i %> = vec3(maxRoundR<%= i %> + boundsPadding, s.h + boundsPadding, maxRoundR<%= i %> + boundsPadding);
              <%     
                  break;
              case 16: //ELLIPSOID: %>
                  // Use max of the three radii
                  float maxEllipseR<%= i %> = max(<%= _f(s.r) %>, max(<%= _f(s.r1) %>, <%= _f(s.r2) %>));
                  vec3 bounds<%= i %> = vec3(maxEllipseR<%= i %> + boundsPadding);
              <%     
                  break;
              case 17: //FOOTBALL: %>
                  // Football shape - analyze the sdFootball function parameters
                  // It uses s.a, s.b (endpoints) and s.h (height/thickness)
                  float footballLength<%= i %> = length(vec3(<%= _f(s.b.x - s.a.x) %>, <%= _f(s.b.y - s.a.y) %>, <%= _f(s.b.z - s.a.z) %>)) * 0.5;
                  vec3 bounds<%= i %> = vec3(footballLength<%= i %> + <%= _f(s.h) %> + boundsPadding);
              <%     
                  break;
              case 18: //OCTAHEDRON: %>
                  // Regular octahedron with "radius" s.r
                  vec3 bounds<%= i %> = vec3(<%= _f(s.r) %> + boundsPadding);
              <%     
                  break;
              case 19: //PYRAMID: %>
                  // Pyramid with height s.r and base 1x1 (from sdPyramid)
                  vec3 bounds<%= i %> = vec3(0.71 + boundsPadding, <%= _f(s.r) %> + boundsPadding, 0.71 + boundsPadding);
              <%     
                  break;
              case 7: //HEX_PRISM: %>
                  vec3 bounds<%= i %> = vec3(<%= _f(s.l.x) %> * 1.16, <%= _f(s.l.y) %> + boundsPadding, <%= _f(s.l.x) %> * 1.16);
              <%     
                  break;
              case 8: //TRI_PRISM: %>
                  vec3 bounds<%= i %> = vec3(<%= _f(s.l.x) %> + boundsPadding, <%= _f(s.l.y) %> + boundsPadding, <%= _f(s.l.x) %> + boundsPadding);
              <%     
                  break;
              case 0: //PLANE: %>
                  // Plane extends infinitely, but we can use a large bound
                  vec3 bounds<%= i %> = vec3(100.0);
              <%     
                  break;
              default: %>
                  // For unknown shapes, use conservative bound
                  vec3 bounds<%= i %> = vec3(1.5);
          <% } %>

          if (res.x >= earlyExitThreshold) {
            if( sdBox( newPos<%= i %>, bounds<%= i %> ) < res.x ) 
            {
                <% switch(s.type) {
                  case 1: // SPHERE: %>
                    res = opU( res, vec3( sdSphere(newPos<%= i %>, <%= _f(s.r) %>) * FUDGE_FACTOR, <%= s.mat %>, <%= i %> ) );
                  <%
                    break;
                  case 2: //BOX: %>
                    res = opU( res, vec3( sdBox(newPos<%= i %>, vec3(<%= _f(s.a.x) %>, <%= _f(s.a.y) %>, <%= _f(s.a.z) %>)) * FUDGE_FACTOR, <%= s.mat %>, <%= i %> ) );
                  <%
                    break;
                  case 3: //ROUND_BOX: %>
                    res = opU( res, vec3( sdRoundBox(newPos<%= i %>, vec3(<%= _f(s.a.x) %>, <%= _f(s.a.y) %>, <%= _f(s.a.z) %>), <%= s.r %>) * FUDGE_FACTOR, <%= s.mat %>, <%= i %>) );
                  <%
                    break;
                  case 20: //BOX_FRAME: %>
                    res = opU( res, vec3( sdBoxFrame(newPos<%= i %>, vec3(<%= _f(s.a.x) %>, <%= _f(s.a.y) %>, <%= _f(s.a.z) %>), <%= _f(s.r) %>) * FUDGE_FACTOR, <%= s.mat %>, <%= i %>) );
                  <%
                    break;
                  case 4: //TORUS: %>
                    res = opU( res, vec3( sdTorus(newPos<%= i %>, <%= _f(s.r1) %>, <%= _f(s.r2) %>) * FUDGE_FACTOR, <%= s.mat %>, <%= i %>) );
                  <%
                    break;
                  case 5: //LINK: %>
                    res = opU( res, vec3( sdLink(newPos<%= i %>, <%= _f(s.h) %>, <%= _f(s.r1) %>, <%= _f(s.r2) %>) * FUDGE_FACTOR, <%= s.mat %>, <%= i %>) );
                  <%
                    break;
                  case 6: //CONE: %>
                    res = opU( res, vec3( sdCone(newPos<%= i %>, vec2(<%= _f(s.c.x) %>, <%= _f(s.c.y) %>), <%= _f(s.h) %>) * FUDGE_FACTOR, <%= s.mat %>, <%= i %>) );
                  <%
                    break;
                  case 7: //HEX_PRISM: %>
                    res = opU( res, vec3( sdHexPrism(newPos<%= i %>, vec2(<%= _f(s.l.x) %>, <%= _f(s.l.y) %>)) * FUDGE_FACTOR, <%= s.mat %>, <%= i %>) );
                  <%
                    break;
                  case 8: //TRI_PRISM: %>
                    res = opU( res, vec3( sdTriPrism(newPos<%= i %>, vec2(<%= _f(s.l.x) %>, <%= _f(s.l.y) %>)) * FUDGE_FACTOR, <%= s.mat %>, <%= i %>) );
                  <%
                    break;
                  case 9: //CAPSULE: %>
                    res = opU( res, vec3( sdCapsule(newPos<%= i %>, <%= _f(s.h) %>, <%= _f(s.r) %>) * FUDGE_FACTOR, <%= s.mat %>, <%= i %>) );
                  <%
                    break;
                  case 10: //CYLINDER: %>
                    res = opU( res, vec3( sdCylinder(newPos<%= i %>, <%= _f(s.h) %>, <%= _f(s.r) %>) * FUDGE_FACTOR, <%= s.mat %>, <%= i %>) );
                  <%
                    break;
                  case 11: //ROUND_CYLINDER: %>
                    res = opU( res, vec3( sdRoundCylinder(newPos<%= i %>, <%= _f(s.r) %>, <%= _f(s.h) %>, <%= _f(s.r1) %>) * FUDGE_FACTOR, <%= s.mat %>, <%= i %>) );
                  <%
                    break;
                  case 12: //CUT_CONE: %>
                    res = opU( res, vec3( sdCutCone(newPos<%= i %>, <%= _f(s.h) %>, <%= _f(s.r1) %>, <%= _f(s.r2) %>) * FUDGE_FACTOR, <%= s.mat %>, <%= i %>) );
                  <%
                    break;
                  case 13: //SOLID_ANGLE: %>
                    res = opU( res, vec3( sdSolidAngle(newPos<%= i %>, vec2(<%= _f(s.c.x) %>, <%= _f(s.c.y) %>), <%= _f(s.r1) %>) * FUDGE_FACTOR, <%= s.mat %>, <%= i %>) );
                  <%
                    break;
                  case 14: //CUT_SPHERE: %>
                    res = opU( res, vec3( sdCutSphere(newPos<%= i %>, <%= _f(s.r) %>, <%= _f(s.h) %>) * FUDGE_FACTOR, <%= s.mat %>, <%= i %>) );
                  <%
                    break;
                  case 15: //ROUND_CONE: %>
                    res = opU( res, vec3( sdRoundCone(newPos<%= i %>, <%= _f(s.h) %>, <%= _f(s.r1) %>, <%= _f(s.r2) %>) * FUDGE_FACTOR, <%= s.mat %>, <%= i %>) );
                  <%
                    break;
                  case 16: //ELLIPSOID: %>
                    res = opU( res, vec3( sdEllipsoid(newPos<%= i %>, <%= _f(s.r) %>, <%= _f(s.r1) %>, <%= _f(s.r2) %>) * FUDGE_FACTOR, <%= s.mat %>, <%= i %>) );
                  <%
                    break;
                  case 17: //FOOTBALL: %>
                    res = opU( res, vec3( sdFootball(newPos<%= i %>, vec3(<%= _f(s.a.x) %>, <%= _f(s.a.y) %>, <%= _f(s.a.z) %>), vec3(<%= _f(s.b.x) %>, <%= _f(s.b.y) %>, <%= _f(s.b.z) %>), <%= _f(s.h) %>) * FUDGE_FACTOR, <%= s.mat %>, <%= i %>) );
                  <%
                    break;
                  case 18: //OCTAHEDRON: %>
                    res = opU( res, vec3( sdOctahedron(newPos<%= i %>, <%= _f(s.r) %>) * FUDGE_FACTOR, <%= s.mat %>, <%= i %>) );
                  <%
                    break;
                  case 19: //PYRAMID: %>
                    res = opU( res, vec3( sdPyramid(newPos<%= i %>, <%= _f(s.r) %>) * FUDGE_FACTOR, <%= s.mat %>, <%= i %>) );
                  <%
                    break;
                } %>
            }
          }
        }
    <% }) %>

    return res;
}
<% } %>

// Backwards compatibility version for functions that don't need distance
vec3 map( in vec3 pos )
{
    // Estimate distance from origin for these calls
    float estimatedDistance = length(pos);
    return map(pos, estimatedDistance);
}


// https://iquilezles.org/articles/boxfunctions
vec2 iBox( in vec3 ro, in vec3 rd, in vec3 rad ) 
{
    vec3 m = 1.0/rd;
    vec3 n = m*ro;
    vec3 k = abs(m)*rad;
    vec3 t1 = -n - k;
    vec3 t2 = -n + k;
	  return vec2( max( max( t1.x, t1.y ), t1.z ), min( min( t2.x, t2.y ), t2.z ) );
}

vec3 raycast(in vec3 ro, in vec3 rd)
{
    // Initialize performance stats
    perfStats.stepCount = 0;
    perfStats.stallCount = 0;
    perfStats.bounceCount = 0;
    perfStats.terminationReason = 0;
    perfStats.minDistance = 1e6;
    perfStats.totalDistance = 0.0;
    
    vec3 res = vec3(-1.0, -1.0, -1.0);

    float tmin = 0.01;
    float tmax = 20.0;

    // Raytrace floor plane
    float tp1 = (0.0 - ro.y) / rd.y;
    if (tp1 > 0.0)
    {
        tmax = min(tmax, tp1);
        res = vec3(tp1, 0.0, -1.0);
    }

    // Raymarch bounding box
    vec2 tb = iBox(ro - vec3(0.0, 0.4, 0.0), rd, vec3(2.0, 2.0, 2.0));
    if (tb.x < tb.y && tb.y > 0.0 && tb.x < tmax)
    {
        float t = tmin;
        float prevStep = 1e6;
        int stallCount = 0;
        const int STALL_LIMIT = 10;
        const float epsilon = 0.1;
        int bounceCount = 0;
        int count = 0;

        for (int i = 0; i < marchingSteps && t < tmax; i++)
        {
            perfStats.stepCount++;
            vec3 p = ro + rd * t;
            vec3 h = map(p, t);
            float step = abs(h.x);
            
            // Track minimum distance and total distance
            perfStats.minDistance = min(perfStats.minDistance, step);
            perfStats.totalDistance += step;

            // Hit surface
            if (step < (distanceThreshold * t))
            {
                res = vec3(t, h.y, h.z);
                perfStats.terminationReason = 0; // Hit surface
                break;
            }

            // Refined stall detection
            if (step == prevStep)
            {
                stallCount++;
                perfStats.stallCount++;
            }
            else
            {
                stallCount = 0;
            }

            prevStep = step;

            bool stallTest = stallCount >= STALL_LIMIT;
            if (stallTest)
            {
                vec3 jumpDir;
                bool isFloor = h.y == 0.0;

                if(isFloor)
                {
                    jumpDir = vec3(0.0, 1.0, 0.0);
                }
                else
                {
                    vec3 sPos;
                    bool firstHalf = int(h.z) < numberOfShapes;

                    if(firstHalf)
                    {
                      <% if(devMode) { %> 
                      sPos = shapes[int(h.z)].pos;
                      <% } else { %> 
                      sPos = shapes[int(h.z)];
                      <% } %>
                    }

                    if(!firstHalf)
                    {
                      <% if(devMode) { %> 
                      sPos = shapes[int(h.z)].pos;
                      <% } else { %> 
                      sPos = shapes[int(h.z) - numberOfShapes];
                      <% } %>
                    }

                    vec3 toCenter = normalize(p - sPos);

                    jumpDir = (h.x > 0.0) ? toCenter : -toCenter;
                }

                // Nudge forward slightly in rd and laterally out of stall zone
                t += 0.05;
                ro += jumpDir * 0.04;
                stallCount = 0;
                bounceCount++;
                perfStats.bounceCount++;
                perfStats.terminationReason = 3; // Stalled
            }
            else
            {
                t += step;
            }
            count++;
        }
        
        // Check if we hit max iterations
        if (perfStats.stepCount >= marchingSteps) {
            perfStats.terminationReason = 1; // Max steps
        }
        
        // Check if we escaped the bounding box
        if (t >= tmax) {
            perfStats.terminationReason = 2; // Escaped
        }
    }

    return res;
}

/*
// https://iquilezles.org/articles/rmshadows
float calcSoftShadow( in vec3 ro, in vec3 rd, in float mint, in float tmax )
{
    // bounding volume
    float tp = (0.8-ro.y)/rd.y; if( tp>0.0 ) tmax = min( tmax, tp );

    float res = 1.0;
    float t = mint;
    for( int i=ZERO; i< shadowAccuracy; i++ )
    {
      perfStats.stepCount++;
		  float h = map( ro + rd*t, t ).x;
      float s = clamp(8.0*h/t,0.0,1.0);
      res = min( res, s );
      t += clamp(h, 0.001, 0.05);
      if( res<-1.0 || t>tmax) break;
    }
    res = max(res, -1.0);
    return 0.25 * (1.0+res)*(1.0+res)*(2.0-res);
}
*/

float calcSoftShadow(in vec3 ro, in vec3 rd, in float mint, in float tmax) {
    float t = mint;
    float res = 1.0;
    
    for(int i = 0; i < shadowAccuracy; i++) {  // Just 6 steps instead of 24
        float h = map(ro + rd * t, t).x;
        res = min(res, 8.0 * h / t);
        t += h;
        if(res < 0.001 || t > tmax) break;
    }
    
    return clamp(res, 0.0, 1.0);  // Simpler calculation
}


// https://iquilezles.org/articles/normalsSDF
vec3 calcNormal( in vec3 pos )
{
#if 0
    vec2 e = vec2(1.0,-1.0)*0.5773*0.0005;
    return normalize( e.xyy*map( pos + e.xyy ).x + 
					  e.yyx*map( pos + e.yyx ).x + 
					  e.yxy*map( pos + e.yxy ).x + 
					  e.xxx*map( pos + e.xxx ).x );
#else
    // inspired by tdhooper and klems - a way to prevent the compiler from inlining map() 4 times
    vec3 n = vec3(0.0);
    for( int i=ZERO; i<4; i++ )
    {
        vec3 e = 0.5773*(2.0*vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0);
        n += e*map(pos+0.0005*e).x;
      //if( n.x+n.y+n.z>100.0 ) break;
    }
    return normalize(n);
#endif    
}

// https://iquilezles.org/articles/nvscene2008/rwwtt.pdf
float calcAO( in vec3 pos, in vec3 nor )
{
	float occ = 0.0;
    float sca = 1.0;
    for( int i=ZERO; i<5; i++ )
    {
        float h = 0.01 + 0.12*float(i)/4.0;
        float d = map( pos + h*nor ).x;
        occ += (h-d)*sca;
        sca *= 0.95;
        if( occ>0.35 ) break;
    }
    return clamp( 1.0 - 3.0*occ, 0.0, 1.0 ) * (0.5+0.5*nor.y);
}

vec4 gi(in vec3 pos, in vec3 nor) {
  vec4 col = vec4(0);
  for (int i=0; i<4; i++) {
    float hr = .01 + float(i) * giLength / 4.;
    vec3 res = map( pos + hr*nor );

    Material mat = materials[int(res.y)];
    col += vec4(mat.color, 1.) * (hr - res.x);
  }
  col.rgb *= giStrength / giLength;
  col.w = clamp(1.-col.w * aoStrength / giLength, 0., 1.);
  return col;
}

// https://iquilezles.org/articles/checkerfiltering
float checkersGradBox( in vec2 p, in vec2 dpdx, in vec2 dpdy )
{
    // filter kernel
    vec2 w = abs(dpdx)+abs(dpdy) + 0.001;
    // analytical integral (box filter)
    vec2 i = 2.0*(abs(fract((p-0.5*w)*0.5)-0.5)-abs(fract((p+0.5*w)*0.5)-0.5))/w;
    // xor pattern
    return 0.5 - 0.5*i.x*i.y;                  
}

vec3 applyLights(vec3 pos, vec3 rd, vec3 nor, vec3 ref, vec3 albedo, Material mat) 
{
    vec3 lin = vec3(0.0); 
    vec3 V = -rd;

    <% lights.forEach((l, i) => { %>
        vec3 L<%= i %>, lightCol<%= i %> = vec3(<%= _f(l.color.r) %>, <%= _f(l.color.g) %>, <%= _f(l.color.b) %>);
        float attenuation<%= i %> = 1.0;

        <% if(l.type == 0) { %>
            lin += lightCol<%= i %> * <%= _f(l.strength) %> * mat.kd * albedo; // Ambient light only affects diffuse
        <% } else { %>

          if(lighting)
          {
            <% if(l.type == 1) { %>
                L<%= i %> = normalize(-vec3(<%= l.dir.x %>, <%= l.dir.y %>, <%= l.dir.z %>));
            <% } %>
            <% if(l.type == 2) { %>
                vec3 toLight<%= i %> = vec3(<%= l.pos.x %> - pos.x, <%= l.pos.y %> - pos.y, <%= l.pos.z %> - pos.z);
                float dist2<%= i %> = dot(toLight<%= i %>, toLight<%= i %>);
                float dist<%= i %> = sqrt(dist2<%= i %>);
                L<%= i %> = toLight<%= i %> / dist<%= i %>;
                <% if(l.ranged) { %>
                    attenuation *= clamp(1.0 - dist<%= i %> / <%= l.r %>, 0.0, 1.0);
                <% } %>
            <% } %>

            // Shadow
            float shadow<%= i %> = 1.0;
            if(shadows && <%= l.castsShadow ? "true" : " false" %>)
            {
              shadow<%= i %> = calcSoftShadow(pos + nor * 0.01, L<%= i %>, 0.01, shadowRange);
            }

            // Half vector for Cook-Torrance
            vec3 H<%= i %> = normalize(L<%= i %> + V);

            float NdotL<%= i %> = max(dot(nor, L<%= i %>), 0.0);
            float NdotV<%= i %> = max(dot(nor, V), 0.0);
            float NdotH<%= i %> = max(dot(nor, H<%= i %>), 0.0);
            float VdotH<%= i %> = max(dot(V, H<%= i %>), 0.0);

            // Fresnel term (Schlick)
            vec3 F0<%= i %> = mix(vec3(0.04), albedo, mat.metallic);
            vec3 F<%= i %> = F0<%= i %> + (1.0 - F0<%= i %>) * pow(1.0 - VdotH<%= i %>, 5.0);

            // Geometry term (Smith GGX Approximation)
            float alpha<%= i %> = mat.roughness * mat.roughness;
            float k<%= i %> = (alpha<%= i %> + 1.0) * (alpha<%= i %> + 1.0) / 8.0;
            float G_V<%= i %> = NdotV<%= i %> / (NdotV<%= i %> * (1.0 - k<%= i %>) + k<%= i %>);
            float G_L<%= i %> = NdotL<%= i %> / (NdotL<%= i %> * (1.0 - k<%= i %>) + k<%= i %>);
            float G<%= i %> = G_V<%= i %> * G_L<%= i %>;

            // Normal distribution function (GGX)
            float a2<%= i %> = alpha<%= i %> * alpha<%= i %>;
            float d<%= i %> = (NdotH<%= i %> * NdotH<%= i %>) * (a2<%= i %> - 1.0) + 1.0;
            float D<%= i %> = a2<%= i %> / (PI * d<%= i %> * d<%= i %>);

            // Cook-Torrance specular BRDF
            vec3 spec<%= i %> = (F<%= i %> * G<%= i %> * D<%= i %>) / max(4.0 * NdotL<%= i %> * NdotV<%= i %>, 0.001);

            // Diffuse (Lambert or none for metals)
            vec3 kd<%= i %> = (1.0 - F<%= i %>) * (1.0 - mat.metallic);
            vec3 diffuse<%= i %> = kd<%= i %> * albedo / PI;

            // Combine
            vec3 contrib<%= i %> = (diffuse<%= i %> + spec<%= i %>) * <%= _f(l.strength) %> * lightCol<%= i %> * NdotL<%= i %> * attenuation<%= i %> * shadow<%= i %>;
            lin += contrib<%= i %>;
          }
        <% } %>
    <% }) %>

    // Global Illumination
    if(globalIllumination)
    {
      vec4 giCol = gi(pos, nor);
      lin = lin * giCol.w + giCol.rgb;
    }

    return lin;
}


// Ray structure
struct Ray {
    vec3 origin;
    vec3 direction;
    float throughput; // Color multiplier for the ray
    bool inside;
    int identifier;
};

Ray rays[MAX_RAYS]; // Array to store rays
int numRays = 0;     // The number of active rays in the array

// Function to add a new ray to the ray queue
void addRay(vec3 origin, vec3 direction, float throughput, bool inside, int identifier) {
    if (numRays < maxRays) {
        rays[numRays].origin = origin;
        rays[numRays].direction = direction;
        rays[numRays].throughput = throughput; // Color multiplier
        rays[numRays].inside = inside; // inside
        rays[numRays].identifier = identifier; // inside
        numRays++;
    }
}

vec3 render(in vec3 ro, in vec3 rd, in vec3 rdx, in vec3 rdy) {
    // Initialize background color
    vec3 bg = vec3(0.8, 0.8, 0.8);
    vec3 col = vec3(0.);

    // Initialize the first ray
    addRay(ro, rd, 1.0, false, -1);

    // Project pixel footprint into the plane
    vec3 dpdx = ro.y * (rd / rd.y - rdx / rdx.y);
    vec3 dpdy = ro.y * (rd / rd.y - rdy / rdy.y);

    // Process each ray
    for (int i = 0; i < numRays; i++) {

      Ray currentRay = rays[i];

      // Perform raycast to find intersection point
      vec3 res = raycast(currentRay.origin, currentRay.direction); // Use raycast here
      float t = res.x;
      float m = res.y;

      if(!currentRay.inside)
      {
        if (m > -0.5) { // Hit an object
            Material mat = materials[int(m)];
            vec3 pos = currentRay.origin + t * currentRay.direction;
            vec3 nor = (m < 0.5) ? vec3(0.0, 1.0, 0.0) : calcNormal(pos);
            vec3 refDir = reflect(currentRay.direction, nor);

            vec3 base = mat.color; 

            float reflectivity = mat.reflectivity;
            float transparency = mat.transparency;
            float reflectRoughness = mat.reflectRoughness;
            float refractRoughness = mat.refractRoughness;
            float ior = mat.ior;

            // Lighting calculations for the current point
            vec3 lin = applyLights(pos, currentRay.direction, nor, refDir, base, mat);
            //vec3 lin = base;

            // FLATTENED BRANCHING VERSION
            // Pre-compute conditions to avoid repeated evaluation
            bool isOpaque = (transparency == 0.0 && reflectivity == 0.0);
            bool isReflectiveOnly = (reflectivity > 0.0 && transparency == 0.0);
            bool hasTransparency = (transparency > 0.0);

            // Handle opaque materials
            if (isOpaque) {
                col += lin * currentRay.throughput;
            }

            // Handle reflective-only materials
            if (isReflectiveOnly) {
                col += lin * currentRay.throughput * (1.0 - reflectivity);
                
                // Rough reflections
                if (reflectRoughness > 0.01 && roughReflectSamples > 0) {
                    for(int j = 0; j < roughReflectSamples; j++) {
                        vec3 jitter = reflectRoughness * randomHemispherePoint(vec3(random(vec2(float(j) * 0.73, fract(t * 13.3))), random(vec2(float(j + 1) * 0.91, fract(t * 17.7))), random(vec2(float(j + 2) * 1.32, fract(t * 31.3)))), refDir);
                        addRay(pos + nor * 0.002, normalize(refDir + jitter), currentRay.throughput * reflectivity * (1. / float(roughReflectSamples)), false, 0 + i);
                    }
                } else {
                    addRay(pos + nor * 0.002, refDir, currentRay.throughput * reflectivity, false, 0 + i);
                }
            }

            // Handle materials with transparency (includes both reflective+transparent)
            if (hasTransparency) {
                // Refractive direction (calculate if we can refract)
                float eta = 1. / ior;
                vec3 refractDir = refract(currentRay.direction, nor, eta);
                bool canRefract = length(refractDir) > 0.0;

                // Fresnel term (Schlick approximation)
                float cosTheta = clamp(dot(-currentRay.direction, nor), 0.0, 1.0);
                float fresnel = reflectivity + (1.0 - reflectivity) * pow(1.0 - cosTheta, 5.0);

                // Handle transparency component
                if (canRefract) {
                    col += lin * currentRay.throughput * (1.0 - transparency);
                    
                    if (refractRoughness > 0.01 && roughRefractSamples > 0) {
                        for(int j = 0; j < roughRefractSamples; j++) {
                            vec3 jitter = 0.1 * refractRoughness * randomHemispherePoint(vec3(random(vec2(float(j) * 0.73, fract(t * 13.3))), random(vec2(float(j + 1) * 0.91, fract(t * 17.7))), random(vec2(float(j + 2) * 1.32, fract(t * 31.3)))), refDir);
                            addRay(pos + nor * 0.004, normalize(refractDir - jitter), currentRay.throughput * transparency * (1. / float(roughRefractSamples)), true, 10 + i);
                        }
                    } else {
                        addRay(pos + nor * 0.004, refractDir, currentRay.throughput * transparency, true, 10 + i);
                    }
                }
                
                // Handle reflection component (for transparent materials)
                if (fresnel != 0.0) {
                    col += lin * currentRay.throughput * (1.0 - fresnel);
                    
                    if (reflectRoughness > 0.01 && roughReflectSamples > 0) {
                        for(int j = 0; j < roughReflectSamples; j++) {
                            vec3 jitter = 0.1 * reflectRoughness * randomHemispherePoint(vec3(random(vec2(float(j) * 0.73, fract(t * 13.3))), random(vec2(float(j + 1) * 0.91, fract(t * 17.7))), random(vec2(float(j + 2) * 1.32, fract(t * 31.3)))), refDir);
                            addRay(pos + nor * 0.002, normalize(refDir + jitter), currentRay.throughput * fresnel * 1. / float(roughReflectSamples), false, 20 + i);
                        }
                    } else {
                        addRay(pos + nor * 0.002, refDir, currentRay.throughput * fresnel, false, 20 + i);
                    }
                }
            }
        } else {
            // Missed the object, so keep the background color
            col += bg * currentRay.throughput;
        }
      }
      else
      {
        if (m > -0.5)
        {
          Material mat = materials[int(m)];
          vec3 pos = currentRay.origin + t * currentRay.direction;
          vec3 nor = -calcNormal(pos);
          vec3 refDir = reflect(currentRay.direction, nor);

          float reflectivity = mat.reflectivity;
          float attenuation = mat.attenuation;
          float attenuationStrength = mat.attenuationStrength;
          vec3 innerColor = mat.innerColor;
          bool intRef = mat.intRef;
          float ior = mat.ior;

          float eta = ior;
          vec3 refractDir = refract(currentRay.direction, nor, eta);
          bool canRefract = length(refractDir) > 0.0;

          // Fresnel term (Schlick approximation)
          float cosTheta = clamp(dot(-currentRay.direction, nor), 0.0, 1.0);
          float fresnel = reflectivity + (1.0 - reflectivity) * pow(1.0 - cosTheta, 5.0);

          float att = pow((1.0 - pow(attenuation, 20.)), (pow(1.0 + t, attenuationStrength)));
          float throughput = att; 
          if(attenuation > 0.0)
          {
            col += currentRay.throughput * (1.0 - att) * innerColor;
          }

          bool escaped = false;
          if(canRefract && fresnel != 1.0)
          {
            addRay(pos - nor * 0.004, refractDir, currentRay.throughput * throughput, false, 30 + i);
          }
          else if(numRays + 1 == maxRays)
          {
            escaped = true;
            addRay(pos - nor * 0.004, currentRay.direction, currentRay.throughput * throughput, false, 40 + i);
          }

          if(!canRefract && !escaped && intRef)
          { 
            addRay(pos + nor * 0.002, refDir, currentRay.throughput * 0.25, true, 50 + i);
          }
        }
      }
    }

    return clamp(col, 0.0, 1.0);
}

mat3 setCamera( in vec3 ro, in vec3 ta, float cr )
{
	vec3 cw = normalize(ta-ro);
	vec3 cp = vec3(sin(cr), cos(cr),0.0);
	vec3 cu = normalize( cross(cw,cp) );
	vec3 cv =          ( cross(cu,cw) );
    return mat3( cu, cv, cw );
}

vec3 convertColor(float color) {
    return 0.2 + 0.2*sin( color*2.0 + vec3(0.0,1.0,2.0));
}

vec3 hsv2rgb(vec3 hsv) { return ((clamp(abs(fract(hsv.x+vec3(0,2,1)/3.)*2.-1.)*3.-1.,0.,1.)-1.)*hsv.y+1.)*hsv.z; }

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 mo = clamp(iMouse.xy/iResolution.xy, 0.,1.);

    // camera	
    vec3 ro;
    
    if(orbit > 0.01)
    {
      ro = camTgt + vec3( camDist*cos(iTime * orbit), camHeight, camDist*sin(iTime * orbit) );
    }
    else
    {
      ro = camTgt + vec3( camDist*cos(PI*2.*mo.x), (0.1 + camHeight) * mo.y, camDist*sin(PI*2.*mo.x) );
    }
    // camera-to-world transformation
    mat3 ca = setCamera( ro, camTgt, 0.0 );

    vec3 tot = vec3(0.0);
    vec2 p = (2.0*fragCoord-iResolution.xy)/iResolution.y;

    // focal length
    const float fl = 2.5;
    
    // ray direction
    vec3 rd = ca * normalize( vec3(p,fl) );

      // ray differentials
    vec2 px = (2.0*(fragCoord+vec2(1.0,0.0))-iResolution.xy)/iResolution.y;
    vec2 py = (2.0*(fragCoord+vec2(0.0,1.0))-iResolution.xy)/iResolution.y;
    vec3 rdx = ca * normalize( vec3(px,fl) );
    vec3 rdy = ca * normalize( vec3(py,fl) );

    <% if(devMode) { %>
    if(showBoxes)
    {
      for(int i = 0; i < numberOfShapes; i++)
      {
        Shape debugShape;
        Shape shape = shapes[i];
        debugShape.type = BOX_FRAME;
        debugShape.mat = 1;
        debugShape.pos = shapes[i].pos;
        debugShape.a = getShapeBounds(shape); 
        debugShape.r = 0.005;
        debugShape.isRot = shapes[i].isRot;
        debugShape.mat = 1;
        debugShape.rot = shape.rot;
        debugShapes[i] = debugShape;
      }
    }
    <% } %>
    
    // render	
    vec3 col = render( ro, rd, rdx, rdy );

    // Performance visualization
    if (showPerformance) {
        vec3 perfColor = vec3(0.0);
        
        if (perfMode == 0) {
            // Step count visualization - scale controls intensity range
            float normalizedSteps = float(perfStats.stepCount) / (float(marchingSteps)/ perfScale);
            perfColor = heatmapColor(normalizedSteps, 1.0);
        } else if (perfMode == 1) {
            // Distance-based heat map
            float avgStepSize = perfStats.totalDistance / float(max(perfStats.stepCount, 1));
            float efficiency = clamp(avgStepSize * perfScale, 0.0, 1.0);
            perfColor = heatmapColor(1.0 - efficiency, 1.0);
        } else if (perfMode == 2) {
            // Termination reason - perfScale controls blend amount
            perfColor = terminationReasonColor(perfStats.terminationReason);
        } else if (perfMode == 3) {
            // Stall count visualization - scale controls sensitivity
            float stallRatio = float(perfStats.stallCount) / float(max(perfStats.stepCount, 1));
            perfColor = heatmapColor(stallRatio * 10.0 * perfScale, 1.0);
        } else if (perfMode == 4) {
            // Minimum distance reached - scale controls distance threshold
            float minDistNorm = clamp(1.0 - (perfStats.minDistance / (0.1 / perfScale)), 0.0, 1.0);
            perfColor = heatmapColor(minDistNorm, 1.0);
        }
        
        // Blend performance visualization with original image
        // Use perfScale to control blend amount for termination mode
        //float blendAmount = (perfMode == 2) ? clamp(perfScale * 0.7, 0.0, 1.0) : 0.7;
        //col = mix(col, perfColor, blendAmount);
        col = perfColor;
    }

    // gamma
    col = pow( col, vec3(0.4545) );

    tot += col;
    
    fragColor = vec4( tot, 1.0 );

    if(override)
    {
      fragColor = overrideColor;
    }
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}