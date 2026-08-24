
const http = require('http');

function request(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data }));
        });
        req.on('error', reject);
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function run() {
    try {
        // 1. Get CSRF Token
        const csrfRes = await request({
            hostname: '127.0.0.1',
            port: 7000,
            path: '/api/csrf-token',
            method: 'GET'
        });
        
        const csrfData = JSON.parse(csrfRes.data);
        const csrfToken = csrfData.token;
        const cookie = csrfRes.headers['set-cookie'][0];
        
        console.log('CSRF Token:', csrfToken);

        const payload = JSON.stringify({
            from_account_id: '550e8400-e29b-41d4-a716-446655440201',
            to_account_id: '550e8400-e29b-41d4-a716-446655440203',
            amount: 1000,
            description: 'test',
            source_bank: 'bank_a',
            correlation_id: '550e8400-e29b-41d4-a716-446655440201'
        });

        // 2. Test Transfer
        const res = await request({
            hostname: '127.0.0.1',
            port: 7000,
            path: '/api/transactions/transfer',
            method: 'POST',
            headers: {
                'x-api-version': '1',
                'x-api-key': 'sk-c7782ce3a41e2c3b12488b4a7a7ac938bbe8d2ee2b7a7dee3bf183264fcccc70',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                'x-csrf-token': csrfToken,
                'Cookie': cookie
            }
        }, payload);
        
        console.log('Status:', res.status);
        console.log('Response:', res.data);
    } catch(err) {
        console.error(err);
    }
}
run();

