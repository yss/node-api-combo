/**
 * Created by yss on 6/16/17.
 */
'use strict';

require('should');
const Combo = require('../index.js');

const PATH_JSON = '/static/test/';
const RESULT_COMBO_A = [{ a: 1 }];
const RESULT_COMBO_B = [{ b: 1 }];
const RESULT_COMBO_C = [{ c: 1 }];
const RESULT_COMBO_NULL = [null];

/**
 *
 * @param {Object} obj
 * @param {Object} obj.ctx
 * @param {Object} obj.combo
 * @param {Function} obj.next
 * @param {Function} callback
 */
async function simulator(obj, callback) {
    obj = obj || {};

    let ctx = Object.assign({
        path: '/combo',
        get (key) {
            if (key === 'User-Agent') {
                return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36' + Math.random().toString().substr(0, 3);
            }
            return '';
        }
    }, obj.ctx || {});

    if (ctx.urls) {
        ctx.path += '?urls=' + encodeURIComponent(ctx.urls);
    }

    if (!ctx.search) {
        ctx.search = ctx.path.substring(ctx.path.indexOf('?') || 0);
    }

    ctx.path = ctx.path.split('?')[0];

    let combo = Object.assign({
        apiHost: 'blog.yssbox.com',
        protocol: 'https'
    }, obj.combo || {});

    try {
        await Combo.withIgnoreError('/combo', combo)(ctx, obj.next || async function (){});
    } catch (e) {
        console.error(e);
    }

    if (callback) {
        if (typeof ctx.body === 'string') {
            ctx.body = JSON.parse(ctx.body);
        }
        return callback(ctx);
    }
}

describe('Koa-Api-Combo-Ignore', function () {
    this.timeout(12000);
    describe('Request', function () {
        it('should be return null when get with error path', function () {
            return simulator({
                ctx: {
                    urls: PATH_JSON + 'a1.json'
                }
            }, async function (ctx) {
                ctx.body.should.be.deepEqual(RESULT_COMBO_NULL);
            });
        });

        it('should be return correct value when get with https protocol and use compress:true', function () {
            return simulator({
                ctx: {
                    urls: '/yss/koa-api-combo/master/test/data/b.json'
                },
                combo: {
                    apiHost: 'raw.githubusercontent.com',
                    protocol: 'https',
                    compress: true
                }
            }, async function (ctx) {
                ctx.body.should.be.deepEqual(RESULT_COMBO_B);
            });
        });

        it('should be return correct value when get multiple requests with http protocol', function () {
            return simulator({
                ctx: {
                    urls: PATH_JSON + 'a1.json,' + PATH_JSON + 'b.json,' + PATH_JSON + 'c.json'
                }
            }, async function(ctx) {
                ctx.body.should.be.deepEqual(RESULT_COMBO_NULL.concat(RESULT_COMBO_B).concat(RESULT_COMBO_C));
            });
        });

        it('should be return correct value when get multiple requests with https protocol', function () {
            return simulator({
                ctx: {
                    urls: '/yss/koa-api-combo/master/test/data/a.json,/yss/koa-api-combo/master/test/data/b.json,/yss/koa-api-combo/master/test/data/c.json'
                },
                combo: {
                    apiHost: 'raw.githubusercontent.com',
                    protocol: 'https'
                }
            }, async function (ctx) {
                ctx.body.should.be.deepEqual(RESULT_COMBO_A.concat(RESULT_COMBO_B).concat(RESULT_COMBO_C));
            });
        });

        it('should be go to next handle with other route', function () {
            return simulator({
                ctx: {
                    path: '/test'
                },
                next () {
                    arguments.length.should.be.equal(0);
                }
            }, function (ctx) {
                ctx.should.not.have.key('body');
            });
        });
    });

    describe('Query In Different Position', function () {
        it('should be return correct value when get multiple requests with http protocol.', function () {
            return simulator({
                ctx: {
                    path: '/combo?p=1&urls=' + encodeURIComponent(PATH_JSON + 'a.json,' + PATH_JSON + 'b.json?p=2,' + PATH_JSON + 'c.json?c=2') + '&c=1'
                }
            }, async function (ctx) {
                ctx.body.should.be.deepEqual(RESULT_COMBO_A.concat(RESULT_COMBO_B).concat(RESULT_COMBO_C));
            });
        });
    });
});
