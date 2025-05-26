import bt from "events";
import yt from "hull.js";
import * as Et from "twgl.js";
import f from "twgl.js";
import { loadSvgString as Ct, serializeSvgToString as Dt } from "scratch-svg-renderer";
import It from "linebreak";
import kt from "grapheme-breaker";
const x = {
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
let q;
const U = (h, t) => t ^ (h ^ t) & h - t >> 31, G = (h, t) => h ^ (h ^ t) & h - t >> 31, M = ({ _width: h, _height: t, _colorData: e }, i, s) => i >= h || s >= t || i < 0 || s < 0 ? 0 : e[(s * h + i) * 4 + 3], R = [
  new Uint8ClampedArray(4),
  new Uint8ClampedArray(4),
  new Uint8ClampedArray(4),
  new Uint8ClampedArray(4)
], at = ({ _width: h, _height: t, _colorData: e }, i, s, n) => {
  if (i = G(0, U(i, h - 1)), s = G(0, U(s, t - 1)), i >= h || s >= t || i < 0 || s < 0)
    return n.fill(0);
  const r = (s * h + i) * 4, a = e[r + 3] / 255;
  return n[0] = e[r] * a, n[1] = e[r + 1] * a, n[2] = e[r + 2] * a, n[3] = e[r + 3], n;
}, Mt = ({ _width: h, _height: t, _colorData: e }, i, s, n) => {
  i = G(0, U(i, h - 1)), s = G(0, U(s, t - 1));
  const r = (s * h + i) * 4;
  return n[0] = e[r], n[1] = e[r + 1], n[2] = e[r + 2], n[3] = e[r + 3], n;
};
class st {
  constructor() {
    this._width = 0, this._height = 0, this._colorData = null, this._getColor = at, this.colorAtNearest = this.colorAtLinear = (t, e) => e.fill(0);
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
      const s = st._updateCanvas(), n = this._width = s.width = t.width, r = this._height = s.height = t.height, a = s.getContext("2d");
      if (!(n && r))
        return;
      a.clearRect(0, 0, n, r), a.drawImage(t, 0, 0, n, r), i = a.getImageData(0, 0, n, r);
    }
    e ? this._getColor = Mt : this._getColor = at, this._colorData = i.data, delete this.colorAtNearest, delete this.colorAtLinear;
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
    const i = t[0] * (this._width - 1), s = t[1] * (this._height - 1), n = i % 1, r = s % 1, a = 1 - n, o = 1 - r, l = Math.floor(i), c = Math.floor(s), u = this._getColor(this, l, c, R[0]), _ = this._getColor(this, l + 1, c, R[1]), g = this._getColor(this, l, c + 1, R[2]), d = this._getColor(this, l + 1, c + 1, R[3]);
    return e[0] = u[0] * a * o + g[0] * a * r + _[0] * n * o + d[0] * n * r, e[1] = u[1] * a * o + g[1] * a * r + _[1] * n * o + d[1] * n * r, e[2] = u[2] * a * o + g[2] * a * r + _[2] * n * o + d[2] * n * r, e[3] = u[3] * a * o + g[3] * a * r + _[3] * n * o + d[3] * n * r, e;
  }
  /**
   * Test if texture coordinate touches the silhouette using nearest neighbor.
   * @param {twgl.v3} vec A texture coordinate.
   * @return {boolean} If the nearest pixel has an alpha value.
   */
  isTouchingNearest(t) {
    if (this._colorData)
      return M(
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
    return M(this, e, i) > 0 || M(this, e + 1, i) > 0 || M(this, e, i + 1) > 0 || M(this, e + 1, i + 1) > 0;
  }
  /**
   * Get the canvas element reused by Silhouettes to update their data with.
   * @private
   * @return {CanvasElement} A canvas to draw bitmap data to.
   */
  static _updateCanvas() {
    return typeof q == "undefined" && (q = document.createElement("canvas")), q;
  }
}
class v extends bt {
  /**
   * Create a Skin, which stores and/or generates textures for use in rendering.
   * @param {int} id - The unique ID for this Skin.
   * @constructor
   */
  constructor(t) {
    super(), this._id = t, this._rotationCenter = f.v3.create(0, 0), this._texture = null, this._uniforms = {
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
    }, this._silhouette = new st(), this.setMaxListeners(x.SKIN_SHARE_SOFT_LIMIT);
  }
  /**
   * Dispose of this object. Do not use it after calling this method.
   */
  dispose() {
    this._id = x.ID_NONE;
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
      this._emptyImageTexture = f.createTexture(t, e);
    }
    this._rotationCenter[0] = 0, this._rotationCenter[1] = 0, this._silhouette.update(this._emptyImageData), this.emit(v.Events.WasAltered);
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
v.Events = {
  /**
   * Emitted when anything about the Skin has been altered, such as the appearance or rotation center.
   * @event Skin.event:WasAltered
   */
  WasAltered: "WasAltered"
};
class O extends v {
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
    let n = t;
    if (t instanceof HTMLCanvasElement && (n = t.getContext("2d").getImageData(0, 0, t.width, t.height)), this._texture === null) {
      const r = {
        auto: !1,
        wrap: s.CLAMP_TO_EDGE
      };
      this._texture = f.createTexture(s, r);
    }
    this._setTexture(n), this._costumeResolution = e || 2, this._textureSize = O._getBitmapSize(t), typeof i == "undefined" && (i = this.calculateRotationCenter()), this._rotationCenter[0] = i[0], this._rotationCenter[1] = i[1], this.emit(v.Events.WasAltered);
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
class m {
  /**
   * @param {WebGLRenderingContext} gl WebGL rendering context to create shaders for
   * @constructor
   */
  constructor(t) {
    this._gl = t, this._shaderCache = {};
    for (const e in m.DRAW_MODE)
      Object.prototype.hasOwnProperty.call(m.DRAW_MODE, e) && (this._shaderCache[e] = []);
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
    t === m.DRAW_MODE.silhouette && (e &= ~(m.EFFECT_INFO.color.mask | m.EFFECT_INFO.brightness.mask));
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
    const i = m.EFFECTS.length, s = [
      `#define DRAW_MODE_${t}`
    ];
    for (let o = 0; o < i; ++o)
      e & 1 << o && s.push(`#define ENABLE_${m.EFFECTS[o]}`);
    const n = `${s.join(`
`)}
`, r = n + require("raw-loader!./shaders/sprite.vert"), a = n + require("raw-loader!./shaders/sprite.frag");
    return f.createProgramInfo(this._gl, [r, a]);
  }
}
m.EFFECT_INFO = {
  /** Color effect */
  color: {
    uniformName: "u_color",
    mask: 1,
    converter: (h) => h / 200 % 1,
    shapeChanges: !1
  },
  /** Fisheye effect */
  fisheye: {
    uniformName: "u_fisheye",
    mask: 2,
    converter: (h) => Math.max(0, (h + 100) / 100),
    shapeChanges: !0
  },
  /** Whirl effect */
  whirl: {
    uniformName: "u_whirl",
    mask: 4,
    converter: (h) => -h * Math.PI / 180,
    shapeChanges: !0
  },
  /** Pixelate effect */
  pixelate: {
    uniformName: "u_pixelate",
    mask: 8,
    converter: (h) => Math.abs(h) / 10,
    shapeChanges: !0
  },
  /** Mosaic effect */
  mosaic: {
    uniformName: "u_mosaic",
    mask: 16,
    converter: (h) => (h = Math.round((Math.abs(h) + 10) / 10), Math.max(1, Math.min(h, 512))),
    shapeChanges: !0
  },
  /** Brightness effect */
  brightness: {
    uniformName: "u_brightness",
    mask: 32,
    converter: (h) => Math.max(-100, Math.min(h, 100)) / 100,
    shapeChanges: !1
  },
  /** Ghost effect */
  ghost: {
    uniformName: "u_ghost",
    mask: 64,
    converter: (h) => 1 - Math.max(0, Math.min(h, 100)) / 100,
    shapeChanges: !1
  }
};
m.EFFECTS = Object.keys(m.EFFECT_INFO);
m.DRAW_MODE = {
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
const X = {
  color4f: [0, 0, 1, 1],
  diameter: 1
}, F = [0, 0, 0, 0];
class Ft extends v {
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
    }, this._lineBufferInfo = f.createBufferInfoFromArrays(this._renderer.gl, {
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
    this._lineShader = this._renderer._shaderManager.getShader(m.DRAW_MODE.line, i), this.onNativeSizeChanged = this.onNativeSizeChanged.bind(this), this._renderer.on(x.Events.NativeSizeChanged, this.onNativeSizeChanged), this._setCanvasSize(e.getNativeSize());
  }
  /**
   * Dispose of this object. Do not use it after calling this method.
   */
  dispose() {
    this._renderer.removeListener(x.Events.NativeSizeChanged, this.onNativeSizeChanged), this._renderer.gl.deleteTexture(this._texture), this._texture = null, super.dispose();
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
  drawLine(t, e, i, s, n) {
    const r = t.diameter || X.diameter, a = r === 1 || r === 3 ? 0.5 : 0;
    this._drawLineOnBuffer(
      t,
      e + a,
      i + a,
      s + a,
      n + a
    ), this._silhouetteDirty = !0;
  }
  /**
   * Prepare to draw lines in the _lineOnBufferDrawRegionId region.
   */
  _enterDrawLineOnBuffer() {
    const t = this._renderer.gl;
    f.bindFramebufferInfo(t, this._framebuffer), t.viewport(0, 0, this._size[0], this._size[1]);
    const e = this._lineShader;
    t.useProgram(e.program), f.setBuffersAndAttributes(t, e, this._lineBufferInfo);
    const i = {
      u_skin: this._texture,
      u_stageSize: this._size
    };
    f.setUniforms(e, i);
  }
  /**
   * Return to a base state from _lineOnBufferDrawRegionId.
   */
  _exitDrawLineOnBuffer() {
    const t = this._renderer.gl;
    f.bindFramebufferInfo(t, null);
  }
  /**
   * Prepare to do things with this PenSkin's framebuffer
   */
  _enterUsePenBuffer() {
    f.bindFramebufferInfo(this._renderer.gl, this._framebuffer);
  }
  /**
   * Return to a base state
   */
  _exitUsePenBuffer() {
    f.bindFramebufferInfo(this._renderer.gl, null);
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
  _drawLineOnBuffer(t, e, i, s, n) {
    const r = this._renderer.gl, a = this._lineShader;
    this._renderer.enterDrawRegion(this._lineOnBufferDrawRegionId);
    const o = t.color4f || X.color4f;
    F[0] = o[0] * o[3], F[1] = o[1] * o[3], F[2] = o[2] * o[3], F[3] = o[3];
    const l = s - e, c = n - i, u = Math.sqrt(l * l + c * c), _ = {
      u_lineColor: F,
      u_lineThickness: t.diameter || X.diameter,
      u_lineLength: u,
      u_penPoints: [e, -i, l, -c]
    };
    f.setUniforms(a, _), f.drawBufferInfo(r, this._lineBufferInfo, r.TRIANGLES), this._silhouetteDirty = !0;
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
    this._texture = f.createTexture(
      s,
      {
        mag: s.NEAREST,
        min: s.NEAREST,
        wrap: s.CLAMP_TO_EDGE,
        width: e,
        height: i
      }
    );
    const n = [
      {
        format: s.RGBA,
        attachment: this._texture
      }
    ];
    this._framebuffer ? f.resizeFramebufferInfo(s, this._framebuffer, n, e, i) : this._framebuffer = f.createFramebufferInfo(s, n, e, i), s.clearColor(0, 0, 0, 0), s.clear(s.COLOR_BUFFER_BIT), this._silhouettePixels = new Uint8Array(Math.floor(e * i * 4)), this._silhouetteImageData = new ImageData(e, i), this._silhouetteDirty = !0;
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
const Pt = 2048, ht = 8;
class K extends v {
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
    return e.enabledEffects & (m.EFFECT_INFO.fisheye.mask | m.EFFECT_INFO.whirl.mask | m.EFFECT_INFO.pixelate.mask | m.EFFECT_INFO.mosaic.mask) || e._direction % 90 !== 0 ? !1 : Math.abs(t[0]) > 99 && Math.abs(t[0]) < 101 && Math.abs(t[1]) > 99 && Math.abs(t[1]) < 101;
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
    const s = this._context.getImageData(0, 0, this._canvas.width, this._canvas.height), n = {
      auto: !1,
      wrap: this._renderer.gl.CLAMP_TO_EDGE,
      src: s,
      premultiplyAlpha: !0
    }, r = f.createTexture(this._renderer.gl, n);
    return this._largestMIPScale < t && (this._silhouette.update(s), this._largestMIPScale = t), r;
  }
  updateSilhouette(t = [100, 100]) {
    this.getTexture(t);
  }
  /**
   * @param {Array<number>} scale - The scaling factors to be used, each in the [0,100] range.
   * @return {WebGLTexture} The GL texture representation of this skin when drawing at the given scale.
   */
  getTexture(t) {
    const e = t ? Math.max(Math.abs(t[0]), Math.abs(t[1])) : 100, i = Math.min(e / 100, this._maxTextureScale), s = Math.max(Math.ceil(Math.log2(i)) + ht, 0), n = Math.pow(2, s - ht);
    return this._svgImageLoaded && !this._scaledMIPs[s] && (this._scaledMIPs[s] = this.createMIP(n)), this._scaledMIPs[s] || super.getTexture();
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
    const i = Ct(t), s = Dt(
      i,
      !0
      /* shouldInjectFonts */
    );
    this._svgImageLoaded = !1;
    const { x: n, y: r, width: a, height: o } = i.viewBox.baseVal;
    this._size[0] = a, this._size[1] = o, this._svgImage.onload = () => {
      if (a === 0 || o === 0) {
        super.setEmptyImageData();
        return;
      }
      const l = Math.ceil(Math.max(a, o));
      let c = 2;
      for (c; l * c <= Pt; c *= 2)
        this._maxTextureScale = c;
      this.resetMIPs(), typeof e == "undefined" && (e = this.calculateRotationCenter()), this._rotationCenter[0] = e[0] - n, this._rotationCenter[1] = e[1] - r, this._svgImageLoaded = !0, this.emit(v.Events.WasAltered);
    }, this._svgImage.src = `data:image/svg+xml;utf8,${encodeURIComponent(s)}`;
  }
}
class Nt {
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
    const s = this._measurementProvider.beginMeasurementSession(), n = new It(e);
    let r = 0, a, o = null;
    const l = [];
    for (; a = n.nextBreak(); ) {
      const c = e.slice(r, a.position).replace(/\n+$/, "");
      let u = (o || "").concat(c), _ = this._measurementProvider.measureText(u);
      if (_ > t)
        if (this._measurementProvider.measureText(c) > t) {
          let d = 0, p;
          for (; d !== (p = kt.nextBreak(c, d)); ) {
            const S = c.substring(d, p);
            u = (o || "").concat(S), _ = this._measurementProvider.measureText(u), o === null || _ <= t ? o = u : (l.push(o), o = S), d = p;
          }
        } else
          o !== null && l.push(o), o = c;
      else
        o = u;
      a.required && (o !== null && l.push(o), o = null), r = a.position;
    }
    return o = o || "", (o.length > 0 || l.length === 0) && l.push(o), this._cache[i] = l, this._measurementProvider.endMeasurementSession(s), l;
  }
}
class Ot {
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
const w = {
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
class L extends v {
  /**
   * Create a new text bubble skin.
   * @param {!int} id - The ID for this Skin.
   * @param {!RenderWebGL} renderer - The renderer which will use this skin.
   * @constructor
   * @extends Skin
   */
  constructor(t, e) {
    super(t), this._renderer = e, this._canvas = document.createElement("canvas"), this._size = [0, 0], this._renderedScale = 0, this._lines = [], this._textAreaSize = { width: 0, height: 0 }, this._bubbleType = "", this._pointsLeft = !1, this._textDirty = !0, this._textureDirty = !0, this.measurementProvider = new Ot(this._canvas.getContext("2d")), this.textWrapper = new Nt(this.measurementProvider), this._restyleCanvas();
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
    this._text = e, this._bubbleType = t, this._pointsLeft = i, this._textDirty = !0, this._textureDirty = !0, this.emit(v.Events.WasAltered);
  }
  /**
   * Re-style the canvas after resizing it. This is necessary to ensure proper text measurement.
   */
  _restyleCanvas() {
    this._canvas.getContext("2d").font = `${w.FONT_SIZE}px ${w.FONT}, sans-serif`;
  }
  /**
   * Update the array of wrapped lines and the text dimensions.
   */
  _reflowLines() {
    this._lines = this.textWrapper.wrapText(w.MAX_LINE_WIDTH, this._text);
    let t = 0;
    for (const s of this._lines)
      t = Math.max(t, this.measurementProvider.measureText(s));
    const e = Math.max(t, w.MIN_WIDTH) + w.PADDING * 2, i = w.LINE_HEIGHT * this._lines.length + w.PADDING * 2;
    this._textAreaSize.width = e, this._textAreaSize.height = i, this._size[0] = e + w.STROKE_WIDTH, this._size[1] = i + w.STROKE_WIDTH + w.TAIL_HEIGHT, this._textDirty = !1;
  }
  /**
   * Render this text bubble at a certain scale, using the current parameters, to the canvas.
   * @param {number} scale The scale to render the bubble at
   */
  _renderTextBubble(t) {
    const e = this._canvas.getContext("2d");
    this._textDirty && this._reflowLines();
    const i = this._textAreaSize.width, s = this._textAreaSize.height;
    this._canvas.width = Math.ceil(this._size[0] * t), this._canvas.height = Math.ceil(this._size[1] * t), this._restyleCanvas(), e.setTransform(1, 0, 0, 1, 0, 0), e.clearRect(0, 0, this._canvas.width, this._canvas.height), e.scale(t, t), e.translate(w.STROKE_WIDTH * 0.5, w.STROKE_WIDTH * 0.5), e.save(), this._pointsLeft && (e.scale(-1, 1), e.translate(-i, 0)), e.beginPath(), e.moveTo(w.CORNER_RADIUS, s), e.arcTo(0, s, 0, s - w.CORNER_RADIUS, w.CORNER_RADIUS), e.arcTo(0, 0, i, 0, w.CORNER_RADIUS), e.arcTo(i, 0, i, s, w.CORNER_RADIUS), e.arcTo(
      i,
      s,
      i - w.CORNER_RADIUS,
      s,
      w.CORNER_RADIUS
    ), e.save(), e.translate(i - w.CORNER_RADIUS, s), this._bubbleType === "say" ? (e.bezierCurveTo(0, 4, 4, 8, 4, 10), e.arcTo(4, 12, 2, 12, 2), e.bezierCurveTo(-1, 12, -11, 8, -16, 0), e.closePath()) : (e.arc(-16, 0, 4, 0, Math.PI), e.closePath(), e.moveTo(-7, 7.25), e.arc(-9.25, 7.25, 2.25, 0, Math.PI * 2), e.moveTo(0, 9.5), e.arc(-1.5, 9.5, 1.5, 0, Math.PI * 2)), e.restore(), e.fillStyle = w.COLORS.BUBBLE_FILL, e.strokeStyle = w.COLORS.BUBBLE_STROKE, e.lineWidth = w.STROKE_WIDTH, e.stroke(), e.fill(), e.restore(), e.fillStyle = w.COLORS.TEXT_FILL, e.font = `${w.FONT_SIZE}px ${w.FONT}, sans-serif`;
    const n = this._lines;
    for (let r = 0; r < n.length; r++) {
      const a = n[r];
      e.fillText(
        a,
        w.PADDING,
        w.PADDING + w.LINE_HEIGHT * r + w.FONT_HEIGHT_RATIO * w.FONT_SIZE
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
      const n = this._canvas.getContext("2d").getImageData(0, 0, this._canvas.width, this._canvas.height), r = this._renderer.gl;
      if (this._texture === null) {
        const a = {
          auto: !1,
          wrap: r.CLAMP_TO_EDGE
        };
        this._texture = f.createTexture(r, a);
      }
      this._setTexture(n);
    }
    return this._texture;
  }
}
class b {
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
    const e = t[12], i = t[3 * 4 + 1], s = Math.abs(0.5 * t[0 * 4 + 0]) + Math.abs(0.5 * t[1 * 4 + 0]), n = Math.abs(0.5 * t[0 * 4 + 1]) + Math.abs(0.5 * t[1 * 4 + 1]);
    this.left = -s + e, this.right = s + e, this.top = n + i, this.bottom = -n + i;
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
  static intersect(t, e, i = new b()) {
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
  static union(t, e, i = new b()) {
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
const At = ([h, t, e], i) => {
  let s = 0;
  h /= 255, t /= 255, e /= 255;
  let n = 0;
  t < e && (n = t, t = e, e = n, s = -1), h < t && (n = h, h = t, t = n, s = -2 / 6 - s);
  const r = h - Math.min(t, e), a = Math.abs(s + (t - e) / (6 * r + Number.EPSILON)), o = r / (h + Number.EPSILON), l = h;
  return i[0] = a, i[1] = o, i[2] = l, i;
}, Bt = ([h, t, e], i) => {
  if (t === 0)
    return i[0] = i[1] = i[2] = e * 255 + 0.5, i;
  h %= 1;
  const s = h * 6 | 0, n = h * 6 - s, r = e * (1 - t), a = e * (1 - t * n), o = e * (1 - t * (1 - n));
  let l = 0, c = 0, u = 0;
  switch (s) {
    case 0:
      l = e, c = o, u = r;
      break;
    case 1:
      l = a, c = e, u = r;
      break;
    case 2:
      l = r, c = e, u = o;
      break;
    case 3:
      l = r, c = a, u = e;
      break;
    case 4:
      l = o, c = r, u = e;
      break;
    case 5:
      l = e, c = r, u = a;
      break;
  }
  return i[0] = l * 255 + 0.5, i[1] = c * 255 + 0.5, i[2] = u * 255 + 0.5, i;
}, D = 0.5, I = 0.5, Rt = [0, 0, 0];
class W {
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
    const n = t.getUniforms(), r = (s & m.EFFECT_INFO.color.mask) !== 0, a = (s & m.EFFECT_INFO.brightness.mask) !== 0;
    if (r || a) {
      const o = e[3] / 255;
      if (e[0] /= o, e[1] /= o, e[2] /= o, r) {
        const l = At(e, Rt), c = 0.11 / 2, u = 0.09;
        l[2] < c ? (l[0] = 0, l[1] = 1, l[2] = c) : l[1] < u && (l[0] = 0, l[1] = u), l[0] = n.u_color + l[0] + 1, Bt(l, e);
      }
      if (a) {
        const l = n.u_brightness * 255;
        e[0] += l, e[1] += l, e[2] += l;
      }
      e[0] *= o, e[1] *= o, e[2] *= o;
    }
    return s & m.EFFECT_INFO.ghost.mask && (e[0] *= n.u_ghost, e[1] *= n.u_ghost, e[2] *= n.u_ghost, e[3] *= n.u_ghost), e;
  }
  /**
   * Transform a texture coordinate to one that would be select after applying shader effects.
   * @param {Drawable} drawable The drawable whose effects to emulate.
   * @param {twgl.v3} vec The texture coordinate to transform.
   * @param {twgl.v3} dst A place to store the output coordinate.
   * @return {twgl.v3} dst - The coordinate after being transform by effects.
   */
  static transformPoint(t, e, i) {
    Et.v3.copy(e, i);
    const s = t.enabledEffects, n = t.getUniforms();
    if (s & m.EFFECT_INFO.mosaic.mask && (i[0] = n.u_mosaic * i[0] % 1, i[1] = n.u_mosaic * i[1] % 1), s & m.EFFECT_INFO.pixelate.mask) {
      const r = t.skin.getUniforms(), a = r.u_skinSize[0] / n.u_pixelate, o = r.u_skinSize[1] / n.u_pixelate;
      i[0] = (Math.floor(i[0] * a) + D) / a, i[1] = (Math.floor(i[1] * o) + I) / o;
    }
    if (s & m.EFFECT_INFO.whirl.mask) {
      const a = i[0] - D, o = i[1] - I, l = Math.sqrt(Math.pow(a, 2) + Math.pow(o, 2)), c = Math.max(1 - l / 0.5, 0), u = n.u_whirl * c * c, _ = Math.sin(u), g = Math.cos(u), d = g, p = -_, S = _, E = g;
      i[0] = d * a + S * o + D, i[1] = p * a + E * o + I;
    }
    if (s & m.EFFECT_INFO.fisheye.mask) {
      const r = (i[0] - D) / D, a = (i[1] - I) / I, o = Math.sqrt(r * r + a * a), l = Math.pow(Math.min(o, 1), n.u_fisheye) * Math.max(1, o), c = r / o, u = a / o;
      i[0] = D + l * c * D, i[1] = I + l * u * I;
    }
    return i;
  }
}
function Lt(h) {
  return h && h.__esModule && Object.prototype.hasOwnProperty.call(h, "default") ? h.default : h;
}
var et = { exports: {} }, it = { exports: {} };
function j() {
  this._events = {};
}
j.prototype = {
  on: function(h, t) {
    this._events || (this._events = {});
    var e = this._events;
    return (e[h] || (e[h] = [])).push(t), this;
  },
  removeListener: function(h, t) {
    var e = this._events[h] || [], i;
    for (i = e.length - 1; i >= 0 && e[i]; i--)
      (e[i] === t || e[i].cb === t) && e.splice(i, 1);
  },
  removeAllListeners: function(h) {
    h ? this._events[h] && (this._events[h] = []) : this._events = {};
  },
  listeners: function(h) {
    return this._events ? this._events[h] || [] : [];
  },
  emit: function(h) {
    this._events || (this._events = {});
    var t = Array.prototype.slice.call(arguments, 1), e, i = this._events[h] || [];
    for (e = i.length - 1; e >= 0 && i[e]; e--)
      i[e].apply(this, t);
    return this;
  },
  when: function(h, t) {
    return this.once(h, t, !0);
  },
  once: function(h, t, e) {
    if (!t) return this;
    function i() {
      e || this.removeListener(h, i), t.apply(this, arguments) && e && this.removeListener(h, i);
    }
    return i.cb = t, this.on(h, i), this;
  }
};
j.mixin = function(h) {
  var t = j.prototype, e;
  for (e in t)
    t.hasOwnProperty(e) && (h.prototype[e] = t[e]);
};
var zt = j, Ht = zt;
function y() {
}
Ht.mixin(y);
y.prototype.write = function(h, t, e) {
  this.emit("item", h, t, e);
};
y.prototype.end = function() {
  this.emit("end"), this.removeAllListeners();
};
y.prototype.pipe = function(h) {
  var t = this;
  t.emit("unpipe", h), h.emit("pipe", t);
  function e() {
    h.write.apply(h, Array.prototype.slice.call(arguments));
  }
  function i() {
    !h._isStdio && h.end();
  }
  return t.on("item", e), t.on("end", i), t.when("unpipe", function(s) {
    var n = s === h || typeof s == "undefined";
    return n && (t.removeListener("item", e), t.removeListener("end", i), h.emit("unpipe")), n;
  }), h;
};
y.prototype.unpipe = function(h) {
  return this.emit("unpipe", h), this;
};
y.prototype.format = function(h) {
  throw new Error([
    "Warning: .format() is deprecated in Minilog v2! Use .pipe() instead. For example:",
    "var Minilog = require('minilog');",
    "Minilog",
    "  .pipe(Minilog.backends.console.formatClean)",
    "  .pipe(Minilog.backends.console);"
  ].join(`
`));
};
y.mixin = function(h) {
  var t = y.prototype, e;
  for (e in t)
    t.hasOwnProperty(e) && (h.prototype[e] = t[e]);
};
var C = y, Ut = C, $ = { debug: 1, info: 2, warn: 3, error: 4 };
function k() {
  this.enabled = !0, this.defaultResult = !0, this.clear();
}
Ut.mixin(k);
k.prototype.allow = function(h, t) {
  return this._white.push({ n: h, l: $[t] }), this;
};
k.prototype.deny = function(h, t) {
  return this._black.push({ n: h, l: $[t] }), this;
};
k.prototype.clear = function() {
  return this._white = [], this._black = [], this;
};
function lt(h, t) {
  return h.n.test ? h.n.test(t) : h.n == t;
}
k.prototype.test = function(h, t) {
  var e, i = Math.max(this._white.length, this._black.length);
  for (e = 0; e < i; e++) {
    if (this._white[e] && lt(this._white[e], h) && $[t] >= this._white[e].l)
      return !0;
    if (this._black[e] && lt(this._black[e], h) && $[t] <= this._black[e].l)
      return !1;
  }
  return this.defaultResult;
};
k.prototype.write = function(h, t, e) {
  if (!this.enabled || this.test(h, t))
    return this.emit("item", h, t, e);
};
var Gt = k;
(function(h, t) {
  var e = C, i = Gt, s = new e(), n = Array.prototype.slice;
  t = h.exports = function(a) {
    var o = function() {
      return s.write(a, void 0, n.call(arguments)), o;
    };
    return o.debug = function() {
      return s.write(a, "debug", n.call(arguments)), o;
    }, o.info = function() {
      return s.write(a, "info", n.call(arguments)), o;
    }, o.warn = function() {
      return s.write(a, "warn", n.call(arguments)), o;
    }, o.error = function() {
      return s.write(a, "error", n.call(arguments)), o;
    }, o.log = o.debug, o.suggest = t.suggest, o.format = s.format, o;
  }, t.defaultBackend = t.defaultFormatter = null, t.pipe = function(r) {
    return s.pipe(r);
  }, t.end = t.unpipe = t.disable = function(r) {
    return s.unpipe(r);
  }, t.Transform = e, t.Filter = i, t.suggest = new i(), t.enable = function() {
    return t.defaultFormatter ? s.pipe(t.suggest).pipe(t.defaultFormatter).pipe(t.defaultBackend) : s.pipe(t.suggest).pipe(t.defaultBackend);
  };
})(it, it.exports);
var Wt = it.exports, ct = {
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
function jt(h, t) {
  return t ? "color: #fff; background: " + ct[h] + ";" : "color: " + ct[h] + ";";
}
var xt = jt, $t = C, V = xt, qt = { debug: ["cyan"], info: ["purple"], warn: ["yellow", !0], error: ["red", !0] }, nt = new $t();
nt.write = function(h, t, e) {
  var i = console.log;
  console[t] && console[t].apply && (i = console[t], i.apply(console, ["%c" + h + " %c" + t, V("gray"), V.apply(V, qt[t])].concat(e)));
};
nt.pipe = function() {
};
var Xt = nt, Kt = C, z = xt, ut = { debug: ["gray"], info: ["purple"], warn: ["yellow", !0], error: ["red", !0] }, rt = new Kt();
rt.write = function(h, t, e) {
  var i = console.log;
  t != "debug" && console[t] && (i = console[t]);
  var s = 0;
  if (t != "info") {
    for (; s < e.length && typeof e[s] == "string"; s++)
      ;
    i.apply(console, ["%c" + h + " " + e.slice(0, s).join(" "), z.apply(z, ut[t])].concat(e.slice(s)));
  } else
    i.apply(console, ["%c" + h, z.apply(z, ut[t])].concat(e));
};
rt.pipe = function() {
};
var Vt = rt, Yt = C, Jt = /\n+$/, B = new Yt();
B.write = function(h, t, e) {
  var i = e.length - 1;
  if (!(typeof console == "undefined" || !console.log)) {
    if (console.log.apply)
      return console.log.apply(console, [h, t].concat(e));
    if (JSON && JSON.stringify) {
      e[i] && typeof e[i] == "string" && (e[i] = e[i].replace(Jt, ""));
      try {
        for (i = 0; i < e.length; i++)
          e[i] = JSON.stringify(e[i]);
      } catch (s) {
      }
      console.log(e.join(" "));
    }
  }
};
B.formatters = ["color", "minilog"];
B.color = Xt;
B.minilog = Vt;
var Qt = B, Y, ft;
function Zt() {
  if (ft) return Y;
  ft = 1;
  var h = C, t = [], e = new h();
  return e.write = function(i, s, n) {
    t.push([i, s, n]);
  }, e.get = function() {
    return t;
  }, e.empty = function() {
    t = [];
  }, Y = e, Y;
}
var J, _t;
function te() {
  if (_t) return J;
  _t = 1;
  var h = C, t = !1, e = new h();
  return e.write = function(i, s, n) {
    if (!(typeof window == "undefined" || typeof JSON == "undefined" || !JSON.stringify || !JSON.parse))
      try {
        t || (t = window.localStorage.minilog ? JSON.parse(window.localStorage.minilog) : []), t.push([(/* @__PURE__ */ new Date()).toString(), i, s, n]), window.localStorage.minilog = JSON.stringify(t);
      } catch (r) {
      }
  }, J = e, J;
}
var Q, dt;
function ee() {
  if (dt) return Q;
  dt = 1;
  var h = C, t = (/* @__PURE__ */ new Date()).valueOf().toString(36);
  function e(i) {
    this.url = i.url || "", this.cache = [], this.timer = null, this.interval = i.interval || 30 * 1e3, this.enabled = !0, this.jQuery = window.jQuery, this.extras = {};
  }
  return h.mixin(e), e.prototype.write = function(i, s, n) {
    this.timer || this.init(), this.cache.push([i, s].concat(n));
  }, e.prototype.init = function() {
    if (!(!this.enabled || !this.jQuery)) {
      var i = this;
      this.timer = setTimeout(function() {
        var s, n = [], r, a = i.url;
        if (i.cache.length == 0) return i.init();
        for (s = 0; s < i.cache.length; s++)
          try {
            JSON.stringify(i.cache[s]), n.push(i.cache[s]);
          } catch (o) {
          }
        i.jQuery.isEmptyObject(i.extras) ? (r = JSON.stringify({ logs: n }), a = i.url + "?client_id=" + t) : r = JSON.stringify(i.jQuery.extend({ logs: n }, i.extras)), i.jQuery.ajax(a, {
          type: "POST",
          cache: !1,
          processData: !1,
          data: r,
          contentType: "application/json",
          timeout: 1e4
        }).success(function(o, l, c) {
          o.interval && (i.interval = Math.max(1e3, o.interval));
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
  }, Q = e, Q;
}
(function(h, t) {
  var e = Wt, i = e.enable, s = e.disable, n = typeof navigator != "undefined" && /chrome/i.test(navigator.userAgent), r = Qt;
  if (e.defaultBackend = n ? r.minilog : r, typeof window != "undefined") {
    try {
      e.enable(JSON.parse(window.localStorage.minilogSettings));
    } catch (o) {
    }
    if (window.location && window.location.search) {
      var a = RegExp("[?&]minilog=([^&]*)").exec(window.location.search);
      a && e.enable(decodeURIComponent(a[1]));
    }
  }
  e.enable = function() {
    i.call(e, !0);
    try {
      window.localStorage.minilogSettings = JSON.stringify(!0);
    } catch (o) {
    }
    return this;
  }, e.disable = function() {
    s.call(e);
    try {
      delete window.localStorage.minilogSettings;
    } catch (o) {
    }
    return this;
  }, t = h.exports = e, t.backends = {
    array: Zt(),
    browser: e.defaultBackend,
    localStorage: te(),
    jQuery: ee()
  };
})(et, et.exports);
var ie = et.exports;
const vt = /* @__PURE__ */ Lt(ie);
vt.enable();
const N = vt("scratch-render"), se = f.v3.create(), gt = 1e-6, Z = (h, t) => {
  const e = se, i = t[0], s = t[1], n = h._inverseMatrix, r = i * n[3] + s * n[7] + n[15];
  return e[0] = 0.5 - (i * n[0] + s * n[4] + n[12]) / r, e[1] = (i * n[1] + s * n[5] + n[13]) / r + 0.5, Math.abs(e[0]) < gt && (e[0] = 0), Math.abs(e[1]) < gt && (e[1] = 0), h.enabledEffects !== 0 && e[0] >= 0 && e[0] < 1 && e[1] >= 0 && e[1] < 1 && W.transformPoint(h, e, e), e;
};
class A {
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
      u_modelMatrix: f.m4.identity(),
      /**
       * The color to use in the silhouette draw mode.
       * @type {Array<number>}
       */
      u_silhouetteColor: A.color4fFromID(this._id)
    };
    const e = m.EFFECTS.length;
    for (let i = 0; i < e; ++i) {
      const s = m.EFFECTS[i], n = m.EFFECT_INFO[s], r = n.converter;
      this._uniforms[n.uniformName] = r(0);
    }
    this._position = f.v3.create(0, 0), this._scale = f.v3.create(100, 100), this._direction = 90, this._transformDirty = !0, this._rotationMatrix = f.m4.identity(), this._rotationTransformDirty = !0, this._rotationAdjusted = f.v3.create(), this._rotationCenterDirty = !0, this._skinScale = f.v3.create(0, 0, 0), this._skinScaleDirty = !0, this._inverseMatrix = f.m4.identity(), this._inverseTransformDirty = !0, this._visible = !0, this.enabledEffects = 0, this._convexHullPoints = null, this._convexHullDirty = !0, this._transformedHullPoints = null, this._transformedHullDirty = !0, this._skinWasAltered = this._skinWasAltered.bind(this), this.isTouching = this._isTouchingNever;
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
    this._skin !== t && (this._skin && this._skin.removeListener(v.Events.WasAltered, this._skinWasAltered), this._skin = t, this._skin && this._skin.addListener(v.Events.WasAltered, this._skinWasAltered), this._skinWasAltered());
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
    const i = m.EFFECT_INFO[t];
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
    const e = m.EFFECTS.length;
    for (let i = 0; i < e; ++i) {
      const s = m.EFFECTS[i];
      s in t && this.updateEffect(s, t[s]);
    }
  }
  /**
   * Calculate the transform to use when rendering this Drawable.
   * @private
   */
  _calculateTransform() {
    if (this._rotationTransformDirty) {
      const _ = (270 - this._direction) * Math.PI / 180, g = Math.cos(_), d = Math.sin(_);
      this._rotationMatrix[0] = g, this._rotationMatrix[1] = d, this._rotationMatrix[4] = -d, this._rotationMatrix[5] = g, this._rotationTransformDirty = !1;
    }
    if (this._rotationCenterDirty && this.skin !== null) {
      const _ = this.skin.rotationCenter, g = this.skin.size, d = _[0], p = _[1], S = g[0], E = g[1], St = this._scale[0], Tt = this._scale[1], ot = this._rotationAdjusted;
      ot[0] = (d - S / 2) * St / 100, ot[1] = (p - E / 2) * Tt / 100 * -1, this._rotationCenterDirty = !1;
    }
    if (this._skinScaleDirty && this.skin !== null) {
      const _ = this.skin.size, g = this._skinScale;
      g[0] = _[0] * this._scale[0] / 100, g[1] = _[1] * this._scale[1] / 100, this._skinScaleDirty = !1;
    }
    const t = this._uniforms.u_modelMatrix, e = this._skinScale[0], i = this._skinScale[1], s = this._rotationMatrix[0], n = this._rotationMatrix[1], r = this._rotationMatrix[4], a = this._rotationMatrix[5], o = this._rotationAdjusted[0], l = this._rotationAdjusted[1], c = this._position[0], u = this._position[1];
    t[0] = e * s, t[1] = e * n, t[4] = i * r, t[5] = i * a, t[12] = s * o + r * l + c, t[13] = n * o + a * l + u, this._transformDirty = !1;
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
      this._transformedHullPoints.push(f.v3.create());
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
    return this.skin.isTouchingNearest(Z(this, t));
  }
  _isTouchingLinear(t) {
    return this.skin.isTouchingLinear(Z(this, t));
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
    return t = t || new b(), t.initFromPointsAABB(e), t;
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
    const e = 8, i = this._getTransformedHullPoints(), s = Math.max.apply(null, i.map((r) => r[1])), n = i.filter((r) => r[1] > s - e);
    return t = t || new b(), t.initFromPointsAABB(n), t;
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
    return t = t || new b(), t.initFromModelMatrix(e), t;
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
    const t = f.m4.ortho(-1, 1, -1, 1, -1, 1), e = this.skin.size, i = 1 / e[0] / 2, s = 1 / e[1] / 2, n = f.m4.multiply(this._uniforms.u_modelMatrix, t);
    for (let r = 0; r < this._convexHullPoints.length; r++) {
      const a = this._convexHullPoints[r], o = this._transformedHullPoints[r];
      o[0] = 0.5 + -a[0] / e[0] - i, o[1] = a[1] / e[1] - 0.5 + s, f.m4.transformPoint(n, o, o);
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
      f.m4.copy(this._uniforms.u_modelMatrix, t), t[10] = 1, f.m4.inverse(t, t), this._inverseTransformDirty = !1;
    }
  }
  /**
   * Update everything necessary to render this drawable on the CPU.
   */
  updateCPURenderAttributes() {
    this.updateMatrix(), this.skin ? (this.skin.updateSilhouette(this._scale), this.skin.useNearest(this._scale, this) ? this.isTouching = this._isTouchingNearest : this.isTouching = this._isTouchingLinear) : (N.warn(`Could not find skin for drawable with id: ${this._id}`), this.isTouching = this._isTouchingNever);
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
    t -= x.ID_NONE;
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
    return s = (t & 255) << 0, s |= (e & 255) << 8, s |= (i & 255) << 16, s + x.ID_NONE;
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
    const n = Z(e, t);
    if (n[0] < 0 || n[1] < 0 || n[0] > 1 || n[1] > 1)
      return i[0] = 0, i[1] = 0, i[2] = 0, i[3] = 0, i;
    const r = (
      // commenting out to only use nearest for now
      // drawable.skin.useNearest(drawable._scale, drawable) ?
      e.skin._silhouette.colorAtNearest(n, i)
    );
    return e.enabledEffects === 0 ? r : W.transformColor(e, r, s);
  }
}
const mt = f.v3.create(), ne = new b(), re = new b(), oe = new Uint8ClampedArray(4), P = new Uint8ClampedArray(4), ae = 4e4, H = [3, 3], he = 2, pt = 2048, le = (h, t) => (
  // has some non-alpha component to test against
  h[3] > 0 && (h[0] & 252) === (t[0] & 252) && (h[1] & 252) === (t[1] & 252) && (h[2] & 252) === (t[2] & 252)
), tt = (h, t, e) => (h[0] & 248) === (t[e + 0] & 248) && (h[1] & 248) === (t[e + 1] & 248) && (h[2] & 240) === (t[e + 2] & 240), wt = 15;
class T extends bt {
  /**
   * Check if this environment appears to support this renderer before attempting to create an instance.
   * Catching an exception from the constructor is also a valid way to test for (lack of) support.
   * @param {canvas} [optCanvas] - An optional canvas to use for the test. Otherwise a temporary canvas will be used.
   * @returns {boolean} - True if this environment appears to support this renderer, false otherwise.
   */
  static isSupported(t) {
    try {
      return !!T._getContext(t || document.createElement("canvas"));
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
    return f.getWebGLContext(t, e) || f.getContext(t, e);
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
  constructor(t, e, i, s, n) {
    super();
    const r = this._gl = T._getContext(t);
    if (!r)
      throw new Error("Could not get WebGL context: this browser or environment may not support WebGL.");
    this._useGpuMode = T.UseGpuModes.Automatic, this._allDrawables = [], this._allSkins = [], this._drawList = [], this._groupOrdering = [], this._layerGroups = {}, this._nextDrawableId = x.ID_NONE + 1, this._nextSkinId = x.ID_NONE + 1, this._projection = f.m4.identity(), this._shaderManager = new m(r), this._tempCanvas = document.createElement("canvas"), this._regionId = null, this._exitRegion = null, this._backgroundDrawRegionId = {
      enter: () => this._enterDrawBackground(),
      exit: () => this._exitDrawBackground()
    }, this._snapshotCallbacks = [], this._backgroundColor4f = [0, 0, 0, 1], this._backgroundColor3b = new Uint8ClampedArray(3), this._createGeometry(), this.on(x.Events.NativeSizeChanged, this.onNativeSizeChanged), this.setBackgroundColor(1, 1, 1), this.setStageSize(e || -240, i || 240, s || -180, n || 180), this.resize(this._nativeSize[0], this._nativeSize[1]), r.disable(r.DEPTH_TEST), r.enable(r.BLEND), r.blendFunc(r.ONE, r.ONE_MINUS_SRC_ALPHA);
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
    const { canvas: i } = this._gl, s = window.devicePixelRatio || 1, n = t * s, r = e * s;
    (i.width !== n || i.height !== r) && (i.width = n, i.height = r, this.draw());
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
    this._xLeft = t, this._xRight = e, this._yBottom = i, this._yTop = s, this._projection = f.m4.ortho(t, e, i, s, -1, 1), this._setNativeSize(Math.abs(e - t), Math.abs(i - s));
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
    this._nativeSize = [t, e], this.emit(x.Events.NativeSizeChanged, { newSize: this._nativeSize });
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
    const s = this._nextSkinId++, n = new O(s, this);
    return n.setBitmap(t, e, i), this._allSkins[s] = n, s;
  }
  /**
   * Create a new SVG skin.
   * @param {!string} svgData - new SVG to use.
   * @param {?Array<number>} rotationCenter Optional: rotation center of the skin. If not supplied, the center of the
   * skin will be used
   * @returns {!int} the ID for the new skin.
   */
  createSVGSkin(t, e) {
    const i = this._nextSkinId++, s = new K(i, this);
    return s.setSVG(t, e), this._allSkins[i] = s, i;
  }
  /**
   * Create a new PenSkin - a skin which implements a Scratch pen layer.
   * @returns {!int} the ID for the new skin.
   */
  createPenSkin() {
    const t = this._nextSkinId++, e = new Ft(t, this);
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
    const s = this._nextSkinId++, n = new L(s, this);
    return n.setTextBubble(t, e, i), this._allSkins[s] = n, s;
  }
  /**
   * Update an existing SVG skin, or create an SVG skin if the previous skin was not SVG.
   * @param {!int} skinId the ID for the skin to change.
   * @param {!string} svgData - new SVG to use.
   * @param {?Array<number>} rotationCenter Optional: rotation center of the skin. If not supplied, the center of the
   * skin will be used
   */
  updateSVGSkin(t, e, i) {
    if (this._allSkins[t] instanceof K) {
      this._allSkins[t].setSVG(e, i);
      return;
    }
    const s = new K(t, this);
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
    if (this._allSkins[t] instanceof O) {
      this._allSkins[t].setBitmap(e, i, s);
      return;
    }
    const n = new O(t, this);
    n.setBitmap(e, i, s), this._reskin(t, n);
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
    if (this._allSkins[t] instanceof L) {
      this._allSkins[t].setTextBubble(e, i, s);
      return;
    }
    const n = new L(t, this);
    n.setTextBubble(e, i, s), this._reskin(t, n);
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
      N.warn("Cannot create a drawable without a known layer group");
      return;
    }
    const e = this._nextDrawableId++, i = new A(e);
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
    const i = this._layerGroups[e], s = i.groupIndex, n = this._endIndexForKnownLayerGroup(i);
    this._drawList.splice(n, 0, t), this._updateOffsets("add", s);
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
      N.warn("Cannot destroy drawable without known layer group.");
      return;
    }
    this._allDrawables[t].dispose(), delete this._allDrawables[t];
    const s = this._layerGroups[e], n = this._endIndexForKnownLayerGroup(s);
    let r = s.drawListOffset;
    for (; r < n && this._drawList[r] !== t; )
      r++;
    if (r < n)
      this._drawList.splice(r, 1), this._updateOffsets("delete", s.groupIndex);
    else {
      N.warn("Could not destroy drawable that could not be found in layer group.");
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
  setDrawableOrder(t, e, i, s, n) {
    if (!i || !Object.prototype.hasOwnProperty.call(this._layerGroups, i)) {
      N.warn("Cannot set the order of a drawable without a known layer group.");
      return;
    }
    const r = this._layerGroups[i], a = r.drawListOffset, o = this._endIndexForKnownLayerGroup(r);
    let l = a;
    for (; l < o && this._drawList[l] !== t; )
      l++;
    if (l < o) {
      if (e === 0)
        return l;
      this._drawList.splice(l, 1)[0];
      let c = e;
      s && (c += l);
      const u = (n || 0) + a, _ = u >= a && u < o ? u : a;
      return c = Math.max(c, _), c = Math.min(c, o), this._drawList.splice(c, 0, t), c;
    }
    return null;
  }
  /**
   * Draw all current drawables and present the frame on the canvas.
   */
  draw() {
    this._doExitDrawRegion();
    const t = this._gl;
    if (f.bindFramebufferInfo(t, null), t.viewport(0, 0, t.canvas.width, t.canvas.height), t.clearColor(...this._backgroundColor4f), t.clear(t.COLOR_BUFFER_BIT), this._drawThese(this._drawList, m.DRAW_MODE.default, this._projection, {
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
      const n = this._debugCanvas.getContext("2d");
      n.drawImage(s.canvas, 0, 0), n.strokeStyle = "#FF0000";
      const r = window.devicePixelRatio;
      n.strokeRect(
        r * (i.left + this._nativeSize[0] / 2),
        r * (-i.top + this._nativeSize[1] / 2),
        r * (i.right - i.left),
        r * (-i.bottom + i.top)
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
      const n = this._debugCanvas.getContext("2d");
      n.drawImage(s.canvas, 0, 0), n.strokeStyle = "#FF0000";
      const r = window.devicePixelRatio;
      n.strokeRect(
        r * (i.left + this._nativeSize[0] / 2),
        r * (-i.top + this._nativeSize[1] / 2),
        r * (i.right - i.left),
        r * (-i.bottom + i.top)
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
    let n;
    if (tt(e, this._backgroundColor3b, 0)) {
      if (n = this._touchingBounds(t), n === null) return !1;
    } else {
      if (s.length === 0)
        return !1;
      n = this._candidatesBounds(s);
    }
    const r = this._getMaxPixelsForCPU(), a = this._debugCanvas && this._debugCanvas.getContext("2d");
    a && (this._debugCanvas.width = n.width, this._debugCanvas.height = n.height), n.width * n.height * (s.length + 1) >= r && this._isTouchingColorGpuStart(t, s.map(({ id: g }) => g).reverse(), n, e, i);
    const o = this._allDrawables[t], l = mt, c = oe, u = !!i;
    o.updateCPURenderAttributes();
    const _ = ~m.EFFECT_INFO.ghost.mask;
    for (let g = n.bottom; g <= n.top; g++) {
      if (n.width * (g - n.bottom) * (s.length + 1) >= r)
        return this._isTouchingColorGpuFin(n, e, g - n.bottom);
      for (let d = n.left; d <= n.right; d++)
        if (l[1] = g, l[0] = d, (u ? le(A.sampleColor4b(l, o, c, _), i) : o.isTouching(l)) && (T.sampleColor3b(l, s, c), a && (a.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`, a.fillRect(d - n.left, n.bottom - g, 1, 1)), tt(c, e, 0)))
          return !0;
    }
    return !1;
  }
  _getMaxPixelsForCPU() {
    switch (this._useGpuMode) {
      case T.UseGpuModes.ForceCPU:
        return 1 / 0;
      case T.UseGpuModes.ForceGPU:
        return 0;
      case T.UseGpuModes.Automatic:
      default:
        return ae;
    }
  }
  _enterDrawBackground() {
    const t = this.gl, e = this._shaderManager.getShader(m.DRAW_MODE.background, 0);
    t.disable(t.BLEND), t.useProgram(e.program), f.setBuffersAndAttributes(t, e, this._bufferInfo);
  }
  _exitDrawBackground() {
    const t = this.gl;
    t.enable(t.BLEND);
  }
  _isTouchingColorGpuStart(t, e, i, s, n) {
    this._doExitDrawRegion();
    const r = this._gl;
    f.bindFramebufferInfo(r, this._queryBufferInfo), r.viewport(0, 0, i.width, i.height);
    const a = f.m4.ortho(i.left, i.right, i.top, i.bottom, -1, 1);
    r.clearColor(0, 0, 0, 0), r.clear(r.COLOR_BUFFER_BIT | r.STENCIL_BUFFER_BIT);
    let o;
    n && (o = {
      u_colorMask: [n[0] / 255, n[1] / 255, n[2] / 255],
      u_colorMaskTolerance: he / 255
    });
    try {
      r.enable(r.STENCIL_TEST), r.stencilFunc(r.ALWAYS, 1, 1), r.stencilOp(r.KEEP, r.KEEP, r.REPLACE), r.colorMask(!1, !1, !1, !1), this._drawThese(
        [t],
        n ? m.DRAW_MODE.colorMask : m.DRAW_MODE.silhouette,
        a,
        {
          extraUniforms: o,
          ignoreVisibility: !0,
          // Touching color ignores sprite visibility,
          effectMask: ~m.EFFECT_INFO.ghost.mask
        }
      ), r.stencilFunc(r.EQUAL, 1, 1), r.stencilOp(r.KEEP, r.KEEP, r.KEEP), r.colorMask(!0, !0, !0, !0), this.enterDrawRegion(this._backgroundDrawRegionId);
      const l = {
        u_backgroundColor: this._backgroundColor4f
      }, c = this._shaderManager.getShader(m.DRAW_MODE.background, 0);
      f.setUniforms(c, l), f.drawBufferInfo(r, this._bufferInfo, r.TRIANGLES), this._drawThese(
        e,
        m.DRAW_MODE.default,
        a,
        { idFilterFunc: (u) => u !== t }
      );
    } finally {
      r.colorMask(!0, !0, !0, !0), r.disable(r.STENCIL_TEST), this._doExitDrawRegion();
    }
  }
  _isTouchingColorGpuFin(t, e, i) {
    const s = this._gl, n = new Uint8Array(Math.floor(t.width * (t.height - i) * 4));
    if (s.readPixels(0, 0, t.width, t.height - i, s.RGBA, s.UNSIGNED_BYTE, n), this._debugCanvas) {
      this._debugCanvas.width = t.width, this._debugCanvas.height = t.height;
      const r = this._debugCanvas.getContext("2d"), a = r.getImageData(0, 0, t.width, t.height - i);
      a.data.set(n), r.putImageData(a, 0, 0);
    }
    for (let r = 0; r < n.length; r += 4)
      if (n[r + 3] !== 0 && tt(e, n, r))
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
      e.filter((a) => this._allDrawables[a]._visible)
    );
    if (i.length === 0 || !this._allDrawables[t]._visible)
      return !1;
    const s = this._candidatesBounds(i), n = this._allDrawables[t], r = mt;
    n.updateCPURenderAttributes();
    for (let a = s.left; a <= s.right; a++) {
      r[0] = a;
      for (let o = s.bottom; o <= s.top; o++)
        if (r[1] = o, n.isTouching(r)) {
          for (let l = 0; l < i.length; l++)
            if (i[l].drawable.isTouching(r))
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
    const n = this._gl, r = this._nativeSize[0] / n.canvas.clientWidth, a = this._nativeSize[1] / n.canvas.clientHeight;
    i *= r, s *= a, i = Math.max(1, Math.min(Math.round(i), H[0])), s = Math.max(1, Math.min(Math.round(s), H[1]));
    const o = t * r - (i - 1) / 2, l = e * a + (s - 1) / 2, c = i % 2 ? 0 : -0.5, u = s % 2 ? 0 : -0.5, _ = new b();
    return _.initFromBounds(
      Math.floor(this._xLeft + o + c),
      Math.floor(this._xLeft + o + c + i - 1),
      Math.ceil(this._yTop - l + u),
      Math.ceil(this._yTop - l + u + s - 1)
    ), _;
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
  drawableTouching(t, e, i, s, n) {
    const r = this._allDrawables[t];
    if (!r)
      return !1;
    const a = this.clientSpaceToScratchBounds(e, i, s, n), o = f.v3.create();
    for (r.updateCPURenderAttributes(), o[1] = a.bottom; o[1] <= a.top; o[1]++)
      for (o[0] = a.left; o[0] <= a.right; o[0]++)
        if (r.isTouching(o))
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
  pick(t, e, i, s, n) {
    const r = this.clientSpaceToScratchBounds(t, e, i, s);
    if (r.left === -1 / 0 || r.bottom === -1 / 0 || (n = (n || this._drawList).filter((c) => {
      const u = this._allDrawables[c];
      if (u.getVisible() && u.getUniforms().u_ghost !== 0) {
        const _ = u.getFastBounds();
        return r.intersects(_) ? (u.updateCPURenderAttributes(), !0) : !1;
      }
      return !1;
    }), n.length === 0))
      return !1;
    const a = [], o = f.v3.create(0, 0, 0);
    for (o[1] = r.bottom; o[1] <= r.top; o[1]++)
      for (o[0] = r.left; o[0] <= r.right; o[0]++)
        for (let c = n.length - 1; c >= 0; c--) {
          const u = n[c];
          if (this._allDrawables[u].isTouching(o)) {
            a[u] = (a[u] || 0) + 1;
            break;
          }
        }
    a[x.ID_NONE] = 0;
    let l = x.ID_NONE;
    for (const c in a)
      Object.prototype.hasOwnProperty.call(a, c) && a[c] > a[l] && (l = c);
    return Number(l);
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
    const i = this._nativeSize[0] * 0.5, s = this._nativeSize[1] * 0.5, n = e.getFastBounds(), r = this.canvas, a = r.width / this._nativeSize[0], o = new b();
    o.initFromBounds(
      (n.left + i) * a,
      (n.right + i) * a,
      // in "canvas space", +y is down, but Rectangle methods assume bottom < top, so swap them
      (s - n.top) * a,
      (s - n.bottom) * a
    ), o.snapToInt(), n.initFromBounds(
      o.left / a - i,
      o.right / a - i,
      s - o.top / a,
      s - o.bottom / a
    );
    const l = this._gl, c = l.getParameter(l.MAX_TEXTURE_SIZE), u = Math.min(pt, o.width, c), _ = Math.min(pt, o.height, c), g = f.createFramebufferInfo(l, [{ format: l.RGBA }], u, _);
    try {
      f.bindFramebufferInfo(l, g), l.viewport(0, 0, u, _);
      const d = f.m4.ortho(
        n.left,
        n.right,
        n.top,
        n.bottom,
        -1,
        1
      );
      l.clearColor(0, 0, 0, 0), l.clear(l.COLOR_BUFFER_BIT), this._drawThese(
        [t],
        m.DRAW_MODE.straightAlpha,
        d,
        {
          // Don't apply the ghost effect. TODO: is this an intentional design decision?
          effectMask: ~m.EFFECT_INFO.ghost.mask,
          // We're doing this in screen-space, so the framebuffer dimensions should be those of the canvas in
          // screen-space. This is used to ensure SVG skins are rendered at the proper resolution.
          framebufferWidth: r.width,
          framebufferHeight: r.height
        }
      );
      const p = new Uint8Array(Math.floor(u * _ * 4));
      l.readPixels(0, 0, u, _, l.RGBA, l.UNSIGNED_BYTE, p);
      const S = new ImageData(new Uint8ClampedArray(p.buffer), u, _), E = r.getBoundingClientRect().width / r.width;
      return {
        imageData: S,
        x: o.left * E,
        y: o.bottom * E,
        width: o.width * E,
        height: o.height * E
      };
    } finally {
      l.deleteFramebuffer(g.framebuffer);
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
    const s = Math.round(this._nativeSize[0] * (t / this._gl.canvas.clientWidth - 0.5)), n = Math.round(-this._nativeSize[1] * (e / this._gl.canvas.clientHeight - 0.5)), r = this._gl;
    f.bindFramebufferInfo(r, this._queryBufferInfo);
    const a = new b();
    a.initFromBounds(s - i, s + i, n - i, n + i);
    const o = s - a.left, l = a.top - n;
    r.viewport(0, 0, a.width, a.height);
    const c = f.m4.ortho(a.left, a.right, a.top, a.bottom, -1, 1);
    r.clearColor(...this._backgroundColor4f), r.clear(r.COLOR_BUFFER_BIT), this._drawThese(this._drawList, m.DRAW_MODE.default, c);
    const u = new Uint8Array(Math.floor(a.width * a.height * 4));
    r.readPixels(0, 0, a.width, a.height, r.RGBA, r.UNSIGNED_BYTE, u);
    const _ = Math.floor(4 * (l * a.width + o)), g = {
      r: u[_],
      g: u[_ + 1],
      b: u[_ + 2],
      a: u[_ + 3]
    };
    if (this._debugCanvas) {
      this._debugCanvas.width = a.width, this._debugCanvas.height = a.height;
      const d = this._debugCanvas.getContext("2d"), p = d.createImageData(a.width, a.height);
      p.data.set(u), d.putImageData(p, 0, 0), d.strokeStyle = "black", d.fillStyle = `rgba(${g.r}, ${g.g}, ${g.b}, ${g.a})`, d.rect(o - 4, l - 4, 8, 8), d.fill(), d.stroke();
    }
    return {
      data: u,
      width: a.width,
      height: a.height,
      color: g
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
    for (let n = e.length - 1; n >= 0; n--) {
      const r = e[n];
      if (r !== t) {
        const a = this._allDrawables[r];
        if (a.skin instanceof L) continue;
        if (a.skin && a._visible) {
          a.updateCPURenderAttributes();
          const o = a.getFastBounds();
          o.snapToInt(), i.intersects(o) && s.push({
            id: r,
            drawable: a,
            intersection: b.intersect(i, o)
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
    return t.reduce((e, { intersection: i }) => e ? b.union(e, i, ne) : i, null);
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
    const n = this._allDrawables[t];
    if (!n)
      return [i, s];
    const r = i - n._position[0], a = s - n._position[1], o = n._skin.getFenceBounds(n, re), l = Math.floor(Math.min(o.width, o.height) / 2), c = this._xRight - Math.min(wt, l);
    o.right + r < -c ? i = Math.ceil(n._position[0] - (c + o.right)) : o.left + r > c && (i = Math.floor(n._position[0] + (c - o.left)));
    const u = this._yTop - Math.min(wt, l);
    return o.top + a < -u ? s = Math.ceil(n._position[1] - (u + o.top)) : o.bottom + a > u && (s = Math.floor(n._position[1] + (u - o.bottom))), [i, s];
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
  penLine(t, e, i, s, n, r) {
    /** @type {PenSkin} */
    this._allSkins[t].drawLine(e, i, s, n, r);
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
    const n = (
      /** @type {PenSkin} */
      this._allSkins[t]
    ), r = this._gl;
    f.bindFramebufferInfo(r, n._framebuffer), r.viewport(
      this._nativeSize[0] * 0.5 + s.left,
      this._nativeSize[1] * 0.5 - s.top,
      s.width,
      s.height
    );
    const a = f.m4.ortho(s.left, s.right, s.top, s.bottom, -1, 1);
    this._drawThese([e], m.DRAW_MODE.default, a, { ignoreVisibility: !0 }), n._silhouetteDirty = !0;
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
    this._bufferInfo = f.createBufferInfoFromArrays(this._gl, t);
  }
  /**
   * Respond to a change in the "native" rendering size. The native size is used by buffers which are fixed in size
   * regardless of the size of the main render target. This includes the buffers used for queries such as picking and
   * color-touching. The fixed size allows (more) consistent behavior across devices and presentation modes.
   * @param {object} event - The change event.
   * @private
   */
  onNativeSizeChanged(t) {
    const [e, i] = t.newSize, s = this._gl, n = [
      { format: s.RGBA },
      { format: s.DEPTH_STENCIL }
    ];
    this._pickBufferInfo || (this._pickBufferInfo = f.createFramebufferInfo(s, n, H[0], H[1])), this._queryBufferInfo ? f.resizeFramebufferInfo(s, this._queryBufferInfo, n, e, i) : this._queryBufferInfo = f.createFramebufferInfo(s, n, e, i);
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
    const n = this._gl;
    let r = null;
    const a = "framebufferWidth" in s && "framebufferHeight" in s && s.framebufferWidth !== this._nativeSize[0] && s.framebufferHeight !== this._nativeSize[1], o = t.length;
    for (let l = 0; l < o; ++l) {
      const c = t[l];
      if (s.filter && !s.filter(c)) continue;
      const u = this._allDrawables[c];
      if (!u.getVisible() && !s.ignoreVisibility) continue;
      const _ = a ? [
        u.scale[0] * s.framebufferWidth / this._nativeSize[0],
        u.scale[1] * s.framebufferHeight / this._nativeSize[1]
      ] : u.scale;
      if (!u.skin || !u.skin.getTexture(_)) continue;
      const g = {};
      let d = u.enabledEffects;
      d &= Object.prototype.hasOwnProperty.call(s, "effectMask") ? s.effectMask : d;
      const p = this._shaderManager.getShader(e, d);
      this._regionId !== p && (this._doExitDrawRegion(), this._regionId = p, r = p, n.useProgram(r.program), f.setBuffersAndAttributes(n, r, this._bufferInfo), Object.assign(g, {
        u_projectionMatrix: i
      })), Object.assign(
        g,
        u.skin.getUniforms(_),
        u.getUniforms()
      ), s.extraUniforms && Object.assign(g, s.extraUniforms), g.u_skin && f.setTextureParameters(
        n,
        g.u_skin,
        {
          minMag: u.skin.useNearest(_, u) ? n.NEAREST : n.LINEAR
        }
      ), f.setUniforms(r, g), f.drawBufferInfo(n, this._bufferInfo, n.TRIANGLES);
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
    const n = function(d, p, S) {
      return (p[0] - d[0]) * (S[1] - d[1]) - (p[1] - d[1]) * (S[0] - d[0]);
    }, r = [], a = [];
    let o = -1, l = -1;
    const c = f.v3.create(), u = f.v3.create();
    let _;
    for (let d = 0; d < s; d++) {
      c[1] = d / s;
      let p = 0;
      for (; p < i; p++)
        if (c[0] = p / i, W.transformPoint(e, c, u), e.skin.isTouchingLinear(u)) {
          _ = [p, d];
          break;
        }
      if (!(p >= i)) {
        for (; o > 0 && !(n(r[o], r[o - 1], _) > 0); )
          --o;
        for (r[++o] = _, p = i - 1; p >= 0; p--)
          if (c[0] = p / i, W.transformPoint(e, c, u), e.skin.isTouchingLinear(u)) {
            _ = [p, d];
            break;
          }
        for (; l > 0 && !(n(a[l], a[l - 1], _) < 0); )
          --l;
        a[++l] = _;
      }
    }
    const g = r;
    g.length = o + 1;
    for (let d = l; d >= 0; --d)
      g.push(a[d]);
    return yt(g, 1 / 0);
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
    for (let n = 0; s !== 0 && n < e.length; n++)
      A.sampleColor4b(t, e[n].drawable, P), i[0] += P[0] * s, i[1] += P[1] * s, i[2] += P[2] * s, s *= 1 - P[3] / 255;
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
T.prototype.canHazPixels = T.prototype.extractDrawableScreenSpace;
T.UseGpuModes = {
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
  T as default
};
