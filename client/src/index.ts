import axios from 'axios';
import { Builder, parseStringPromise } from 'xml2js';

const server = process.argv[2];
const port = process.argv[3];
const url = server && port ? `http://${server}:${port}/RPC` : 'http://localhost:8080/RPC';

async function sendRequest(method: string, params: number[]) {
    const xml = new Builder().buildObject({
        methodCall: {
            methodName: method,
            params: {
                param: params.map((param) => ({
                    value: {
                        i4: param,
                    },
                })),
            },
        },
    });

    const response = await axios.post(url, xml, {
        headers: { 'Content-Type': 'text/xml', 'User-Agent': 'YourGroupName' },
    });

    const resXml = await parseStringPromise(response.data);

    if (resXml.methodResponse.fault) {
        return `${resXml.methodResponse.fault[0].value[0].struct[0].member[0].value[0].i4[0]} - ${resXml.methodResponse.fault[0].value[0].struct[0].member[1].value[0].string[0]}`;
    } else {
        return `${resXml.methodResponse.params[0].param[0].value[0].i4[0]}`;
    }
}

(async function main() {
    try {
        console.log('subtract(12, 6) =', await sendRequest('subtract', [12, 6]));
        console.log('multiply(3, 4) =', await sendRequest('multiply', [3, 4]));
        console.log('divide(10, 5) =', await sendRequest('divide', [10, 5]));
        console.log('modulo(10, 5) =', await sendRequest('modulo', [10, 5]));
        console.log('add(0) =', await sendRequest('add', [0]));
        console.log('add(1, 2, 3, 4, 5) =', await sendRequest('add', [1, 2, 3, 4, 5]));
        console.log('multiply(1, 2, 3, 4, 5) =', await sendRequest('multiply', [1, 2, 3, 4, 5]));

        // Error cases
        console.log(
            'add(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER) =',
            await sendRequest('add', [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER])
        );
        console.log('multiply(46341, 46341) =', await sendRequest('multiply', [46341, 46341]));
        // @ts-ignore
        console.log('subtract("abc", "def") =', await sendRequest('subtract', ['abc', 'def']));
        console.log('divide(10, 0) =', await sendRequest('divide', [10, 0]));
        console.log('modulo(10, 0) =', await sendRequest('modulo', [10, 0]));
    } catch (error) {
        console.error(error.message);
    }
})();
