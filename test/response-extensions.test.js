import { JSON22 } from 'json22';
import { suite, test } from 'mocha';
import express from 'express';
import supertest from "supertest";
import {strict as assert} from 'assert';
import { json22express } from '../index.js';

suite('Response extensions', () => {

    test('json22 method', async () => {
        const app = express();
        app.use(json22express({}));
        app.get('/', (req, res, next) => {
            res.status(200).json22({ date: new Date(), bigint: 42n });
            next();
        });

        const resp = await supertest(app).get('/');

        assert.equal(resp.type, JSON22.mimeType);
        const payload = JSON22.parse(resp.text);
        assert.equal(payload.date.constructor.name, 'Date');
        assert.equal(typeof payload.bigint, 'bigint');
    });

    test('json method override', async () => {
        const app = express();
        app.use(json22express({ overrideResponseJsonMethod: true }));
        app.get('/', (req, res, next) => {
            res.status(200).json({ date: new Date(), bigint: 42n });
            next();
        });

        const resp = await supertest(app).get('/');

        assert.equal(resp.type, JSON22.mimeType);
        const payload = JSON22.parse(resp.text);
        assert.equal(payload.date.constructor.name, 'Date');
        assert.equal(typeof payload.bigint, 'bigint');
    });

    test('no json override without option', async () => {
        const app = express();
        app.use(json22express({ overrideResponseJsonMethod: false }));
        app.get('/', (req, res, next) => {
            res.status(200).json({ date: new Date() });
            next();
        });

        const resp = await supertest(app).get('/');

        assert.equal(resp.type, 'application/json');
        const payload = JSON22.parse(resp.text);
        assert.equal(payload.date.constructor.name, 'String');
    });

    test('deprecated json interface fails', async () => {
        const app = express();
        app.use(json22express({ overrideResponseJsonMethod: true }));
        app.get('/', (req, res, next) => {
            try {
                res.json(200, { date: new Date() });
                next();
            } catch(e) {
                next(e);
            }
        });
        const resp = await supertest(app).get('/');
        assert.equal(resp.status, 500);
    });

    // TODO: test json22StringifyOptions passing after three will be at least one

});
