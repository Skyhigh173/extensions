// Name: Multi Touch
// ID: skyhigh173touch
// Description: Multiple fingers at once!
// By: Skyhigh173
// License: MIT

(function (Scratch) {
  'use strict';

  class MultiTouchExtension {
    constructor() {
      /**
       * @type {HTMLDivElement}
       */
      this.canvasDiv = null;
      /**
       * @type {HTMLCanvasElement}
       */
      this.canvas = null;
      /**
       * @type {Array.<Touch>}
       */
      this._touches = [];
      /**
       * @type {Array.<null|Touch>}
       */
      this._fingers = [];
      this._setup();
    }

    get bound() {
      return this.canvas.getBoundingClientRect();
    }

    _clamp(min, x, max) {
      return Math.max(Math.min(x, max), min);
    }
    _scale(x, sRmin, sRmax, tRmin, tRmax) {
      return (tRmax - tRmin) / (sRmax - sRmin) * (x - sRmin) + tRmin;
    }

    _propMap = {
      // map client coord to scratch coord
      _x: (clientX) => this._clamp(-240, this._scale(clientX, this.bound.left, this.bound.right, -240, 240), 240),
      _y: (clientY) => this._clamp(-180, this._scale(clientY, this.bound.bottom, this.bound.top, -180, 180), 180),

      x: (t) => this._propMap._x(t.clientX),
      y: (t) => this._propMap._y(t.clientY),
      dx: (t) => (this._propMap._x(t.clientX) - this._propMap._x(t.prevX)),
      dy: (t) => (this._propMap._y(t.clientY) - this._propMap._y(t.prevY)),
      sx: (t) => this._propMap.dx(t) / ((t.nowDate - t.prevDate) / 1000),
      sy: (t) => this._propMap.dy(t) / ((t.nowDate - t.prevDate) / 1000),
      duration: (t) => (Date.now() - t.date) / 1000,
      force: (t) => t.force,
    };

    getInfo() {
      return {
        id: 'skyhigh173touch',
        name: 'Multi Touch',
        color1: '#F76AB3',
        blocks: [
          {
            opcode: 'touchAvailable',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'is touch available?'
          },
          {
            opcode: 'maxMultiTouch',
            blockType: Scratch.BlockType.REPORTER,
            text: 'maximum finger count'
          },
          '---',
          {
            opcode: 'numOfFingers',
            blockType: Scratch.BlockType.REPORTER,
            text: 'number of fingers',
          },
          {
            opcode: 'numOfFingersID',
            blockType: Scratch.BlockType.REPORTER,
            text: 'number of fingers ID',
          },
          {
            opcode: 'propOfFinger',
            blockType: Scratch.BlockType.REPORTER,
            text: '[PROP] of finger [ID]',
            arguments: {
              PROP: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: 'x',
                menu: 'prop',
              },
              ID: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              }
            }
          },
          {
            opcode: 'fingerExists',
            blockType: Scratch.BlockType.BOOLEAN,
            text: 'finger [ID] exists?',
            arguments: {
              ID: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 1
              }
            }
          }
        ],
        menus: {
          prop: {
            acceptReporters: true,
            /**
             * x: x position
             * y: y position
             * dx: change of x position compared to previous frame
             * dy: change of y position compared to previous frame
             * sx: avg speed x of finger in a second
             * sy: avg speed y of finger in a second
             * duration: time since finger press
             * force (some devices only): force of finger press
             */
            items: ['x', 'y', 'dx', 'dy', 'sx', 'sy', 'duration', 'force'],
          },
        },
      };
    }

    _setup() {
      this.canvas = Scratch.vm.runtime.renderer.canvas;
      this.canvasDiv = this.canvas.parentElement;
      
      // update touchList
      /**
       * @param {TouchEvent} e 
       */
      const upd = e => {
        this._touches = [...e.touches];
        // update position
        this._touches.forEach(t => {
          // if theres a new finger...
          const idx = this._fingers.findIndex(f => f?.identifier === t.identifier);
          if (idx == -1) {
            this._fingers.push(t);
            // extra infos
            this._fingers.at(-1).date = Date.now();
            this._fingers.at(-1).prevX = t.clientX;
            this._fingers.at(-1).prevY = t.clientY;
            this._fingers.at(-1).prevDate = Date.now();
            this._fingers.at(-1).nowDate = Date.now();
          } else {
            const finger = this._fingers[idx];
            const date = finger.date, oldX = finger.clientX, oldY = finger.clientY, oldDate = finger.nowDate;
            this._fingers[idx] = t;
            this._fingers[idx].date = date;
            this._fingers[idx].prevX = oldX;
            this._fingers[idx].prevY = oldY;
            this._fingers[idx].prevDate = oldDate;
            this._fingers[idx].nowDate = Date.now();
          }
        })
        this._fingers.forEach((t, index) => {
          // if the finger releases...
          if (this._touches.findIndex(f => f.identifier === t?.identifier) == -1) {
            this._fingers[index] = null;
          }
        })
        // clear trailing null values
        while (this._fingers.length > 0 && this._fingers.at(-1) === null) { this._fingers.pop(); }
      }
      this.canvasDiv.addEventListener('touchstart', e => upd(e));
      this.canvasDiv.addEventListener('touchmove', e => upd(e));
      this.canvasDiv.addEventListener('touchend', e => upd(e));
    }

    touchAvailable() {
      return window.navigator.maxTouchPoints > 0;
    }
    maxMultiTouch() {
      return window.navigator.maxTouchPoints;
    }

    numOfFingers() {
      return this._touches.length;
    }

    numOfFingersID() {
      return this._fingers.length;
    }

    propOfFinger({ PROP, ID }) {
      PROP = this._propMap[PROP];
      ID = Scratch.Cast.toNumber(ID) - 1;
      if (ID >= this._fingers.length || this._fingers[ID] === null) return '';
      return PROP(this._fingers[ID]);
    }

    fingerExists({ ID }) {
      ID = Scratch.Cast.toNumber(ID) - 1;
      return ID < this._fingers.length && this._fingers[ID] !== null;
    }
  }
  Scratch.extensions.register(new MultiTouchExtension());
})(Scratch);
