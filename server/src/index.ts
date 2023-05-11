import express from 'express';
import bodyParser from 'body-parser';
import { parseStringPromise, Builder } from 'xml2js';

const app = express();
const port = 8080;
app.use(bodyParser.text({ type: 'text/xml' }));

app.post('/RPC', async (req, res) => {
    let xml, response;

    try {
        xml = await parseStringPromise(req.body);
    } catch (e) {
        response = errorBuilder(3, 'Illegal argument type');
        res.type('text/xml').send(response);
        return;
    }

    const methodName = xml.methodCall.methodName[0];
    const params = xml.methodCall.params[0].param.map((p: any) => parseInt(p.value[0].i4));

    console.log({ methodName, params });

    if (params.some((p: any) => isNaN(p))) {
        response = errorBuilder(3, 'Illegal argument type');
        res.type('text/xml').send(response);
        return;
    }

    switch (methodName) {
        case 'add':
            response = responseBuilder(params.reduce((a: number, b: number) => a + b, 0));
            break;
        case 'subtract':
            if (params.length !== 2) {
                response = errorBuilder(3, 'Illegal argument type');
                break;
            }
            response = responseBuilder(params[0] - params[1]);
            break;
        case 'multiply':
            response = responseBuilder(params.reduce((a: number, b: number) => a * b, 1));
            break;
        case 'divide':
            if (params.length !== 2) {
                response = errorBuilder(3, 'Illegal argument type');
                break;
            }
            if (params[1] === 0) {
                response = errorBuilder(1, 'Divide by zero');
                break;
            }
            response = responseBuilder(params[0] / params[1]);
            break;
        case 'modulo':
            if (params.length !== 2) {
                response = errorBuilder(3, 'Illegal argument type');
                break;
            }
            if (params[1] === 0) {
                response = errorBuilder(1, 'Divide by zero');
                break;
            }
            response = responseBuilder(params[0] % params[1]);
            break;
        default:
            res.status(404).send('Not Found');
            return;
    }
    res.type('text/xml').send(response);
});

app.all('*', (req, res) => {
    res.status(req.method === 'POST' ? 405 : 404).send(req.method === 'POST' ? 'Method Not Supported' : 'Not Found');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

function responseBuilder(result: number) {
    console.log({ result });
    return new Builder().buildObject({
        methodResponse: {
            params: {
                param: {
                    value: {
                        i4: result,
                    },
                },
            },
        },
    });
}

function errorBuilder(faultCode: number, faultString: string) {
    console.log({ faultCode, faultString });
    return new Builder().buildObject({
        methodResponse: {
            fault: {
                value: {
                    struct: {
                        member: [
                            {
                                name: 'faultCode',
                                value: {
                                    i4: faultCode,
                                },
                            },
                            {
                                name: 'faultString',
                                value: {
                                    string: faultString,
                                },
                            },
                        ],
                    },
                },
            },
        },
    });
}
