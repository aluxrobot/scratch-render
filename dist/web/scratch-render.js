import ae from "events";
import ye from "hull.js";
import * as x from "twgl.js";
import { loadSvgString as Te, serializeSvgToString as Se } from "scratch-svg-renderer";
const L = {
  /**
   * The ID value to use for "no item" or when an object has been disposed.
   * @const {int}
   */
  ID_NONE: -1,
  /**
   * Optimize for fewer than this number of Drawables sharing the same Skin.
   * Going above this may cause middleware warnings or a performance penalty but should otherwise behave correctly.
   * @const {int}
   */
  SKIN_SHARE_SOFT_LIMIT: 301,
  /**
   * @enum {string}
   */
  Events: {
    /**
     * NativeSizeChanged event
     *
     * @event RenderWebGL#event:NativeSizeChanged
     * @type {object}
     * @property {Array<int>} newSize - the new size of the renderer
     */
    NativeSizeChanged: "NativeSizeChanged"
  }
};
let ft;
const ot = (a, t) => t ^ (a ^ t) & a - t >> 31, at = (a, t) => a ^ (a ^ t) & a - t >> 31, V = ({ _width: a, _height: t, _colorData: e }, i, s) => i >= a || s >= t || i < 0 || s < 0 ? 0 : e[(s * a + i) * 4 + 3], tt = [
  new Uint8ClampedArray(4),
  new Uint8ClampedArray(4),
  new Uint8ClampedArray(4),
  new Uint8ClampedArray(4)
], Rt = ({ _width: a, _height: t, _colorData: e }, i, s, o) => {
  if (i = at(0, ot(i, a - 1)), s = at(0, ot(s, t - 1)), i >= a || s >= t || i < 0 || s < 0)
    return o.fill(0);
  const l = (s * a + i) * 4, u = e[l + 3] / 255;
  return o[0] = e[l] * u, o[1] = e[l + 1] * u, o[2] = e[l + 2] * u, o[3] = e[l + 3], o;
}, De = ({ _width: a, _height: t, _colorData: e }, i, s, o) => {
  i = at(0, ot(i, a - 1)), s = at(0, ot(s, t - 1));
  const l = (s * a + i) * 4;
  return o[0] = e[l], o[1] = e[l + 1], o[2] = e[l + 2], o[3] = e[l + 3], o;
};
class It {
  constructor() {
    this._width = 0, this._height = 0, this._colorData = null, this._getColor = Rt, this.colorAtNearest = this.colorAtLinear = (t, e) => e.fill(0);
  }
  /**
   * Update this silhouette with the bitmapData for a skin.
   * @param {ImageData|HTMLCanvasElement|HTMLImageElement} bitmapData An image, canvas or other element that the skin
   * @param {boolean} isPremultiplied True if the source bitmap data comes premultiplied (e.g. from readPixels).
   * rendering can be queried from.
   */
  update(t, e = !1) {
    let i;
    if (t instanceof ImageData)
      i = t, this._width = t.width, this._height = t.height;
    else {
      const s = It._updateCanvas(), o = this._width = s.width = t.width, l = this._height = s.height = t.height, u = s.getContext("2d");
      if (!(o && l))
        return;
      u.clearRect(0, 0, o, l), u.drawImage(t, 0, 0, o, l), i = u.getImageData(0, 0, o, l);
    }
    e ? this._getColor = De : this._getColor = Rt, this._colorData = i.data, delete this.colorAtNearest, delete this.colorAtLinear;
  }
  /**
   * Sample a color from the silhouette at a given local position using
   * "nearest neighbor"
   * @param {twgl.v3} vec [x,y] texture space (0-1)
   * @param {Uint8ClampedArray} dst The memory buffer to store the value in. (4 bytes)
   * @returns {Uint8ClampedArray} dst
   */
  colorAtNearest(t, e) {
    return this._getColor(
      this,
      Math.floor(t[0] * (this._width - 1)),
      Math.floor(t[1] * (this._height - 1)),
      e
    );
  }
  /**
   * Sample a color from the silhouette at a given local position using
   * "linear interpolation"
   * @param {twgl.v3} vec [x,y] texture space (0-1)
   * @param {Uint8ClampedArray} dst The memory buffer to store the value in. (4 bytes)
   * @returns {Uint8ClampedArray} dst
   */
  colorAtLinear(t, e) {
    const i = t[0] * (this._width - 1), s = t[1] * (this._height - 1), o = i % 1, l = s % 1, u = 1 - o, c = 1 - l, f = Math.floor(i), d = Math.floor(s), _ = this._getColor(this, f, d, tt[0]), w = this._getColor(this, f + 1, d, tt[1]), E = this._getColor(this, f, d + 1, tt[2]), g = this._getColor(this, f + 1, d + 1, tt[3]);
    return e[0] = _[0] * u * c + E[0] * u * l + w[0] * o * c + g[0] * o * l, e[1] = _[1] * u * c + E[1] * u * l + w[1] * o * c + g[1] * o * l, e[2] = _[2] * u * c + E[2] * u * l + w[2] * o * c + g[2] * o * l, e[3] = _[3] * u * c + E[3] * u * l + w[3] * o * c + g[3] * o * l, e;
  }
  /**
   * Test if texture coordinate touches the silhouette using nearest neighbor.
   * @param {twgl.v3} vec A texture coordinate.
   * @return {boolean} If the nearest pixel has an alpha value.
   */
  isTouchingNearest(t) {
    if (this._colorData)
      return V(
        this,
        Math.floor(t[0] * (this._width - 1)),
        Math.floor(t[1] * (this._height - 1))
      ) > 0;
  }
  /**
   * Test to see if any of the 4 pixels used in the linear interpolate touch
   * the silhouette.
   * @param {twgl.v3} vec A texture coordinate.
   * @return {boolean} Any of the pixels have some alpha.
   */
  isTouchingLinear(t) {
    if (!this._colorData) return;
    const e = Math.floor(t[0] * (this._width - 1)), i = Math.floor(t[1] * (this._height - 1));
    return V(this, e, i) > 0 || V(this, e + 1, i) > 0 || V(this, e, i + 1) > 0 || V(this, e + 1, i + 1) > 0;
  }
  /**
   * Get the canvas element reused by Silhouettes to update their data with.
   * @private
   * @return {CanvasElement} A canvas to draw bitmap data to.
   */
  static _updateCanvas() {
    return typeof ft == "undefined" && (ft = document.createElement("canvas")), ft;
  }
}
class F extends ae {
  /**
   * Create a Skin, which stores and/or generates textures for use in rendering.
   * @param {int} id - The unique ID for this Skin.
   * @constructor
   */
  constructor(t) {
    super(), this._id = t, this._rotationCenter = x.v3.create(0, 0), this._texture = null, this._uniforms = {
      /**
       * The nominal (not necessarily current) size of the current skin.
       * @type {Array<number>}
       */
      u_skinSize: [0, 0],
      /**
       * The actual WebGL texture object for the skin.
       * @type {WebGLTexture}
       */
      u_skin: null
    }, this._silhouette = new It(), this.setMaxListeners(L.SKIN_SHARE_SOFT_LIMIT);
  }
  /**
   * Dispose of this object. Do not use it after calling this method.
   */
  dispose() {
    this._id = L.ID_NONE;
  }
  /**
   * @return {int} the unique ID for this Skin.
   */
  get id() {
    return this._id;
  }
  /**
   * @returns {Vec3} the origin, in object space, about which this Skin should rotate.
   */
  get rotationCenter() {
    return this._rotationCenter;
  }
  /**
   * @abstract
   * @return {Array<number>} the "native" size, in texels, of this skin.
   */
  get size() {
    return [0, 0];
  }
  /**
   * Should this skin's texture be filtered with nearest-neighbor or linear interpolation at the given scale?
   * @param {?Array<Number>} scale The screen-space X and Y scaling factors at which this skin's texture will be
   * displayed, as percentages (100 means 1 "native size" unit is 1 screen pixel; 200 means 2 screen pixels, etc).
   * @param {Drawable} drawable The drawable that this skin's texture will be applied to.
   * @return {boolean} True if this skin's texture, as returned by {@link getTexture}, should be filtered with
   * nearest-neighbor interpolation.
   */
  // eslint-disable-next-line no-unused-vars
  useNearest(t, e) {
    return !0;
  }
  /**
   * Get the center of the current bounding box
   * @return {Array<number>} the center of the current bounding box
   */
  calculateRotationCenter() {
    return [this.size[0] / 2, this.size[1] / 2];
  }
  /**
   * @abstract
   * @param {Array<number>} scale - The scaling factors to be used.
   * @return {WebGLTexture} The GL texture representation of this skin when drawing at the given size.
   */
  // eslint-disable-next-line no-unused-vars
  getTexture(t) {
    return this._emptyImageTexture;
  }
  /**
   * Get the bounds of the drawable for determining its fenced position.
   * @param {Array<number>} drawable - The Drawable instance this skin is using.
   * @param {?Rectangle} result - Optional destination for bounds calculation.
   * @return {!Rectangle} The drawable's bounds. For compatibility with Scratch 2, we always use getAABB.
   */
  getFenceBounds(t, e) {
    return t.getAABB(e);
  }
  /**
   * Update and returns the uniforms for this skin.
   * @param {Array<number>} scale - The scaling factors to be used.
   * @returns {object.<string, *>} the shader uniforms to be used when rendering with this Skin.
   */
  getUniforms(t) {
    return this._uniforms.u_skin = this.getTexture(t), this._uniforms.u_skinSize = this.size, this._uniforms;
  }
  /**
   * If the skin defers silhouette operations until the last possible minute,
   * this will be called before isTouching uses the silhouette.
   * @abstract
   */
  updateSilhouette() {
  }
  /**
   * Set this skin's texture to the given image.
   * @param {ImageData|HTMLCanvasElement} textureData - The canvas or image data to set the texture to.
   */
  _setTexture(t) {
    const e = this._renderer.gl;
    e.bindTexture(e.TEXTURE_2D, this._texture), e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !0), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA, e.RGBA, e.UNSIGNED_BYTE, t), e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !1), this._silhouette.update(t);
  }
  /**
   * Set the contents of this skin to an empty skin.
   * @fires Skin.event:WasAltered
   */
  setEmptyImageData() {
    if (this._texture = null, !this._emptyImageData) {
      this._emptyImageData = new ImageData(1, 1);
      const t = this._renderer.gl, e = {
        auto: !0,
        wrap: t.CLAMP_TO_EDGE,
        src: this._emptyImageData
      };
      this._emptyImageTexture = x.createTexture(t, e);
    }
    this._rotationCenter[0] = 0, this._rotationCenter[1] = 0, this._silhouette.update(this._emptyImageData), this.emit(F.Events.WasAltered);
  }
  /**
   * Does this point touch an opaque or translucent point on this skin?
   * Nearest Neighbor version
   * The caller is responsible for ensuring this skin's silhouette is up-to-date.
   * @see updateSilhouette
   * @see Drawable.updateCPURenderAttributes
   * @param {twgl.v3} vec A texture coordinate.
   * @return {boolean} Did it touch?
   */
  isTouchingNearest(t) {
    return this._silhouette.isTouchingNearest(t);
  }
  /**
   * Does this point touch an opaque or translucent point on this skin?
   * Linear Interpolation version
   * The caller is responsible for ensuring this skin's silhouette is up-to-date.
   * @see updateSilhouette
   * @see Drawable.updateCPURenderAttributes
   * @param {twgl.v3} vec A texture coordinate.
   * @return {boolean} Did it touch?
   */
  isTouchingLinear(t) {
    return this._silhouette.isTouchingLinear(t);
  }
}
F.Events = {
  /**
   * Emitted when anything about the Skin has been altered, such as the appearance or rotation center.
   * @event Skin.event:WasAltered
   */
  WasAltered: "WasAltered"
};
class Z extends F {
  /**
   * Create a new Bitmap Skin.
   * @extends Skin
   * @param {!int} id - The ID for this Skin.
   * @param {!RenderWebGL} renderer - The renderer which will use this skin.
   */
  constructor(t, e) {
    super(t), this._costumeResolution = 1, this._renderer = e, this._textureSize = [0, 0];
  }
  /**
   * Dispose of this object. Do not use it after calling this method.
   */
  dispose() {
    this._texture && (this._renderer.gl.deleteTexture(this._texture), this._texture = null), super.dispose();
  }
  /**
   * @return {Array<number>} the "native" size, in texels, of this skin.
   */
  get size() {
    return [this._textureSize[0] / this._costumeResolution, this._textureSize[1] / this._costumeResolution];
  }
  /**
   * @param {Array<number>} scale - The scaling factors to be used.
   * @return {WebGLTexture} The GL texture representation of this skin when drawing at the given scale.
   */
  // eslint-disable-next-line no-unused-vars
  getTexture(t) {
    return this._texture || super.getTexture();
  }
  /**
   * Set the contents of this skin to a snapshot of the provided bitmap data.
   * @param {ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} bitmapData - new contents for this skin.
   * @param {int} [costumeResolution=1] - The resolution to use for this bitmap.
   * @param {Array<number>} [rotationCenter] - Optional rotation center for the bitmap. If not supplied, it will be
   * calculated from the bounding box
   * @fires Skin.event:WasAltered
   */
  setBitmap(t, e, i) {
    if (!t.width || !t.height) {
      super.setEmptyImageData();
      return;
    }
    const s = this._renderer.gl;
    let o = t;
    if (t instanceof HTMLCanvasElement && (o = t.getContext("2d").getImageData(0, 0, t.width, t.height)), this._texture === null) {
      const l = {
        auto: !1,
        wrap: s.CLAMP_TO_EDGE
      };
      this._texture = x.createTexture(s, l);
    }
    this._setTexture(o), this._costumeResolution = e || 2, this._textureSize = Z._getBitmapSize(t), typeof i == "undefined" && (i = this.calculateRotationCenter()), this._rotationCenter[0] = i[0], this._rotationCenter[1] = i[1], this.emit(F.Events.WasAltered);
  }
  /**
   * @param {ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} bitmapData - bitmap data to inspect.
   * @returns {Array<int>} the width and height of the bitmap data, in pixels.
   * @private
   */
  static _getBitmapSize(t) {
    return t instanceof HTMLImageElement ? [t.naturalWidth || t.width, t.naturalHeight || t.height] : t instanceof HTMLVideoElement ? [t.videoWidth || t.width, t.videoHeight || t.height] : [t.width, t.height];
  }
}
const Ce = `precision mediump float;

#ifdef DRAW_MODE_line
uniform vec2 u_stageSize;
uniform float u_lineThickness;
uniform float u_lineLength;
// The X and Y components of u_penPoints hold the first pen point. The Z and W components hold the difference between
// the second pen point and the first. This is done because calculating the difference in the shader leads to floating-
// point error when both points have large-ish coordinates.
uniform vec4 u_penPoints;

// Add this to divisors to prevent division by 0, which results in NaNs propagating through calculations.
// Smaller values can cause problems on some mobile devices.
const float epsilon = 1e-3;
#endif

#if !(defined(DRAW_MODE_line) || defined(DRAW_MODE_background))
uniform mat4 u_projectionMatrix;
uniform mat4 u_modelMatrix;
attribute vec2 a_texCoord;
#endif

attribute vec2 a_position;

varying vec2 v_texCoord;

void main() {
	#ifdef DRAW_MODE_line
	// Calculate a rotated ("tight") bounding box around the two pen points.
	// Yes, we're doing this 6 times (once per vertex), but on actual GPU hardware,
	// it's still faster than doing it in JS combined with the cost of uniformMatrix4fv.

	// Expand line bounds by sqrt(2) / 2 each side-- this ensures that all antialiased pixels
	// fall within the quad, even at a 45-degree diagonal
	vec2 position = a_position;
	float expandedRadius = (u_lineThickness * 0.5) + 1.4142135623730951;

	// The X coordinate increases along the length of the line. It's 0 at the center of the origin point
	// and is in pixel-space (so at n pixels along the line, its value is n).
	v_texCoord.x = mix(0.0, u_lineLength + (expandedRadius * 2.0), a_position.x) - expandedRadius;
	// The Y coordinate is perpendicular to the line. It's also in pixel-space.
	v_texCoord.y = ((a_position.y - 0.5) * expandedRadius) + 0.5;

	position.x *= u_lineLength + (2.0 * expandedRadius);
	position.y *= 2.0 * expandedRadius;

	// 1. Center around first pen point
	position -= expandedRadius;

	// 2. Rotate quad to line angle
	vec2 pointDiff = u_penPoints.zw;
	// Ensure line has a nonzero length so it's rendered properly
	// As long as either component is nonzero, the line length will be nonzero
	// If the line is zero-length, give it a bit of horizontal length
	pointDiff.x = (abs(pointDiff.x) < epsilon && abs(pointDiff.y) < epsilon) ? epsilon : pointDiff.x;
	// The \`normalized\` vector holds rotational values equivalent to sine/cosine
	// We're applying the standard rotation matrix formula to the position to rotate the quad to the line angle
	// pointDiff can hold large values so we must divide by u_lineLength instead of calling GLSL's normalize function:
	// https://asawicki.info/news_1596_watch_out_for_reduced_precision_normalizelength_in_opengl_es
	vec2 normalized = pointDiff / max(u_lineLength, epsilon);
	position = mat2(normalized.x, normalized.y, -normalized.y, normalized.x) * position;

	// 3. Translate quad
	position += u_penPoints.xy;

	// 4. Apply view transform
	position *= 2.0 / u_stageSize;
	gl_Position = vec4(position, 0, 1);
	#elif defined(DRAW_MODE_background)
	gl_Position = vec4(a_position * 2.0, 0, 1);
	#else
	gl_Position = u_projectionMatrix * u_modelMatrix * vec4(a_position, 0, 1);
	v_texCoord = a_texCoord;
	#endif
}
`, Ae = `precision mediump float;

#ifdef DRAW_MODE_silhouette
uniform vec4 u_silhouetteColor;
#else // DRAW_MODE_silhouette
# ifdef ENABLE_color
uniform float u_color;
# endif // ENABLE_color
# ifdef ENABLE_brightness
uniform float u_brightness;
# endif // ENABLE_brightness
#endif // DRAW_MODE_silhouette

#ifdef DRAW_MODE_colorMask
uniform vec3 u_colorMask;
uniform float u_colorMaskTolerance;
#endif // DRAW_MODE_colorMask

#ifdef ENABLE_fisheye
uniform float u_fisheye;
#endif // ENABLE_fisheye
#ifdef ENABLE_whirl
uniform float u_whirl;
#endif // ENABLE_whirl
#ifdef ENABLE_pixelate
uniform float u_pixelate;
uniform vec2 u_skinSize;
#endif // ENABLE_pixelate
#ifdef ENABLE_mosaic
uniform float u_mosaic;
#endif // ENABLE_mosaic
#ifdef ENABLE_ghost
uniform float u_ghost;
#endif // ENABLE_ghost

#ifdef DRAW_MODE_line
uniform vec4 u_lineColor;
uniform float u_lineThickness;
uniform float u_lineLength;
#endif // DRAW_MODE_line

#ifdef DRAW_MODE_background
uniform vec4 u_backgroundColor;
#endif // DRAW_MODE_background

uniform sampler2D u_skin;

#ifndef DRAW_MODE_background
varying vec2 v_texCoord;
#endif

// Add this to divisors to prevent division by 0, which results in NaNs propagating through calculations.
// Smaller values can cause problems on some mobile devices.
const float epsilon = 1e-3;

#if !defined(DRAW_MODE_silhouette) && (defined(ENABLE_color))
// Branchless color conversions based on code from:
// http://www.chilliant.com/rgb2hsv.html by Ian Taylor
// Based in part on work by Sam Hocevar and Emil Persson
// See also: https://en.wikipedia.org/wiki/HSL_and_HSV#Formal_derivation


// Convert an RGB color to Hue, Saturation, and Value.
// All components of input and output are expected to be in the [0,1] range.
vec3 convertRGB2HSV(vec3 rgb)
{
	// Hue calculation has 3 cases, depending on which RGB component is largest, and one of those cases involves a "mod"
	// operation. In order to avoid that "mod" we split the M==R case in two: one for G<B and one for B>G. The B>G case
	// will be calculated in the negative and fed through abs() in the hue calculation at the end.
	// See also: https://en.wikipedia.org/wiki/HSL_and_HSV#Hue_and_chroma
	const vec4 hueOffsets = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);

	// temp1.xy = sort B & G (largest first)
	// temp1.z = the hue offset we'll use if it turns out that R is the largest component (M==R)
	// temp1.w = the hue offset we'll use if it turns out that R is not the largest component (M==G or M==B)
	vec4 temp1 = rgb.b > rgb.g ? vec4(rgb.bg, hueOffsets.wz) : vec4(rgb.gb, hueOffsets.xy);

	// temp2.x = the largest component of RGB ("M" / "Max")
	// temp2.yw = the smaller components of RGB, ordered for the hue calculation (not necessarily sorted by magnitude!)
	// temp2.z = the hue offset we'll use in the hue calculation
	vec4 temp2 = rgb.r > temp1.x ? vec4(rgb.r, temp1.yzx) : vec4(temp1.xyw, rgb.r);

	// m = the smallest component of RGB ("min")
	float m = min(temp2.y, temp2.w);

	// Chroma = M - m
	float C = temp2.x - m;

	// Value = M
	float V = temp2.x;

	return vec3(
		abs(temp2.z + (temp2.w - temp2.y) / (6.0 * C + epsilon)), // Hue
		C / (temp2.x + epsilon), // Saturation
		V); // Value
}

vec3 convertHue2RGB(float hue)
{
	float r = abs(hue * 6.0 - 3.0) - 1.0;
	float g = 2.0 - abs(hue * 6.0 - 2.0);
	float b = 2.0 - abs(hue * 6.0 - 4.0);
	return clamp(vec3(r, g, b), 0.0, 1.0);
}

vec3 convertHSV2RGB(vec3 hsv)
{
	vec3 rgb = convertHue2RGB(hsv.x);
	float c = hsv.z * hsv.y;
	return rgb * c + hsv.z - c;
}
#endif // !defined(DRAW_MODE_silhouette) && (defined(ENABLE_color))

const vec2 kCenter = vec2(0.5, 0.5);

void main()
{
	#if !(defined(DRAW_MODE_line) || defined(DRAW_MODE_background))
	vec2 texcoord0 = v_texCoord;

	#ifdef ENABLE_mosaic
	texcoord0 = fract(u_mosaic * texcoord0);
	#endif // ENABLE_mosaic

	#ifdef ENABLE_pixelate
	{
		// TODO: clean up "pixel" edges
		vec2 pixelTexelSize = u_skinSize / u_pixelate;
		texcoord0 = (floor(texcoord0 * pixelTexelSize) + kCenter) / pixelTexelSize;
	}
	#endif // ENABLE_pixelate

	#ifdef ENABLE_whirl
	{
		const float kRadius = 0.5;
		vec2 offset = texcoord0 - kCenter;
		float offsetMagnitude = length(offset);
		float whirlFactor = max(1.0 - (offsetMagnitude / kRadius), 0.0);
		float whirlActual = u_whirl * whirlFactor * whirlFactor;
		float sinWhirl = sin(whirlActual);
		float cosWhirl = cos(whirlActual);
		mat2 rotationMatrix = mat2(
			cosWhirl, -sinWhirl,
			sinWhirl, cosWhirl
		);

		texcoord0 = rotationMatrix * offset + kCenter;
	}
	#endif // ENABLE_whirl

	#ifdef ENABLE_fisheye
	{
		vec2 vec = (texcoord0 - kCenter) / kCenter;
		float vecLength = length(vec);
		float r = pow(min(vecLength, 1.0), u_fisheye) * max(1.0, vecLength);
		vec2 unit = vec / vecLength;

		texcoord0 = kCenter + r * unit * kCenter;
	}
	#endif // ENABLE_fisheye

	gl_FragColor = texture2D(u_skin, texcoord0);

	#if defined(ENABLE_color) || defined(ENABLE_brightness)
	// Divide premultiplied alpha values for proper color processing
	// Add epsilon to avoid dividing by 0 for fully transparent pixels
	gl_FragColor.rgb = clamp(gl_FragColor.rgb / (gl_FragColor.a + epsilon), 0.0, 1.0);

	#ifdef ENABLE_color
	{
		vec3 hsv = convertRGB2HSV(gl_FragColor.xyz);

		// this code forces grayscale values to be slightly saturated
		// so that some slight change of hue will be visible
		const float minLightness = 0.11 / 2.0;
		const float minSaturation = 0.09;
		if (hsv.z < minLightness) hsv = vec3(0.0, 1.0, minLightness);
		else if (hsv.y < minSaturation) hsv = vec3(0.0, minSaturation, hsv.z);

		hsv.x = mod(hsv.x + u_color, 1.0);
		if (hsv.x < 0.0) hsv.x += 1.0;

		gl_FragColor.rgb = convertHSV2RGB(hsv);
	}
	#endif // ENABLE_color

	#ifdef ENABLE_brightness
	gl_FragColor.rgb = clamp(gl_FragColor.rgb + vec3(u_brightness), vec3(0), vec3(1));
	#endif // ENABLE_brightness

	// Re-multiply color values
	gl_FragColor.rgb *= gl_FragColor.a + epsilon;

	#endif // defined(ENABLE_color) || defined(ENABLE_brightness)

	#ifdef ENABLE_ghost
	gl_FragColor *= u_ghost;
	#endif // ENABLE_ghost

	#ifdef DRAW_MODE_silhouette
	// Discard fully transparent pixels for stencil test
	if (gl_FragColor.a == 0.0) {
		discard;
	}
	// switch to u_silhouetteColor only AFTER the alpha test
	gl_FragColor = u_silhouetteColor;
	#else // DRAW_MODE_silhouette

	#ifdef DRAW_MODE_colorMask
	vec3 maskDistance = abs(gl_FragColor.rgb - u_colorMask);
	vec3 colorMaskTolerance = vec3(u_colorMaskTolerance, u_colorMaskTolerance, u_colorMaskTolerance);
	if (any(greaterThan(maskDistance, colorMaskTolerance)))
	{
		discard;
	}
	#endif // DRAW_MODE_colorMask
	#endif // DRAW_MODE_silhouette

	#ifdef DRAW_MODE_straightAlpha
	// Un-premultiply alpha.
	gl_FragColor.rgb /= gl_FragColor.a + epsilon;
	#endif

	#endif // !(defined(DRAW_MODE_line) || defined(DRAW_MODE_background))

	#ifdef DRAW_MODE_line
	// Maaaaagic antialiased-line-with-round-caps shader.

	// "along-the-lineness". This increases parallel to the line.
	// It goes from negative before the start point, to 0.5 through the start to the end, then ramps up again
	// past the end point.
	float d = ((v_texCoord.x - clamp(v_texCoord.x, 0.0, u_lineLength)) * 0.5) + 0.5;

	// Distance from (0.5, 0.5) to (d, the perpendicular coordinate). When we're in the middle of the line,
	// d will be 0.5, so the distance will be 0 at points close to the line and will grow at points further from it.
	// For the "caps", d will ramp down/up, giving us rounding.
	// See https://www.youtube.com/watch?v=PMltMdi1Wzg for a rough outline of the technique used to round the lines.
	float line = distance(vec2(0.5), vec2(d, v_texCoord.y)) * 2.0;
	// Expand out the line by its thickness.
	line -= ((u_lineThickness - 1.0) * 0.5);
	// Because "distance to the center of the line" decreases the closer we get to the line, but we want more opacity
	// the closer we are to the line, invert it.
	gl_FragColor = u_lineColor * clamp(1.0 - line, 0.0, 1.0);
	#endif // DRAW_MODE_line

	#ifdef DRAW_MODE_background
	gl_FragColor = u_backgroundColor;
	#endif
}
`;
class y {
  /**
   * @param {WebGLRenderingContext} gl WebGL rendering context to create shaders for
   * @constructor
   */
  constructor(t) {
    this._gl = t, this._shaderCache = {};
    for (const e in y.DRAW_MODE)
      Object.prototype.hasOwnProperty.call(y.DRAW_MODE, e) && (this._shaderCache[e] = []);
  }
  /**
   * Fetch the shader for a particular set of active effects.
   * Build the shader if necessary.
   * @param {ShaderManager.DRAW_MODE} drawMode Draw normally, silhouette, etc.
   * @param {int} effectBits Bitmask representing the enabled effects.
   * @returns {ProgramInfo} The shader's program info.
   */
  getShader(t, e) {
    const i = this._shaderCache[t];
    t === y.DRAW_MODE.silhouette && (e &= ~(y.EFFECT_INFO.color.mask | y.EFFECT_INFO.brightness.mask));
    let s = i[e];
    return s || (s = i[e] = this._buildShader(t, e)), s;
  }
  /**
   * Build the shader for a particular set of active effects.
   * @param {ShaderManager.DRAW_MODE} drawMode Draw normally, silhouette, etc.
   * @param {int} effectBits Bitmask representing the enabled effects.
   * @returns {ProgramInfo} The new shader's program info.
   * @private
   */
  _buildShader(t, e) {
    const i = y.EFFECTS.length, s = [
      `#define DRAW_MODE_${t}`
    ];
    for (let c = 0; c < i; ++c)
      e & 1 << c && s.push(`#define ENABLE_${y.EFFECTS[c]}`);
    const o = `${s.join(`
`)}
`, l = o + Ce, u = o + Ae;
    return x.createProgramInfo(this._gl, [l, u]);
  }
}
y.EFFECT_INFO = {
  /** Color effect */
  color: {
    uniformName: "u_color",
    mask: 1,
    converter: (a) => a / 200 % 1,
    shapeChanges: !1
  },
  /** Fisheye effect */
  fisheye: {
    uniformName: "u_fisheye",
    mask: 2,
    converter: (a) => Math.max(0, (a + 100) / 100),
    shapeChanges: !0
  },
  /** Whirl effect */
  whirl: {
    uniformName: "u_whirl",
    mask: 4,
    converter: (a) => -a * Math.PI / 180,
    shapeChanges: !0
  },
  /** Pixelate effect */
  pixelate: {
    uniformName: "u_pixelate",
    mask: 8,
    converter: (a) => Math.abs(a) / 10,
    shapeChanges: !0
  },
  /** Mosaic effect */
  mosaic: {
    uniformName: "u_mosaic",
    mask: 16,
    converter: (a) => (a = Math.round((Math.abs(a) + 10) / 10), Math.max(1, Math.min(a, 512))),
    shapeChanges: !0
  },
  /** Brightness effect */
  brightness: {
    uniformName: "u_brightness",
    mask: 32,
    converter: (a) => Math.max(-100, Math.min(a, 100)) / 100,
    shapeChanges: !1
  },
  /** Ghost effect */
  ghost: {
    uniformName: "u_ghost",
    mask: 64,
    converter: (a) => 1 - Math.max(0, Math.min(a, 100)) / 100,
    shapeChanges: !1
  }
};
y.EFFECTS = Object.keys(y.EFFECT_INFO);
y.DRAW_MODE = {
  /**
   * Draw normally. Its output will use premultiplied alpha.
   */
  default: "default",
  /**
   * Draw with non-premultiplied alpha. Useful for reading pixels from GL into an ImageData object.
   */
  straightAlpha: "straightAlpha",
  /**
   * Draw a silhouette using a solid color.
   */
  silhouette: "silhouette",
  /**
   * Draw only the parts of the drawable which match a particular color.
   */
  colorMask: "colorMask",
  /**
   * Draw a line with caps.
   */
  line: "line",
  /**
   * Draw the background in a certain color. Must sometimes be used instead of gl.clear.
   */
  background: "background"
};
const _t = {
  color4f: [0, 0, 1, 1],
  diameter: 1
}, $ = [0, 0, 0, 0];
class ke extends F {
  /**
   * Create a Skin which implements a Scratch pen layer.
   * @param {int} id - The unique ID for this Skin.
   * @param {RenderWebGL} renderer - The renderer which will use this Skin.
   * @extends Skin
   * @listens RenderWebGL#event:NativeSizeChanged
   */
  constructor(t, e) {
    super(t), this._renderer = e, this._size = null, this._framebuffer = null, this._silhouetteDirty = !1, this._silhouettePixels = null, this._silhouetteImageData = null, this._lineOnBufferDrawRegionId = {
      enter: () => this._enterDrawLineOnBuffer(),
      exit: () => this._exitDrawLineOnBuffer()
    }, this._usePenBufferDrawRegionId = {
      enter: () => this._enterUsePenBuffer(),
      exit: () => this._exitUsePenBuffer()
    }, this._lineBufferInfo = x.createBufferInfoFromArrays(this._renderer.gl, {
      a_position: {
        numComponents: 2,
        data: [
          1,
          0,
          0,
          0,
          1,
          1,
          1,
          1,
          0,
          0,
          0,
          1
        ]
      }
    });
    const i = 0;
    this._lineShader = this._renderer._shaderManager.getShader(y.DRAW_MODE.line, i), this.onNativeSizeChanged = this.onNativeSizeChanged.bind(this), this._renderer.on(L.Events.NativeSizeChanged, this.onNativeSizeChanged), this._setCanvasSize(e.getNativeSize());
  }
  /**
   * Dispose of this object. Do not use it after calling this method.
   */
  dispose() {
    this._renderer.removeListener(L.Events.NativeSizeChanged, this.onNativeSizeChanged), this._renderer.gl.deleteTexture(this._texture), this._texture = null, super.dispose();
  }
  /**
   * @return {Array<number>} the "native" size, in texels, of this skin. [width, height]
   */
  get size() {
    return this._size;
  }
  useNearest(t) {
    return Math.max(t[0], t[1]) >= 100;
  }
  /**
   * @param {Array<number>} scale The X and Y scaling factors to be used, as percentages of this skin's "native" size.
   * @return {WebGLTexture} The GL texture representation of this skin when drawing at the given size.
   */
  // eslint-disable-next-line no-unused-vars
  getTexture(t) {
    return this._texture;
  }
  /**
   * Clear the pen layer.
   */
  clear() {
    this._renderer.enterDrawRegion(this._usePenBufferDrawRegionId);
    const t = this._renderer.gl;
    t.clearColor(0, 0, 0, 0), t.clear(t.COLOR_BUFFER_BIT), this._silhouetteDirty = !0;
  }
  /**
   * Draw a point on the pen layer.
   * @param {PenAttributes} penAttributes - how the point should be drawn.
   * @param {number} x - the X coordinate of the point to draw.
   * @param {number} y - the Y coordinate of the point to draw.
   */
  drawPoint(t, e, i) {
    this.drawLine(t, e, i, e, i);
  }
  /**
   * Draw a line on the pen layer.
   * @param {PenAttributes} penAttributes - how the line should be drawn.
   * @param {number} x0 - the X coordinate of the beginning of the line.
   * @param {number} y0 - the Y coordinate of the beginning of the line.
   * @param {number} x1 - the X coordinate of the end of the line.
   * @param {number} y1 - the Y coordinate of the end of the line.
   */
  drawLine(t, e, i, s, o) {
    const l = t.diameter || _t.diameter, u = l === 1 || l === 3 ? 0.5 : 0;
    this._drawLineOnBuffer(
      t,
      e + u,
      i + u,
      s + u,
      o + u
    ), this._silhouetteDirty = !0;
  }
  /**
   * Prepare to draw lines in the _lineOnBufferDrawRegionId region.
   */
  _enterDrawLineOnBuffer() {
    const t = this._renderer.gl;
    x.bindFramebufferInfo(t, this._framebuffer), t.viewport(0, 0, this._size[0], this._size[1]);
    const e = this._lineShader;
    t.useProgram(e.program), x.setBuffersAndAttributes(t, e, this._lineBufferInfo);
    const i = {
      u_skin: this._texture,
      u_stageSize: this._size
    };
    x.setUniforms(e, i);
  }
  /**
   * Return to a base state from _lineOnBufferDrawRegionId.
   */
  _exitDrawLineOnBuffer() {
    const t = this._renderer.gl;
    x.bindFramebufferInfo(t, null);
  }
  /**
   * Prepare to do things with this PenSkin's framebuffer
   */
  _enterUsePenBuffer() {
    x.bindFramebufferInfo(this._renderer.gl, this._framebuffer);
  }
  /**
   * Return to a base state
   */
  _exitUsePenBuffer() {
    x.bindFramebufferInfo(this._renderer.gl, null);
  }
  /**
   * Draw a line on the framebuffer.
   * Note that the point coordinates are in the following coordinate space:
   * +y is down, (0, 0) is the center, and the coords range from (-width / 2, -height / 2) to (height / 2, width / 2).
   * @param {PenAttributes} penAttributes - how the line should be drawn.
   * @param {number} x0 - the X coordinate of the beginning of the line.
   * @param {number} y0 - the Y coordinate of the beginning of the line.
   * @param {number} x1 - the X coordinate of the end of the line.
   * @param {number} y1 - the Y coordinate of the end of the line.
   */
  _drawLineOnBuffer(t, e, i, s, o) {
    const l = this._renderer.gl, u = this._lineShader;
    this._renderer.enterDrawRegion(this._lineOnBufferDrawRegionId);
    const c = t.color4f || _t.color4f;
    $[0] = c[0] * c[3], $[1] = c[1] * c[3], $[2] = c[2] * c[3], $[3] = c[3];
    const f = s - e, d = o - i, _ = Math.sqrt(f * f + d * d), w = {
      u_lineColor: $,
      u_lineThickness: t.diameter || _t.diameter,
      u_lineLength: _,
      u_penPoints: [e, -i, f, -d]
    };
    x.setUniforms(u, w), x.drawBufferInfo(l, this._lineBufferInfo, l.TRIANGLES), this._silhouetteDirty = !0;
  }
  /**
   * React to a change in the renderer's native size.
   * @param {object} event - The change event.
   */
  onNativeSizeChanged(t) {
    this._setCanvasSize(t.newSize);
  }
  /**
   * Set the size of the pen canvas.
   * @param {Array<int>} canvasSize - the new width and height for the canvas.
   * @private
   */
  _setCanvasSize(t) {
    const [e, i] = t;
    this._size = t, this._rotationCenter[0] = e / 2, this._rotationCenter[1] = i / 2;
    const s = this._renderer.gl;
    this._texture = x.createTexture(
      s,
      {
        mag: s.NEAREST,
        min: s.NEAREST,
        wrap: s.CLAMP_TO_EDGE,
        width: e,
        height: i
      }
    );
    const o = [
      {
        format: s.RGBA,
        attachment: this._texture
      }
    ];
    this._framebuffer ? x.resizeFramebufferInfo(s, this._framebuffer, o, e, i) : this._framebuffer = x.createFramebufferInfo(s, o, e, i), s.clearColor(0, 0, 0, 0), s.clear(s.COLOR_BUFFER_BIT), this._silhouettePixels = new Uint8Array(Math.floor(e * i * 4)), this._silhouetteImageData = new ImageData(e, i), this._silhouetteDirty = !0;
  }
  /**
   * If there have been pen operations that have dirtied the canvas, update
   * now before someone wants to use our silhouette.
   */
  updateSilhouette() {
    if (this._silhouetteDirty) {
      this._renderer.enterDrawRegion(this._usePenBufferDrawRegionId);
      const t = this._renderer.gl;
      t.readPixels(
        0,
        0,
        this._size[0],
        this._size[1],
        t.RGBA,
        t.UNSIGNED_BYTE,
        this._silhouettePixels
      ), this._silhouetteImageData.data.set(this._silhouettePixels), this._silhouette.update(
        this._silhouetteImageData,
        !0
        /* isPremultiplied */
      ), this._silhouetteDirty = !1;
    }
  }
}
const Ie = 2048, zt = 8;
class dt extends F {
  /**
   * Create a new SVG skin.
   * @param {!int} id - The ID for this Skin.
   * @param {!RenderWebGL} renderer - The renderer which will use this skin.
   * @constructor
   * @extends Skin
   */
  constructor(t, e) {
    super(t), this._renderer = e, this._svgImage = document.createElement("img"), this._svgImageLoaded = !1, this._size = [0, 0], this._canvas = document.createElement("canvas"), this._context = this._canvas.getContext("2d"), this._scaledMIPs = [], this._largestMIPScale = 0, this._maxTextureScale = 1;
  }
  /**
   * Dispose of this object. Do not use it after calling this method.
   */
  dispose() {
    this.resetMIPs(), super.dispose();
  }
  /**
   * @return {Array<number>} the natural size, in Scratch units, of this skin.
   */
  get size() {
    return [this._size[0], this._size[1]];
  }
  useNearest(t, e) {
    return e.enabledEffects & (y.EFFECT_INFO.fisheye.mask | y.EFFECT_INFO.whirl.mask | y.EFFECT_INFO.pixelate.mask | y.EFFECT_INFO.mosaic.mask) || e._direction % 90 !== 0 ? !1 : Math.abs(t[0]) > 99 && Math.abs(t[0]) < 101 && Math.abs(t[1]) > 99 && Math.abs(t[1]) < 101;
  }
  /**
   * Create a MIP for a given scale.
   * @param {number} scale - The relative size of the MIP
   * @return {SVGMIP} An object that handles creating and updating SVG textures.
   */
  createMIP(t) {
    const [e, i] = this._size;
    if (this._canvas.width = e * t, this._canvas.height = i * t, this._canvas.width <= 0 || this._canvas.height <= 0 || // Even if the canvas at the current scale has a nonzero size, the image's dimensions are floored
    // pre-scaling; e.g. if an image has a width of 0.4 and is being rendered at 3x scale, the canvas will have
    // a width of 1, but the image's width will be rounded down to 0 on some browsers (Firefox) prior to being
    // drawn at that scale, resulting in an IndexSizeError if we attempt to draw it.
    this._svgImage.naturalWidth <= 0 || this._svgImage.naturalHeight <= 0) return super.getTexture();
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height), this._context.setTransform(t, 0, 0, t, 0, 0), this._context.drawImage(this._svgImage, 0, 0);
    const s = this._context.getImageData(0, 0, this._canvas.width, this._canvas.height), o = {
      auto: !1,
      wrap: this._renderer.gl.CLAMP_TO_EDGE,
      src: s,
      premultiplyAlpha: !0
    }, l = x.createTexture(this._renderer.gl, o);
    return this._largestMIPScale < t && (this._silhouette.update(s), this._largestMIPScale = t), l;
  }
  updateSilhouette(t = [100, 100]) {
    this.getTexture(t);
  }
  /**
   * @param {Array<number>} scale - The scaling factors to be used, each in the [0,100] range.
   * @return {WebGLTexture} The GL texture representation of this skin when drawing at the given scale.
   */
  getTexture(t) {
    const e = t ? Math.max(Math.abs(t[0]), Math.abs(t[1])) : 100, i = Math.min(e / 100, this._maxTextureScale), s = Math.max(Math.ceil(Math.log2(i)) + zt, 0), o = Math.pow(2, s - zt);
    return this._svgImageLoaded && !this._scaledMIPs[s] && (this._scaledMIPs[s] = this.createMIP(o)), this._scaledMIPs[s] || super.getTexture();
  }
  /**
   * Do a hard reset of the existing MIPs by deleting them.
   */
  resetMIPs() {
    this._scaledMIPs.forEach((t) => this._renderer.gl.deleteTexture(t)), this._scaledMIPs.length = 0, this._largestMIPScale = 0;
  }
  /**
   * Set the contents of this skin to a snapshot of the provided SVG data.
   * @param {string} svgData - new SVG to use.
   * @param {Array<number>} [rotationCenter] - Optional rotation center for the SVG. If not supplied, it will be
   * calculated from the bounding box
   * @fires Skin.event:WasAltered
   */
  setSVG(t, e) {
    const i = Te(t), s = Se(
      i,
      !0
      /* shouldInjectFonts */
    );
    this._svgImageLoaded = !1;
    const { x: o, y: l, width: u, height: c } = i.viewBox.baseVal;
    this._size[0] = u, this._size[1] = c, this._svgImage.onload = () => {
      if (u === 0 || c === 0) {
        super.setEmptyImageData();
        return;
      }
      const f = Math.ceil(Math.max(u, c));
      let d = 2;
      for (d; f * d <= Ie; d *= 2)
        this._maxTextureScale = d;
      this.resetMIPs(), typeof e == "undefined" && (e = this.calculateRotationCenter()), this._rotationCenter[0] = e[0] - o, this._rotationCenter[1] = e[1] - l, this._svgImageLoaded = !0, this.emit(F.Events.WasAltered);
    }, this._svgImage.src = `data:image/svg+xml;utf8,${encodeURIComponent(s)}`;
  }
}
var Me = typeof globalThis != "undefined" ? globalThis : typeof window != "undefined" ? window : typeof global != "undefined" ? global : typeof self != "undefined" ? self : {};
function ut(a) {
  return a && a.__esModule && Object.prototype.hasOwnProperty.call(a, "default") ? a.default : a;
}
function Le(a) {
  if (a.__esModule) return a;
  var t = a.default;
  if (typeof t == "function") {
    var e = function i() {
      return this instanceof i ? Reflect.construct(t, arguments, this.constructor) : t.apply(this, arguments);
    };
    e.prototype = t.prototype;
  } else e = {};
  return Object.defineProperty(e, "__esModule", { value: !0 }), Object.keys(a).forEach(function(i) {
    var s = Object.getOwnPropertyDescriptor(a, i);
    Object.defineProperty(e, i, s.get ? s : {
      enumerable: !0,
      get: function() {
        return a[i];
      }
    });
  }), e;
}
var Mt = 0, le = -3;
function J() {
  this.table = new Uint16Array(16), this.trans = new Uint16Array(288);
}
function Fe(a, t) {
  this.source = a, this.sourceIndex = 0, this.tag = 0, this.bitcount = 0, this.dest = t, this.destLen = 0, this.ltree = new J(), this.dtree = new J();
}
var he = new J(), ce = new J(), Lt = new Uint8Array(30), Ft = new Uint16Array(30), ue = new Uint8Array(30), fe = new Uint16Array(30), Be = new Uint8Array([
  16,
  17,
  18,
  0,
  8,
  7,
  9,
  6,
  10,
  5,
  11,
  4,
  12,
  3,
  13,
  2,
  14,
  1,
  15
]), Ht = new J(), N = new Uint8Array(320);
function _e(a, t, e, i) {
  var s, o;
  for (s = 0; s < e; ++s) a[s] = 0;
  for (s = 0; s < 30 - e; ++s) a[s + e] = s / e | 0;
  for (o = i, s = 0; s < 30; ++s)
    t[s] = o, o += 1 << a[s];
}
function Ne(a, t) {
  var e;
  for (e = 0; e < 7; ++e) a.table[e] = 0;
  for (a.table[7] = 24, a.table[8] = 152, a.table[9] = 112, e = 0; e < 24; ++e) a.trans[e] = 256 + e;
  for (e = 0; e < 144; ++e) a.trans[24 + e] = e;
  for (e = 0; e < 8; ++e) a.trans[168 + e] = 280 + e;
  for (e = 0; e < 112; ++e) a.trans[176 + e] = 144 + e;
  for (e = 0; e < 5; ++e) t.table[e] = 0;
  for (t.table[5] = 32, e = 0; e < 32; ++e) t.trans[e] = e;
}
var Ut = new Uint16Array(16);
function gt(a, t, e, i) {
  var s, o;
  for (s = 0; s < 16; ++s) a.table[s] = 0;
  for (s = 0; s < i; ++s) a.table[t[e + s]]++;
  for (a.table[0] = 0, o = 0, s = 0; s < 16; ++s)
    Ut[s] = o, o += a.table[s];
  for (s = 0; s < i; ++s)
    t[e + s] && (a.trans[Ut[t[e + s]]++] = s);
}
function Oe(a) {
  a.bitcount-- || (a.tag = a.source[a.sourceIndex++], a.bitcount = 7);
  var t = a.tag & 1;
  return a.tag >>>= 1, t;
}
function O(a, t, e) {
  if (!t)
    return e;
  for (; a.bitcount < 24; )
    a.tag |= a.source[a.sourceIndex++] << a.bitcount, a.bitcount += 8;
  var i = a.tag & 65535 >>> 16 - t;
  return a.tag >>>= t, a.bitcount -= t, i + e;
}
function Dt(a, t) {
  for (; a.bitcount < 24; )
    a.tag |= a.source[a.sourceIndex++] << a.bitcount, a.bitcount += 8;
  var e = 0, i = 0, s = 0, o = a.tag;
  do
    i = 2 * i + (o & 1), o >>>= 1, ++s, e += t.table[s], i -= t.table[s];
  while (i >= 0);
  return a.tag = o, a.bitcount -= s, t.trans[e + i];
}
function Pe(a, t, e) {
  var i, s, o, l, u, c;
  for (i = O(a, 5, 257), s = O(a, 5, 1), o = O(a, 4, 4), l = 0; l < 19; ++l) N[l] = 0;
  for (l = 0; l < o; ++l) {
    var f = O(a, 3, 0);
    N[Be[l]] = f;
  }
  for (gt(Ht, N, 0, 19), u = 0; u < i + s; ) {
    var d = Dt(a, Ht);
    switch (d) {
      case 16:
        var _ = N[u - 1];
        for (c = O(a, 2, 3); c; --c)
          N[u++] = _;
        break;
      case 17:
        for (c = O(a, 3, 3); c; --c)
          N[u++] = 0;
        break;
      case 18:
        for (c = O(a, 7, 11); c; --c)
          N[u++] = 0;
        break;
      default:
        N[u++] = d;
        break;
    }
  }
  gt(t, N, 0, i), gt(e, N, i, s);
}
function Wt(a, t, e) {
  for (; ; ) {
    var i = Dt(a, t);
    if (i === 256)
      return Mt;
    if (i < 256)
      a.dest[a.destLen++] = i;
    else {
      var s, o, l, u;
      for (i -= 257, s = O(a, Lt[i], Ft[i]), o = Dt(a, e), l = a.destLen - O(a, ue[o], fe[o]), u = l; u < l + s; ++u)
        a.dest[a.destLen++] = a.dest[u];
    }
  }
}
function Re(a) {
  for (var t, e, i; a.bitcount > 8; )
    a.sourceIndex--, a.bitcount -= 8;
  if (t = a.source[a.sourceIndex + 1], t = 256 * t + a.source[a.sourceIndex], e = a.source[a.sourceIndex + 3], e = 256 * e + a.source[a.sourceIndex + 2], t !== (~e & 65535))
    return le;
  for (a.sourceIndex += 4, i = t; i; --i)
    a.dest[a.destLen++] = a.source[a.sourceIndex++];
  return a.bitcount = 0, Mt;
}
function ze(a, t) {
  var e = new Fe(a, t), i, s, o;
  do {
    switch (i = Oe(e), s = O(e, 2, 0), s) {
      case 0:
        o = Re(e);
        break;
      case 1:
        o = Wt(e, he, ce);
        break;
      case 2:
        Pe(e, e.ltree, e.dtree), o = Wt(e, e.ltree, e.dtree);
        break;
      default:
        o = le;
    }
    if (o !== Mt)
      throw new Error("Data error");
  } while (!i);
  return e.destLen < e.dest.length ? typeof e.dest.slice == "function" ? e.dest.slice(0, e.destLen) : e.dest.subarray(0, e.destLen) : e.dest;
}
Ne(he, ce);
_e(Lt, Ft, 4, 3);
_e(ue, fe, 2, 1);
Lt[28] = 0;
Ft[28] = 258;
var de = ze;
const He = new Uint8Array(new Uint32Array([305419896]).buffer)[0] === 18, Gt = (a, t, e) => {
  let i = a[t];
  a[t] = a[e], a[e] = i;
}, Ue = (a) => {
  const t = a.length;
  for (let e = 0; e < t; e += 4)
    Gt(a, e, e + 3), Gt(a, e + 1, e + 2);
}, We = (a) => {
  He && Ue(a);
};
var Ge = {
  swap32LE: We
};
const Xt = de, { swap32LE: Xe } = Ge, Bt = 11, W = 5, Ve = Bt - W, $e = 65536 >> Bt, je = 1 << Ve, qe = je - 1, st = 2, Ke = 1 << W, pt = Ke - 1, ge = 65536 >> W, Ze = 1024 >> W, Ye = ge + Ze, Je = Ye, Qe = 32, ti = Je + Qe, ei = 1 << st;
class ii {
  constructor(t) {
    const e = typeof t.readUInt32BE == "function" && typeof t.slice == "function";
    if (e || t instanceof Uint8Array) {
      let i;
      if (e)
        this.highStart = t.readUInt32LE(0), this.errorValue = t.readUInt32LE(4), i = t.readUInt32LE(8), t = t.slice(12);
      else {
        const s = new DataView(t.buffer);
        this.highStart = s.getUint32(0, !0), this.errorValue = s.getUint32(4, !0), i = s.getUint32(8, !0), t = t.subarray(12);
      }
      t = Xt(t, new Uint8Array(i)), t = Xt(t, new Uint8Array(i)), Xe(t), this.data = new Uint32Array(t.buffer);
    } else
      ({ data: this.data, highStart: this.highStart, errorValue: this.errorValue } = t);
  }
  get(t) {
    let e;
    return t < 0 || t > 1114111 ? this.errorValue : t < 55296 || t > 56319 && t <= 65535 ? (e = (this.data[t >> W] << st) + (t & pt), this.data[e]) : t <= 65535 ? (e = (this.data[ge + (t - 55296 >> W)] << st) + (t & pt), this.data[e]) : t < this.highStart ? (e = this.data[ti - $e + (t >> Bt)], e = this.data[e + (t >> W & qe)], e = (e << st) + (t & pt), this.data[e]) : this.data[this.data.length - ei];
  }
}
var ni = ii;
const si = /* @__PURE__ */ ut(ni);
var pe = {};
(function(a) {
  var t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  (function(e) {
    var i = typeof Uint8Array != "undefined" ? Uint8Array : Array, s = 43, o = 47, l = 48, u = 97, c = 65, f = 45, d = 95;
    function _(g) {
      var m = g.charCodeAt(0);
      if (m === s || m === f)
        return 62;
      if (m === o || m === d)
        return 63;
      if (m < l)
        return -1;
      if (m < l + 10)
        return m - l + 26 + 26;
      if (m < c + 26)
        return m - c;
      if (m < u + 26)
        return m - u + 26;
    }
    function w(g) {
      var m, k, T, b, p, v;
      if (g.length % 4 > 0)
        throw new Error("Invalid string. Length must be a multiple of 4");
      var S = g.length;
      p = g.charAt(S - 2) === "=" ? 2 : g.charAt(S - 1) === "=" ? 1 : 0, v = new i(g.length * 3 / 4 - p), T = p > 0 ? g.length - 4 : g.length;
      var A = 0;
      function I(z) {
        v[A++] = z;
      }
      for (m = 0, k = 0; m < T; m += 4, k += 3)
        b = _(g.charAt(m)) << 18 | _(g.charAt(m + 1)) << 12 | _(g.charAt(m + 2)) << 6 | _(g.charAt(m + 3)), I((b & 16711680) >> 16), I((b & 65280) >> 8), I(b & 255);
      return p === 2 ? (b = _(g.charAt(m)) << 2 | _(g.charAt(m + 1)) >> 4, I(b & 255)) : p === 1 && (b = _(g.charAt(m)) << 10 | _(g.charAt(m + 1)) << 4 | _(g.charAt(m + 2)) >> 2, I(b >> 8 & 255), I(b & 255)), v;
    }
    function E(g) {
      var m, k = g.length % 3, T = "", b, p;
      function v(A) {
        return t.charAt(A);
      }
      function S(A) {
        return v(A >> 18 & 63) + v(A >> 12 & 63) + v(A >> 6 & 63) + v(A & 63);
      }
      for (m = 0, p = g.length - k; m < p; m += 3)
        b = (g[m] << 16) + (g[m + 1] << 8) + g[m + 2], T += S(b);
      switch (k) {
        case 1:
          b = g[g.length - 1], T += v(b >> 2), T += v(b << 4 & 63), T += "==";
          break;
        case 2:
          b = (g[g.length - 2] << 8) + g[g.length - 1], T += v(b >> 10), T += v(b >> 4 & 63), T += v(b << 2 & 63), T += "=";
          break;
      }
      return T;
    }
    e.toByteArray = w, e.fromByteArray = E;
  })(a);
})(pe);
const ri = /* @__PURE__ */ ut(pe);
var me = {};
const oi = 5, Vt = 12, ai = 13, li = 16, hi = 17, ci = 22, $t = 28, jt = 31, ui = 33, rt = 34, fi = 35, mt = 36, Ct = 37, be = 38, _i = 39, di = 40, q = 41, gi = 42, n = 0, r = 1, D = 2, ve = 3, h = 4, pi = [
  //OP   , CL    , CP    , QU    , GL    , NS    , EX    , SY    , IS    , PR    , PO    , NU    , AL    , HL    , ID    , IN    , HY    , BA    , BB    , B2    , ZW    , CM    , WJ    , H2    , H3    , JL    , JV    , JT    , RI    , EB    , EM    , ZWJ   , CB
  [
    h,
    h,
    h,
    h,
    h,
    h,
    h,
    h,
    h,
    h,
    h,
    h,
    h,
    h,
    h,
    h,
    h,
    h,
    h,
    h,
    h,
    ve,
    h,
    h,
    h,
    h,
    h,
    h,
    h,
    h,
    h,
    h,
    h
  ],
  [
    n,
    h,
    h,
    r,
    r,
    h,
    h,
    h,
    h,
    r,
    r,
    n,
    n,
    n,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    n
  ],
  [
    n,
    h,
    h,
    r,
    r,
    h,
    h,
    h,
    h,
    r,
    r,
    r,
    r,
    r,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    n
  ],
  [
    h,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    h,
    D,
    h,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r
  ],
  [
    r,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    h,
    D,
    h,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r
  ],
  [
    n,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    n
  ],
  [
    n,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    n
  ],
  [
    n,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    n,
    n,
    r,
    n,
    r,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    n
  ],
  [
    n,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    n,
    n,
    r,
    r,
    r,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    n
  ],
  [
    r,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    n,
    n,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    r,
    r,
    r,
    r,
    r,
    n,
    r,
    r,
    r,
    n
  ],
  [
    r,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    n,
    n,
    r,
    r,
    r,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    n
  ],
  [
    r,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    r,
    r,
    r,
    r,
    r,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    n
  ],
  [
    r,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    r,
    r,
    r,
    r,
    r,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    n
  ],
  [
    r,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    r,
    r,
    r,
    r,
    r,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    n
  ],
  [
    n,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    n,
    r,
    n,
    n,
    n,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    n
  ],
  [
    n,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    n
  ],
  [
    n,
    h,
    h,
    r,
    n,
    r,
    h,
    h,
    h,
    n,
    n,
    r,
    n,
    n,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    n
  ],
  [
    n,
    h,
    h,
    r,
    n,
    r,
    h,
    h,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    n
  ],
  [
    r,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    h,
    D,
    h,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    n
  ],
  [
    n,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    r,
    r,
    n,
    h,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    n
  ],
  [
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n
  ],
  [
    r,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    r,
    r,
    r,
    r,
    r,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    n
  ],
  [
    r,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    h,
    D,
    h,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r,
    r
  ],
  [
    n,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    n,
    r,
    n,
    n,
    n,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    r,
    r,
    n,
    n,
    n,
    r,
    n
  ],
  [
    n,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    n,
    r,
    n,
    n,
    n,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    r,
    n,
    n,
    n,
    r,
    n
  ],
  [
    n,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    n,
    r,
    n,
    n,
    n,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    r,
    r,
    r,
    r,
    n,
    n,
    n,
    n,
    r,
    n
  ],
  [
    n,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    n,
    r,
    n,
    n,
    n,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    r,
    r,
    n,
    n,
    n,
    r,
    n
  ],
  [
    n,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    n,
    r,
    n,
    n,
    n,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    r,
    n,
    n,
    n,
    r,
    n
  ],
  [
    n,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    n,
    r,
    n,
    n,
    r,
    n
  ],
  [
    n,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    n,
    r,
    n,
    n,
    n,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    r,
    n
  ],
  [
    n,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    n,
    r,
    n,
    n,
    n,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    n
  ],
  [
    r,
    h,
    h,
    r,
    r,
    r,
    h,
    h,
    h,
    r,
    r,
    r,
    r,
    r,
    n,
    r,
    r,
    r,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    n
  ],
  [
    n,
    h,
    h,
    r,
    r,
    n,
    h,
    h,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    h,
    D,
    h,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    n,
    r,
    n
  ]
  // CB
], mi = ri.toByteArray("AAgOAAAAAAAQ4QAAAQ0P8vDtnQuMXUUZx+eyu7d7797d9m5bHoWltKVUlsjLWE0VJNigQoMVqkStEoNQQUl5GIo1KKmogEgqkKbBRki72lYabZMGKoGAjQRtJJDaCCIRiiigREBQS3z+xzOTnZ3O+3HOhd5NfpkzZx7fN9988zivu2M9hGwB28F94DnwEngd/Asc1EtIs9c/bIPDwCxwLDgezHcodyo4w5C+CCwBS8FnwSXgCnA1uFbI93XwbXAbWAfWgx+CzWAb+An4KfgFeAzsYWWfYuFz4CXwGvgb+Dfo6yNkEEwGh4CZYB44FpwI3g1OY+kfBItZOo2fB84Hy8DF4HJwNbiWpV8PVoO1LH4n2NRXyN+KcAd4kNVP9XsY4aPgcfAbsBfs6SniL4K/sPjfEf6HlanXCRkCw2BGvUh/keWfXS/CY+pFXs7x9XHmM94LTmWIeU2cgbxnS/k/B3kf86jDhU8L9V2E40vAFWAlWFUfb++NOL4F3C7JX4/4GiE+hvgWsF0oS7mXldspnN+F493gyXrh9xTav0cg3EvzgVfBG6wsmVSEkxBOBgdPGpd7JI6PnqRvJ68/xlbHof53gPeA94OzwLngk+ACsAwsByvASrAK3MB0Ws3CtQjvBJvAVrADPMDSHkb4CNijaccTwvnf4fiPEs8Lxy+D18A/QU8/xjgYBjPAbDAKTgYLwOngTHAO+EQ/8wuEF4EvsPiVCFf2+9tsFStzA8LVHuXXBsi6QyqzUYiPMR/7Mc7dAx7oL8bzw/3u/Bw8Bp4Az4AXwCtgHzsmDXP5fiF9iiVvly5d0sHngar16NKlS5cuXbp06fLmYlqHXrcd3ph4P0THUY3iXh49novju4S0tzfs5d+JPKewfAsRntZb3K9ZhOMlrO6lCC8An28U9+OuovcPcPxlVu5rCL/VmHh/iHIrzn3fIPu7SN8Axmg+8AOwEWwCm7tp3bRuWjetm5Y8bSu4B9zbKO6ZVsnORrVU3f4uXTqZ2H3sLoyx3eDXjfDndE9qyj6L838CfwVvgFpzYnof4oNgOhgBc8Fos9DrZIQLmtXPP1MmF6wGj4H+KXoWguvADkXaPil+YpuQy8Am8Ey7ODdtmJDF4HowBp4De6HDTNjhfHAHeBr0DBBy0kDxfPbcgSIusgrcWhtnJ8vL+TPix7UIOQtcBq4C28Cr4KRBnANbwSuDE+s50JgyNNFuXbp06XIgsXjIvPafjvXozKY+fVFz/z0LT1uCtKVSWbrOLWPnztG8e0Xfy7ol8XtZJi7WtG+5od2UFXQ/A12vUeS7jp27yVKHjdsU9lXB869TyNvAzt0lpP2oWbwLdjiO78bx/Sz+EMJHwK9Y/LcIfw+eZ3F67/Hl5vh9xX80J+rwX8SvRDhpgL17iPAQMHNArfPrqHPewLheI+AERV6efwV418B4nOZ/H+IfYHV8GOF5LJ3eAz0fx8sM9S0fUNud39O9CulfGZhY5huI3wzWgNvBelbHZoTbNPVpfYjKQpkHwUNgl0LWblbnk0LbbDxr0OMFpL3iqWdu9nWYPlVAWkXY39LnGdCkDbeqv1YNbfcMQ3t9oe8lzm6NH9N1ZB6Ln4BwfkJZJk7RyFnYKt6b/JDQXx9p5X+eFdqOjzM9P9MB/lUlFzr20aXIdzlY4dmn9F3YqtvoO76/2hp/D/xA5Zue88nNyL8GbFbs075X0tyUig3Qd2MCnf//HjnzpbsR3g9+1kHzzVjdnE71/qVBX9rGPUh/ysNWe1neFzvIDi5zAufV1sT0N0poR22wkFUfTOPfA4N2mbZ5fSrqOHSw+IbkSBbOGSzSRgf91/GTUWYBOB2cIZQ/G8cfBZ8CFwrnL8XxF8FKcA24jqXdiPA7Qr61OF7H4mMItwzuv2/YLth1ISt3Hzu3k4W7EH5JqPdRHD/O4k+z8A8IX5Lq3y7Z4nXE9xn6kX6vQ4bKfy+ok+hH+xf3hq9dnTTHhjKd2GmDuWA242iHMq4cC7A8kJ7i8o1+skSa7Jieo38HCWnoNjKFhdSFBxzpZ7QE6lI8N4S14aASZcryaV/WWHw66f6NHuCoxuQxmvM56GX9QMd8Q4D65ywGP+ZzRJuM+zQvx/MOS2VFeqQ4IXnH26zM9Xe6/E6D+4foAzzuajPZp8Qyw5ayZVDWuH0z0BtYRkeIDqH9KO9VbH1btd/lhNqCzvl8zeLnG0S/hnU6baHfpiuO6yy0rd+DHURo/zYF5H26j03rQsip2ndzz82u1z9N4VjWKWeb68Tedpt95HRVXp7H1R6p+/Wt4FPy/PpWwscOLRJ+PVWF/+W0iVyGzs18TIvXkOJ1Wxm66vSXz+vylenrZcj1ub439W+K8RNCGTJi2p/TJ1K23VaXr35tRpnzmjxequgfcfyk6B/TGBVlyedsNgpdd/h+W1U3P99QyFPNo1X3TwpM/WLTIWYfoBqXrv6iskHZ/RFr79R6hIyHBrH3f1nrUVnjP8SnZZ+rYtzr9Exld5MNbPNErusAPg+77u/eDOPftU9yj39TH7rezxd1LvsZQJlzkWlOirG/79zjMj/mtHUKu7vKy+3/LnXr9okyKedjX5/0He9iP/j63LwOQdarEVlfy8OO/Lqw023j6xcqmwxLiOd6heM2i9cV9LJy8jMJ23yQ+rpbfu7EQ/pXE8KYvUSqvVnb4XzZa6LrHMXHR+zcLvqWbm/Bn0/HzIs6fWPHoat8XfnDKmZGxRxeMbn2UqZ5Q94nmcZRbqqUXbZ8+lcjE+cPX11t814orvvAXNcG8vqj2vvk1MGn3anlj0bIT72v47bvE+Lc98T9b6r7AKn6j+8Duf7D0nnZx/j7Zjn0j9nbpSTndaLr9WNLivP+iN23xF7L+fqv6ZouFyb78jxVXvv5jJ9YUs9/sddO8h7KNg5jrhfaJGztT6G7KF+1d6yCmD5Kdb2fan60rSc552fZr3zeQ9DpnPp+Si5cx5Ktv2QfSzF/mMbWdOm46rFI4XstnU9xeqX4NKb7TKEdcr6pZOK3ID1k/LvFHkVczEuZLEDr499YqvqBym1aEHWgcvoYOtv0M91qQl5TfpO/in6rWx8OVpT1Wedkv3f5xom3T/xeR/6Gx6V86PWAOB4bBpqWdN+yTcVxjIyGRz/FrDGu6w/3d7kPm8StX8RyPu+uuvpNju/vTLJV37GpvoM0oZPnW87VLnL/5pDno1NoW1R6yedU6TyUv3u19a3KFnIbTLYz+ZCLP4T0tU1uivFgso0pnsJ/UtXvarNY28Xq5cvkBDrQP/E5ZaiuQwwfmTlsOiQRU1fMuqrDd/3ISSuwjOwXOfTyGUMpZIXq4GpLn3pUcdfzch2x7XO1u2uZHOPb1G6b3Xg9PH1IIWeEpJlPQtqos2EKW8b0u8rnuP1UeVLoXJb9be0uG9nnbchjU+XTszT5VeNBThPHnc5OKj1U9aj0GTHIVaGy1YhEWT4ixns00DT+XEzWn/7VAsIc63Cov3OdyhwjrnaqQqZvWKXdypRdlq+k8msZ031U+Rm4fA+3TtyeR9hwfW9G9yxDN0fZMN33F+9TE6md4hwoxumfaUzI9fN3PFT3xVV2msrQ3UsnChm6Nulk8TndpS28D3zX9tTIPsF/z7Am5OkTjm1tI1JZW74+4VgsZ0N3L1yXV3WeP5uR7TGHHdvC3JQlxybfpd22tDlk/2eofRK8TzrN/qnar/K/OUTth6I/+jAnEptNbPvFHP2gs40N3+dfMWtwqvVct7/wfd8gtQ7imifial9ZJ9/3IHLYU6eDj3+4PhsNhX+vwvcWLnu6kGfEMe8DuciPfUfGZB8X/7HJy/Gefe5n+VRGFd/wyP2ta7/LO4yh/sbLV/k9lev6kfO9Dt/5U67b1/6u/epqB1U9Me23jfHY9sscAg4tkbLl+e4/U36rJ9ddxfd6sg5vq5ice42Wpk/pb9FOJ36/W9tpv4kbC79nUbZceX8Zu6/qJ+P3WvhvA8v3reh7Jbn2d6rrNC7XNZTLma4Ba0JI9efX2uLzF5scG/w9UNU1ZxW+ymUfzELeTllXlQ1rUuhzjS5fp9c964iFBOqeSz63bU065nZKdU+mDEz3qHIjjifquw0pnb/raRtvrnsYcb46ihT3taoYz6brdNW9l6rWRnE/navdPn1XlR1km7hcz1WlH/elKuSOSvLLuE8U6m8uzwRdfcGl73VyTHuyMvzJ1Sa2cWDTP/Z63Kc94n2B1PYr24dz1JlyHLlcP+S4B6vD1c9EW4q2LWstCvUjeVy63k/LMYdUNd5D1xQfvVTzX1VjkMsUv88N8VH5fReVn/Fjn++/h6X6Q8a6b1/q3g/i/ewi0/Scs8zxXeV6mWIOUPlPzBgdFerW+bZrm2P18dnjuK6HunEp+rHvPMXbr+sHVb/lnL+pTP57jPw9Cvk3PW178JD9qChfzuvTf7Htl38L1QUf/VKu9SFjwWbTWPvFEvu7Uq76y7+31g6QlYPc669pbsm9Xur2LWI9Pu8ypfDXqm3A2z8s1FWGn4ntL9NfQu2oSlftX9uetvTtv7J8Ql4zxfXGZ3zk8PeQ9w59x2uMfqI8/q5eKh/l9cb2rwsu9rSNl06ZP2Pmxtz+rNMx93yno0n2/82rVH7rQ+y9P15H6FyRun9ViH81ATmffI7nJ5r8uXXW6enbP6b/B8/l5OifVHYLnb9S39s2zcc+Ph+rh8+eQgVPS72elzGWY/tUtbbabBpDiI7yN1q6/4th2y+ErAc5+9BVvu/7KamJbWNZeuqI/R4tRf+YyD1HmOZM1bMV3/14Sn10c0Xu+Sj1nOXb5jL73ncdy02uvlXZNde65dOHYl7Vs4KYuS6FzWLn2zJlpZqPXPVPOa5yzKOyn1VhT9lmMfdbfH7D11Wf2PXN5h9y+dD287+qxgSnaYmnIrRtIb8pJe6/Uv9OVer6Whn0zfGO/BEloZI9ojmfAlUflClDd178bTmVHVTpZXOkAlk/lb42UujmI89HH5V+cl7XtowY6vTxLVWok6UrGzoGTHN+bB+6ri05687VNpvfuvRfaP2uMlNQth1D5JjGelm/8yn+9p3p/7qk9gnfeddXZmq/Sm333PJT659Kv1zjNbZ9uv2Oi//67CV8/N1nj1DmviyXDNVeJkaeaX8UsyesYg8cu2+NvdaPfb+lLDu5tvt/"), bi = new si(mi), qt = function(a) {
  switch (a) {
    case ui:
      return Vt;
    case _i:
    case di:
    case gi:
      return Vt;
    case fi:
      return oi;
    default:
      return a;
  }
}, Kt = function(a) {
  switch (a) {
    case Ct:
    case be:
      return rt;
    case q:
      return ci;
    default:
      return a;
  }
};
class bt {
  constructor(t, e = !1) {
    this.position = t, this.required = e;
  }
}
class vi {
  nextCodePoint() {
    const t = this.string.charCodeAt(this.pos++), e = this.string.charCodeAt(this.pos);
    return 55296 <= t && t <= 56319 && 56320 <= e && e <= 57343 ? (this.pos++, (t - 55296) * 1024 + (e - 56320) + 65536) : t;
  }
  nextCharClass() {
    return qt(bi.get(this.nextCodePoint()));
  }
  getSimpleBreak() {
    switch (this.nextClass) {
      case q:
        return !1;
      case rt:
      case Ct:
      case be:
        return this.curClass = rt, !1;
      case mt:
        return this.curClass = mt, !1;
    }
    return null;
  }
  getPairTableBreak(t) {
    let e = !1;
    switch (pi[this.curClass][this.nextClass]) {
      case n:
        e = !0;
        break;
      case r:
        e = t === q;
        break;
      case D:
        if (e = t === q, !e)
          return e = !1, e;
        break;
      case ve:
        if (t !== q) return e;
        break;
    }
    return this.LB8a && (e = !1), this.LB21a && (this.curClass === li || this.curClass === hi) ? (e = !1, this.LB21a = !1) : this.LB21a = this.curClass === ai, this.curClass === $t ? (this.LB30a++, this.LB30a == 2 && this.nextClass === $t && (e = !0, this.LB30a = 0)) : this.LB30a = 0, this.curClass = this.nextClass, e;
  }
  nextBreak() {
    if (this.curClass == null) {
      let t = this.nextCharClass();
      this.curClass = Kt(t), this.nextClass = t, this.LB8a = t === jt, this.LB30a = 0;
    }
    for (; this.pos < this.string.length; ) {
      this.lastPos = this.pos;
      const t = this.nextClass;
      if (this.nextClass = this.nextCharClass(), this.curClass === rt || this.curClass === mt && this.nextClass !== Ct)
        return this.curClass = Kt(qt(this.nextClass)), new bt(this.lastPos, !0);
      let e = this.getSimpleBreak();
      if (e === null && (e = this.getPairTableBreak(t)), this.LB8a = this.nextClass === jt, e) return new bt(this.lastPos);
    }
    return this.lastPos < this.string.length ? (this.lastPos = this.string.length, new bt(this.string.length)) : null;
  }
  constructor(t) {
    this.string = t, this.pos = 0, this.lastPos = 0, this.curClass = null, this.nextClass = null, this.LB8a = !1, this.LB21a = !1, this.LB30a = 0;
  }
}
me = vi;
var we = {};
const wi = 0, xi = 1, Ei = 2, yi = 3, Ti = 4, Si = 5, Di = 6, Ci = 7, Ai = 8, ki = 9, Ii = 10, Mi = 11, Li = {
  Other: wi,
  CR: xi,
  LF: Ei,
  Control: yi,
  Extend: Ti,
  Regional_Indicator: Si,
  SpacingMark: Di,
  L: Ci,
  V: Ai,
  T: ki,
  LV: Ii,
  LVT: Mi
};
var vt, Zt;
function Fi() {
  if (Zt) return vt;
  Zt = 1;
  var a, t;
  return t = de, a = function() {
    var e, i, s, o, l, u, c, f, d, _, w, E, g, m, k, T;
    E = 11, m = 5, g = E - m, w = 65536 >> E, l = 1 << g, c = l - 1, f = 2, e = 1 << m, s = e - 1, _ = 65536 >> m, d = 1024 >> m, u = _ + d, T = u, k = 32, o = T + k, i = 1 << f;
    function b(p) {
      var v, S, A;
      v = typeof p.readUInt32BE == "function" && typeof p.slice == "function", v || p instanceof Uint8Array ? (v ? (this.highStart = p.readUInt32BE(0), this.errorValue = p.readUInt32BE(4), S = p.readUInt32BE(8), p = p.slice(12)) : (A = new DataView(p.buffer), this.highStart = A.getUint32(0), this.errorValue = A.getUint32(4), S = A.getUint32(8), p = p.subarray(12)), p = t(p, new Uint8Array(S)), p = t(p, new Uint8Array(S)), this.data = new Uint32Array(p.buffer)) : (this.data = p.data, this.highStart = p.highStart, this.errorValue = p.errorValue);
    }
    return b.prototype.get = function(p) {
      var v;
      return p < 0 || p > 1114111 ? this.errorValue : p < 55296 || p > 56319 && p <= 65535 ? (v = (this.data[p >> m] << f) + (p & s), this.data[v]) : p <= 65535 ? (v = (this.data[_ + (p - 55296 >> m)] << f) + (p & s), this.data[v]) : p < this.highStart ? (v = this.data[o - w + (p >> E)], v = this.data[v + (p >> m & c)], v = (v << f) + (p & s), this.data[v]) : this.data[this.data.length - i];
    }, b;
  }(), vt = a, vt;
}
const Bi = {}, Ni = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({ __proto__: null, default: Bi }, Symbol.toStringTag, { value: "Module" })), Oi = /* @__PURE__ */ Le(Ni);
(function(a) {
  (function() {
    var t, e, i, s, o, l, u, c, f, d, _, w, E, g, m, k, T;
    T = Li, t = T.CR, o = T.LF, e = T.Control, i = T.Extend, c = T.Regional_Indicator, f = T.SpacingMark, s = T.L, w = T.V, d = T.T, l = T.LV, u = T.LVT, _ = Fi(), m = Oi, E = new _(m.readFileSync(__dirname + "/classes.trie")), g = function(b, p) {
      var v, S, A;
      return p = p || 0, v = b.charCodeAt(p), 55296 <= v && v <= 56319 ? (S = v, A = b.charCodeAt(p + 1), 56320 <= A && A <= 57343 ? (S - 55296) * 1024 + (A - 56320) + 65536 : S) : 56320 <= v && v <= 57343 ? (S = b.charCodeAt(p - 1), A = v, 55296 <= S && S <= 56319 ? (S - 55296) * 1024 + (A - 56320) + 65536 : A) : v;
    }, k = function(b, p) {
      return b === t && p === o ? !1 : b === e || b === t || b === o || p === e || p === t || p === o ? !0 : b === s && (p === s || p === w || p === l || p === u) || (b === l || b === w) && (p === w || p === d) || (b === u || b === d) && p === d || b === c && p === c || p === i ? !1 : p !== f;
    }, a.nextBreak = function(b, p) {
      var v, S, A, I, z, X, Pt;
      if (p == null && (p = 0), p < 0)
        return 0;
      if (p >= b.length - 1)
        return b.length;
      for (A = E.get(g(b, p)), v = I = p + 1, z = b.length; I < z; v = I += 1)
        if (!(55296 <= (X = b.charCodeAt(v - 1)) && X <= 56319 && 56320 <= (Pt = b.charCodeAt(v)) && Pt <= 57343)) {
          if (S = E.get(g(b, v)), k(A, S))
            return v;
          A = S;
        }
      return b.length;
    }, a.previousBreak = function(b, p) {
      var v, S, A, I, z, X;
      if (p == null && (p = b.length), p > b.length)
        return b.length;
      if (p <= 1)
        return 0;
      for (p--, S = E.get(g(b, p)), v = I = p - 1; I >= 0; v = I += -1)
        if (!(55296 <= (z = b.charCodeAt(v)) && z <= 56319 && 56320 <= (X = b.charCodeAt(v + 1)) && X <= 57343)) {
          if (A = E.get(g(b, v)), k(A, S))
            return v + 1;
          S = A;
        }
      return 0;
    }, a.break = function(b) {
      var p, v, S;
      for (S = [], v = 0; (p = a.nextBreak(b, v)) < b.length; )
        S.push(b.slice(v, p)), v = p;
      return v < b.length && S.push(b.slice(v)), S;
    }, a.countBreaks = function(b) {
      var p, v, S;
      for (v = 0, S = 0; (p = a.nextBreak(b, S)) < b.length; )
        S = p, v++;
      return S < b.length && v++, v;
    };
  }).call(Me);
})(we);
const Pi = /* @__PURE__ */ ut(we);
class Ri {
  /**
   * Construct a text wrapper which will measure text using the specified measurement provider.
   * @param {MeasurementProvider} measurementProvider - a helper object to provide text measurement services.
   */
  constructor(t) {
    this._measurementProvider = t, this._cache = {};
  }
  /**
   * Wrap the provided text into lines restricted to a maximum width. See Unicode Standard Annex (UAX) #14.
   * @param {number} maxWidth - the maximum allowed width of a line.
   * @param {string} text - the text to be wrapped. Will be split on whitespace.
   * @returns {Array.<string>} an array containing the wrapped lines of text.
   */
  wrapText(t, e) {
    e = e.normalize();
    const i = `${t}-${e}`;
    if (this._cache[i])
      return this._cache[i];
    const s = this._measurementProvider.beginMeasurementSession(), o = new me(e);
    let l = 0, u, c = null;
    const f = [];
    try {
      for (; u = o.nextBreak(); ) {
        const d = e.slice(l, u.position).replace(/\n+$/, "");
        let _ = (c || "").concat(d), w = this._measurementProvider.measureText(_);
        if (w > t)
          if (this._measurementProvider.measureText(d) > t) {
            let g = 0, m;
            for (; g !== (m = Pi.nextBreak(d, g)); ) {
              const k = d.substring(g, m);
              _ = (c || "").concat(k), w = this._measurementProvider.measureText(_), c === null || w <= t ? c = _ : (f.push(c), c = k), g = m;
            }
          } else
            c !== null && f.push(c), c = d;
        else
          c = _;
        u.required && (c !== null && f.push(c), c = null), l = u.position;
      }
    } catch (d) {
      return console.warn("LineBreaker failed, using simple word wrapping:", d), this._fallbackWrapText(t, e, s);
    }
    return c = c || "", (c.length > 0 || f.length === 0) && f.push(c), this._cache[i] = f, this._measurementProvider.endMeasurementSession(s), f;
  }
  /**
   * Fallback text wrapping method for when LineBreaker fails
   * @param {number} maxWidth - the maximum allowed width of a line.
   * @param {string} text - the text to be wrapped.
   * @param {*} measurementSession - the current measurement session.
   * @returns {Array.<string>} wrapped lines of text.
   */
  _fallbackWrapText(t, e, i) {
    const s = e.split(/\s+/), o = [];
    let l = "";
    for (const u of s) {
      const c = l ? `${l} ${u}` : u;
      this._measurementProvider.measureText(c) <= t || l === "" ? l = c : (o.push(l), l = u);
    }
    return l && o.push(l), this._measurementProvider.endMeasurementSession(i), o.length > 0 ? o : [""];
  }
}
class zi {
  /**
   * @param {CanvasRenderingContext2D} ctx - provides a canvas rendering context
   * with 'font' set to the text style of the text to be wrapped.
   */
  constructor(t) {
    this._ctx = t, this._cache = {};
  }
  // We don't need to set up or tear down anything here. Should these be removed altogether?
  /**
   * Called by the TextWrapper before a batch of zero or more calls to measureText().
   */
  beginMeasurementSession() {
  }
  /**
   * Called by the TextWrapper after a batch of zero or more calls to measureText().
   */
  endMeasurementSession() {
  }
  /**
   * Measure a whole string as one unit.
   * @param {string} text - the text to measure.
   * @returns {number} - the length of the string.
   */
  measureText(t) {
    return this._cache[t] || (this._cache[t] = this._ctx.measureText(t).width), this._cache[t];
  }
}
const C = {
  MAX_LINE_WIDTH: 170,
  // Maximum width, in Scratch pixels, of a single line of text
  MIN_WIDTH: 50,
  // Minimum width, in Scratch pixels, of a text bubble
  STROKE_WIDTH: 4,
  // Thickness of the stroke around the bubble. Only half's visible because it's drawn under the fill
  PADDING: 10,
  // Padding around the text area
  CORNER_RADIUS: 16,
  // Radius of the rounded corners
  TAIL_HEIGHT: 12,
  // Height of the speech bubble's "tail". Probably should be a constant.
  FONT: "Helvetica",
  // Font to render the text with
  FONT_SIZE: 14,
  // Font size, in Scratch pixels
  FONT_HEIGHT_RATIO: 0.9,
  // Height, in Scratch pixels, of the text, as a proportion of the font's size
  LINE_HEIGHT: 16,
  // Spacing between each line of text
  COLORS: {
    BUBBLE_FILL: "white",
    BUBBLE_STROKE: "rgba(0, 0, 0, 0.15)",
    TEXT_FILL: "#575E75"
  }
};
class et extends F {
  /**
   * Create a new text bubble skin.
   * @param {!int} id - The ID for this Skin.
   * @param {!RenderWebGL} renderer - The renderer which will use this skin.
   * @constructor
   * @extends Skin
   */
  constructor(t, e) {
    super(t), this._renderer = e, this._canvas = document.createElement("canvas"), this._size = [0, 0], this._renderedScale = 0, this._lines = [], this._textAreaSize = { width: 0, height: 0 }, this._bubbleType = "", this._pointsLeft = !1, this._textDirty = !0, this._textureDirty = !0, this.measurementProvider = new zi(this._canvas.getContext("2d")), this.textWrapper = new Ri(this.measurementProvider), this._restyleCanvas();
  }
  /**
   * Dispose of this object. Do not use it after calling this method.
   */
  dispose() {
    this._texture && (this._renderer.gl.deleteTexture(this._texture), this._texture = null), this._canvas = null, super.dispose();
  }
  /**
   * @return {Array<number>} the dimensions, in Scratch units, of this skin.
   */
  get size() {
    return this._textDirty && this._reflowLines(), this._size;
  }
  /**
   * Set parameters for this text bubble.
   * @param {!string} type - either "say" or "think".
   * @param {!string} text - the text for the bubble.
   * @param {!boolean} pointsLeft - which side the bubble is pointing.
   */
  setTextBubble(t, e, i) {
    this._text = e, this._bubbleType = t, this._pointsLeft = i, this._textDirty = !0, this._textureDirty = !0, this.emit(F.Events.WasAltered);
  }
  /**
   * Re-style the canvas after resizing it. This is necessary to ensure proper text measurement.
   */
  _restyleCanvas() {
    this._canvas.getContext("2d").font = `${C.FONT_SIZE}px ${C.FONT}, sans-serif`;
  }
  /**
   * Update the array of wrapped lines and the text dimensions.
   */
  _reflowLines() {
    this._lines = this.textWrapper.wrapText(C.MAX_LINE_WIDTH, this._text);
    let t = 0;
    for (const s of this._lines)
      t = Math.max(t, this.measurementProvider.measureText(s));
    const e = Math.max(t, C.MIN_WIDTH) + C.PADDING * 2, i = C.LINE_HEIGHT * this._lines.length + C.PADDING * 2;
    this._textAreaSize.width = e, this._textAreaSize.height = i, this._size[0] = e + C.STROKE_WIDTH, this._size[1] = i + C.STROKE_WIDTH + C.TAIL_HEIGHT, this._textDirty = !1;
  }
  /**
   * Render this text bubble at a certain scale, using the current parameters, to the canvas.
   * @param {number} scale The scale to render the bubble at
   */
  _renderTextBubble(t) {
    const e = this._canvas.getContext("2d");
    this._textDirty && this._reflowLines();
    const i = this._textAreaSize.width, s = this._textAreaSize.height;
    this._canvas.width = Math.ceil(this._size[0] * t), this._canvas.height = Math.ceil(this._size[1] * t), this._restyleCanvas(), e.setTransform(1, 0, 0, 1, 0, 0), e.clearRect(0, 0, this._canvas.width, this._canvas.height), e.scale(t, t), e.translate(C.STROKE_WIDTH * 0.5, C.STROKE_WIDTH * 0.5), e.save(), this._pointsLeft && (e.scale(-1, 1), e.translate(-i, 0)), e.beginPath(), e.moveTo(C.CORNER_RADIUS, s), e.arcTo(0, s, 0, s - C.CORNER_RADIUS, C.CORNER_RADIUS), e.arcTo(0, 0, i, 0, C.CORNER_RADIUS), e.arcTo(i, 0, i, s, C.CORNER_RADIUS), e.arcTo(
      i,
      s,
      i - C.CORNER_RADIUS,
      s,
      C.CORNER_RADIUS
    ), e.save(), e.translate(i - C.CORNER_RADIUS, s), this._bubbleType === "say" ? (e.bezierCurveTo(0, 4, 4, 8, 4, 10), e.arcTo(4, 12, 2, 12, 2), e.bezierCurveTo(-1, 12, -11, 8, -16, 0), e.closePath()) : (e.arc(-16, 0, 4, 0, Math.PI), e.closePath(), e.moveTo(-7, 7.25), e.arc(-9.25, 7.25, 2.25, 0, Math.PI * 2), e.moveTo(0, 9.5), e.arc(-1.5, 9.5, 1.5, 0, Math.PI * 2)), e.restore(), e.fillStyle = C.COLORS.BUBBLE_FILL, e.strokeStyle = C.COLORS.BUBBLE_STROKE, e.lineWidth = C.STROKE_WIDTH, e.stroke(), e.fill(), e.restore(), e.fillStyle = C.COLORS.TEXT_FILL, e.font = `${C.FONT_SIZE}px ${C.FONT}, sans-serif`;
    const o = this._lines;
    for (let l = 0; l < o.length; l++) {
      const u = o[l];
      e.fillText(
        u,
        C.PADDING,
        C.PADDING + C.LINE_HEIGHT * l + C.FONT_HEIGHT_RATIO * C.FONT_SIZE
      );
    }
    this._renderedScale = t;
  }
  updateSilhouette(t = [100, 100]) {
    this.getTexture(t);
  }
  /**
   * @param {Array<number>} scale - The scaling factors to be used, each in the [0,100] range.
   * @return {WebGLTexture} The GL texture representation of this skin when drawing at the given scale.
   */
  getTexture(t) {
    const i = (t ? Math.max(Math.abs(t[0]), Math.abs(t[1])) : 100) / 100;
    if (this._textureDirty || this._renderedScale !== i) {
      this._renderTextBubble(i), this._textureDirty = !1;
      const o = this._canvas.getContext("2d").getImageData(0, 0, this._canvas.width, this._canvas.height), l = this._renderer.gl;
      if (this._texture === null) {
        const u = {
          auto: !1,
          wrap: l.CLAMP_TO_EDGE
        };
        this._texture = x.createTexture(l, u);
      }
      this._setTexture(o);
    }
    return this._texture;
  }
}
class M {
  /**
   * A utility for creating and comparing axis-aligned rectangles.
   * Rectangles are always initialized to the "largest possible rectangle";
   * use one of the init* methods below to set up a particular rectangle.
   * @constructor
   */
  constructor() {
    this.left = -1 / 0, this.right = 1 / 0, this.bottom = -1 / 0, this.top = 1 / 0;
  }
  /**
   * Initialize a Rectangle from given Scratch-coordinate bounds.
   * @param {number} left Left bound of the rectangle.
   * @param {number} right Right bound of the rectangle.
   * @param {number} bottom Bottom bound of the rectangle.
   * @param {number} top Top bound of the rectangle.
   */
  initFromBounds(t, e, i, s) {
    this.left = t, this.right = e, this.bottom = i, this.top = s;
  }
  /**
   * Initialize a Rectangle to the minimum AABB around a set of points.
   * @param {Array<Array<number>>} points Array of [x, y] points.
   */
  initFromPointsAABB(t) {
    this.left = 1 / 0, this.right = -1 / 0, this.top = -1 / 0, this.bottom = 1 / 0;
    for (let e = 0; e < t.length; e++) {
      const i = t[e][0], s = t[e][1];
      i < this.left && (this.left = i), i > this.right && (this.right = i), s > this.top && (this.top = s), s < this.bottom && (this.bottom = s);
    }
  }
  /**
   * Initialize a Rectangle to a 1 unit square centered at 0 x 0 transformed
   * by a model matrix.
   * @param {Array.<number>} m A 4x4 matrix to transform the rectangle by.
   * @tutorial Rectangle-AABB-Matrix
   */
  initFromModelMatrix(t) {
    const e = t[12], i = t[3 * 4 + 1], s = Math.abs(0.5 * t[0 * 4 + 0]) + Math.abs(0.5 * t[1 * 4 + 0]), o = Math.abs(0.5 * t[0 * 4 + 1]) + Math.abs(0.5 * t[1 * 4 + 1]);
    this.left = -s + e, this.right = s + e, this.top = o + i, this.bottom = -o + i;
  }
  /**
   * Determine if this Rectangle intersects some other.
   * Note that this is a comparison assuming the Rectangle was
   * initialized with Scratch-space bounds or points.
   * @param {!Rectangle} other Rectangle to check if intersecting.
   * @return {boolean} True if this Rectangle intersects other.
   */
  intersects(t) {
    return this.left <= t.right && t.left <= this.right && this.top >= t.bottom && t.top >= this.bottom;
  }
  /**
   * Determine if this Rectangle fully contains some other.
   * Note that this is a comparison assuming the Rectangle was
   * initialized with Scratch-space bounds or points.
   * @param {!Rectangle} other Rectangle to check if fully contained.
   * @return {boolean} True if this Rectangle fully contains other.
   */
  contains(t) {
    return t.left > this.left && t.right < this.right && t.top < this.top && t.bottom > this.bottom;
  }
  /**
   * Clamp a Rectangle to bounds.
   * @param {number} left Left clamp.
   * @param {number} right Right clamp.
   * @param {number} bottom Bottom clamp.
   * @param {number} top Top clamp.
   */
  clamp(t, e, i, s) {
    this.left = Math.max(this.left, t), this.right = Math.min(this.right, e), this.bottom = Math.max(this.bottom, i), this.top = Math.min(this.top, s), this.left = Math.min(this.left, e), this.right = Math.max(this.right, t), this.bottom = Math.min(this.bottom, s), this.top = Math.max(this.top, i);
  }
  /**
   * Push out the Rectangle to integer bounds.
   */
  snapToInt() {
    this.left = Math.floor(this.left), this.right = Math.ceil(this.right), this.bottom = Math.floor(this.bottom), this.top = Math.ceil(this.top);
  }
  /**
   * Compute the intersection of two bounding Rectangles.
   * Could be an impossible box if they don't intersect.
   * @param {Rectangle} a One rectangle
   * @param {Rectangle} b Other rectangle
   * @param {?Rectangle} result A resulting storage rectangle  (safe to pass
   *                            a or b if you want to overwrite one)
   * @returns {Rectangle} resulting rectangle
   */
  static intersect(t, e, i = new M()) {
    return i.left = Math.max(t.left, e.left), i.right = Math.min(t.right, e.right), i.top = Math.min(t.top, e.top), i.bottom = Math.max(t.bottom, e.bottom), i;
  }
  /**
   * Compute the union of two bounding Rectangles.
   * @param {Rectangle} a One rectangle
   * @param {Rectangle} b Other rectangle
   * @param {?Rectangle} result A resulting storage rectangle  (safe to pass
   *                            a or b if you want to overwrite one)
   * @returns {Rectangle} resulting rectangle
   */
  static union(t, e, i = new M()) {
    return i.left = Math.min(t.left, e.left), i.right = Math.max(t.right, e.right), i.top = Math.max(t.top, e.top), i.bottom = Math.min(t.bottom, e.bottom), i;
  }
  /**
   * Width of the Rectangle.
   * @return {number} Width of rectangle.
   */
  get width() {
    return Math.abs(this.left - this.right);
  }
  /**
   * Height of the Rectangle.
   * @return {number} Height of rectangle.
   */
  get height() {
    return Math.abs(this.top - this.bottom);
  }
}
const Hi = ([a, t, e], i) => {
  let s = 0;
  a /= 255, t /= 255, e /= 255;
  let o = 0;
  t < e && (o = t, t = e, e = o, s = -1), a < t && (o = a, a = t, t = o, s = -2 / 6 - s);
  const l = a - Math.min(t, e), u = Math.abs(s + (t - e) / (6 * l + Number.EPSILON)), c = l / (a + Number.EPSILON), f = a;
  return i[0] = u, i[1] = c, i[2] = f, i;
}, Ui = ([a, t, e], i) => {
  if (t === 0)
    return i[0] = i[1] = i[2] = e * 255 + 0.5, i;
  a %= 1;
  const s = a * 6 | 0, o = a * 6 - s, l = e * (1 - t), u = e * (1 - t * o), c = e * (1 - t * (1 - o));
  let f = 0, d = 0, _ = 0;
  switch (s) {
    case 0:
      f = e, d = c, _ = l;
      break;
    case 1:
      f = u, d = e, _ = l;
      break;
    case 2:
      f = l, d = e, _ = c;
      break;
    case 3:
      f = l, d = u, _ = e;
      break;
    case 4:
      f = c, d = l, _ = e;
      break;
    case 5:
      f = e, d = l, _ = u;
      break;
  }
  return i[0] = f * 255 + 0.5, i[1] = d * 255 + 0.5, i[2] = _ * 255 + 0.5, i;
}, H = 0.5, U = 0.5, Wi = [0, 0, 0];
class lt {
  /**
   * Transform a color in-place given the drawable's effect uniforms.  Will apply
   * Ghost and Color and Brightness effects.
   * @param {Drawable} drawable The drawable to get uniforms from.
   * @param {Uint8ClampedArray} inOutColor The color to transform.
   * @param {number} [effectMask] A bitmask for which effects to use. Optional.
   * @returns {Uint8ClampedArray} dst filled with the transformed color
   */
  static transformColor(t, e, i) {
    if (e[3] === 0)
      return e;
    let s = t.enabledEffects;
    typeof i == "number" && (s &= i);
    const o = t.getUniforms(), l = (s & y.EFFECT_INFO.color.mask) !== 0, u = (s & y.EFFECT_INFO.brightness.mask) !== 0;
    if (l || u) {
      const c = e[3] / 255;
      if (e[0] /= c, e[1] /= c, e[2] /= c, l) {
        const f = Hi(e, Wi), d = 0.11 / 2, _ = 0.09;
        f[2] < d ? (f[0] = 0, f[1] = 1, f[2] = d) : f[1] < _ && (f[0] = 0, f[1] = _), f[0] = o.u_color + f[0] + 1, Ui(f, e);
      }
      if (u) {
        const f = o.u_brightness * 255;
        e[0] += f, e[1] += f, e[2] += f;
      }
      e[0] *= c, e[1] *= c, e[2] *= c;
    }
    return s & y.EFFECT_INFO.ghost.mask && (e[0] *= o.u_ghost, e[1] *= o.u_ghost, e[2] *= o.u_ghost, e[3] *= o.u_ghost), e;
  }
  /**
   * Transform a texture coordinate to one that would be select after applying shader effects.
   * @param {Drawable} drawable The drawable whose effects to emulate.
   * @param {twgl.v3} vec The texture coordinate to transform.
   * @param {twgl.v3} dst A place to store the output coordinate.
   * @return {twgl.v3} dst - The coordinate after being transform by effects.
   */
  static transformPoint(t, e, i) {
    x.v3.copy(e, i);
    const s = t.enabledEffects, o = t.getUniforms();
    if (s & y.EFFECT_INFO.mosaic.mask && (i[0] = o.u_mosaic * i[0] % 1, i[1] = o.u_mosaic * i[1] % 1), s & y.EFFECT_INFO.pixelate.mask) {
      const l = t.skin.getUniforms(), u = l.u_skinSize[0] / o.u_pixelate, c = l.u_skinSize[1] / o.u_pixelate;
      i[0] = (Math.floor(i[0] * u) + H) / u, i[1] = (Math.floor(i[1] * c) + U) / c;
    }
    if (s & y.EFFECT_INFO.whirl.mask) {
      const u = i[0] - H, c = i[1] - U, f = Math.sqrt(Math.pow(u, 2) + Math.pow(c, 2)), d = Math.max(1 - f / 0.5, 0), _ = o.u_whirl * d * d, w = Math.sin(_), E = Math.cos(_), g = E, m = -w, k = w, T = E;
      i[0] = g * u + k * c + H, i[1] = m * u + T * c + U;
    }
    if (s & y.EFFECT_INFO.fisheye.mask) {
      const l = (i[0] - H) / H, u = (i[1] - U) / U, c = Math.sqrt(l * l + u * u), f = Math.pow(Math.min(c, 1), o.u_fisheye) * Math.max(1, c), d = l / c, _ = u / c;
      i[0] = H + f * d * H, i[1] = U + f * _ * U;
    }
    return i;
  }
}
var At = { exports: {} }, kt = { exports: {} };
function ht() {
  this._events = {};
}
ht.prototype = {
  on: function(a, t) {
    this._events || (this._events = {});
    var e = this._events;
    return (e[a] || (e[a] = [])).push(t), this;
  },
  removeListener: function(a, t) {
    var e = this._events[a] || [], i;
    for (i = e.length - 1; i >= 0 && e[i]; i--)
      (e[i] === t || e[i].cb === t) && e.splice(i, 1);
  },
  removeAllListeners: function(a) {
    a ? this._events[a] && (this._events[a] = []) : this._events = {};
  },
  listeners: function(a) {
    return this._events ? this._events[a] || [] : [];
  },
  emit: function(a) {
    this._events || (this._events = {});
    var t = Array.prototype.slice.call(arguments, 1), e, i = this._events[a] || [];
    for (e = i.length - 1; e >= 0 && i[e]; e--)
      i[e].apply(this, t);
    return this;
  },
  when: function(a, t) {
    return this.once(a, t, !0);
  },
  once: function(a, t, e) {
    if (!t) return this;
    function i() {
      e || this.removeListener(a, i), t.apply(this, arguments) && e && this.removeListener(a, i);
    }
    return i.cb = t, this.on(a, i), this;
  }
};
ht.mixin = function(a) {
  var t = ht.prototype, e;
  for (e in t)
    t.hasOwnProperty(e) && (a.prototype[e] = t[e]);
};
var Gi = ht, Xi = Gi;
function P() {
}
Xi.mixin(P);
P.prototype.write = function(a, t, e) {
  this.emit("item", a, t, e);
};
P.prototype.end = function() {
  this.emit("end"), this.removeAllListeners();
};
P.prototype.pipe = function(a) {
  var t = this;
  t.emit("unpipe", a), a.emit("pipe", t);
  function e() {
    a.write.apply(a, Array.prototype.slice.call(arguments));
  }
  function i() {
    !a._isStdio && a.end();
  }
  return t.on("item", e), t.on("end", i), t.when("unpipe", function(s) {
    var o = s === a || typeof s == "undefined";
    return o && (t.removeListener("item", e), t.removeListener("end", i), a.emit("unpipe")), o;
  }), a;
};
P.prototype.unpipe = function(a) {
  return this.emit("unpipe", a), this;
};
P.prototype.format = function(a) {
  throw new Error([
    "Warning: .format() is deprecated in Minilog v2! Use .pipe() instead. For example:",
    "var Minilog = require('minilog');",
    "Minilog",
    "  .pipe(Minilog.backends.console.formatClean)",
    "  .pipe(Minilog.backends.console);"
  ].join(`
`));
};
P.mixin = function(a) {
  var t = P.prototype, e;
  for (e in t)
    t.hasOwnProperty(e) && (a.prototype[e] = t[e]);
};
var R = P, Vi = R, ct = { debug: 1, info: 2, warn: 3, error: 4 };
function G() {
  this.enabled = !0, this.defaultResult = !0, this.clear();
}
Vi.mixin(G);
G.prototype.allow = function(a, t) {
  return this._white.push({ n: a, l: ct[t] }), this;
};
G.prototype.deny = function(a, t) {
  return this._black.push({ n: a, l: ct[t] }), this;
};
G.prototype.clear = function() {
  return this._white = [], this._black = [], this;
};
function Yt(a, t) {
  return a.n.test ? a.n.test(t) : a.n == t;
}
G.prototype.test = function(a, t) {
  var e, i = Math.max(this._white.length, this._black.length);
  for (e = 0; e < i; e++) {
    if (this._white[e] && Yt(this._white[e], a) && ct[t] >= this._white[e].l)
      return !0;
    if (this._black[e] && Yt(this._black[e], a) && ct[t] <= this._black[e].l)
      return !1;
  }
  return this.defaultResult;
};
G.prototype.write = function(a, t, e) {
  if (!this.enabled || this.test(a, t))
    return this.emit("item", a, t, e);
};
var $i = G;
(function(a, t) {
  var e = R, i = $i, s = new e(), o = Array.prototype.slice;
  t = a.exports = function(u) {
    var c = function() {
      return s.write(u, void 0, o.call(arguments)), c;
    };
    return c.debug = function() {
      return s.write(u, "debug", o.call(arguments)), c;
    }, c.info = function() {
      return s.write(u, "info", o.call(arguments)), c;
    }, c.warn = function() {
      return s.write(u, "warn", o.call(arguments)), c;
    }, c.error = function() {
      return s.write(u, "error", o.call(arguments)), c;
    }, c.log = c.debug, c.suggest = t.suggest, c.format = s.format, c;
  }, t.defaultBackend = t.defaultFormatter = null, t.pipe = function(l) {
    return s.pipe(l);
  }, t.end = t.unpipe = t.disable = function(l) {
    return s.unpipe(l);
  }, t.Transform = e, t.Filter = i, t.suggest = new i(), t.enable = function() {
    return t.defaultFormatter ? s.pipe(t.suggest).pipe(t.defaultFormatter).pipe(t.defaultBackend) : s.pipe(t.suggest).pipe(t.defaultBackend);
  };
})(kt, kt.exports);
var ji = kt.exports, Jt = {
  black: "#000",
  red: "#c23621",
  green: "#25bc26",
  yellow: "#bbbb00",
  blue: "#492ee1",
  magenta: "#d338d3",
  cyan: "#33bbc8",
  gray: "#808080",
  purple: "#708"
};
function qi(a, t) {
  return t ? "color: #fff; background: " + Jt[a] + ";" : "color: " + Jt[a] + ";";
}
var xe = qi, Ki = R, wt = xe, Zi = { debug: ["cyan"], info: ["purple"], warn: ["yellow", !0], error: ["red", !0] }, Nt = new Ki();
Nt.write = function(a, t, e) {
  var i = console.log;
  console[t] && console[t].apply && (i = console[t], i.apply(console, ["%c" + a + " %c" + t, wt("gray"), wt.apply(wt, Zi[t])].concat(e)));
};
Nt.pipe = function() {
};
var Yi = Nt, Ji = R, it = xe, Qt = { debug: ["gray"], info: ["purple"], warn: ["yellow", !0], error: ["red", !0] }, Ot = new Ji();
Ot.write = function(a, t, e) {
  var i = console.log;
  t != "debug" && console[t] && (i = console[t]);
  var s = 0;
  if (t != "info") {
    for (; s < e.length && typeof e[s] == "string"; s++)
      ;
    i.apply(console, ["%c" + a + " " + e.slice(0, s).join(" "), it.apply(it, Qt[t])].concat(e.slice(s)));
  } else
    i.apply(console, ["%c" + a, it.apply(it, Qt[t])].concat(e));
};
Ot.pipe = function() {
};
var Qi = Ot, tn = R, en = /\n+$/, Q = new tn();
Q.write = function(a, t, e) {
  var i = e.length - 1;
  if (!(typeof console == "undefined" || !console.log)) {
    if (console.log.apply)
      return console.log.apply(console, [a, t].concat(e));
    if (JSON && JSON.stringify) {
      e[i] && typeof e[i] == "string" && (e[i] = e[i].replace(en, ""));
      try {
        for (i = 0; i < e.length; i++)
          e[i] = JSON.stringify(e[i]);
      } catch (s) {
      }
      console.log(e.join(" "));
    }
  }
};
Q.formatters = ["color", "minilog"];
Q.color = Yi;
Q.minilog = Qi;
var nn = Q, xt, te;
function sn() {
  if (te) return xt;
  te = 1;
  var a = R, t = [], e = new a();
  return e.write = function(i, s, o) {
    t.push([i, s, o]);
  }, e.get = function() {
    return t;
  }, e.empty = function() {
    t = [];
  }, xt = e, xt;
}
var Et, ee;
function rn() {
  if (ee) return Et;
  ee = 1;
  var a = R, t = !1, e = new a();
  return e.write = function(i, s, o) {
    if (!(typeof window == "undefined" || typeof JSON == "undefined" || !JSON.stringify || !JSON.parse))
      try {
        t || (t = window.localStorage.minilog ? JSON.parse(window.localStorage.minilog) : []), t.push([(/* @__PURE__ */ new Date()).toString(), i, s, o]), window.localStorage.minilog = JSON.stringify(t);
      } catch (l) {
      }
  }, Et = e, Et;
}
var yt, ie;
function on() {
  if (ie) return yt;
  ie = 1;
  var a = R, t = (/* @__PURE__ */ new Date()).valueOf().toString(36);
  function e(i) {
    this.url = i.url || "", this.cache = [], this.timer = null, this.interval = i.interval || 30 * 1e3, this.enabled = !0, this.jQuery = window.jQuery, this.extras = {};
  }
  return a.mixin(e), e.prototype.write = function(i, s, o) {
    this.timer || this.init(), this.cache.push([i, s].concat(o));
  }, e.prototype.init = function() {
    if (!(!this.enabled || !this.jQuery)) {
      var i = this;
      this.timer = setTimeout(function() {
        var s, o = [], l, u = i.url;
        if (i.cache.length == 0) return i.init();
        for (s = 0; s < i.cache.length; s++)
          try {
            JSON.stringify(i.cache[s]), o.push(i.cache[s]);
          } catch (c) {
          }
        i.jQuery.isEmptyObject(i.extras) ? (l = JSON.stringify({ logs: o }), u = i.url + "?client_id=" + t) : l = JSON.stringify(i.jQuery.extend({ logs: o }, i.extras)), i.jQuery.ajax(u, {
          type: "POST",
          cache: !1,
          processData: !1,
          data: l,
          contentType: "application/json",
          timeout: 1e4
        }).success(function(c, f, d) {
          c.interval && (i.interval = Math.max(1e3, c.interval));
        }).error(function() {
          i.interval = 3e4;
        }).always(function() {
          i.init();
        }), i.cache = [];
      }, this.interval);
    }
  }, e.prototype.end = function() {
  }, e.jQueryWait = function(i) {
    if (typeof window != "undefined" && (window.jQuery || window.$))
      return i(window.jQuery || window.$);
    typeof window != "undefined" && setTimeout(function() {
      e.jQueryWait(i);
    }, 200);
  }, yt = e, yt;
}
(function(a, t) {
  var e = ji, i = e.enable, s = e.disable, o = typeof navigator != "undefined" && /chrome/i.test(navigator.userAgent), l = nn;
  if (e.defaultBackend = o ? l.minilog : l, typeof window != "undefined") {
    try {
      e.enable(JSON.parse(window.localStorage.minilogSettings));
    } catch (c) {
    }
    if (window.location && window.location.search) {
      var u = RegExp("[?&]minilog=([^&]*)").exec(window.location.search);
      u && e.enable(decodeURIComponent(u[1]));
    }
  }
  e.enable = function() {
    i.call(e, !0);
    try {
      window.localStorage.minilogSettings = JSON.stringify(!0);
    } catch (c) {
    }
    return this;
  }, e.disable = function() {
    s.call(e);
    try {
      delete window.localStorage.minilogSettings;
    } catch (c) {
    }
    return this;
  }, t = a.exports = e, t.backends = {
    array: sn(),
    browser: e.defaultBackend,
    localStorage: rn(),
    jQuery: on()
  };
})(At, At.exports);
var an = At.exports;
const Ee = /* @__PURE__ */ ut(an);
Ee.enable();
const K = Ee("scratch-render"), ln = x.v3.create(), ne = 1e-6, Tt = (a, t) => {
  const e = ln, i = t[0], s = t[1], o = a._inverseMatrix, l = i * o[3] + s * o[7] + o[15];
  return e[0] = 0.5 - (i * o[0] + s * o[4] + o[12]) / l, e[1] = (i * o[1] + s * o[5] + o[13]) / l + 0.5, Math.abs(e[0]) < ne && (e[0] = 0), Math.abs(e[1]) < ne && (e[1] = 0), a.enabledEffects !== 0 && e[0] >= 0 && e[0] < 1 && e[1] >= 0 && e[1] < 1 && lt.transformPoint(a, e, e), e;
};
class Y {
  /**
   * An object which can be drawn by the renderer.
   * @todo double-buffer all rendering state (position, skin, effects, etc.)
   * @param {!int} id - This Drawable's unique ID.
   * @constructor
   */
  constructor(t) {
    this._id = t, this._uniforms = {
      /**
       * The model matrix, to concat with projection at draw time.
       * @type {module:twgl/m4.Mat4}
       */
      u_modelMatrix: x.m4.identity(),
      /**
       * The color to use in the silhouette draw mode.
       * @type {Array<number>}
       */
      u_silhouetteColor: Y.color4fFromID(this._id)
    };
    const e = y.EFFECTS.length;
    for (let i = 0; i < e; ++i) {
      const s = y.EFFECTS[i], o = y.EFFECT_INFO[s], l = o.converter;
      this._uniforms[o.uniformName] = l(0);
    }
    this._position = x.v3.create(0, 0), this._scale = x.v3.create(100, 100), this._direction = 90, this._transformDirty = !0, this._rotationMatrix = x.m4.identity(), this._rotationTransformDirty = !0, this._rotationAdjusted = x.v3.create(), this._rotationCenterDirty = !0, this._skinScale = x.v3.create(0, 0, 0), this._skinScaleDirty = !0, this._inverseMatrix = x.m4.identity(), this._inverseTransformDirty = !0, this._visible = !0, this.enabledEffects = 0, this._convexHullPoints = null, this._convexHullDirty = !0, this._transformedHullPoints = null, this._transformedHullDirty = !0, this._skinWasAltered = this._skinWasAltered.bind(this), this.isTouching = this._isTouchingNever;
  }
  /**
   * Dispose of this Drawable. Do not use it after calling this method.
   */
  dispose() {
    this.skin = null;
  }
  /**
   * Mark this Drawable's transform as dirty.
   * It will be recalculated next time it's needed.
   */
  setTransformDirty() {
    this._transformDirty = !0, this._inverseTransformDirty = !0, this._transformedHullDirty = !0;
  }
  /**
   * @returns {number} The ID for this Drawable.
   */
  get id() {
    return this._id;
  }
  /**
   * @returns {Skin} the current skin for this Drawable.
   */
  get skin() {
    return this._skin;
  }
  /**
   * @param {Skin} newSkin - A new Skin for this Drawable.
   */
  set skin(t) {
    this._skin !== t && (this._skin && this._skin.removeListener(F.Events.WasAltered, this._skinWasAltered), this._skin = t, this._skin && this._skin.addListener(F.Events.WasAltered, this._skinWasAltered), this._skinWasAltered());
  }
  /**
   * @returns {Array<number>} the current scaling percentages applied to this Drawable. [100,100] is normal size.
   */
  get scale() {
    return [this._scale[0], this._scale[1]];
  }
  /**
   * @returns {object.<string, *>} the shader uniforms to be used when rendering this Drawable.
   */
  getUniforms() {
    return this._transformDirty && this._calculateTransform(), this._uniforms;
  }
  /**
   * @returns {boolean} whether this Drawable is visible.
   */
  getVisible() {
    return this._visible;
  }
  /**
   * Update the position if it is different. Marks the transform as dirty.
   * @param {Array.<number>} position A new position.
   */
  updatePosition(t) {
    (this._position[0] !== t[0] || this._position[1] !== t[1]) && (this._position[0] = Math.round(t[0]), this._position[1] = Math.round(t[1]), this.setTransformDirty());
  }
  /**
   * Update the direction if it is different. Marks the transform as dirty.
   * @param {number} direction A new direction.
   */
  updateDirection(t) {
    this._direction !== t && (this._direction = t, this._rotationTransformDirty = !0, this.setTransformDirty());
  }
  /**
   * Update the scale if it is different. Marks the transform as dirty.
   * @param {Array.<number>} scale A new scale.
   */
  updateScale(t) {
    (this._scale[0] !== t[0] || this._scale[1] !== t[1]) && (this._scale[0] = t[0], this._scale[1] = t[1], this._rotationCenterDirty = !0, this._skinScaleDirty = !0, this.setTransformDirty());
  }
  /**
   * Update visibility if it is different. Marks the convex hull as dirty.
   * @param {boolean} visible A new visibility state.
   */
  updateVisible(t) {
    this._visible !== t && (this._visible = t, this.setConvexHullDirty());
  }
  /**
   * Update an effect. Marks the convex hull as dirty if the effect changes shape.
   * @param {string} effectName The name of the effect.
   * @param {number} rawValue A new effect value.
   */
  updateEffect(t, e) {
    const i = y.EFFECT_INFO[t];
    e ? this.enabledEffects |= i.mask : this.enabledEffects &= ~i.mask;
    const s = i.converter;
    this._uniforms[i.uniformName] = s(e), i.shapeChanges && this.setConvexHullDirty();
  }
  /**
   * Update the position, direction, scale, or effect properties of this Drawable.
   * @deprecated Use specific update* methods instead.
   * @param {object.<string,*>} properties The new property values to set.
   */
  updateProperties(t) {
    "position" in t && this.updatePosition(t.position), "direction" in t && this.updateDirection(t.direction), "scale" in t && this.updateScale(t.scale), "visible" in t && this.updateVisible(t.visible);
    const e = y.EFFECTS.length;
    for (let i = 0; i < e; ++i) {
      const s = y.EFFECTS[i];
      s in t && this.updateEffect(s, t[s]);
    }
  }
  /**
   * Calculate the transform to use when rendering this Drawable.
   * @private
   */
  _calculateTransform() {
    if (this._rotationTransformDirty) {
      const w = (270 - this._direction) * Math.PI / 180, E = Math.cos(w), g = Math.sin(w);
      this._rotationMatrix[0] = E, this._rotationMatrix[1] = g, this._rotationMatrix[4] = -g, this._rotationMatrix[5] = E, this._rotationTransformDirty = !1;
    }
    if (this._rotationCenterDirty && this.skin !== null) {
      const w = this.skin.rotationCenter, E = this.skin.size, g = w[0], m = w[1], k = E[0], T = E[1], b = this._scale[0], p = this._scale[1], v = this._rotationAdjusted;
      v[0] = (g - k / 2) * b / 100, v[1] = (m - T / 2) * p / 100 * -1, this._rotationCenterDirty = !1;
    }
    if (this._skinScaleDirty && this.skin !== null) {
      const w = this.skin.size, E = this._skinScale;
      E[0] = w[0] * this._scale[0] / 100, E[1] = w[1] * this._scale[1] / 100, this._skinScaleDirty = !1;
    }
    const t = this._uniforms.u_modelMatrix, e = this._skinScale[0], i = this._skinScale[1], s = this._rotationMatrix[0], o = this._rotationMatrix[1], l = this._rotationMatrix[4], u = this._rotationMatrix[5], c = this._rotationAdjusted[0], f = this._rotationAdjusted[1], d = this._position[0], _ = this._position[1];
    t[0] = e * s, t[1] = e * o, t[4] = i * l, t[5] = i * u, t[12] = s * c + l * f + d, t[13] = o * c + u * f + _, this._transformDirty = !1;
  }
  /**
   * Whether the Drawable needs convex hull points provided by the renderer.
   * @return {boolean} True when no convex hull known, or it's dirty.
   */
  needsConvexHullPoints() {
    return !this._convexHullPoints || this._convexHullDirty || this._convexHullPoints.length === 0;
  }
  /**
   * Set the convex hull to be dirty.
   * Do this whenever the Drawable's shape has possibly changed.
   */
  setConvexHullDirty() {
    this._convexHullDirty = !0;
  }
  /**
   * Set the convex hull points for the Drawable.
   * @param {Array<Array<number>>} points Convex hull points, as [[x, y], ...]
   */
  setConvexHullPoints(t) {
    this._convexHullPoints = t, this._convexHullDirty = !1, this._transformedHullPoints = [];
    for (let e = 0; e < t.length; e++)
      this._transformedHullPoints.push(x.v3.create());
    this._transformedHullDirty = !0;
  }
  /**
   * @function
   * @name isTouching
   * Check if the world position touches the skin.
   * The caller is responsible for ensuring this drawable's inverse matrix & its skin's silhouette are up-to-date.
   * @see updateCPURenderAttributes
   * @param {twgl.v3} vec World coordinate vector.
   * @return {boolean} True if the world position touches the skin.
   */
  // `updateCPURenderAttributes` sets this Drawable instance's `isTouching` method
  // to one of the following three functions:
  // If this drawable has no skin, set it to `_isTouchingNever`.
  // Otherwise, if this drawable uses nearest-neighbor scaling at its current scale, set it to `_isTouchingNearest`.
  // Otherwise, set it to `_isTouchingLinear`.
  // This allows several checks to be moved from the `isTouching` function to `updateCPURenderAttributes`.
  // eslint-disable-next-line no-unused-vars
  _isTouchingNever(t) {
    return !1;
  }
  _isTouchingNearest(t) {
    return this.skin.isTouchingNearest(Tt(this, t));
  }
  _isTouchingLinear(t) {
    return this.skin.isTouchingLinear(Tt(this, t));
  }
  /**
   * Get the precise bounds for a Drawable.
   * This function applies the transform matrix to the known convex hull,
   * and then finds the minimum box along the axes.
   * Before calling this, ensure the renderer has updated convex hull points.
   * @param {?Rectangle} result optional destination for bounds calculation
   * @return {!Rectangle} Bounds for a tight box around the Drawable.
   */
  getBounds(t) {
    if (this.needsConvexHullPoints())
      throw new Error("Needs updated convex hull points before bounds calculation.");
    this._transformDirty && this._calculateTransform();
    const e = this._getTransformedHullPoints();
    return t = t || new M(), t.initFromPointsAABB(e), t;
  }
  /**
   * Get the precise bounds for the upper 8px slice of the Drawable.
   * Used for calculating where to position a text bubble.
   * Before calling this, ensure the renderer has updated convex hull points.
   * @param {?Rectangle} result optional destination for bounds calculation
   * @return {!Rectangle} Bounds for a tight box around a slice of the Drawable.
   */
  getBoundsForBubble(t) {
    if (this.needsConvexHullPoints())
      throw new Error("Needs updated convex hull points before bubble bounds calculation.");
    this._transformDirty && this._calculateTransform();
    const e = 8, i = this._getTransformedHullPoints(), s = Math.max.apply(null, i.map((l) => l[1])), o = i.filter((l) => l[1] > s - e);
    return t = t || new M(), t.initFromPointsAABB(o), t;
  }
  /**
   * Get the rough axis-aligned bounding box for the Drawable.
   * Calculated by transforming the skin's bounds.
   * Note that this is less precise than the box returned by `getBounds`,
   * which is tightly snapped to account for a Drawable's transparent regions.
   * `getAABB` returns a much less accurate bounding box, but will be much
   * faster to calculate so may be desired for quick checks/optimizations.
   * @param {?Rectangle} result optional destination for bounds calculation
   * @return {!Rectangle} Rough axis-aligned bounding box for Drawable.
   */
  getAABB(t) {
    this._transformDirty && this._calculateTransform();
    const e = this._uniforms.u_modelMatrix;
    return t = t || new M(), t.initFromModelMatrix(e), t;
  }
  /**
   * Return the best Drawable bounds possible without performing graphics queries.
   * I.e., returns the tight bounding box when the convex hull points are already
   * known, but otherwise return the rough AABB of the Drawable.
   * @param {?Rectangle} result optional destination for bounds calculation
   * @return {!Rectangle} Bounds for the Drawable.
   */
  getFastBounds(t) {
    return this.needsConvexHullPoints() ? this.getAABB(t) : this.getBounds(t);
  }
  /**
   * Transform all the convex hull points by the current Drawable's
   * transform. This allows us to skip recalculating the convex hull
   * for many Drawable updates, including translation, rotation, scaling.
   * @return {!Array.<!Array.number>} Array of glPoints which are Array<x, y>
   * @private
   */
  _getTransformedHullPoints() {
    if (!this._transformedHullDirty)
      return this._transformedHullPoints;
    const t = x.m4.ortho(-1, 1, -1, 1, -1, 1), e = this.skin.size, i = 1 / e[0] / 2, s = 1 / e[1] / 2, o = x.m4.multiply(this._uniforms.u_modelMatrix, t);
    for (let l = 0; l < this._convexHullPoints.length; l++) {
      const u = this._convexHullPoints[l], c = this._transformedHullPoints[l];
      c[0] = 0.5 + -u[0] / e[0] - i, c[1] = u[1] / e[1] - 0.5 + s, x.m4.transformPoint(o, c, c);
    }
    return this._transformedHullDirty = !1, this._transformedHullPoints;
  }
  /**
   * Update the transform matrix and calculate it's inverse for collision
   * and local texture position purposes.
   */
  updateMatrix() {
    if (this._transformDirty && this._calculateTransform(), this._inverseTransformDirty) {
      const t = this._inverseMatrix;
      x.m4.copy(this._uniforms.u_modelMatrix, t), t[10] = 1, x.m4.inverse(t, t), this._inverseTransformDirty = !1;
    }
  }
  /**
   * Update everything necessary to render this drawable on the CPU.
   */
  updateCPURenderAttributes() {
    this.updateMatrix(), this.skin ? (this.skin.updateSilhouette(this._scale), this.skin.useNearest(this._scale, this) ? this.isTouching = this._isTouchingNearest : this.isTouching = this._isTouchingLinear) : (K.warn(`Could not find skin for drawable with id: ${this._id}`), this.isTouching = this._isTouchingNever);
  }
  /**
   * Respond to an internal change in the current Skin.
   * @private
   */
  _skinWasAltered() {
    this._rotationCenterDirty = !0, this._skinScaleDirty = !0, this.setConvexHullDirty(), this.setTransformDirty();
  }
  /**
   * Calculate a color to represent the given ID number. At least one component of
   * the resulting color will be non-zero if the ID is not RenderConstants.ID_NONE.
   * @param {int} id The ID to convert.
   * @returns {Array<number>} An array of [r,g,b,a], each component in the range [0,1].
   */
  static color4fFromID(t) {
    t -= L.ID_NONE;
    const e = (t >> 0 & 255) / 255, i = (t >> 8 & 255) / 255, s = (t >> 16 & 255) / 255;
    return [e, i, s, 1];
  }
  /**
   * Calculate the ID number represented by the given color. If all components of
   * the color are zero, the result will be RenderConstants.ID_NONE; otherwise the result
   * will be a valid ID.
   * @param {int} r The red value of the color, in the range [0,255].
   * @param {int} g The green value of the color, in the range [0,255].
   * @param {int} b The blue value of the color, in the range [0,255].
   * @returns {int} The ID represented by that color.
   */
  static color3bToID(t, e, i) {
    let s;
    return s = (t & 255) << 0, s |= (e & 255) << 8, s |= (i & 255) << 16, s + L.ID_NONE;
  }
  /**
   * Sample a color from a drawable's texture.
   * The caller is responsible for ensuring this drawable's inverse matrix & its skin's silhouette are up-to-date.
   * @see updateCPURenderAttributes
   * @param {twgl.v3} vec The scratch space [x,y] vector
   * @param {Drawable} drawable The drawable to sample the texture from
   * @param {Uint8ClampedArray} dst The "color4b" representation of the texture at point.
   * @param {number} [effectMask] A bitmask for which effects to use. Optional.
   * @returns {Uint8ClampedArray} The dst object filled with the color4b
   */
  static sampleColor4b(t, e, i, s) {
    const o = Tt(e, t);
    if (o[0] < 0 || o[1] < 0 || o[0] > 1 || o[1] > 1)
      return i[0] = 0, i[1] = 0, i[2] = 0, i[3] = 0, i;
    const l = (
      // commenting out to only use nearest for now
      // drawable.skin.useNearest(drawable._scale, drawable) ?
      e.skin._silhouette.colorAtNearest(o, i)
    );
    return e.enabledEffects === 0 ? l : lt.transformColor(e, l, s);
  }
}
const se = x.v3.create(), hn = new M(), cn = new M(), un = new Uint8ClampedArray(4), j = new Uint8ClampedArray(4), fn = 4e4, nt = [3, 3], _n = 2, re = 2048, dn = (a, t) => (
  // has some non-alpha component to test against
  a[3] > 0 && (a[0] & 252) === (t[0] & 252) && (a[1] & 252) === (t[1] & 252) && (a[2] & 252) === (t[2] & 252)
), St = (a, t, e) => (a[0] & 248) === (t[e + 0] & 248) && (a[1] & 248) === (t[e + 1] & 248) && (a[2] & 240) === (t[e + 2] & 240), oe = 15;
class B extends ae {
  /**
   * Check if this environment appears to support this renderer before attempting to create an instance.
   * Catching an exception from the constructor is also a valid way to test for (lack of) support.
   * @param {canvas} [optCanvas] - An optional canvas to use for the test. Otherwise a temporary canvas will be used.
   * @returns {boolean} - True if this environment appears to support this renderer, false otherwise.
   */
  static isSupported(t) {
    try {
      return !!B._getContext(t || document.createElement("canvas"));
    } catch (e) {
      return !1;
    }
  }
  /**
   * Ask TWGL to create a rendering context with the attributes used by this renderer.
   * @param {canvas} canvas - attach the context to this canvas.
   * @returns {WebGLRenderingContext} - a TWGL rendering context (backed by either WebGL 1.0 or 2.0).
   * @private
   */
  static _getContext(t) {
    const e = { alpha: !1, stencil: !0, antialias: !1 };
    return x.getWebGLContext(t, e) || x.getContext(t, e);
  }
  /**
   * Create a renderer for drawing Scratch sprites to a canvas using WebGL.
   * Coordinates will default to Scratch 2.0 values if unspecified.
   * The stage's "native" size will be calculated from the these coordinates.
   * For example, the defaults result in a native size of 480x360.
   * Queries such as "touching color?" will always execute at the native size.
   * @see RenderWebGL#setStageSize
   * @see RenderWebGL#resize
   * @param {canvas} canvas The canvas to draw onto.
   * @param {int} [xLeft=-240] The x-coordinate of the left edge.
   * @param {int} [xRight=240] The x-coordinate of the right edge.
   * @param {int} [yBottom=-180] The y-coordinate of the bottom edge.
   * @param {int} [yTop=180] The y-coordinate of the top edge.
   * @constructor
   * @listens RenderWebGL#event:NativeSizeChanged
   */
  constructor(t, e, i, s, o) {
    super();
    const l = this._gl = B._getContext(t);
    if (!l)
      throw new Error("Could not get WebGL context: this browser or environment may not support WebGL.");
    this._useGpuMode = B.UseGpuModes.Automatic, this._allDrawables = [], this._allSkins = [], this._drawList = [], this._groupOrdering = [], this._layerGroups = {}, this._nextDrawableId = L.ID_NONE + 1, this._nextSkinId = L.ID_NONE + 1, this._projection = x.m4.identity(), this._shaderManager = new y(l), this._tempCanvas = document.createElement("canvas"), this._regionId = null, this._exitRegion = null, this._backgroundDrawRegionId = {
      enter: () => this._enterDrawBackground(),
      exit: () => this._exitDrawBackground()
    }, this._snapshotCallbacks = [], this._backgroundColor4f = [0, 0, 0, 1], this._backgroundColor3b = new Uint8ClampedArray(3), this._createGeometry(), this.on(L.Events.NativeSizeChanged, this.onNativeSizeChanged), this.setBackgroundColor(1, 1, 1), this.setStageSize(e || -240, i || 240, s || -180, o || 180), this.resize(this._nativeSize[0], this._nativeSize[1]), l.disable(l.DEPTH_TEST), l.enable(l.BLEND), l.blendFunc(l.ONE, l.ONE_MINUS_SRC_ALPHA);
  }
  /**
   * @returns {WebGLRenderingContext} the WebGL rendering context associated with this renderer.
   */
  get gl() {
    return this._gl;
  }
  /**
   * @returns {HTMLCanvasElement} the canvas of the WebGL rendering context associated with this renderer.
   */
  get canvas() {
    return this._gl && this._gl.canvas;
  }
  /**
   * Set the physical size of the stage in device-independent pixels.
   * This will be multiplied by the device's pixel ratio on high-DPI displays.
   * @param {int} pixelsWide The desired width in device-independent pixels.
   * @param {int} pixelsTall The desired height in device-independent pixels.
   */
  resize(t, e) {
    const { canvas: i } = this._gl, s = window.devicePixelRatio || 1, o = t * s, l = e * s;
    (i.width !== o || i.height !== l) && (i.width = o, i.height = l, this.draw());
  }
  /**
   * Set the background color for the stage. The stage will be cleared with this
   * color each frame.
   * @param {number} red The red component for the background.
   * @param {number} green The green component for the background.
   * @param {number} blue The blue component for the background.
   */
  setBackgroundColor(t, e, i) {
    this._backgroundColor4f[0] = t, this._backgroundColor4f[1] = e, this._backgroundColor4f[2] = i, this._backgroundColor3b[0] = t * 255, this._backgroundColor3b[1] = e * 255, this._backgroundColor3b[2] = i * 255;
  }
  /**
   * Tell the renderer to draw various debug information to the provided canvas
   * during certain operations.
   * @param {canvas} canvas The canvas to use for debug output.
   */
  setDebugCanvas(t) {
    this._debugCanvas = t;
  }
  /**
   * Control the use of the GPU or CPU paths in `isTouchingColor`.
   * @param {RenderWebGL.UseGpuModes} useGpuMode - automatically decide, force CPU, or force GPU.
   */
  setUseGpuMode(t) {
    this._useGpuMode = t;
  }
  /**
   * Set logical size of the stage in Scratch units.
   * @param {int} xLeft The left edge's x-coordinate. Scratch 2 uses -240.
   * @param {int} xRight The right edge's x-coordinate. Scratch 2 uses 240.
   * @param {int} yBottom The bottom edge's y-coordinate. Scratch 2 uses -180.
   * @param {int} yTop The top edge's y-coordinate. Scratch 2 uses 180.
   */
  setStageSize(t, e, i, s) {
    this._xLeft = t, this._xRight = e, this._yBottom = i, this._yTop = s, this._projection = x.m4.ortho(t, e, i, s, -1, 1), this._setNativeSize(Math.abs(e - t), Math.abs(i - s));
  }
  /**
   * @return {Array<int>} the "native" size of the stage, which is used for pen, query renders, etc.
   */
  getNativeSize() {
    return [this._nativeSize[0], this._nativeSize[1]];
  }
  /**
   * Set the "native" size of the stage, which is used for pen, query renders, etc.
   * @param {int} width - the new width to set.
   * @param {int} height - the new height to set.
   * @private
   * @fires RenderWebGL#event:NativeSizeChanged
   */
  _setNativeSize(t, e) {
    this._nativeSize = [t, e], this.emit(L.Events.NativeSizeChanged, { newSize: this._nativeSize });
  }
  /**
   * Create a new bitmap skin from a snapshot of the provided bitmap data.
   * @param {ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} bitmapData - new contents for this skin.
   * @param {!int} [costumeResolution=1] - The resolution to use for this bitmap.
   * @param {?Array<number>} [rotationCenter] Optional: rotation center of the skin. If not supplied, the center of
   * the skin will be used.
   * @returns {!int} the ID for the new skin.
   */
  createBitmapSkin(t, e, i) {
    const s = this._nextSkinId++, o = new Z(s, this);
    return o.setBitmap(t, e, i), this._allSkins[s] = o, s;
  }
  /**
   * Create a new SVG skin.
   * @param {!string} svgData - new SVG to use.
   * @param {?Array<number>} rotationCenter Optional: rotation center of the skin. If not supplied, the center of the
   * skin will be used
   * @returns {!int} the ID for the new skin.
   */
  createSVGSkin(t, e) {
    const i = this._nextSkinId++, s = new dt(i, this);
    return s.setSVG(t, e), this._allSkins[i] = s, i;
  }
  /**
   * Create a new PenSkin - a skin which implements a Scratch pen layer.
   * @returns {!int} the ID for the new skin.
   */
  createPenSkin() {
    const t = this._nextSkinId++, e = new ke(t, this);
    return this._allSkins[t] = e, t;
  }
  /**
   * Create a new SVG skin using the text bubble svg creator. The rotation center
   * is always placed at the top left.
   * @param {!string} type - either "say" or "think".
   * @param {!string} text - the text for the bubble.
   * @param {!boolean} pointsLeft - which side the bubble is pointing.
   * @returns {!int} the ID for the new skin.
   */
  createTextSkin(t, e, i) {
    const s = this._nextSkinId++, o = new et(s, this);
    return o.setTextBubble(t, e, i), this._allSkins[s] = o, s;
  }
  /**
   * Update an existing SVG skin, or create an SVG skin if the previous skin was not SVG.
   * @param {!int} skinId the ID for the skin to change.
   * @param {!string} svgData - new SVG to use.
   * @param {?Array<number>} rotationCenter Optional: rotation center of the skin. If not supplied, the center of the
   * skin will be used
   */
  updateSVGSkin(t, e, i) {
    if (this._allSkins[t] instanceof dt) {
      this._allSkins[t].setSVG(e, i);
      return;
    }
    const s = new dt(t, this);
    s.setSVG(e, i), this._reskin(t, s);
  }
  /**
   * Update an existing bitmap skin, or create a bitmap skin if the previous skin was not bitmap.
   * @param {!int} skinId the ID for the skin to change.
   * @param {!ImageData|HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} imgData - new contents for this skin.
   * @param {!number} bitmapResolution - the resolution scale for a bitmap costume.
   * @param {?Array<number>} rotationCenter Optional: rotation center of the skin. If not supplied, the center of the
   * skin will be used
   */
  updateBitmapSkin(t, e, i, s) {
    if (this._allSkins[t] instanceof Z) {
      this._allSkins[t].setBitmap(e, i, s);
      return;
    }
    const o = new Z(t, this);
    o.setBitmap(e, i, s), this._reskin(t, o);
  }
  _reskin(t, e) {
    const i = this._allSkins[t];
    this._allSkins[t] = e;
    for (const s of this._allDrawables)
      s && s.skin === i && (s.skin = e);
    i.dispose();
  }
  /**
   * Update a skin using the text bubble svg creator.
   * @param {!int} skinId the ID for the skin to change.
   * @param {!string} type - either "say" or "think".
   * @param {!string} text - the text for the bubble.
   * @param {!boolean} pointsLeft - which side the bubble is pointing.
   */
  updateTextSkin(t, e, i, s) {
    if (this._allSkins[t] instanceof et) {
      this._allSkins[t].setTextBubble(e, i, s);
      return;
    }
    const o = new et(t, this);
    o.setTextBubble(e, i, s), this._reskin(t, o);
  }
  /**
   * Destroy an existing skin. Do not use the skin or its ID after calling this.
   * @param {!int} skinId - The ID of the skin to destroy.
   */
  destroySkin(t) {
    this._allSkins[t].dispose(), delete this._allSkins[t];
  }
  /**
   * Create a new Drawable and add it to the scene.
   * @param {string} group Layer group to add the drawable to
   * @returns {int} The ID of the new Drawable.
   */
  createDrawable(t) {
    if (!t || !Object.prototype.hasOwnProperty.call(this._layerGroups, t)) {
      K.warn("Cannot create a drawable without a known layer group");
      return;
    }
    const e = this._nextDrawableId++, i = new Y(e);
    return this._allDrawables[e] = i, this._addToDrawList(e, t), i.skin = null, e;
  }
  /**
   * Set the layer group ordering for the renderer.
   * @param {Array<string>} groupOrdering The ordered array of layer group
   * names
   */
  setLayerGroupOrdering(t) {
    this._groupOrdering = t;
    for (let e = 0; e < this._groupOrdering.length; e++)
      this._layerGroups[this._groupOrdering[e]] = {
        groupIndex: e,
        drawListOffset: 0
      };
  }
  _addToDrawList(t, e) {
    const i = this._layerGroups[e], s = i.groupIndex, o = this._endIndexForKnownLayerGroup(i);
    this._drawList.splice(o, 0, t), this._updateOffsets("add", s);
  }
  _updateOffsets(t, e) {
    for (let i = e + 1; i < this._groupOrdering.length; i++) {
      const s = this._groupOrdering[i];
      t === "add" ? this._layerGroups[s].drawListOffset++ : t === "delete" && this._layerGroups[s].drawListOffset--;
    }
  }
  get _visibleDrawList() {
    return this._drawList.filter((t) => this._allDrawables[t]._visible);
  }
  // Given a layer group, return the index where it ends (non-inclusive),
  // e.g. the returned index does not have a drawable from this layer group in it)
  _endIndexForKnownLayerGroup(t) {
    const e = t.groupIndex;
    return e === this._groupOrdering.length - 1 ? this._drawList.length : this._layerGroups[this._groupOrdering[e + 1]].drawListOffset;
  }
  /**
   * Destroy a Drawable, removing it from the scene.
   * @param {int} drawableID The ID of the Drawable to remove.
   * @param {string} group Group name that the drawable belongs to
   */
  destroyDrawable(t, e) {
    if (!e || !Object.prototype.hasOwnProperty.call(this._layerGroups, e)) {
      K.warn("Cannot destroy drawable without known layer group.");
      return;
    }
    this._allDrawables[t].dispose(), delete this._allDrawables[t];
    const s = this._layerGroups[e], o = this._endIndexForKnownLayerGroup(s);
    let l = s.drawListOffset;
    for (; l < o && this._drawList[l] !== t; )
      l++;
    if (l < o)
      this._drawList.splice(l, 1), this._updateOffsets("delete", s.groupIndex);
    else {
      K.warn("Could not destroy drawable that could not be found in layer group.");
      return;
    }
  }
  /**
   * Returns the position of the given drawableID in the draw list. This is
   * the absolute position irrespective of layer group.
   * @param {number} drawableID The drawable ID to find.
   * @return {number} The postion of the given drawable ID.
   */
  getDrawableOrder(t) {
    return this._drawList.indexOf(t);
  }
  /**
   * Set a drawable's order in the drawable list (effectively, z/layer).
   * Can be used to move drawables to absolute positions in the list,
   * or relative to their current positions.
   * "go back N layers": setDrawableOrder(id, -N, true, 1); (assuming stage at 0).
   * "go to back": setDrawableOrder(id, 1); (assuming stage at 0).
   * "go to front": setDrawableOrder(id, Infinity);
   * @param {int} drawableID ID of Drawable to reorder.
   * @param {number} order New absolute order or relative order adjusment.
   * @param {string=} group Name of layer group drawable belongs to.
   * Reordering will not take place if drawable cannot be found within the bounds
   * of the layer group.
   * @param {boolean=} optIsRelative If set, `order` refers to a relative change.
   * @param {number=} optMin If set, order constrained to be at least `optMin`.
   * @return {?number} New order if changed, or null.
   */
  setDrawableOrder(t, e, i, s, o) {
    if (!i || !Object.prototype.hasOwnProperty.call(this._layerGroups, i)) {
      K.warn("Cannot set the order of a drawable without a known layer group.");
      return;
    }
    const l = this._layerGroups[i], u = l.drawListOffset, c = this._endIndexForKnownLayerGroup(l);
    let f = u;
    for (; f < c && this._drawList[f] !== t; )
      f++;
    if (f < c) {
      if (e === 0)
        return f;
      this._drawList.splice(f, 1)[0];
      let d = e;
      s && (d += f);
      const _ = (o || 0) + u, w = _ >= u && _ < c ? _ : u;
      return d = Math.max(d, w), d = Math.min(d, c), this._drawList.splice(d, 0, t), d;
    }
    return null;
  }
  /**
   * Draw all current drawables and present the frame on the canvas.
   */
  draw() {
    this._doExitDrawRegion();
    const t = this._gl;
    if (x.bindFramebufferInfo(t, null), t.viewport(0, 0, t.canvas.width, t.canvas.height), t.clearColor(...this._backgroundColor4f), t.clear(t.COLOR_BUFFER_BIT), this._drawThese(this._drawList, y.DRAW_MODE.default, this._projection, {
      framebufferWidth: t.canvas.width,
      framebufferHeight: t.canvas.height
    }), this._snapshotCallbacks.length > 0) {
      const e = t.canvas.toDataURL();
      this._snapshotCallbacks.forEach((i) => i(e)), this._snapshotCallbacks = [];
    }
  }
  /**
   * Get the precise bounds for a Drawable.
   * @param {int} drawableID ID of Drawable to get bounds for.
   * @return {object} Bounds for a tight box around the Drawable.
   */
  getBounds(t) {
    const e = this._allDrawables[t];
    if (e.needsConvexHullPoints()) {
      const s = this._getConvexHullPointsForDrawable(t);
      e.setConvexHullPoints(s);
    }
    const i = e.getFastBounds();
    if (this._debugCanvas) {
      const s = this._gl;
      this._debugCanvas.width = s.canvas.width, this._debugCanvas.height = s.canvas.height;
      const o = this._debugCanvas.getContext("2d");
      o.drawImage(s.canvas, 0, 0), o.strokeStyle = "#FF0000";
      const l = window.devicePixelRatio;
      o.strokeRect(
        l * (i.left + this._nativeSize[0] / 2),
        l * (-i.top + this._nativeSize[1] / 2),
        l * (i.right - i.left),
        l * (-i.bottom + i.top)
      );
    }
    return i;
  }
  /**
   * Get the precise bounds for a Drawable around the top slice.
   * Used for positioning speech bubbles more closely to the sprite.
   * @param {int} drawableID ID of Drawable to get bubble bounds for.
   * @return {object} Bounds for a tight box around the Drawable top slice.
   */
  getBoundsForBubble(t) {
    const e = this._allDrawables[t];
    if (e.needsConvexHullPoints()) {
      const s = this._getConvexHullPointsForDrawable(t);
      e.setConvexHullPoints(s);
    }
    const i = e.getBoundsForBubble();
    if (this._debugCanvas) {
      const s = this._gl;
      this._debugCanvas.width = s.canvas.width, this._debugCanvas.height = s.canvas.height;
      const o = this._debugCanvas.getContext("2d");
      o.drawImage(s.canvas, 0, 0), o.strokeStyle = "#FF0000";
      const l = window.devicePixelRatio;
      o.strokeRect(
        l * (i.left + this._nativeSize[0] / 2),
        l * (-i.top + this._nativeSize[1] / 2),
        l * (i.right - i.left),
        l * (-i.bottom + i.top)
      );
    }
    return i;
  }
  /**
   * Get the current skin (costume) size of a Drawable.
   * @param {int} drawableID The ID of the Drawable to measure.
   * @return {Array<number>} Skin size, width and height.
   */
  getCurrentSkinSize(t) {
    const e = this._allDrawables[t];
    return this.getSkinSize(e.skin.id);
  }
  /**
   * Get the size of a skin by ID.
   * @param {int} skinID The ID of the Skin to measure.
   * @return {Array<number>} Skin size, width and height.
   */
  getSkinSize(t) {
    return this._allSkins[t].size;
  }
  /**
   * Get the rotation center of a skin by ID.
   * @param {int} skinID The ID of the Skin
   * @return {Array<number>} The rotationCenterX and rotationCenterY
   */
  getSkinRotationCenter(t) {
    return this._allSkins[t].calculateRotationCenter();
  }
  /**
   * Check if a particular Drawable is touching a particular color.
   * Unlike touching drawable, if the "tester" is invisble, we will still test.
   * @param {int} drawableID The ID of the Drawable to check.
   * @param {Array<int>} color3b Test if the Drawable is touching this color.
   * @param {Array<int>} [mask3b] Optionally mask the check to this part of Drawable.
   * @returns {boolean} True iff the Drawable is touching the color.
   */
  isTouchingColor(t, e, i) {
    const s = this._candidatesTouching(t, this._visibleDrawList);
    let o;
    if (St(e, this._backgroundColor3b, 0)) {
      if (o = this._touchingBounds(t), o === null) return !1;
    } else {
      if (s.length === 0)
        return !1;
      o = this._candidatesBounds(s);
    }
    const l = this._getMaxPixelsForCPU(), u = this._debugCanvas && this._debugCanvas.getContext("2d");
    u && (this._debugCanvas.width = o.width, this._debugCanvas.height = o.height), o.width * o.height * (s.length + 1) >= l && this._isTouchingColorGpuStart(t, s.map(({ id: E }) => E).reverse(), o, e, i);
    const c = this._allDrawables[t], f = se, d = un, _ = !!i;
    c.updateCPURenderAttributes();
    const w = ~y.EFFECT_INFO.ghost.mask;
    for (let E = o.bottom; E <= o.top; E++) {
      if (o.width * (E - o.bottom) * (s.length + 1) >= l)
        return this._isTouchingColorGpuFin(o, e, E - o.bottom);
      for (let g = o.left; g <= o.right; g++)
        if (f[1] = E, f[0] = g, (_ ? dn(Y.sampleColor4b(f, c, d, w), i) : c.isTouching(f)) && (B.sampleColor3b(f, s, d), u && (u.fillStyle = `rgb(${d[0]},${d[1]},${d[2]})`, u.fillRect(g - o.left, o.bottom - E, 1, 1)), St(d, e, 0)))
          return !0;
    }
    return !1;
  }
  _getMaxPixelsForCPU() {
    switch (this._useGpuMode) {
      case B.UseGpuModes.ForceCPU:
        return 1 / 0;
      case B.UseGpuModes.ForceGPU:
        return 0;
      case B.UseGpuModes.Automatic:
      default:
        return fn;
    }
  }
  _enterDrawBackground() {
    const t = this.gl, e = this._shaderManager.getShader(y.DRAW_MODE.background, 0);
    t.disable(t.BLEND), t.useProgram(e.program), x.setBuffersAndAttributes(t, e, this._bufferInfo);
  }
  _exitDrawBackground() {
    const t = this.gl;
    t.enable(t.BLEND);
  }
  _isTouchingColorGpuStart(t, e, i, s, o) {
    this._doExitDrawRegion();
    const l = this._gl;
    x.bindFramebufferInfo(l, this._queryBufferInfo), l.viewport(0, 0, i.width, i.height);
    const u = x.m4.ortho(i.left, i.right, i.top, i.bottom, -1, 1);
    l.clearColor(0, 0, 0, 0), l.clear(l.COLOR_BUFFER_BIT | l.STENCIL_BUFFER_BIT);
    let c;
    o && (c = {
      u_colorMask: [o[0] / 255, o[1] / 255, o[2] / 255],
      u_colorMaskTolerance: _n / 255
    });
    try {
      l.enable(l.STENCIL_TEST), l.stencilFunc(l.ALWAYS, 1, 1), l.stencilOp(l.KEEP, l.KEEP, l.REPLACE), l.colorMask(!1, !1, !1, !1), this._drawThese(
        [t],
        o ? y.DRAW_MODE.colorMask : y.DRAW_MODE.silhouette,
        u,
        {
          extraUniforms: c,
          ignoreVisibility: !0,
          // Touching color ignores sprite visibility,
          effectMask: ~y.EFFECT_INFO.ghost.mask
        }
      ), l.stencilFunc(l.EQUAL, 1, 1), l.stencilOp(l.KEEP, l.KEEP, l.KEEP), l.colorMask(!0, !0, !0, !0), this.enterDrawRegion(this._backgroundDrawRegionId);
      const f = {
        u_backgroundColor: this._backgroundColor4f
      }, d = this._shaderManager.getShader(y.DRAW_MODE.background, 0);
      x.setUniforms(d, f), x.drawBufferInfo(l, this._bufferInfo, l.TRIANGLES), this._drawThese(
        e,
        y.DRAW_MODE.default,
        u,
        { idFilterFunc: (_) => _ !== t }
      );
    } finally {
      l.colorMask(!0, !0, !0, !0), l.disable(l.STENCIL_TEST), this._doExitDrawRegion();
    }
  }
  _isTouchingColorGpuFin(t, e, i) {
    const s = this._gl, o = new Uint8Array(Math.floor(t.width * (t.height - i) * 4));
    if (s.readPixels(0, 0, t.width, t.height - i, s.RGBA, s.UNSIGNED_BYTE, o), this._debugCanvas) {
      this._debugCanvas.width = t.width, this._debugCanvas.height = t.height;
      const l = this._debugCanvas.getContext("2d"), u = l.getImageData(0, 0, t.width, t.height - i);
      u.data.set(o), l.putImageData(u, 0, 0);
    }
    for (let l = 0; l < o.length; l += 4)
      if (o[l + 3] !== 0 && St(e, o, l))
        return !0;
    return !1;
  }
  /**
   * Check if a particular Drawable is touching any in a set of Drawables.
   * @param {int} drawableID The ID of the Drawable to check.
   * @param {?Array<int>} candidateIDs The Drawable IDs to check, otherwise all visible drawables in the renderer
   * @returns {boolean} True if the Drawable is touching one of candidateIDs.
   */
  isTouchingDrawables(t, e = this._drawList) {
    const i = this._candidatesTouching(
      t,
      // even if passed an invisible drawable, we will NEVER touch it!
      e.filter((u) => this._allDrawables[u]._visible)
    );
    if (i.length === 0 || !this._allDrawables[t]._visible)
      return !1;
    const s = this._candidatesBounds(i), o = this._allDrawables[t], l = se;
    o.updateCPURenderAttributes();
    for (let u = s.left; u <= s.right; u++) {
      l[0] = u;
      for (let c = s.bottom; c <= s.top; c++)
        if (l[1] = c, o.isTouching(l)) {
          for (let f = 0; f < i.length; f++)
            if (i[f].drawable.isTouching(l))
              return !0;
        }
    }
    return !1;
  }
  /**
   * Convert a client based x/y position on the canvas to a Scratch 3 world space
   * Rectangle.  This creates recangles with a radius to cover selecting multiple
   * scratch pixels with touch / small render areas.
   *
   * @param {int} centerX The client x coordinate of the picking location.
   * @param {int} centerY The client y coordinate of the picking location.
   * @param {int} [width] The client width of the touch event (optional).
   * @param {int} [height] The client width of the touch event (optional).
   * @returns {Rectangle} Scratch world space rectangle, iterate bottom <= top,
   *                      left <= right.
   */
  clientSpaceToScratchBounds(t, e, i = 1, s = 1) {
    const o = this._gl, l = this._nativeSize[0] / o.canvas.clientWidth, u = this._nativeSize[1] / o.canvas.clientHeight;
    i *= l, s *= u, i = Math.max(1, Math.min(Math.round(i), nt[0])), s = Math.max(1, Math.min(Math.round(s), nt[1]));
    const c = t * l - (i - 1) / 2, f = e * u + (s - 1) / 2, d = i % 2 ? 0 : -0.5, _ = s % 2 ? 0 : -0.5, w = new M();
    return w.initFromBounds(
      Math.floor(this._xLeft + c + d),
      Math.floor(this._xLeft + c + d + i - 1),
      Math.ceil(this._yTop - f + _),
      Math.ceil(this._yTop - f + _ + s - 1)
    ), w;
  }
  /**
   * Determine if the drawable is touching a client based x/y.  Helper method for sensing
   * touching mouse-pointer.  Ignores visibility.
   *
   * @param {int} drawableID The ID of the drawable to check.
   * @param {int} centerX The client x coordinate of the picking location.
   * @param {int} centerY The client y coordinate of the picking location.
   * @param {int} [touchWidth] The client width of the touch event (optional).
   * @param {int} [touchHeight] The client height of the touch event (optional).
   * @returns {boolean} If the drawable has any pixels that would draw in the touch area
   */
  drawableTouching(t, e, i, s, o) {
    const l = this._allDrawables[t];
    if (!l)
      return !1;
    const u = this.clientSpaceToScratchBounds(e, i, s, o), c = x.v3.create();
    for (l.updateCPURenderAttributes(), c[1] = u.bottom; c[1] <= u.top; c[1]++)
      for (c[0] = u.left; c[0] <= u.right; c[0]++)
        if (l.isTouching(c))
          return !0;
    return !1;
  }
  /**
   * Detect which sprite, if any, is at the given location.
   * This function will pick all drawables that are visible, unless specific
   * candidate drawable IDs are provided.  Used for determining what is clicked
   * or dragged.  Will not select hidden / ghosted sprites.
   *
   * @param {int} centerX The client x coordinate of the picking location.
   * @param {int} centerY The client y coordinate of the picking location.
   * @param {int} [touchWidth] The client width of the touch event (optional).
   * @param {int} [touchHeight] The client height of the touch event (optional).
   * @param {Array<int>} [candidateIDs] The Drawable IDs to pick from, otherwise all visible drawables.
   * @returns {int} The ID of the topmost Drawable under the picking location, or
   * RenderConstants.ID_NONE if there is no Drawable at that location.
   */
  pick(t, e, i, s, o) {
    const l = this.clientSpaceToScratchBounds(t, e, i, s);
    if (l.left === -1 / 0 || l.bottom === -1 / 0 || (o = (o || this._drawList).filter((d) => {
      const _ = this._allDrawables[d];
      if (_.getVisible() && _.getUniforms().u_ghost !== 0) {
        const w = _.getFastBounds();
        return l.intersects(w) ? (_.updateCPURenderAttributes(), !0) : !1;
      }
      return !1;
    }), o.length === 0))
      return !1;
    const u = [], c = x.v3.create(0, 0, 0);
    for (c[1] = l.bottom; c[1] <= l.top; c[1]++)
      for (c[0] = l.left; c[0] <= l.right; c[0]++)
        for (let d = o.length - 1; d >= 0; d--) {
          const _ = o[d];
          if (this._allDrawables[_].isTouching(c)) {
            u[_] = (u[_] || 0) + 1;
            break;
          }
        }
    u[L.ID_NONE] = 0;
    let f = L.ID_NONE;
    for (const d in u)
      Object.prototype.hasOwnProperty.call(u, d) && u[d] > u[f] && (f = d);
    return Number(f);
  }
  /**
   * @typedef DrawableExtraction
   * @property {ImageData} data Raw pixel data for the drawable
   * @property {number} x The x coordinate of the drawable's bounding box's top-left corner, in 'CSS pixels'
   * @property {number} y The y coordinate of the drawable's bounding box's top-left corner, in 'CSS pixels'
   * @property {number} width The drawable's bounding box width, in 'CSS pixels'
   * @property {number} height The drawable's bounding box height, in 'CSS pixels'
   */
  /**
   * Return a drawable's pixel data and bounds in screen space.
   * @param {int} drawableID The ID of the drawable to get pixel data for
   * @return {DrawableExtraction} Data about the picked drawable
   */
  extractDrawableScreenSpace(t) {
    const e = this._allDrawables[t];
    if (!e) throw new Error(`Could not extract drawable with ID ${t}; it does not exist`);
    this._doExitDrawRegion();
    const i = this._nativeSize[0] * 0.5, s = this._nativeSize[1] * 0.5, o = e.getFastBounds(), l = this.canvas, u = l.width / this._nativeSize[0], c = new M();
    c.initFromBounds(
      (o.left + i) * u,
      (o.right + i) * u,
      // in "canvas space", +y is down, but Rectangle methods assume bottom < top, so swap them
      (s - o.top) * u,
      (s - o.bottom) * u
    ), c.snapToInt(), o.initFromBounds(
      c.left / u - i,
      c.right / u - i,
      s - c.top / u,
      s - c.bottom / u
    );
    const f = this._gl, d = f.getParameter(f.MAX_TEXTURE_SIZE), _ = Math.min(re, c.width, d), w = Math.min(re, c.height, d), E = x.createFramebufferInfo(f, [{ format: f.RGBA }], _, w);
    try {
      x.bindFramebufferInfo(f, E), f.viewport(0, 0, _, w);
      const g = x.m4.ortho(
        o.left,
        o.right,
        o.top,
        o.bottom,
        -1,
        1
      );
      f.clearColor(0, 0, 0, 0), f.clear(f.COLOR_BUFFER_BIT), this._drawThese(
        [t],
        y.DRAW_MODE.straightAlpha,
        g,
        {
          // Don't apply the ghost effect. TODO: is this an intentional design decision?
          effectMask: ~y.EFFECT_INFO.ghost.mask,
          // We're doing this in screen-space, so the framebuffer dimensions should be those of the canvas in
          // screen-space. This is used to ensure SVG skins are rendered at the proper resolution.
          framebufferWidth: l.width,
          framebufferHeight: l.height
        }
      );
      const m = new Uint8Array(Math.floor(_ * w * 4));
      f.readPixels(0, 0, _, w, f.RGBA, f.UNSIGNED_BYTE, m);
      const k = new ImageData(new Uint8ClampedArray(m.buffer), _, w), T = l.getBoundingClientRect().width / l.width;
      return {
        imageData: k,
        x: c.left * T,
        y: c.bottom * T,
        width: c.width * T,
        height: c.height * T
      };
    } finally {
      f.deleteFramebuffer(E.framebuffer);
    }
  }
  /**
   * @typedef ColorExtraction
   * @property {Uint8Array} data Raw pixel data for the drawable
   * @property {int} width Drawable bounding box width
   * @property {int} height Drawable bounding box height
   * @property {object} color Color object with RGBA properties at picked location
   */
  /**
   * Return drawable pixel data and color at a given position
   * @param {int} x The client x coordinate of the picking location.
   * @param {int} y The client y coordinate of the picking location.
   * @param {int} radius The client radius to extract pixels with.
   * @return {?ColorExtraction} Data about the picked color
   */
  extractColor(t, e, i) {
    this._doExitDrawRegion();
    const s = Math.round(this._nativeSize[0] * (t / this._gl.canvas.clientWidth - 0.5)), o = Math.round(-this._nativeSize[1] * (e / this._gl.canvas.clientHeight - 0.5)), l = this._gl;
    x.bindFramebufferInfo(l, this._queryBufferInfo);
    const u = new M();
    u.initFromBounds(s - i, s + i, o - i, o + i);
    const c = s - u.left, f = u.top - o;
    l.viewport(0, 0, u.width, u.height);
    const d = x.m4.ortho(u.left, u.right, u.top, u.bottom, -1, 1);
    l.clearColor(...this._backgroundColor4f), l.clear(l.COLOR_BUFFER_BIT), this._drawThese(this._drawList, y.DRAW_MODE.default, d);
    const _ = new Uint8Array(Math.floor(u.width * u.height * 4));
    l.readPixels(0, 0, u.width, u.height, l.RGBA, l.UNSIGNED_BYTE, _);
    const w = Math.floor(4 * (f * u.width + c)), E = {
      r: _[w],
      g: _[w + 1],
      b: _[w + 2],
      a: _[w + 3]
    };
    if (this._debugCanvas) {
      this._debugCanvas.width = u.width, this._debugCanvas.height = u.height;
      const g = this._debugCanvas.getContext("2d"), m = g.createImageData(u.width, u.height);
      m.data.set(_), g.putImageData(m, 0, 0), g.strokeStyle = "black", g.fillStyle = `rgba(${E.r}, ${E.g}, ${E.b}, ${E.a})`, g.rect(c - 4, f - 4, 8, 8), g.fill(), g.stroke();
    }
    return {
      data: _,
      width: u.width,
      height: u.height,
      color: E
    };
  }
  /**
   * Get the candidate bounding box for a touching query.
   * @param {int} drawableID ID for drawable of query.
   * @return {?Rectangle} Rectangle bounds for touching query, or null.
   */
  _touchingBounds(t) {
    const e = this._allDrawables[t];
    if (!e.skin || !e.skin.getTexture([100, 100])) return null;
    const i = e.getFastBounds();
    return i.clamp(this._xLeft, this._xRight, this._yBottom, this._yTop), i.snapToInt(), i.width === 0 || i.height === 0 ? null : i;
  }
  /**
   * Filter a list of candidates for a touching query into only those that
   * could possibly intersect the given bounds.
   * @param {int} drawableID - ID for drawable of query.
   * @param {Array<int>} candidateIDs - Candidates for touching query.
   * @return {?Array< {id, drawable, intersection} >} Filtered candidates with useful data.
   */
  _candidatesTouching(t, e) {
    const i = this._touchingBounds(t), s = [];
    if (i === null)
      return s;
    for (let o = e.length - 1; o >= 0; o--) {
      const l = e[o];
      if (l !== t) {
        const u = this._allDrawables[l];
        if (u.skin instanceof et) continue;
        if (u.skin && u._visible) {
          u.updateCPURenderAttributes();
          const c = u.getFastBounds();
          c.snapToInt(), i.intersects(c) && s.push({
            id: l,
            drawable: u,
            intersection: M.intersect(i, c)
          });
        }
      }
    }
    return s;
  }
  /**
   * Helper to get the union bounds from a set of candidates returned from the above method
   * @private
   * @param {Array<object>} candidates info from _candidatesTouching
   * @return {Rectangle} the outer bounding box union
   */
  _candidatesBounds(t) {
    return t.reduce((e, { intersection: i }) => e ? M.union(e, i, hn) : i, null);
  }
  /**
   * Update a drawable's skin.
   * @param {number} drawableID The drawable's id.
   * @param {number} skinId The skin to update to.
   */
  updateDrawableSkinId(t, e) {
    const i = this._allDrawables[t];
    i && (i.skin = this._allSkins[e]);
  }
  /**
   * Update a drawable's position.
   * @param {number} drawableID The drawable's id.
   * @param {Array.<number>} position The new position.
   */
  updateDrawablePosition(t, e) {
    const i = this._allDrawables[t];
    i && i.updatePosition(e);
  }
  /**
   * Update a drawable's direction.
   * @param {number} drawableID The drawable's id.
   * @param {number} direction A new direction.
   */
  updateDrawableDirection(t, e) {
    const i = this._allDrawables[t];
    i && i.updateDirection(e);
  }
  /**
   * Update a drawable's scale.
   * @param {number} drawableID The drawable's id.
   * @param {Array.<number>} scale A new scale.
   */
  updateDrawableScale(t, e) {
    const i = this._allDrawables[t];
    i && i.updateScale(e);
  }
  /**
   * Update a drawable's direction and scale together.
   * @param {number} drawableID The drawable's id.
   * @param {number} direction A new direction.
   * @param {Array.<number>} scale A new scale.
   */
  updateDrawableDirectionScale(t, e, i) {
    const s = this._allDrawables[t];
    s && (s.updateDirection(e), s.updateScale(i));
  }
  /**
   * Update a drawable's visibility.
   * @param {number} drawableID The drawable's id.
   * @param {boolean} visible Will the drawable be visible?
   */
  updateDrawableVisible(t, e) {
    const i = this._allDrawables[t];
    i && i.updateVisible(e);
  }
  /**
   * Update a drawable's visual effect.
   * @param {number} drawableID The drawable's id.
   * @param {string} effectName The effect to change.
   * @param {number} value A new effect value.
   */
  updateDrawableEffect(t, e, i) {
    const s = this._allDrawables[t];
    s && s.updateEffect(e, i);
  }
  /**
   * Update the position, direction, scale, or effect properties of this Drawable.
   * @deprecated Use specific updateDrawable* methods instead.
   * @param {int} drawableID The ID of the Drawable to update.
   * @param {object.<string,*>} properties The new property values to set.
   */
  updateDrawableProperties(t, e) {
    const i = this._allDrawables[t];
    i && ("skinId" in e && this.updateDrawableSkinId(t, e.skinId), i.updateProperties(e));
  }
  /**
   * Update the position object's x & y members to keep the drawable fenced in view.
   * @param {int} drawableID - The ID of the Drawable to update.
   * @param {Array.<number, number>} position to be fenced - An array of type [x, y]
   * @return {Array.<number, number>} The fenced position as an array [x, y]
   */
  getFencedPositionOfDrawable(t, e) {
    let i = e[0], s = e[1];
    const o = this._allDrawables[t];
    if (!o)
      return [i, s];
    const l = i - o._position[0], u = s - o._position[1], c = o._skin.getFenceBounds(o, cn), f = Math.floor(Math.min(c.width, c.height) / 2), d = this._xRight - Math.min(oe, f);
    c.right + l < -d ? i = Math.ceil(o._position[0] - (d + c.right)) : c.left + l > d && (i = Math.floor(o._position[0] + (d - c.left)));
    const _ = this._yTop - Math.min(oe, f);
    return c.top + u < -_ ? s = Math.ceil(o._position[1] - (_ + c.top)) : c.bottom + u > _ && (s = Math.floor(o._position[1] + (_ - c.bottom))), [i, s];
  }
  /**
   * Clear a pen layer.
   * @param {int} penSkinID - the unique ID of a Pen Skin.
   */
  penClear(t) {
    /** @type {PenSkin} */
    this._allSkins[t].clear();
  }
  /**
   * Draw a point on a pen layer.
   * @param {int} penSkinID - the unique ID of a Pen Skin.
   * @param {PenAttributes} penAttributes - how the point should be drawn.
   * @param {number} x - the X coordinate of the point to draw.
   * @param {number} y - the Y coordinate of the point to draw.
   */
  penPoint(t, e, i, s) {
    /** @type {PenSkin} */
    this._allSkins[t].drawPoint(e, i, s);
  }
  /**
   * Draw a line on a pen layer.
   * @param {int} penSkinID - the unique ID of a Pen Skin.
   * @param {PenAttributes} penAttributes - how the line should be drawn.
   * @param {number} x0 - the X coordinate of the beginning of the line.
   * @param {number} y0 - the Y coordinate of the beginning of the line.
   * @param {number} x1 - the X coordinate of the end of the line.
   * @param {number} y1 - the Y coordinate of the end of the line.
   */
  penLine(t, e, i, s, o, l) {
    /** @type {PenSkin} */
    this._allSkins[t].drawLine(e, i, s, o, l);
  }
  /**
   * Stamp a Drawable onto a pen layer.
   * @param {int} penSkinID - the unique ID of a Pen Skin.
   * @param {int} stampID - the unique ID of the Drawable to use as the stamp.
   */
  penStamp(t, e) {
    if (!this._allDrawables[e])
      return;
    const s = this._touchingBounds(e);
    if (!s)
      return;
    this._doExitDrawRegion();
    const o = (
      /** @type {PenSkin} */
      this._allSkins[t]
    ), l = this._gl;
    x.bindFramebufferInfo(l, o._framebuffer), l.viewport(
      this._nativeSize[0] * 0.5 + s.left,
      this._nativeSize[1] * 0.5 - s.top,
      s.width,
      s.height
    );
    const u = x.m4.ortho(s.left, s.right, s.top, s.bottom, -1, 1);
    this._drawThese([e], y.DRAW_MODE.default, u, { ignoreVisibility: !0 }), o._silhouetteDirty = !0;
  }
  /* ******
   * Truly internal functions: these support the functions above.
   ********/
  /**
   * Build geometry (vertex and index) buffers.
   * @private
   */
  _createGeometry() {
    const t = {
      a_position: {
        numComponents: 2,
        data: [
          -0.5,
          -0.5,
          0.5,
          -0.5,
          -0.5,
          0.5,
          -0.5,
          0.5,
          0.5,
          -0.5,
          0.5,
          0.5
        ]
      },
      a_texCoord: {
        numComponents: 2,
        data: [
          1,
          0,
          0,
          0,
          1,
          1,
          1,
          1,
          0,
          0,
          0,
          1
        ]
      }
    };
    this._bufferInfo = x.createBufferInfoFromArrays(this._gl, t);
  }
  /**
   * Respond to a change in the "native" rendering size. The native size is used by buffers which are fixed in size
   * regardless of the size of the main render target. This includes the buffers used for queries such as picking and
   * color-touching. The fixed size allows (more) consistent behavior across devices and presentation modes.
   * @param {object} event - The change event.
   * @private
   */
  onNativeSizeChanged(t) {
    const [e, i] = t.newSize, s = this._gl, o = [
      { format: s.RGBA },
      { format: s.DEPTH_STENCIL }
    ];
    this._pickBufferInfo || (this._pickBufferInfo = x.createFramebufferInfo(s, o, nt[0], nt[1])), this._queryBufferInfo ? x.resizeFramebufferInfo(s, this._queryBufferInfo, o, e, i) : this._queryBufferInfo = x.createFramebufferInfo(s, o, e, i);
  }
  /**
   * Enter a draw region.
   *
   * A draw region is where multiple draw operations are performed with the
   * same GL state. WebGL performs poorly when it changes state like blend
   * mode. Marking a collection of state values as a "region" the renderer
   * can skip superfluous extra state calls when it is already in that
   * region. Since one region may be entered from within another a exit
   * handle can also be registered that is called when a new region is about
   * to be entered to restore a common inbetween state.
   *
   * @param {any} regionId - id of the region to enter
   * @param {function} enter - handle to call when first entering a region
   * @param {function} exit - handle to call when leaving a region
   */
  enterDrawRegion(t, e = t.enter, i = t.exit) {
    this._regionId !== t && (this._doExitDrawRegion(), this._regionId = t, e(), this._exitRegion = i);
  }
  /**
   * Forcefully exit the current region returning to a common inbetween GL
   * state.
   */
  _doExitDrawRegion() {
    this._exitRegion !== null && this._exitRegion(), this._exitRegion = null, this._regionId = null;
  }
  /**
   * Draw a set of Drawables, by drawable ID
   * @param {Array<int>} drawables The Drawable IDs to draw, possibly this._drawList.
   * @param {ShaderManager.DRAW_MODE} drawMode Draw normally, silhouette, etc.
   * @param {module:twgl/m4.Mat4} projection The projection matrix to use.
   * @param {object} [opts] Options for drawing
   * @param {idFilterFunc} opts.filter An optional filter function.
   * @param {object.<string,*>} opts.extraUniforms Extra uniforms for the shaders.
   * @param {int} opts.effectMask Bitmask for effects to allow
   * @param {boolean} opts.ignoreVisibility Draw all, despite visibility (e.g. stamping, touching color)
   * @param {int} opts.framebufferWidth The width of the framebuffer being drawn onto. Defaults to "native" width
   * @param {int} opts.framebufferHeight The height of the framebuffer being drawn onto. Defaults to "native" height
   * @private
   */
  _drawThese(t, e, i, s = {}) {
    const o = this._gl;
    let l = null;
    const u = "framebufferWidth" in s && "framebufferHeight" in s && s.framebufferWidth !== this._nativeSize[0] && s.framebufferHeight !== this._nativeSize[1], c = t.length;
    for (let f = 0; f < c; ++f) {
      const d = t[f];
      if (s.filter && !s.filter(d)) continue;
      const _ = this._allDrawables[d];
      if (!_.getVisible() && !s.ignoreVisibility) continue;
      const w = u ? [
        _.scale[0] * s.framebufferWidth / this._nativeSize[0],
        _.scale[1] * s.framebufferHeight / this._nativeSize[1]
      ] : _.scale;
      if (!_.skin || !_.skin.getTexture(w)) continue;
      const E = {};
      let g = _.enabledEffects;
      g &= Object.prototype.hasOwnProperty.call(s, "effectMask") ? s.effectMask : g;
      const m = this._shaderManager.getShader(e, g);
      this._regionId !== m && (this._doExitDrawRegion(), this._regionId = m, l = m, o.useProgram(l.program), x.setBuffersAndAttributes(o, l, this._bufferInfo), Object.assign(E, {
        u_projectionMatrix: i
      })), Object.assign(
        E,
        _.skin.getUniforms(w),
        _.getUniforms()
      ), s.extraUniforms && Object.assign(E, s.extraUniforms), E.u_skin && x.setTextureParameters(
        o,
        E.u_skin,
        {
          minMag: _.skin.useNearest(w, _) ? o.NEAREST : o.LINEAR
        }
      ), x.setUniforms(l, E), x.drawBufferInfo(o, this._bufferInfo, o.TRIANGLES);
    }
    this._regionId = null;
  }
  /**
   * Get the convex hull points for a particular Drawable.
   * To do this, calculate it based on the drawable's Silhouette.
   * @param {int} drawableID The Drawable IDs calculate convex hull for.
   * @return {Array<Array<number>>} points Convex hull points, as [[x, y], ...]
   */
  _getConvexHullPointsForDrawable(t) {
    const e = this._allDrawables[t], [i, s] = e.skin.size;
    if (!e.getVisible() || i === 0 || s === 0)
      return [];
    e.updateCPURenderAttributes();
    const o = function(g, m, k) {
      return (m[0] - g[0]) * (k[1] - g[1]) - (m[1] - g[1]) * (k[0] - g[0]);
    }, l = [], u = [];
    let c = -1, f = -1;
    const d = x.v3.create(), _ = x.v3.create();
    let w;
    for (let g = 0; g < s; g++) {
      d[1] = g / s;
      let m = 0;
      for (; m < i; m++)
        if (d[0] = m / i, lt.transformPoint(e, d, _), e.skin.isTouchingLinear(_)) {
          w = [m, g];
          break;
        }
      if (!(m >= i)) {
        for (; c > 0 && !(o(l[c], l[c - 1], w) > 0); )
          --c;
        for (l[++c] = w, m = i - 1; m >= 0; m--)
          if (d[0] = m / i, lt.transformPoint(e, d, _), e.skin.isTouchingLinear(_)) {
            w = [m, g];
            break;
          }
        for (; f > 0 && !(o(u[f], u[f - 1], w) < 0); )
          --f;
        u[++f] = w;
      }
    }
    const E = l;
    E.length = c + 1;
    for (let g = f; g >= 0; --g)
      E.push(u[g]);
    return ye(E, 1 / 0);
  }
  /**
   * Sample a "final" color from an array of drawables at a given scratch space.
   * Will blend any alpha values with the drawables "below" it.
   * @param {twgl.v3} vec Scratch Vector Space to sample
   * @param {Array<Drawables>} drawables A list of drawables with the "top most"
   *              drawable at index 0
   * @param {Uint8ClampedArray} dst The color3b space to store the answer in.
   * @return {Uint8ClampedArray} The dst vector with everything blended down.
   */
  static sampleColor3b(t, e, i) {
    i = i || new Uint8ClampedArray(3), i.fill(0);
    let s = 1;
    for (let o = 0; s !== 0 && o < e.length; o++)
      Y.sampleColor4b(t, e[o].drawable, j), i[0] += j[0] * s, i[1] += j[1] * s, i[2] += j[2] * s, s *= 1 - j[3] / 255;
    return i[0] += s * 255, i[1] += s * 255, i[2] += s * 255, i;
  }
  /**
   * @callback RenderWebGL#snapshotCallback
   * @param {string} dataURI Data URI of the snapshot of the renderer
   */
  /**
   * @param {snapshotCallback} callback Function called in the next frame with the snapshot data
   */
  requestSnapshot(t) {
    this._snapshotCallbacks.push(t);
  }
}
B.prototype.canHazPixels = B.prototype.extractDrawableScreenSpace;
B.UseGpuModes = {
  /**
   * Heuristically decide whether to use the GPU path, the CPU path, or a dynamic mixture of the two.
   */
  Automatic: "Automatic",
  /**
   * Always use the GPU path.
   */
  ForceGPU: "ForceGPU",
  /**
   * Always use the CPU path.
   */
  ForceCPU: "ForceCPU"
};
export {
  B as default
};
