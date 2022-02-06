import zlib from 'zlib';
import { JSON22 } from 'json22';
import { strict as assert } from 'assert';
import { suite, test } from 'mocha';
import express from 'express';
import  supertest from 'supertest';
import { json22express } from '../index.js';

suite('Body parser tests', () => {

    test('body parser works', async () => {
        const app = express();
        app.use(json22express({}));
        app.post('/', (req, res, next) => {
            const { date, bigint } = req.body;
            res.status(200).json({ date: date.constructor.name, bigint: typeof bigint });
            next();
        });

        const resp = await supertest(app)
            .post('/')
            .set({ 'content-type': JSON22.mimeType })
            .send(JSON22.stringify({ date: new Date(), bigint: 42n }));

        assert.deepEqual(resp.body, { date: 'Date', bigint: 'bigint'});
    });

    test('check for double instance', async () => {
        const app = express();
        app.use(json22express({}));
        app.use(json22express({}));
        app.use((err, req, res, next) => res.status(500).send(err.message));

        const resp = await supertest(app)
            .post('/')
            .set({ 'content-type': JSON22.mimeType })
            .send(JSON22.stringify({ date: new Date(), bigint: 42n }));

        assert.equal(resp.status, 500);
        assert.equal(resp.text, 'Duplicated json22 middleware on the pipe');
    });

    test('empty body', async () => {
        const app = express();
        app.use(json22express({}));
        app.post('/', (req, res, next) => {
            res.status(200).json({ body: typeof req.body });
            next();
        });

        const resp = await supertest(app)
            .post('/')
            .set({ 'content-type': JSON22.mimeType })
            .send();

        assert.equal(resp.status, 200);
        assert.deepEqual(resp.body, { body: 'undefined' });
    });

    test('too big body', async () => {
        const app = express();
        app.use(json22express({ maxContentLength: 10 }));
        app.post('/', (req, res, next) => {
            res.status(200).json({ body: typeof req.body });
            next();
        });

        const resp = await supertest(app)
            .post('/')
            .set({ 'content-type': JSON22.mimeType })
            .send(JSON22.stringify({ date: new Date(), bigint: 42n }));

        assert.equal(resp.status, 413);
        assert.equal(resp.text, 'Payload too large');
    });

    test('unsupported charset', async () => {
        const app = express();
        app.use(json22express({}));
        app.post('/', (req, res, next) =>  next());

        const resp = await supertest(app)
            .post('/')
            .set({ 'content-type': `${JSON22.mimeType};charset=cp866` })
            .send(JSON22.stringify({ date: new Date(), bigint: 42n }));

        assert.equal(resp.status, 415);
        assert.equal(resp.text, 'Unsupported charset "cp866"');
    });

    test('unsupported content encoding', async () => {
        const app = express();
        app.use(json22express({}));
        app.post('/', (req, res, next) =>  next());

        const resp = await supertest(app)
            .post('/')
            .set({ 'content-type': JSON22.mimeType, 'content-encoding': 'compress' })
            .send(JSON22.stringify({ date: new Date(), bigint: 42n }));

        assert.equal(resp.status, 415);
        assert.equal(resp.text, 'Unsupported content encoding "compress"');
    });

    test('content encoding deflate', async () => {
        const app = express();
        app.use(json22express({}));
        app.post('/', (req, res, next) => {
            const { date, bigint } = req.body;
            res.status(200).json({ date: date.constructor.name, bigint: typeof bigint });
            next();
        });

        const payload = zlib.deflateSync(JSON22.stringify({ date: new Date(), bigint: 42n }));

        const resp = await supertest(app)
            .post('/')
            .set({ 'content-type': JSON22.mimeType, 'content-encoding': 'deflate' })
            .send(payload);

        assert.deepEqual(resp.body, { date: 'Date', bigint: 'bigint'});
    });

    test('content encoding gzip', async () => {
        const app = express();
        app.use(json22express({}));
        app.post('/', (req, res, next) => {
            const { date, bigint } = req.body;
            res.status(200).json({ date: date.constructor.name, bigint: typeof bigint });
            next();
        });

        const payload = zlib.gzipSync(JSON22.stringify({ date: new Date(), bigint: 42n }));

        const resp = await supertest(app)
            .post('/')
            .set({ 'content-type': JSON22.mimeType, 'content-encoding': 'gzip' })
            .send(payload);

        assert.deepEqual(resp.body, { date: 'Date', bigint: 'bigint'});
    });

    test('content encoding br', async () => {
        const app = express();
        app.use(json22express({}));
        app.post('/', (req, res, next) => {
            const { date, bigint } = req.body;
            res.status(200).json({ date: date.constructor.name, bigint: typeof bigint });
            next();
        });

        const payload = zlib.brotliCompressSync(JSON22.stringify({ date: new Date(), bigint: 42n }));

        const resp = await supertest(app)
            .post('/')
            .set({ 'content-type': JSON22.mimeType, 'content-encoding': 'br' })
            .send(payload);

        assert.deepEqual(resp.body, { date: 'Date', bigint: 'bigint'});
    });

    test('content encoding identity', async () => {
        const app = express();
        app.use(json22express({}));
        app.post('/', (req, res, next) => {
            const { date, bigint } = req.body;
            res.status(200).json({ date: date.constructor.name, bigint: typeof bigint });
            next();
        });

        const payload = JSON22.stringify({ date: new Date(), bigint: 42n });

        const resp = await supertest(app)
            .post('/')
            .set({ 'content-type': JSON22.mimeType, 'content-encoding': 'identity' })
            .send(payload);

        assert.deepEqual(resp.body, { date: 'Date', bigint: 'bigint'});
    });

    test('wrong content encoding', async () => {
        const app = express();
        app.use(json22express({}));
        app.post('/', (req, res, next) => {
            const { date, bigint } = req.body;
            res.status(200).json({ date: date.constructor.name, bigint: typeof bigint });
            next();
        });

        const payload = zlib.brotliCompressSync(JSON22.stringify({ date: new Date(), bigint: 42n }));

        const resp = await supertest(app)
            .post('/')
            .set({ 'content-type': JSON22.mimeType, 'content-encoding': 'gzip' }) // should be br
            .send(payload);

        assert.equal(resp.status, 415);
        assert.equal(resp.text, 'Wrong content encoding: Z_DATA_ERROR');
    });

    test('malformed json22', async () => {
        const app = express();
        app.use(json22express({}));
        app.post('/', (req, res, next) => {
            const { date, bigint } = req.body;
            res.status(200).json({ date: date.constructor.name, bigint: typeof bigint });
            next();
        });

        const resp = await supertest(app)
            .post('/')
            .set({ 'content-type': JSON22.mimeType })
            .send('{ "date": Date( }');

        assert.equal(resp.status, 415);
        assert.equal(resp.text, 'Wrong content encoding: Unexpected character } at 16, literal identifier expected');
    });

    test('support for json', async () => {
        const app = express();
        app.use(json22express({ handleJson: true }));
        app.post('/', (req, res, next) => {
            const { date } = req.body;
            res.status(200).json({ date: date.constructor.name });
            next();
        });

        const resp = await supertest(app)
            .post('/')
            .set({ 'content-type': 'application/json' })
            .send('{ "date": "2022-01-07" }');

        assert.equal(resp.status, 200);
        assert.deepEqual(resp.body, { date: 'String' });
    });

    test('do not support for json without the option', async () => {
        const app = express();
        app.use(json22express({}));
        app.post('/', (req, res, next) => {
            res.status(200).json({ body: typeof req.body });
            next();
        });

        const resp = await supertest(app)
            .post('/')
            .set({ 'content-type': 'application/json' })
            .send('{ "date": "2022-01-07" }');

        assert.equal(resp.status, 200);
        assert.deepEqual(resp.body, { body: 'undefined' });
    });

    test('raw body save', async () => {
        const app = express();
        app.use(json22express({ keepRawAs: 'testRawBody' }));
        app.post('/', (req, res, next) => {
            const { testRawBody } = req;
            res.status(200).json({ rawBody: testRawBody.constructor.name });
            next();
        });

        const resp = await supertest(app)
            .post('/')
            .set({ 'content-type': JSON22.mimeType })
            .send(JSON22.stringify({ date: new Date(), bigint: 42n }));

        assert.equal(resp.status, 200);
        assert.deepEqual(resp.body, { rawBody: 'Buffer' });
    });

    test('json22ParseOptions used', async () => {

        class TypedModel {
            constructor(data) {
                this.a = data?.a;
                this.b = data?.b;
            }
            valueOf() {
                return { a: this.a, b: this.b };
            }
        }

        const context = { 'TypedModel': TypedModel };

        const app = express();
        app.use(json22express({ json22ParseOptions: { context } }));
        app.post('/', (req, res, next) => {
            const { typed } = req.body;
            res.status(200).json({ typed: typed.constructor.name });
            next();
        });

        const resp = await supertest(app)
            .post('/')
            .set({ 'content-type': JSON22.mimeType })
            .send(JSON22.stringify({ typed: new TypedModel(1, 2) }));

        assert.equal(resp.status, 200);
        assert.deepEqual(resp.body, { typed: 'TypedModel' });
    });

});
